import { useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import { fmt, type Lang, type Strings } from "@/i18n";
import {
  BoltIcon,
  CarIcon,
  CheckIcon,
  ClipboardIcon,
  CloseIcon,
  CoinIcon,
  CopyIcon,
  FlagIcon,
  StarBurstIcon,
  TrophyIcon,
  UndoIcon,
  WalletIcon,
} from "@/icons";
import {
  debtOf,
  earnedOf,
  type DefiState,
} from "@/data/staking";
import type { NftState } from "@/data/nft";
import { labelOf, totalsOf, type HistoryEntry } from "@/data/history";
import {
  engagementStats,
  weekRows,
  type ActivityMap,
  type EngagementLevel,
} from "@/data/engagement";

/* ------------------------------------------------------------------ */
/* props                                                               */
/* ------------------------------------------------------------------ */

export interface AccountProps {
  t: Strings;
  lang: Lang;
  /** desktop gets the two-column board, everything else stacks */
  desk: boolean;
  player: { name: string; id: string; walletAddress: string; provider: string } | null;
  coins: number;
  carsOwned: number;
  activeCarName: string;
  /** races driven, wins, leaderboard points */
  races: number;
  wins: number;
  points: number;
  tasksDone: number;
  streak: number;
  bestEscape: number;
  defi: DefiState;
  nft: NftState;
  history: HistoryEntry[];
  activity: ActivityMap;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/* small pieces                                                        */
/* ------------------------------------------------------------------ */

function Coin({ size = 12 }: { size?: number }) {
  return <CoinIcon width={size} height={size} className="shrink-0 text-amber-400" />;
}

/** the tint of a calendar tile, per level */
const LEVEL_FILL: Record<EngagementLevel, string> = {
  0: "transparent",
  1: "#332a5c",
  2: "#5b47a8",
  3: "#8a6bf0",
  4: "#b79bff",
};

/** empty days keep the striped look of the reference instead of a flat block */
const HATCH =
  "repeating-linear-gradient(135deg, rgba(255,255,255,0.055) 0 1px, transparent 1px 5px)";

function Panel({
  title,
  icon,
  action,
  children,
  className,
  testId,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <section
      data-account-panel={testId}
      className={cn(
        "rounded-[18px] border-[2px] border-[#232a31] bg-[#11161a] p-[13px]",
        className,
      )}
    >
      <div className="flex items-center gap-[7px]">
        {icon && (
          <span className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full border-[2px] border-[#2c3a44] bg-[#0d1216] text-white/60">
            {icon}
          </span>
        )}
        <span className="min-w-0 truncate font-display text-[13px] leading-none tracking-wide text-white">{title}</span>
        {action && <span className="ms-auto shrink-0">{action}</span>}
      </div>
      <div className="mt-[10px]">{children}</div>
    </section>
  );
}

function Tile({
  label,
  value,
  tone = "white",
  icon,
  suffix,
}: {
  label: string;
  value: string | number;
  tone?: "white" | "green" | "amber" | "red" | "purple";
  icon?: React.ReactNode;
  suffix?: string;
}) {
  return (
    <div className="rounded-[13px] border-[2px] border-[#232a31] bg-[#0d1216] px-[10px] py-[8px]">
      <div className="truncate font-body text-[8px] font-black uppercase tracking-[0.13em] text-white/35">{label}</div>
      <div
        dir="ltr"
        className={cn(
          "mt-[3px] flex items-center gap-[4px] font-display text-[15px] leading-none tabular-nums",
          tone === "white" && "text-white",
          tone === "green" && "text-[#46f0a0]",
          tone === "amber" && "text-amber-400",
          tone === "red" && "text-[#ff6b6b]",
          tone === "purple" && "text-[#b79bff]",
        )}
      >
        {icon}
        <span className="truncate">{value}</span>
        {suffix && <span className="font-body text-[9px] font-black tracking-wide text-white/35">{suffix}</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* weekly engagement                                                   */
/* ------------------------------------------------------------------ */

const COMPACT_WEEKS = 5;
const FULL_WEEKS = 12;

function WeeklyEngagement({
  t,
  lang,
  activity,
  desk,
}: {
  t: Strings;
  lang: Lang;
  activity: ActivityMap;
  desk: boolean;
}) {
  const [all, setAll] = useState(false);
  const fa = lang === "fa";
  // Persian weeks start on Saturday, the English board on Sunday
  const weekStart = fa ? 6 : 0;
  const weeks = all ? FULL_WEEKS : COMPACT_WEEKS;

  const rows = useMemo(() => weekRows(activity, Date.now(), weeks, weekStart), [activity, weeks, weekStart]);
  const stats = useMemo(() => engagementStats(activity, Date.now(), 7), [activity]);

  // column headers: the initials of the seven weekdays, starting where the week starts
  const dayNames = useMemo(() => {
    const names: string[] = [];
    const base = new Date(2026, 0, 4); // a Sunday, so day-of-week indexing is stable
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + ((weekStart + i) % 7));
      names.push(
        new Intl.DateTimeFormat(fa ? "fa-IR" : "en-US", { weekday: "narrow" })
          .format(d)
          .slice(0, fa ? 1 : 1),
      );
    }
    return names;
  }, [fa, weekStart]);

  const dateLabel = (ms: number) =>
    new Intl.DateTimeFormat(fa ? "fa-IR" : "en-US", { month: "short", day: "numeric" }).format(new Date(ms));

  const legend: [EngagementLevel, string][] = [
    [1, t.engLow],
    [2, t.engMedium],
    [3, t.engHigh],
    [4, t.engBest],
  ];

  return (
    <Panel
      title={t.weeklyEngagement}
      testId="engagement"
      icon={<BoltIcon width={12} height={12} />}
      action={
        <div className="flex items-center gap-[5px]">
          <button
            type="button"
            onClick={() => setAll((v) => !v)}
            data-engagement-expand=""
            aria-pressed={all}
            className="rounded-full border-[2px] border-[#2c3a44] bg-[#0d1216] px-[9px] py-[3px] font-body text-[8px] font-black tracking-[0.1em] text-white/65 transition-colors hover:border-[#b79bff]/60 hover:text-white"
          >
            {all ? t.showLess : t.viewAll}
          </button>
          <button
            type="button"
            onClick={() => setAll((v) => !v)}
            aria-label={all ? t.showLess : t.viewAll}
            className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-[2px] border-[#2c3a44] bg-[#0d1216] text-white/55 transition-colors hover:border-[#b79bff]/60 hover:text-white"
          >
            <UndoIcon width={11} height={11} className={all ? "-scale-y-100" : undefined} />
          </button>
        </div>
      }
    >
      {/* legend */}
      <div className="flex flex-wrap items-center gap-x-[12px] gap-y-[4px]">
        {legend.map(([level, text]) => (
          <span key={level} className="flex items-center gap-[4px]">
            <span
              className="h-[9px] w-[9px] rounded-[3px]"
              style={{ backgroundColor: LEVEL_FILL[level] }}
            />
            <span className="font-body text-[9px] font-black tracking-wide text-white/45">{text}</span>
          </span>
        ))}
      </div>

      {/* calendar */}
      <div className="mt-[10px] flex gap-[6px]" data-engagement-grid="">
        {/* row labels (the week the row belongs to) */}
        <div className={cn("flex shrink-0 flex-col", desk ? "gap-[6px]" : "gap-[5px]")} aria-hidden>
          <span className={cn(fa ? "h-[13px]" : "h-[13px]")} />
          {rows.map((row) => (
            <span
              key={row.start}
              className={cn(
                "flex items-center font-body text-[8px] font-black tracking-wide text-white/30",
                desk ? "h-[24px]" : "h-[18px]",
              )}
            >
              <bdi dir={fa ? "rtl" : "ltr"}>{dateLabel(row.start)}</bdi>
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          {/* weekday initials */}
          <div className="grid grid-cols-7 gap-[5px]">
            {dayNames.map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="flex h-[13px] items-center justify-center font-body text-[8px] font-black tracking-wide text-white/25"
              >
                {name}
              </span>
            ))}
          </div>

          <div className={cn("mt-[0px] flex flex-col", desk ? "gap-[6px]" : "gap-[5px]")}>
            {rows.map((row) => (
              <div key={row.start} className="grid grid-cols-7 gap-[5px]">
                {row.days.map((day) => {
                  const cell = dateLabel(day.date);
                  const title = day.future
                    ? ""
                    : day.count > 0
                      ? fmt(day.count === 1 ? t.actionOnDay : t.actionsOnDay, { n: day.count, d: cell })
                      : fmt(t.nothingOnDay, { d: cell });
                  return (
                    <span
                      key={day.key}
                      data-day={day.key}
                      data-level={day.future ? "future" : day.level}
                      data-count={day.future ? 0 : day.count}
                      title={title}
                      className={cn(
                        "block w-full rounded-[6px] border-[1.5px] transition-transform",
                        desk ? "h-[24px]" : "h-[18px]",
                        day.future
                          ? "border-white/[0.03] opacity-40"
                          : "border-white/[0.04] hover:scale-[1.12] hover:border-white/25",
                        day.today && "border-white/55",
                      )}
                      // longhands only: mixing the `background` shorthand with
                      // `background-color` in one style object resets both
                      style={
                        day.level === 0
                          ? { backgroundColor: "#161a21", backgroundImage: HATCH }
                          : { backgroundColor: LEVEL_FILL[day.level], backgroundImage: "none" }
                      }
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* the two numbers that describe the last seven days */}
      <div className="mt-[10px] grid grid-cols-2 gap-[6px]">
        <div className="flex items-center justify-between rounded-[11px] border-[2px] border-[#232a31] bg-[#0d1216] px-[9px] py-[5px]">
          <span className="font-body text-[8px] font-black uppercase tracking-[0.12em] text-white/35">{t.activeDays}</span>
          <span className="font-display text-[13px] leading-none tabular-nums text-[#b79bff]" dir="ltr">
            {stats.activeDays}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-[11px] border-[2px] border-[#232a31] bg-[#0d1216] px-[9px] py-[5px]">
          <span className="font-body text-[8px] font-black uppercase tracking-[0.12em] text-white/35">{t.actions7d}</span>
          <span className="font-display text-[13px] leading-none tabular-nums text-white" dir="ltr">
            {stats.actions}
          </span>
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* the screen                                                          */
/* ------------------------------------------------------------------ */

export function Account(p: AccountProps) {
  const { t, lang, desk } = p;
  const fa = lang === "fa";
  const [copied, setCopied] = useState(false);

  const copyWallet = () => {
    const address = p.player?.walletAddress;
    if (!address) return;
    try {
      void navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard can be blocked — the address is on screen anyway */
    }
  };

  const totals = useMemo(() => totalsOf(p.history), [p.history]);

  const portfolio = useMemo(() => {
    const positions = p.defi.positions ?? [];
    const staked = positions.reduce((sum, x) => sum + x.amount, 0);
    const earnings = positions.reduce((sum, x) => sum + earnedOf(x, Date.now()), 0);
    const debt = (p.defi.loans ?? []).reduce((sum, l) => sum + debtOf(l, Date.now()), 0);
    return {
      positions: positions.length,
      staked,
      earnings,
      debt,
      nftOwned: p.nft.owned.length,
      nftStaked: p.nft.stakes.length,
    };
  }, [p.defi, p.nft]);

  const netWorth = p.coins + portfolio.staked + Math.floor(portfolio.earnings) - Math.round(portfolio.debt);

  const recent = useMemo(() => p.history.slice(0, 7), [p.history]);

  const [wins, losses] = [totals.inCoins, totals.outCoins];
  const net = wins - losses;

  const ago = (at: number) => {
    const mins = Math.max(0, Math.round((Date.now() - at) / 60_000));
    if (mins < 1) return fa ? "الان" : "now";
    if (mins < 60) return fa ? `${mins} دقیقه پیش` : `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return fa ? `${hours} ساعت پیش` : `${hours}h ago`;
    const days = Math.round(hours / 24);
    return fa ? `${days} روز پیش` : `${days}d ago`;
  };

  const identity = (
    <div
      data-account-hero=""
      className="relative overflow-hidden rounded-[18px] border-[2px] border-[#232a31] bg-[linear-gradient(135deg,#16202a_0%,#101820_60%,#0c1116_100%)] p-[14px]"
    >
      <div className="pointer-events-none absolute -right-[40px] -top-[60px] h-[180px] w-[180px] rounded-full bg-[#2fe98a]/10 blur-[40px]" />
      <div className="relative flex flex-wrap items-center gap-[12px]">
        <span className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full border-[3px] border-[#2fe98a]/40 bg-[#0d1216]">
          <WalletIcon width={24} height={24} className="text-[#2fe98a]" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-[6px]">
            <span className="truncate font-display text-[20px] leading-none tracking-wide text-white">{p.player?.name ?? "DRIVER"}</span>
            <span className="shrink-0 rounded-full bg-[#2fe98a]/12 px-[7px] py-[2px] font-body text-[8px] font-black tracking-[0.1em] text-[#2fe98a]">
              {p.activeCarName}
            </span>
          </div>
          <div className="mt-[5px] flex flex-wrap items-center gap-x-[10px] gap-y-[3px]">
            {p.player?.walletAddress && (
              <button
                type="button"
                onClick={copyWallet}
                data-account-copy=""
                title={p.player.walletAddress}
                className="flex items-center gap-[4px] font-body text-[10px] font-black tracking-wide text-white/55 transition-colors hover:text-white"
              >
                <span className="font-mono text-amber-400" dir="ltr">
                  {p.player.walletAddress.slice(0, 4)}…{p.player.walletAddress.slice(-4)}
                </span>
                {copied ? (
                  <CheckIcon width={11} height={11} className="text-[#2fe98a]" />
                ) : (
                  <CopyIcon width={11} height={11} className="text-white/35" />
                )}
              </button>
            )}
            {p.player?.id && (
              <span className="flex items-center gap-[4px] font-body text-[10px] font-black tracking-wide text-white/40">
                <span className="text-white/25">#</span>
                <bdi dir="ltr">{p.player.id}</bdi>
              </span>
            )}
            {p.player?.provider && (
              <span className="flex items-center gap-[4px] font-body text-[9px] font-black uppercase tracking-[0.1em] text-white/35">
                {t.connectedVia}
                <span className="text-[#b79bff]">{p.player.provider}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-[5px] rounded-[12px] border-[2px] border-[#232a31] bg-[#0d1216] px-[10px] py-[6px]">
          <Coin size={14} />
          <span className="font-display text-[16px] leading-none tabular-nums text-amber-400" dir="ltr">
            {p.coins.toLocaleString("en-US")}
          </span>
        </div>
      </div>
    </div>
  );

  const career = (
    <Panel title={t.career} icon={<FlagIcon width={12} height={12} />} testId="career">
      <div className="grid grid-cols-2 gap-[6px]">
        <Tile label={t.racesLbl} value={p.races} icon={<FlagIcon width={11} height={11} className="text-white/40" />} />
        <Tile label={t.winsLbl} value={p.wins} tone="green" icon={<TrophyIcon width={11} height={11} />} />
        <Tile label={t.points} value={p.points.toLocaleString("en-US")} tone="amber" icon={<StarBurstIcon width={11} height={11} />} />
        <Tile label={t.tasksDone} value={p.tasksDone} icon={<ClipboardIcon width={11} height={11} className="text-white/40" />} />
        <Tile label={t.carsOwned} value={p.carsOwned} icon={<CarIcon width={11} height={11} className="text-white/40" />} />
        <Tile label={t.streakLbl} value={p.streak} suffix={fa ? "روز" : "d"} icon={<BoltIcon width={11} height={11} className="text-white/40" />} />
      </div>
    </Panel>
  );

  const walletPanel = (
    <Panel title={t.portfolio} icon={<CoinIcon width={12} height={12} className="text-amber-400" />} testId="portfolio">
      <div className="grid grid-cols-2 gap-[6px]">
        <Tile label={t.statsStaked} value={Math.round(portfolio.staked).toLocaleString("en-US")} icon={<Coin size={11} />} />
        <Tile
          label={t.yourEarnings}
          value={
            portfolio.positions === 0
              ? "0"
              : portfolio.earnings >= 1
                ? Math.floor(portfolio.earnings).toLocaleString("en-US")
                : "<1"
          }
          tone="green"
        />
        <Tile label={t.statsDebt} value={Math.round(portfolio.debt).toLocaleString("en-US")} tone={portfolio.debt > 0 ? "red" : "white"} />
        <Tile label={t.netWorth} value={Math.round(netWorth).toLocaleString("en-US")} tone="amber" icon={<Coin size={11} />} />
      </div>
      <div className="mt-[6px] flex flex-wrap items-center gap-[5px]">
        <span className="rounded-full border-[2px] border-[#232a31] px-[8px] py-[3px] font-body text-[8px] font-black tracking-[0.1em] text-white/45">
          {t.positionsLabel} {portfolio.positions}
        </span>
        <span className="rounded-full border-[2px] border-[#232a31] px-[8px] py-[3px] font-body text-[8px] font-black tracking-[0.1em] text-white/45">
          {t.nftItems} {portfolio.nftOwned}
        </span>
        <span className="rounded-full border-[2px] border-[#232a31] px-[8px] py-[3px] font-body text-[8px] font-black tracking-[0.1em] text-white/45">
          {t.nftInVault} {portfolio.nftStaked}
        </span>
      </div>
    </Panel>
  );

  const ledger = (
    <Panel title={t.historyTitle} icon={<CoinIcon width={12} height={12} className="text-amber-400" />} testId="ledger">
      <div className="grid grid-cols-3 gap-[6px]">
        <div className="rounded-[13px] border-[2px] border-[#232a31] bg-[#0d1216] px-[9px] py-[7px]">
          <div className="truncate font-body text-[8px] font-black uppercase tracking-[0.13em] text-white">{t.historyEarned}</div>
          <div className="mt-[3px] font-display text-[14px] leading-none tabular-nums" style={{ color: "#46f0a0" }} dir="ltr">
            {wins === 0 ? "0" : `+${wins.toLocaleString("en-US")}`}
          </div>
        </div>
        <div className="rounded-[13px] border-[2px] border-[#232a31] bg-[#0d1216] px-[9px] py-[7px]">
          <div className="truncate font-body text-[8px] font-black uppercase tracking-[0.13em] text-white">{t.historySpent}</div>
          <div className="mt-[3px] font-display text-[14px] leading-none tabular-nums" style={{ color: "#ff5a5a" }} dir="ltr">
            {losses === 0 ? "0" : `−${losses.toLocaleString("en-US")}`}
          </div>
        </div>
        <div className="rounded-[13px] border-[2px] border-[#232a31] bg-[#0d1216] px-[9px] py-[7px]">
          <div className="truncate font-body text-[8px] font-black uppercase tracking-[0.13em] text-white">{t.historyNet}</div>
          <div
            className="mt-[3px] font-display text-[14px] leading-none tabular-nums"
            style={{ color: net > 0 ? "#46f0a0" : net < 0 ? "#ff5a5a" : "#ffffff" }}
            dir="ltr"
          >
            {net > 0 ? "+" : net < 0 ? "−" : ""}
            {Math.abs(net).toLocaleString("en-US")}
          </div>
        </div>
      </div>
    </Panel>
  );

  const activityPanel = (
    <Panel title={t.recentActivity} icon={<UndoIcon width={12} height={12} />} testId="activity">
      {recent.length === 0 ? (
        <div className="rounded-[12px] border-[2px] border-dashed border-[#232a31] px-[12px] py-[16px] text-center font-body text-[10px] font-black text-white/35">
          {t.noActivityYet}
        </div>
      ) : (
        <ul className="divide-y divide-[#1d242b]" data-account-recent="">
          {recent.map((row) => {
            const income = row.coins > 0;
            const spend = row.coins < 0;
            return (
              <li key={row.id} className="flex items-center gap-[8px] py-[6px] first:pt-0 last:pb-0">
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border-[2px] border-[#232a31] bg-[#0d1216]">
                  <Coin size={9} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-[11.5px] leading-tight text-white/85">
                    {labelOf(row.kind, lang)}
                    {row.detail ? <span className="text-white/35"> · {row.detail}</span> : null}
                  </span>
                </span>
                <span className="shrink-0 font-body text-[9px] font-black tracking-wide text-white/25">{ago(row.at)}</span>
                <span
                  className="w-[74px] shrink-0 text-end font-display text-[11.5px] leading-none tabular-nums"
                  style={{ color: income ? "#46f0a0" : spend ? "#ff5a5a" : "rgba(255,255,255,0.4)" }}
                  dir="ltr"
                >
                  {row.coins === 0 ? "—" : `${income ? "+" : "−"}${Math.abs(row.coins).toLocaleString("en-US")}`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex animate-fade-in flex-col overflow-hidden bg-[#070a0c]"
      role="dialog"
      aria-label={t.accountPage}
      data-board=""
      data-account=""
    >
      {/* backdrop glows + grid, matching the other boards */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_-10%,rgba(47,233,138,0.15),transparent_55%),radial-gradient(ellipse_at_85%_5%,rgba(176,108,255,0.16),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:44px_44px]" />

      <header className={cn("relative flex shrink-0 items-center gap-[10px]", desk ? "px-[26px] py-[14px]" : "px-[14px] py-[10px]")}>
        <button
          type="button"
          onClick={p.onClose}
          aria-label={t.back}
          data-account-back=""
          className="flex h-[34px] w-[36px] shrink-0 items-center justify-center rounded-[10px] border-[2px] border-[#2a333c] bg-[#0f1418] text-white/70 transition-colors hover:border-[#2fe98a]/60 hover:text-white"
        >
          <UndoIcon width={16} height={16} />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-[6px]">
            <span className="font-display text-[19px] leading-none tracking-wide text-white">{t.accountPage}</span>
            <span className="hidden rounded-full bg-[#b79bff]/14 px-[7px] py-[2px] font-body text-[8px] font-black tracking-[0.12em] text-[#b79bff] sm:block">
              DRIVER
            </span>
          </div>
          <div className="mt-[2px] truncate font-body text-[9px] font-black tracking-wide text-white/35">{t.accountPageSub}</div>
        </div>

        <div className="ms-auto flex items-center gap-[8px]">
          <span className="flex items-center gap-[5px] rounded-full border-[2px] border-[#2a333c] bg-[#0d1216] px-[10px] py-[4px]">
            <CoinIcon width={13} height={13} className="text-amber-400" />
            <span className="font-display text-[13px] leading-none tabular-nums text-amber-400" dir="ltr">
              {p.coins.toLocaleString("en-US")}
            </span>
          </span>
          <button
            type="button"
            onClick={p.onClose}
            aria-label={t.close}
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border-[2px] border-[#2a333c] text-white/50 transition-colors hover:border-[#ff6b6b] hover:text-white"
          >
            <CloseIcon width={14} height={14} />
          </button>
        </div>
      </header>

      <div className={cn("thin-scroll relative min-h-0 flex-1 overflow-y-auto", desk ? "px-[26px] pb-[22px]" : "px-[14px] pb-[18px]")}>
        <div className={cn("mx-auto flex w-full flex-col gap-[10px]", desk ? "max-w-[1040px]" : "max-w-[560px]")}>
          {identity}

          {desk ? (
            <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-[10px]">
              <div className="flex flex-col gap-[10px]">
                <WeeklyEngagement t={t} lang={lang} activity={p.activity} desk />
                {activityPanel}
              </div>
              <div className="flex flex-col gap-[10px]">
                {career}
                {walletPanel}
                {ledger}
              </div>
            </div>
          ) : (
            <>
              <WeeklyEngagement t={t} lang={lang} activity={p.activity} desk={false} />
              <div className="grid grid-cols-1 gap-[10px]">
                {career}
                {walletPanel}
                {ledger}
              </div>
              {activityPanel}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
