import { useEffect, useState, type ComponentType } from "react";

/**
 * Panels that are not needed for the first screen.
 *
 * Every one of these is rendered only after the player does something (opens the
 * dealership, taps the coin badge, opens staking…), so keeping them out of the
 * entry chunk makes the first paint cheaper and lets the browser cache each panel
 * on its own — editing the dealership no longer invalidates the garage code.
 *
 * The loader is hand-rolled instead of `React.lazy` on purpose: React caches a
 * rejected import forever, so one failed chunk would leave the button dead until
 * a full page reload. Here a failure is remembered only until it is retried, and
 * the gate always shows either a spinner or a retry card — never a blank screen.
 */

export type Loader<T> = () => Promise<T>;

// keyed by the loader itself, so the hover warm-up and the panel share one request
const cache = new WeakMap<Loader<unknown>, Promise<unknown>>();

/** Loads a chunk once; a rejection is dropped so the next attempt really retries. */
export function loadPanel<T>(load: Loader<T>): Promise<T> {
  const key = load as Loader<unknown>;
  const hit = cache.get(key) as Promise<T> | undefined;
  if (hit) return hit;
  const pending = load().catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, pending);
  return pending;
}

/** Chunk importers, shared by the panels and the hover warm-up. */
export const panels = {
  coinShop: () => import("./CoinShop").then((m) => m.CoinShop),
  dealership: () => import("./Dealership").then((m) => m.Dealership),
  nft: () => import("./NftMarket").then((m) => m.NftMarket),
  raceOverlay: () => import("./RaceOverlay").then((m) => m.RaceOverlay),
  staking: () => import("./Staking").then((m) => m.Staking),
  wallet: () => import("./WalletModal").then((m) => m.WalletModal),
};

/** Starts fetching a panel chunk before the player commits (hover / press / focus). */
export const prefetch = {
  coinShop: () => void loadPanel(panels.coinShop).catch(() => {}),
  dealership: () => void loadPanel(panels.dealership).catch(() => {}),
  nft: () => void loadPanel(panels.nft).catch(() => {}),
  staking: () => void loadPanel(panels.staking).catch(() => {}),
  raceOverlay: () => void loadPanel(panels.raceOverlay).catch(() => {}),
  wallet: () => void loadPanel(panels.wallet).catch(() => {}),
};

/* ------------------------------------------------------------------ */
/* gates                                                               */
/* ------------------------------------------------------------------ */

/** Shown while the chunk is on the wire: a pressed button must never look dead. */
function PanelLoading({ label }: { label?: string }) {
  return (
    <div
      data-panel-loading=""
      className="absolute inset-0 z-40 flex animate-fade-in flex-col items-center justify-center gap-[14px] bg-navy-950/85 backdrop-blur-[2px]"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="h-[38px] w-[38px] animate-spin rounded-full border-[4px] border-white/15 border-t-mint-400" />
      {label && <span className="font-display text-[16px] tracking-wide text-white/80">{label}</span>}
    </div>
  );
}

/** A chunk that fails to load must never look like a dead button. */
function PanelFailure({ label, onRetry }: { label?: string; onRetry: () => void }) {
  return (
    <div
      data-panel-failed=""
      role="alert"
      className="absolute inset-0 z-40 flex animate-fade-in flex-col items-center justify-center gap-[12px] bg-navy-950/90 px-[24px] text-center backdrop-blur-[2px]"
    >
      <span className="font-display text-[19px] text-white t-stroke sw-3">{label ?? "PANEL"}</span>
      <span className="max-w-[320px] font-body text-[12px] font-bold text-white/60">Could not load this panel.</span>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full border-[3px] border-ink bg-gradient-to-b from-[#ffd23a] to-[#ff9a1f] px-[18px] py-[6px] font-display text-[14px] text-ink shadow-[0_3px_0_#9a4a08] active:translate-y-[2px] active:shadow-none"
      >
        RETRY
      </button>
    </div>
  );
}

/**
 * One lazy panel: spinner → panel, or an error card with a working retry.
 *
 * `props` is only read while rendering the loaded component, so an inline object
 * is fine; the chunk itself is fetched once unless an attempt failed.
 */
export function LazyPanel<P extends object>({
  id,
  load,
  props,
  label,
}: {
  id: string;
  load: Loader<ComponentType<P>>;
  props: P;
  label?: string;
}) {
  const [attempt, setAttempt] = useState(0);
  const [Comp, setComp] = useState<ComponentType<P> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    setComp(null);
    loadPanel(load)
      .then((C) => {
        if (alive) setComp(() => C);
      })
      .catch((error) => {
        console.error(`[lazy] panel "${id}" failed to load:`, error);
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [load, attempt]);

  if (failed) return <PanelFailure label={label} onRetry={() => setAttempt((a) => a + 1)} />;
  if (!Comp) return <PanelLoading label={label} />;
  return <Comp {...props} />;
}

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
};

/** Fetches the on-demand chunks while the browser is idle (deduped by the loader cache). */
export function preloadPanels() {
  const warm = () => {
    prefetch.coinShop();
    prefetch.dealership();
    prefetch.nft();
    prefetch.raceOverlay();
    prefetch.staking();
    prefetch.wallet();
  };
  if (typeof window === "undefined") return;
  const idle = (window as IdleWindow).requestIdleCallback;
  if (idle) idle(warm, { timeout: 3000 });
  else window.setTimeout(warm, 1500);
}
