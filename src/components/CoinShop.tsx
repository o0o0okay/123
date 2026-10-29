import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { COIN_PACKS, formatCoins, formatUsd, packBaseCoins, type CoinPack } from "@/data/coinPacks";
import type { Strings } from "@/i18n";
import { fmt } from "@/i18n";
import { CheckIcon, CloseIcon, CoinIcon, CopyIcon, SolanaIcon, StarBurstIcon } from "@/icons";
import { formatSol, findTransfer, isValidAddress, livePaymentsEnabled, nowSeconds, payConfig, payUri, quoteFor } from "@/solanaPay";

/* ------------------------------------------------------------------ */
/* small pieces                                                        */
/* ------------------------------------------------------------------ */

/** Sparkles used around the coin piles. */
function Sparkles() {
  return (
    <>
      <StarBurstIcon width={14} height={14} className="absolute left-[16%] top-[26%] text-white/95" />
      <StarBurstIcon width={9} height={9} className="absolute right-[20%] top-[16%] text-white/80" />
      <StarBurstIcon width={11} height={11} className="absolute bottom-[22%] right-[14%] text-white/70" />
    </>
  );
}

/** The coin pile drawn on every pack card. */
function CoinArt({ pack }: { pack: CoinPack }) {
  const layouts: Record<CoinPack["art"], { x: number; y: number; s: number; o: number }[]> = {
    1: [{ x: 50, y: 50, s: 66, o: 1 }, { x: 33, y: 30, s: 30, o: 0.55 }],
    2: [
      { x: 50, y: 56, s: 62, o: 1 },
      { x: 26, y: 34, s: 38, o: 0.95 },
      { x: 74, y: 32, s: 40, o: 0.95 },
    ],
    5: [
      { x: 50, y: 56, s: 62, o: 1 },
      { x: 24, y: 40, s: 36, o: 0.95 },
      { x: 76, y: 38, s: 38, o: 0.95 },
      { x: 34, y: 76, s: 30, o: 0.9 },
      { x: 68, y: 78, s: 28, o: 0.9 },
    ],
    8: [
      { x: 50, y: 58, s: 60, o: 1 },
      { x: 26, y: 40, s: 34, o: 0.95 },
      { x: 74, y: 40, s: 34, o: 0.95 },
      { x: 20, y: 66, s: 26, o: 0.9 },
      { x: 80, y: 66, s: 26, o: 0.9 },
      { x: 40, y: 24, s: 22, o: 0.85 },
      { x: 62, y: 22, s: 20, o: 0.85 },
      { x: 50, y: 84, s: 22, o: 0.85 },
    ],
  };
  return (
    <div className="relative h-full w-full">
      <Sparkles />
      {layouts[pack.art].map((c, i) => (
        <span
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_3px_0_rgba(0,0,0,0.35)]"
          style={{ left: `${c.x}%`, top: `${c.y}%`, width: c.s, height: c.s, opacity: c.o }}
        >
          <CoinIcon width={c.s} height={c.s} />
        </span>
      ))}
    </div>
  );
}

function PackCard({
  t,
  pack,
  selected,
  onBuy,
}: {
  t: Strings;
  pack: CoinPack;
  selected: boolean;
  onBuy: () => void;
}) {
  return (
    <div
      data-pack={pack.id}
      className={cn(
        "relative overflow-hidden rounded-[16px] border-[3px] p-[7px] shadow-[0_5px_0_#060a28] transition-transform",
        selected ? "border-amber-300 ring-[2px] ring-amber-300/70" : "border-ink",
      )}
      style={{
        background:
          "radial-gradient(circle at 50% 42%, #7fc6ef 0%, #3f8fd0 45%, #2f76b8 70%, #215c9b 100%)",
      }}
    >
      {/* light rays behind the coins */}
      <div
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            "repeating-conic-gradient(from 0deg at 50% 42%, rgba(255,255,255,0.55) 0deg 7deg, rgba(255,255,255,0) 7deg 22deg)",
        }}
      />
      <div className="relative flex flex-col items-center">
        <div className="font-display text-[16px] leading-none text-white t-stroke sw-3">
          {fmt(t.coinPackCoins, { n: formatCoins(pack.coins) })}
        </div>
        {pack.bonus > 0 && (
          <div className="mt-[3px] rounded-full border-[2px] border-ink bg-amber-400 px-[7px] font-body text-[9px] font-black leading-[15px] text-ink">
            {fmt(t.coinPackBonus, { n: pack.bonus })} · {formatCoins(packBaseCoins(pack))}
          </div>
        )}

        <div className={cn("relative w-full", pack.bonus > 0 ? "mt-[2px] h-[84px]" : "mt-[5px] h-[84px]")}>
          <CoinArt pack={pack} />
        </div>

        <button
          type="button"
          id={`buy-${pack.id}`}
          onClick={onBuy}
          className="mt-[4px] flex h-[34px] w-full items-center justify-center rounded-[11px] border-[3px] border-ink bg-gradient-to-b from-[#8ee84f] to-[#3f9a1e] font-display text-[18px] text-white t-stroke sw-3 shadow-[0_3px_0_#1f5a10] transition-transform hover:brightness-110 active:translate-y-[2px] active:shadow-none"
        >
          {formatUsd(pack.priceUsd)}
        </button>
      </div>

      {pack.hot && (
        <span className="absolute -top-[6px] end-[-10px] rotate-[-14deg] rounded-[6px] border-[3px] border-white bg-gradient-to-b from-[#ff6b6b] to-[#d31f4a] px-[9px] font-display text-[13px] leading-[20px] text-white shadow-[0_3px_0_rgba(0,0,0,0.35)]">
          {t.coinPackHot}
        </span>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-[14px] w-[14px] animate-spin rounded-full border-[2.5px] border-white/25 border-t-white" />
  );
}

/* ------------------------------------------------------------------ */
/* the shop                                                            */
/* ------------------------------------------------------------------ */

type Step = "packs" | "pay" | "done";
type Status = "idle" | "waiting" | "checking" | "error";

export function CoinShop({
  t,
  coins,
  walletAddress,
  wide = true,
  onPurchase,
  onClose,
}: {
  t: Strings;
  /** current balance, shown in the header */
  coins: number;
  /** connected Solana wallet — used to match the incoming transfer */
  walletAddress?: string;
  wide?: boolean;
  /** called once, when the payment is confirmed (credits the pack) */
  onPurchase: (pack: CoinPack) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("packs");
  const [pack, setPack] = useState<CoinPack | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txid, setTxid] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => nowSeconds());

  const cfg = payConfig();
  const live = livePaymentsEnabled();
  const quote = pack ? quoteFor(pack.priceUsd) : null;
  const startedAt = useRef<number>(nowSeconds());
  const credited = useRef(false);

  const confirm = (signature: string) => {
    if (credited.current || !pack) return;
    credited.current = true;
    setTxid(signature);
    setStatus("idle");
    setStep("done");
    onPurchase(pack);
  };

  const check = async () => {
    if (!pack || !quote || !live) return;
    setStatus("checking");
    setError(null);
    try {
      const found = await findTransfer({
        lamports: quote.lamports,
        from: isValidAddress(walletAddress ?? "") ? walletAddress : undefined,
        since: startedAt.current,
      });
      if (found) confirm(found.signature);
      else setStatus("waiting");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  // keep a live "waiting for payment" poll while the pay sheet is open
  useEffect(() => {
    if (step !== "pay" || !live) return;
    const tick = window.setInterval(() => setNow(nowSeconds()), 1000);
    return () => window.clearInterval(tick);
  }, [step, live]);

  useEffect(() => {
    if (step !== "pay" || !live || !pack || !quote) return;
    let cancelled = false;
    const poll = async () => {
      if (cancelled || credited.current) return;
      try {
        const found = await findTransfer({
          lamports: quote.lamports,
          from: isValidAddress(walletAddress ?? "") ? walletAddress : undefined,
          since: startedAt.current,
        });
        if (!cancelled && found) confirm(found.signature);
      } catch {
        /* keep polling; a flaky RPC is not a failed payment */
      }
    };
    const id = window.setInterval(() => void poll(), 5000);
    void poll();
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, live, pack?.id]);

  const startPayment = (p: CoinPack) => {
    setPack(p);
    setStep("pay");
    setStatus(live ? "waiting" : "idle");
    setError(null);
    setTxid(null);
    credited.current = false;
    startedAt.current = nowSeconds();
  };

  /** demo mode: no treasury configured, so the confirmation is simulated */
  const payDemo = () => {
    setStatus("checking");
    window.setTimeout(() => confirm(`demo-${Date.now().toString(36)}`), 1400);
  };

  const copyAddress = () => {
    if (!cfg.treasury) return;
    try {
      void navigator.clipboard.writeText(cfg.treasury);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const backToShop = () => {
    setStep("packs");
    setPack(null);
    setStatus("idle");
  };

  const expiry = Math.max(0, 600 - (now - startedAt.current));

  return (
    <div
      className="absolute inset-0 z-50 flex animate-fade-in items-center justify-center bg-navy-950/80 px-[8px] py-[10px] backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-label={t.coinShop}
      onClick={onClose}
    >
      <div
        id="coin-shop"
        data-step={step}
        className={cn(
          "relative flex max-h-full w-full flex-col animate-slide-up rounded-[24px] border-[4px] border-ink bg-gradient-to-b from-[#2a5aa8] via-[#1b3f80] to-[#122a5c] px-[12px] pb-[12px] pt-[34px] shadow-[0_12px_0_#060a28,0_24px_50px_rgba(0,0,0,0.5)]",
          wide ? "max-w-[520px]" : "max-w-[420px]",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ribbon title */}
        <div className="absolute -top-[22px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[14px] border-[3px] border-ink bg-gradient-to-r from-[#ff7a1a] to-[#ffb32a] px-[28px] py-[4px] font-display text-[22px] text-white t-stroke sw-4 shadow-[0_4px_0_#9a4a08]">
          {t.coinShop}
        </div>

        {/* close */}
        <button
          type="button"
          id="coin-shop-close"
          onClick={onClose}
          aria-label={t.close}
          className="absolute -top-[16px] end-[-8px] flex h-[32px] w-[32px] items-center justify-center rounded-[10px] border-[3px] border-ink bg-gradient-to-b from-[#5f8fd8] to-[#2c5aa0] text-white shadow-[0_3px_0_#0a1038] transition-transform active:translate-y-[2px]"
        >
          <CloseIcon width={16} height={16} />
        </button>

        {/* balance strip */}
        <div className="mb-[9px] flex shrink-0 items-center justify-between gap-[8px] rounded-full border-[2.5px] border-ink bg-navy-950/70 px-[11px] py-[4px]">
          <span className="flex items-center gap-[5px] font-body text-[10px] font-black tracking-wider text-white/50">
            <CoinIcon width={16} height={16} />
            {t.coins}
          </span>
          <span className="font-display text-[17px] leading-none text-amber-400 t-stroke sw-2" dir="ltr">
            {formatCoins(coins)}
          </span>
        </div>

        {step === "packs" && (
          <>
            <div className="grid shrink-0 grid-cols-2 gap-[9px]">
              {COIN_PACKS.map((p) => (
                <PackCard key={p.id} t={t} pack={p} selected={pack?.id === p.id} onBuy={() => startPayment(p)} />
              ))}
            </div>
            <p className="mt-[9px] text-center font-body text-[10px] font-bold leading-snug text-white/45">
              {t.coinShopNote}
            </p>
          </>
        )}

        {step === "pay" && pack && quote && (
          <div id="coin-payment" className="flex min-h-0 flex-col gap-[8px]">
            {/* what is being bought */}
            <div className="flex items-center justify-between gap-[8px] rounded-[14px] border-[3px] border-ink bg-navy-950/70 px-[11px] py-[7px]">
              <span className="flex min-w-0 items-center gap-[6px]">
                <CoinIcon width={26} height={26} className="shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate font-display text-[16px] leading-none text-white">
                    {fmt(t.coinPackCoins, { n: formatCoins(pack.coins) })}
                  </span>
                  {pack.bonus > 0 && (
                    <span className="font-body text-[9px] font-black text-amber-400">
                      {fmt(t.coinPackBonus, { n: pack.bonus })}
                    </span>
                  )}
                </span>
              </span>
              <span className="shrink-0 font-display text-[18px] leading-none text-white/70">{formatUsd(pack.priceUsd)}</span>
            </div>

            {/* amount + network */}
            <div className="grid grid-cols-2 gap-[8px]">
              <div className="rounded-[14px] border-[3px] border-ink bg-navy-950/70 px-[10px] py-[6px]">
                <div className="font-body text-[9px] font-black tracking-wider text-white/45">{t.payAmount}</div>
                <div className="mt-[2px] font-display text-[19px] leading-none text-amber-400" dir="ltr">
                  {formatSol(quote.sol)}
                </div>
                <div className="font-body text-[9px] font-black text-white/35" dir="ltr">
                  ≈ {formatUsd(quote.usd)}
                </div>
              </div>
              <div className="rounded-[14px] border-[3px] border-ink bg-navy-950/70 px-[10px] py-[6px]">
                <div className="font-body text-[9px] font-black tracking-wider text-white/45">{t.payNetwork}</div>
                <div className="mt-[2px] flex items-center gap-[5px] font-display text-[15px] leading-none text-white">
                  <SolanaIcon width={15} height={15} className="text-mint-400" />
                  {cfg.network === "mainnet-beta" ? "MAINNET" : "DEVNET"}
                </div>
                <div className="font-body text-[9px] font-black text-white/35">
                  {live ? t.payLive : t.payDemoTag}
                </div>
              </div>
            </div>

            {live ? (
              <>
                <div className="rounded-[14px] border-[3px] border-ink bg-navy-950/70 px-[10px] py-[7px]">
                  <div className="flex items-center justify-between gap-[6px]">
                    <span className="font-body text-[9px] font-black tracking-wider text-white/45">{t.payAddress}</span>
                    <button
                      type="button"
                      onClick={copyAddress}
                      className={cn(
                        "flex items-center gap-[3px] font-body text-[9px] font-black hover:text-white",
                        copied ? "text-mint-400" : "text-skyg-300",
                      )}
                    >
                      {copied ? <CheckIcon width={10} height={10} /> : <CopyIcon width={10} height={10} />}
                      {t.copyAddress}
                    </button>
                  </div>
                  <div className="mt-[2px] truncate font-mono text-[10px] font-bold text-white/75" dir="ltr">
                    {cfg.treasury}
                  </div>
                </div>

                <a
                  href={payUri({
                    treasury: cfg.treasury,
                    sol: quote.sol,
                    label: "Heat Chase",
                    message: fmt(t.coinPackCoins, { n: formatCoins(pack.coins) }),
                    memo: `pack:${pack.id}`,
                  })}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-[38px] items-center justify-center gap-[6px] rounded-[12px] border-[3px] border-ink bg-gradient-to-b from-[#8ee84f] to-[#3f9a1e] font-display text-[16px] text-white t-stroke sw-3 shadow-[0_4px_0_#1f5a10] transition-transform hover:brightness-110 active:translate-y-[2px]"
                >
                  <SolanaIcon width={17} height={17} />
                  {t.openWallet}
                </a>

                <div className="flex items-center justify-between gap-[8px] rounded-[12px] border-[2.5px] border-ink bg-navy-950/70 px-[10px] py-[6px]">
                  <span className="flex items-center gap-[5px] font-body text-[10px] font-black text-white/55">
                    <Spinner />
                    {t.waitingPayment}
                  </span>
                  <span className="font-body text-[9px] font-black text-white/35" dir="ltr">
                    {Math.floor(expiry / 60)}:{`${expiry % 60}`.padStart(2, "0")}
                  </span>
                </div>
                {status === "error" && (
                  <div className="rounded-[10px] border-[2px] border-[#ff6b4a]/60 bg-[#ff6b4a]/15 px-[9px] py-[4px] font-body text-[9px] font-bold text-[#ffb4a2]">
                    {t.paymentFailed}: {error}
                  </div>
                )}
                <div className="flex gap-[7px]">
                  <button
                    type="button"
                    id="coin-pay-check"
                    onClick={() => void check()}
                    disabled={status === "checking"}
                    className="h-[34px] flex-1 rounded-[11px] border-[3px] border-ink bg-gradient-to-b from-[#ffd23a] to-[#ff9a1f] font-display text-[15px] text-ink shadow-[0_3px_0_#9a4a08] transition-transform active:translate-y-[2px]"
                  >
                    {status === "checking" ? t.payChecking : t.checkPayment}
                  </button>
                  <button
                    type="button"
                    onClick={backToShop}
                    className="h-[34px] w-[92px] rounded-[11px] border-[3px] border-ink bg-navy-800 font-display text-[14px] text-white/80 shadow-[0_3px_0_#0a1038] transition-transform active:translate-y-[2px]"
                  >
                    {t.cancel}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-[12px] border-[2.5px] border-amber-400/50 bg-amber-400/10 px-[10px] py-[6px] font-body text-[10px] font-bold leading-snug text-amber-200/90">
                  {t.payDemoNotice}
                </div>
                <button
                  type="button"
                  id="coin-pay-demo"
                  onClick={payDemo}
                  disabled={status === "checking"}
                  className="flex h-[40px] items-center justify-center gap-[6px] rounded-[12px] border-[3px] border-ink bg-gradient-to-b from-[#8ee84f] to-[#3f9a1e] font-display text-[17px] text-white t-stroke sw-3 shadow-[0_4px_0_#1f5a10] transition-transform hover:brightness-110 active:translate-y-[2px]"
                >
                  {status === "checking" ? (
                    <>
                      <Spinner />
                      {t.confirmingPayment}
                    </>
                  ) : (
                    <>
                      <SolanaIcon width={17} height={17} />
                      {fmt(t.payDemoButton, { p: formatUsd(pack.priceUsd) })}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={backToShop}
                  className="h-[32px] rounded-[11px] border-[3px] border-ink bg-navy-800 font-display text-[14px] text-white/80 shadow-[0_3px_0_#0a1038] transition-transform active:translate-y-[2px]"
                >
                  {t.cancel}
                </button>
              </>
            )}
          </div>
        )}

        {step === "done" && pack && (
          <div id="coin-purchase-done" className="flex flex-col items-center gap-[9px] py-[6px] text-center">
            <span className="flex h-[54px] w-[54px] items-center justify-center rounded-full border-[3px] border-ink bg-gradient-to-b from-[#9ef05a] to-[#3f9a1e] text-white shadow-[0_4px_0_#1f5a10]">
              <CheckIcon width={30} height={30} />
            </span>
            <div className="font-display text-[20px] leading-none text-white t-stroke sw-3">{t.purchaseDone}</div>
            <div className="flex items-center gap-[5px] rounded-full border-[2.5px] border-ink bg-navy-950/70 px-[12px] py-[4px]">
              <CoinIcon width={18} height={18} />
              <span className="font-display text-[18px] leading-none text-amber-400" dir="ltr">
                +{formatCoins(pack.coins)}
              </span>
            </div>
            {txid && !txid.startsWith("demo-") && (
              <a
                href={`https://explorer.solana.com/tx/${txid}${cfg.network === "devnet" ? "?cluster=devnet" : ""}`}
                target="_blank"
                rel="noreferrer"
                className="max-w-full truncate font-mono text-[9px] font-bold text-skyg-300 hover:text-white"
                dir="ltr"
              >
                {txid.slice(0, 20)}…
              </a>
            )}
            <div className="flex w-full gap-[7px]">
              <button
                type="button"
                id="coin-shop-again"
                onClick={backToShop}
                className="h-[36px] flex-1 rounded-[11px] border-[3px] border-ink bg-navy-800 font-display text-[15px] text-white/85 shadow-[0_3px_0_#0a1038] transition-transform active:translate-y-[2px]"
              >
                {t.backToShop}
              </button>
              <button
                type="button"
                id="coin-shop-done"
                onClick={onClose}
                className="h-[36px] flex-1 rounded-[11px] border-[3px] border-ink bg-gradient-to-b from-[#ffd23a] to-[#ff9a1f] font-display text-[15px] text-ink shadow-[0_3px_0_#9a4a08] transition-transform active:translate-y-[2px]"
              >
                {t.done}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
