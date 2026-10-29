import { useEffect, useState, type MouseEvent } from "react";
import { cn } from "@/utils/cn";
import { formatCountdown, type DailyTileState, type DailyView } from "@/data/daily";
import type { Strings } from "@/i18n";
import { CheckIcon, CoinIcon, GiftIcon, LockIcon, StarBurstIcon } from "@/icons";

/** `500` → `500`, `1500` → `1.5k` — keeps the tiny day tiles readable. */
function short(n: number) {
  return n >= 1000 ? `${+(n / 1000).toFixed(1)}k` : `${n}`;
}

/** Ticks down to the next local midnight; the app hands us the remaining ms. */
export function Countdown({ ms }: { ms: number }) {
  const [left, setLeft] = useState(ms);
  useEffect(() => setLeft(ms), [ms]);
  useEffect(() => {
    const id = window.setInterval(() => setLeft((v) => Math.max(0, v - 1000)), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span className="tabular-nums" dir="ltr">
      {formatCountdown(left)}
    </span>
  );
}

const TILE: Record<DailyTileState, string> = {
  claimed: "border-mint-400/45 bg-mint-500/12 text-mint-400",
  current: "border-ink bg-gradient-to-b from-[#ffe05a] to-[#ffa41c] text-ink shadow-[0_3px_0_#c9660e]",
  locked: "border-ink/70 bg-navy-950/70 text-white/30",
};

/* ------------------------------------------------------------------ */
/* one day of the seven-day cycle                                      */
/* ------------------------------------------------------------------ */

function DayTile({
  t,
  tile,
  active,
  claimedToday,
  dense,
}: {
  t: Strings;
  tile: DailyView["tiles"][number];
  /** this tile is today */
  active: boolean;
  claimedToday: boolean;
  dense?: boolean;
}) {
  const label = t.dailyDay.replace("{n}", `${tile.day}`);
  const status = tile.state === "claimed" ? t.claimed : tile.state === "current" ? t.dailyToday : t.dailyLocked;
  return (
    <div
      title={`${label} · ${tile.reward.toLocaleString("en-US")} · ${status}`}
      aria-label={`${label} · ${tile.reward.toLocaleString("en-US")} · ${status}`}
      data-state={tile.state}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-[10px] border-[2.5px] text-center transition-all",
        dense ? "h-[52px]" : "h-[58px]",
        TILE[tile.state],
        active && tile.state === "current" && "animate-glow ring-[2px] ring-white/60",
        active && tile.state === "claimed" && claimedToday && "ring-[2px] ring-mint-400/40",
      )}
    >
      <span className="font-body text-[8px] font-black leading-none tracking-wide opacity-70">
        {tile.day}
      </span>

      {tile.state === "claimed" ? (
        <CheckIcon width={dense ? 13 : 15} height={dense ? 13 : 15} className="mt-[3px]" />
      ) : tile.state === "locked" ? (
        <LockIcon width={dense ? 12 : 14} height={dense ? 12 : 14} className="mt-[3px]" />
      ) : (
        <CoinIcon width={dense ? 13 : 15} height={dense ? 13 : 15} className="mt-[2px]" />
      )}

      <span
        className={cn(
          "mt-[2px] font-display leading-none",
          dense ? "text-[10px]" : "text-[11px]",
          tile.state === "current" ? "text-ink" : "",
        )}
      >
        {short(tile.reward)}
      </span>

      {active && (
        <span
          className={cn(
            "absolute -top-[6px] start-1/2 -translate-x-1/2 rounded-full border-[2px] border-ink px-[4px] font-body text-[7px] font-black leading-[10px]",
            claimedToday ? "bg-mint-400 text-ink" : "bg-white text-ink",
          )}
        >
          {t.dailyToday}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* the whole daily check-in card                                       */
/* ------------------------------------------------------------------ */

export function DailyReward({
  t,
  daily,
  onClaim,
  dense,
}: {
  t: Strings;
  daily: DailyView;
  onClaim: (e: MouseEvent<HTMLButtonElement>) => void;
  dense?: boolean;
}) {
  const claimable = !daily.claimedToday;

  return (
    <div
      id="daily-checkin"
      data-claimed={daily.claimedToday ? "true" : "false"}
      className={cn(
        "relative overflow-hidden rounded-[16px] border-[3px] border-ink bg-gradient-to-br from-[#2d2a6b] via-navy-900 to-navy-950 shadow-[0_3px_0_#060a28]",
        claimable && "ring-[2px] ring-amber-400/70 shadow-[0_0_14px_rgba(255,210,58,0.22)]",
      )}
    >
      {/* soft gold glow behind the header */}
      <div className="pointer-events-none absolute -top-[26px] end-[-14px] h-[74px] w-[74px] rounded-full bg-amber-400/15 blur-[10px]" />

      {/* header */}
      <div className={cn("relative flex items-center gap-[7px]", dense ? "px-[9px] pt-[7px]" : "px-[10px] pt-[9px]")}>
        <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[8px] border-[2.5px] border-ink bg-gradient-to-b from-[#ffe05a] to-[#ffa41c] text-ink shadow-[0_2px_0_#c9660e]">
          <GiftIcon width={15} height={15} />
        </span>
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "truncate font-display leading-none text-white",
              dense ? "text-[13px]" : "text-[15px] t-stroke sw-2",
            )}
          >
            {t.dailyTitle}
          </div>
          {!dense && (
            <div className="mt-[2px] truncate font-body text-[9px] font-bold text-white/45">{t.dailyBonusHint}</div>
          )}
        </div>
        <span
          className={cn(
            "flex shrink-0 items-center gap-[3px] rounded-full border-[2px] border-ink px-[6px] font-body text-[9px] font-black leading-[15px]",
            daily.streak > 0 ? "bg-amber-400/20 text-amber-300" : "bg-navy-950 text-white/35",
          )}
        >
          <StarBurstIcon width={10} height={10} />
          {daily.streak > 0 ? t.dailyStreak.replace("{n}", `${daily.streak}`) : t.dailyStreakNone}
        </span>
      </div>

      {/* seven day strip */}
      <div className={cn("relative grid grid-cols-7 gap-[4px]", dense ? "px-[9px] pt-[8px]" : "px-[10px] pt-[10px]")}>
        {daily.tiles.map((tile, i) => (
          <DayTile
            key={tile.day}
            t={t}
            tile={tile}
            active={i === daily.activeIndex}
            claimedToday={daily.claimedToday}
            dense={dense}
          />
        ))}
      </div>

      {/* action */}
      <div className={cn("relative", dense ? "px-[9px] pb-[8px] pt-[7px]" : "px-[10px] pb-[10px] pt-[9px]")}>
        {claimable ? (
          <button
            type="button"
            id="daily-claim-btn"
            onClick={onClaim}
            className={cn(
              "relative flex w-full animate-glow items-center justify-center gap-[6px] rounded-[12px] border-[3px] border-ink bg-gradient-to-b from-[#b6f56f] to-[#4fae22] font-display tracking-wide text-[#123307] shadow-[0_4px_0_#2c6d10] transition-transform hover:brightness-105 active:translate-y-[2px] active:shadow-none",
              dense ? "h-[34px] text-[15px]" : "h-[42px] text-[18px]",
            )}
          >
            <GiftIcon width={dense ? 15 : 18} height={dense ? 15 : 18} />
            {t.dailyClaim}
            <span className="flex items-center gap-[3px]" dir="ltr">
              <CoinIcon width={dense ? 14 : 16} height={dense ? 14 : 16} />
              <span className="tabular-nums">{daily.reward.toLocaleString("en-US")}</span>
            </span>
          </button>
        ) : (
          <div
            className={cn(
              "flex items-center justify-between gap-[6px] rounded-[12px] border-[2.5px] border-ink bg-navy-950/80 px-[9px]",
              dense ? "h-[34px]" : "h-[42px]",
            )}
          >
            <span className="flex items-center gap-[4px] font-body text-[10px] font-black text-mint-400">
              <CheckIcon width={12} height={12} />
              {t.dailyClaimed}
            </span>
            <span className="flex items-center gap-[4px] font-body text-[9px] font-black text-white/40">
              {t.dailyNext}
              <Countdown ms={daily.msToReset} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
