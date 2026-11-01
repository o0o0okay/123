import { useMemo } from "react";
import { cn } from "@/utils/cn";
import { fmt, type Lang, type Strings } from "@/i18n";
import { flowOf, labelOf, totalsOf, type HistoryEntry } from "@/data/history";
import {
  BoltIcon,
  CarIcon,
  ClipboardIcon,
  CoinIcon,
  FlagIcon,
  GiftIcon,
  HistoryIcon,
  SprayIcon,
  StarBurstIcon,
  StoreIcon,
  TagIcon,
  TimerIcon,
  TrophyIcon,
  GaugeIcon,
  WalletIcon,
} from "@/icons";

/**
 * The two colours of money, written as plain values.
 *
 * They are applied through `style` rather than a utility class: the amount is
 * the whole point of the ledger, so it must not depend on a theme token being
 * present in the stylesheet the browser ends up with (a stale or partial CSS
 * bundle silently drops `text-flame-400` and the figure falls back to text
 * colour — which is exactly how the losses looked before).
 */
export const GAIN = "#46f0a0";
export const LOSS = "#ff5a5a";

/** which slices of the ledger the panel can show */
export type HistoryView = "all" | "in" | "out";

export interface HistoryProps {
  history: HistoryEntry[];
  /** current filter, driven by the dock accordion and by the panel itself */
  view: HistoryView;
  onView: (v: HistoryView) => void;
}

/** icon + colour of each kind of event */
const TONE: Record<HistoryEntry["kind"], { icon: React.ReactNode; tile: string }> = {
  raceEntry: { icon: <FlagIcon width={13} height={13} />, tile: "bg-sky-500/20 text-sky-300" },
  racePrize: { icon: <TrophyIcon width={13} height={13} />, tile: "bg-amber-400/20 text-amber-400" },
  chase: { icon: <BoltIcon width={13} height={13} />, tile: "bg-mint-400/18 text-mint-400" },
  task: { icon: <ClipboardIcon width={13} height={13} />, tile: "bg-mint-400/18 text-mint-400" },
  daily: { icon: <GiftIcon width={13} height={13} />, tile: "bg-[#ff9ad5]/18 text-[#ff9ad5]" },
  coins: { icon: <CoinIcon width={13} height={13} />, tile: "bg-[#ffb020]/20 text-[#ffc94a]" },
  carBuy: { icon: <CarIcon width={13} height={13} />, tile: "bg-amber-400/18 text-amber-400" },
  carSell: { icon: <TagIcon width={13} height={13} />, tile: "bg-mint-400/18 text-mint-400" },
  upgrade: { icon: <GaugeIcon width={13} height={13} />, tile: "bg-sky-500/20 text-sky-300" },
  paint: { icon: <SprayIcon width={13} height={13} />, tile: "bg-[#b48dff]/20 text-[#c4a7ff]" },
  nftBuy: { icon: <StarBurstIcon width={13} height={13} />, tile: "bg-[#b48dff]/20 text-[#c4a7ff]" },
  nftSell: { icon: <StarBurstIcon width={13} height={13} />, tile: "bg-mint-400/18 text-mint-400" },
  nftStake: { icon: <StarBurstIcon width={13} height={13} />, tile: "bg-[#b48dff]/20 text-[#c4a7ff]" },
  nftClaim: { icon: <StarBurstIcon width={13} height={13} />, tile: "bg-mint-400/18 text-mint-400" },
  nftUnstake: { icon: <StarBurstIcon width={13} height={13} />, tile: "bg-white/10 text-white/60" },
  lpAdd: { icon: <StoreIcon width={13} height={13} />, tile: "bg-sky-500/20 text-sky-300" },
  poolCreate: { icon: <StoreIcon width={13} height={13} />, tile: "bg-sky-500/20 text-sky-300" },
  stake: { icon: <BoltIcon width={13} height={13} />, tile: "bg-mint-400/18 text-mint-400" },
  stakeClaim: { icon: <BoltIcon width={13} height={13} />, tile: "bg-mint-400/18 text-mint-400" },
  stakeWithdraw: { icon: <WalletIcon width={13} height={13} />, tile: "bg-sky-500/20 text-sky-300" },
  borrow: { icon: <WalletIcon width={13} height={13} />, tile: "bg-[#ff9ad5]/18 text-[#ff9ad5]" },
  repay: { icon: <WalletIcon width={13} height={13} />, tile: "bg-sky-500/20 text-sky-300" },
  pledge: { icon: <CarIcon width={13} height={13} />, tile: "bg-[#ff9ad5]/18 text-[#ff9ad5]" },
  release: { icon: <CarIcon width={13} height={13} />, tile: "bg-white/10 text-white/60" },
};

const DAY = 86_400_000;
const startOfDay = (ms: number) => new Date(ms).setHours(0, 0, 0, 0);

/** "NOW" / "5m" / "3h" / "12 MAR" */
function stamp(at: number, now: number, t: Strings): string {
  const diff = Math.max(0, now - at);
  if (diff < 60_000) return t.nowShort;
  if (diff < 3_600_000) return fmt(t.minShort, { n: Math.floor(diff / 60_000) });
  if (diff < DAY) return fmt(t.hourShort, { n: Math.floor(diff / 3_600_000) });
  return new Date(at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).toUpperCase();
}

/** the day band a row belongs to: today / yesterday / earlier */
function bandOf(at: number, now: number): "today" | "yesterday" | "earlier" {
  const today = startOfDay(now);
  if (at >= today) return "today";
  if (at >= today - DAY) return "yesterday";
  return "earlier";
}

/** +1,200 / −500 / 0 — never a signed zero */
/** +1,200 / −500 / 0 — never a signed zero, and never re-ordered by RTL */
const signed = (n: number) => (n === 0 ? "0" : `${n > 0 ? "+" : "−"}${Math.abs(n).toLocaleString("en-US")}`);
/** the summary cards always keep their sign, except for an empty ledger */
const withSign = (n: number, sign: "+" | "−") => (n === 0 ? "0" : `${sign}${Math.abs(n).toLocaleString("en-US")}`);
/** bidi-isolated so a leading sign stays where it was written */
const num = (text: string) => <bdi dir="ltr">{text}</bdi>;

/**
 * The driver's ledger: every coin earned or spent, and the asset moves that come
 * with them, newest first. Filtering happens above (app state) so the dock
 * accordion and the chips in here always agree.
 */
export function HistoryPanel({ t, lang, history, view, onView, className }: HistoryProps & { t: Strings; lang: Lang; className?: string }) {
  const now = Date.now();
  const totals = useMemo(() => totalsOf(history), [history]);
  const rows = useMemo(
    () => history.filter((e) => (view === "all" ? true : flowOf(e.kind) === view)),
    [history, view],
  );

  const chips: [HistoryView, string][] = [
    ["all", t.historyAll],
    ["in", t.historyIn],
    ["out", t.historyOut],
  ];

  return (
    <div data-history="" className={cn("flex h-full flex-col gap-[9px]", className)}>
      {/* summary: in / out / net */}
      <div className="flex shrink-0 items-stretch gap-[6px]">
        <div className="flex flex-1 flex-col items-center rounded-[12px] border-[3px] border-ink bg-gradient-to-b from-navy-800 to-navy-900 px-[6px] py-[5px] shadow-[0_3px_0_#060a28]">
          <span className="font-body text-[8px] font-black tracking-[0.1em] text-mint-400/80">{t.historyEarned}</span>
          <span className="font-display text-[13px] leading-tight" style={{ color: GAIN }}>
            {num(withSign(totals.inCoins, "+"))}
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center rounded-[12px] border-[3px] border-ink bg-gradient-to-b from-navy-800 to-navy-900 px-[6px] py-[5px] shadow-[0_3px_0_#060a28]">
          <span className="font-body text-[8px] font-black tracking-[0.1em] text-flame-400/80">{t.historySpent}</span>
          <span className="font-display text-[13px] leading-tight" style={{ color: LOSS }}>
            {num(withSign(totals.outCoins, "−"))}
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center rounded-[12px] border-[3px] border-ink bg-gradient-to-b from-navy-800 to-navy-900 px-[6px] py-[5px] shadow-[0_3px_0_#060a28]">
          <span className="font-body text-[8px] font-black tracking-[0.1em] text-white/45">{t.historyNet}</span>
          <span
            className={cn("font-display text-[13px] leading-tight", totals.net === 0 && "text-white/60")}
            style={totals.net === 0 ? undefined : { color: totals.net > 0 ? GAIN : LOSS }}
          >
            {num(signed(totals.net))}
          </span>
        </div>
      </div>

      {/* filter chips — same three slices the dock lists under HISTORY */}
      <div className="flex shrink-0 gap-[2px] rounded-full border-[3px] border-ink bg-navy-950 p-[2px]">
        {chips.map(([key, label]) => (
          <button
            key={key}
            type="button"
            data-history-chip={key}
            aria-pressed={view === key}
            onClick={() => onView(key)}
            className={cn(
              "flex-1 rounded-full px-[8px] py-[3px] font-display text-[11px] tracking-wide transition-colors",
              view === key
                ? "bg-gradient-to-b from-[#ffd23a] to-[#ff9a1f] text-white t-stroke sw-2"
                : "text-white/50 hover:text-white",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* the ledger itself */}
      {rows.length === 0 ? (
        <div
          data-history-empty=""
          className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[8px] rounded-[16px] border-[3px] border-dashed border-white/10 px-[18px] text-center"
        >
          <span className="flex h-[46px] w-[46px] items-center justify-center rounded-full border-[3px] border-white/10 bg-navy-900/70 text-white/25">
            <HistoryIcon width={22} height={22} />
          </span>
          <span className="font-display text-[13px] tracking-wide text-white/60">
            {history.length ? t.historyNoMatch : t.historyEmpty}
          </span>
          <span className="font-body text-[10px] font-bold leading-relaxed text-white/30">
            {history.length ? "" : t.historyEmptyHint}
          </span>
        </div>
      ) : (
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pe-[2px]">
          {rows.map((e, i) => {
            const band = bandOf(e.at, now);
            const prevBand = i > 0 ? bandOf(rows[i - 1].at, now) : null;
            const tone = TONE[e.kind];
            const label = band === "today" ? t.historyToday : band === "yesterday" ? t.historyYesterday : t.historyEarlier;
            return (
              <div key={e.id}>
                {band !== prevBand && (
                  <div data-history-band={band} className="mb-[4px] mt-[7px] flex items-center gap-[6px] px-[2px] first:mt-0">
                    <span className="font-body text-[8.5px] font-black uppercase tracking-[0.14em] text-skyg-300/50">{label}</span>
                    <span className="h-[2px] flex-1 rounded bg-white/10" />
                  </div>
                )}
                <div
                  data-history-row={e.kind}
                  className="mb-[3px] flex items-center gap-[8px] rounded-[11px] border-[2px] border-white/8 bg-navy-950/55 py-[5px] pe-[8px] ps-[6px]"
                >
                  <span className={cn("flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[7px]", tone.tile)}>
                    {tone.icon}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col leading-none">
                    <span className="truncate font-display text-[11px] tracking-wide text-white/85">{labelOf(e.kind, lang)}</span>
                    {e.detail && (
                      <span className="mt-[3px] truncate font-body text-[9px] font-bold text-white/35">{e.detail}</span>
                    )}
                  </span>
                  <span className="flex shrink-0 flex-col items-end leading-none">
                    <span
                      data-coins-dir={e.coins > 0 ? "in" : e.coins < 0 ? "out" : "none"}
                      className={cn("font-display text-[13px] tracking-wide", e.coins === 0 && "text-white/45")}
                      style={
                        e.coins === 0
                          ? undefined
                          : {
                              color: e.coins > 0 ? GAIN : LOSS,
                              textShadow: `0 0 7px ${e.coins > 0 ? "rgba(70,240,160,0.4)" : "rgba(255,90,90,0.4)"}`,
                            }
                      }
                    >
                      {e.coins === 0 ? "—" : num(signed(e.coins))}
                    </span>
                    <span className="mt-[3px] font-body text-[8px] font-black tracking-wider text-white/25">
                      {e.points ? `+${e.points} ${t.historyPoints} · ` : ""}
                      {stamp(e.at, now, t)}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* footer: how much is on the ledger */}
      <div className="flex shrink-0 items-center justify-center gap-[6px] pb-[1px] font-body text-[9px] font-black tracking-wider text-white/30">
        <TimerIcon width={11} height={11} />
        {fmt(t.historyEvents, { n: rows.length })}
        {totals.points > 0 && (
          <span className="text-amber-400/70">
            · {num(signed(totals.points))} {t.historyPoints}
          </span>
        )}
      </div>
    </div>
  );
}
