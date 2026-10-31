import { Component, Suspense, lazy, type ReactNode } from "react";

/**
 * Panels that are not needed for the first screen.
 *
 * Every one of these is rendered only after the player does something (opens the
 * dealership, taps the coin badge, starts a race…), so keeping them out of the
 * entry chunk makes the first paint cheaper and lets the browser cache each panel
 * on its own — editing the dealership no longer invalidates the garage code.
 *
 * `preloadPanels()` warms them on idle, so in practice the player never waits:
 * the chunk is already in memory by the time the button is tapped.
 */
export const LazyCoinShop = lazy(() => import("./CoinShop").then((m) => ({ default: m.CoinShop })));

export const LazyDealership = lazy(() =>
  import("./Dealership").then((m) => ({ default: m.Dealership })),
);

export const LazyRaceOverlay = lazy(() =>
  import("./RaceOverlay").then((m) => ({ default: m.RaceOverlay })),
);

export const LazyStaking = lazy(() =>
  import("./Staking").then((m) => ({ default: m.Staking })),
);

export const LazyWalletModal = lazy(() =>
  import("./WalletModal").then((m) => ({ default: m.WalletModal })),
);

type GateProps = { children: ReactNode; resetKey?: unknown };

/**
 * A failed chunk must not take the whole game down: render nothing instead of
 * letting the rejected import bubble out as a render error, and try again the
 * next time the panel is opened (`resetKey` changes).
 */
class PanelBoundary extends Component<GateProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[lazy] panel chunk failed to load:", error);
  }

  componentDidUpdate(prev: GateProps) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** `<Suspense>` + error boundary for one lazy panel (nothing is shown while loading). */
export function LazyGate({ children, resetKey }: GateProps) {
  return (
    <PanelBoundary resetKey={resetKey}>
      <Suspense fallback={null}>{children}</Suspense>
    </PanelBoundary>
  );
}

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
};

/** Fetches the on-demand chunks while the browser is idle (deduped by the module graph). */
export function preloadPanels() {
  const warm = () => {
    void import("./CoinShop");
    void import("./Dealership");
    void import("./RaceOverlay");
    void import("./Staking");
    void import("./WalletModal");
  };
  if (typeof window === "undefined") return;
  const idle = (window as IdleWindow).requestIdleCallback;
  if (idle) idle(warm, { timeout: 3000 });
  else window.setTimeout(warm, 1500);
}
