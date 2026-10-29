import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import type { CarStats } from "@/data/cars";
import { RACES, type RaceId, type RaceMode } from "@/data/races";
import { fmt, type Lang, type Strings } from "@/i18n";
import { useAnimatedNumber } from "@/hooks";
import { useCoinFly } from "./CoinFlyEffect";
import {
  BumperIcon,
  CoinIcon,
  DriftIcon,
  FlagIcon,
  GaugeIcon,
  NitroIcon,
  PoliceLightIcon,
  PowerIcon,
  SkullIcon,
  StarBurstIcon,
  TimerIcon,
  TireIcon,
  TrophyIcon,
  UserIcon,
} from "@/icons";
import { FloatingPanel } from "./ui";

export const RACE_ICONS: Record<RaceId, ReactNode> = {
  street: <FlagIcon width={26} height={26} />,
  score: <StarBurstIcon width={26} height={26} />,
  demolition: <SkullIcon width={26} height={26} />,
  pursuit: <PoliceLightIcon width={26} height={26} />,
  drift: <DriftIcon width={26} height={26} />,
  timeattack: <TimerIcon width={26} height={26} />,
};

const PRIMARY_ICON: Record<RaceMode["primary"], ReactNode> = {
  topSpeed: <GaugeIcon width={12} height={12} />,
  armor: <BumperIcon width={12} height={12} />,
  accel: <TireIcon width={12} height={12} />,
  boost: <NitroIcon width={12} height={12} />,
};

export interface RaceProps {
  stats: CarStats;
  coins: number;
  wins: Record<string, number>;
  racing: boolean;
  onRace: (mode: RaceMode) => void;
}

/* ------------------------------------------------------------------ */
/* one mode card                                                       */
/* ------------------------------------------------------------------ */

function RaceCard({
  t,
  lang,
  mode,
  stats,
  coins,
  wins,
  racing,
  onRace,
  dense,
}: {
  t: Strings;
  lang: Lang;
  mode: RaceMode;
  stats: CarStats;
  coins: number;
  wins: number;
  racing: boolean;
  onRace: (m: RaceMode) => void;
  dense?: boolean;
}) {
  const affordable = coins >= mode.fee;
  const underPowered = stats.power < mode.minPower;
  const primaryLabel = {
    topSpeed: t.topSpeed,
    armor: t.armor,
    accel: t.accel,
    boost: t.boost,
  }[mode.primary];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[18px] border-[3px] border-ink bg-gradient-to-b from-navy-700/95 to-navy-900/95 shadow-[0_4px_0_#060a28]",
        dense ? "p-[8px]" : "p-[10px]",
      )}
    >
      {/* gradient stripe */}
      <span className={cn("absolute inset-y-0 start-0 w-[6px] bg-gradient-to-b", mode.color)} />

      <div className="flex items-start gap-[10px] ps-[6px]">
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-[13px] border-[3px] border-ink bg-gradient-to-b text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.3),0_3px_0_#0a1038]",
            dense ? "h-[42px] w-[42px]" : "h-[50px] w-[50px]",
            mode.color,
          )}
        >
          {RACE_ICONS[mode.id]}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-[6px]">
            <span className={cn("truncate font-display leading-none text-white t-stroke sw-2", dense ? "text-[16px]" : "text-[18px]")}>
              {mode.title[lang]}
            </span>
            {wins > 0 && (
              <span className="flex shrink-0 items-center gap-[2px] rounded-full border-[2px] border-ink bg-amber-400 px-[5px] font-body text-[9px] font-black leading-[14px] text-ink">
                <TrophyIcon width={9} height={9} />
                {wins}
              </span>
            )}
          </div>
          <p className={cn("mt-[3px] font-body font-bold leading-snug text-white/55", dense ? "line-clamp-1 text-[9px]" : "line-clamp-2 text-[10px]")}>
            {mode.desc[lang]}
          </p>

          {/* chips */}
          <div className="mt-[5px] flex flex-wrap items-center gap-[4px]">
            <span className="flex items-center gap-[3px] rounded-full border-[2px] border-ink bg-navy-950 px-[6px] font-body text-[9px] font-black leading-[15px] text-mint-400">
              {PRIMARY_ICON[mode.primary]}
              {primaryLabel}
            </span>
            <span className="flex items-center gap-[3px] rounded-full border-[2px] border-ink bg-navy-950 px-[6px] font-body text-[9px] font-black leading-[15px] text-skyg-300">
              <UserIcon width={10} height={10} />
              {mode.rivals === 0 ? t.solo : `${mode.rivals} ${t.rivals}`}
            </span>
            <span
              className={cn(
                "flex items-center gap-[3px] rounded-full border-[2px] border-ink px-[6px] font-body text-[9px] font-black leading-[15px]",
                underPowered ? "bg-[#ff4f1f]/25 text-[#ff8a6a]" : "bg-navy-950 text-white/55",
              )}
            >
              <PowerIcon width={10} height={10} />
              {mode.minPower}
            </span>
          </div>
        </div>
      </div>

      {/* fee / prize / action */}
      <div className="mt-[8px] flex items-center justify-between gap-[8px] ps-[6px]">
        <div className="flex items-center gap-[10px]">
          <div>
            <div className="font-body text-[8px] font-black tracking-wider text-white/40">{t.entryFee}</div>
            <div className="flex items-center gap-[3px] font-display text-[14px] leading-none text-white">
              {mode.fee === 0 ? (
                <span className="text-mint-400">{t.free}</span>
              ) : (
                <>
                  <CoinIcon width={13} height={13} />
                  {mode.fee.toLocaleString("en-US")}
                </>
              )}
            </div>
          </div>
          <span className="h-[26px] w-[2px] rounded bg-white/10" />
          <div>
            <div className="font-body text-[8px] font-black tracking-wider text-white/40">{t.prize}</div>
            <div className="flex items-center gap-[3px] font-display text-[14px] leading-none text-amber-400">
              <CoinIcon width={13} height={13} />
              {mode.reward[0].toLocaleString("en-US")}–{mode.reward[1].toLocaleString("en-US")}
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={!affordable || racing}
          onClick={() => onRace(mode)}
          className={cn(
            "flex h-[32px] shrink-0 items-center gap-[5px] rounded-full border-[2.5px] border-ink px-[14px] font-display text-[15px] transition-transform active:translate-y-[2px] active:shadow-none",
            affordable && !racing
              ? "bg-gradient-to-b from-[#ffe05a] to-[#ffa41c] text-ink shadow-[0_3px_0_#c9660e] hover:brightness-110"
              : "bg-navy-900 text-white/35",
            affordable && !racing && !underPowered && "animate-glow",
          )}
        >
          <FlagIcon width={15} height={15} />
          {racing ? t.racing : !affordable ? fmt(t.needMore, { n: (mode.fee - coins).toLocaleString("en-US") }) : t.raceNow}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* panel                                                               */
/* ------------------------------------------------------------------ */

export function RacePanel({
  t,
  lang,
  stats,
  coins,
  wins,
  racing,
  onRace,
  className,
  dense,
}: RaceProps & { t: Strings; lang: Lang; className?: string; dense?: boolean }) {
  const animatedCoins = useAnimatedNumber(coins);
  const { isPulsing } = useCoinFly();
  const totalWins = Object.values(wins).reduce((a, b) => a + b, 0);

  return (
    <div className={cn("flex h-full flex-col gap-[9px]", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-between rounded-[16px] border-[3px] border-ink bg-gradient-to-r from-navy-800 to-navy-900 px-[13px] py-[7px] shadow-[0_4px_0_#060a28] transition-all duration-300",
          isPulsing && "scale-[1.03] ring-[3px] ring-amber-400 shadow-[0_0_18px_rgba(255,210,58,0.7)]",
        )}
      >
        <div className="flex items-center gap-[9px]">
          <CoinIcon width={30} height={30} className={cn("transition-transform", isPulsing && "scale-125")} />
          <div>
            <div className="font-body text-[10px] font-black tracking-wider text-white/50">{t.coins}</div>
            <div className="font-display text-[22px] leading-none text-amber-400 t-stroke sw-3">
              {animatedCoins.toLocaleString("en-US")}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-[10px]">
          <div className="text-end">
            <div className="font-body text-[9px] font-black tracking-wider text-white/45">{t.power}</div>
            <div className="font-display text-[18px] leading-none text-white">{stats.power}</div>
          </div>
          <span className="flex items-center gap-[4px] rounded-full border-[3px] border-ink bg-navy-950 px-[9px] py-[3px] font-display text-[13px] text-amber-400">
            <TrophyIcon width={15} height={15} />
            {totalWins}
          </span>
        </div>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 space-y-[8px] overflow-y-auto px-[2px] pb-[3px] pt-[2px]">
        {RACES.map((mode) => (
          <RaceCard
            key={mode.id}
            t={t}
            lang={lang}
            mode={mode}
            stats={stats}
            coins={coins}
            wins={wins[mode.id] ?? 0}
            racing={racing}
            onRace={onRace}
            dense={dense}
          />
        ))}
      </div>
    </div>
  );
}

/** Race modes inside the floating titled panel (mobile tab). */
export function RaceView({
  t,
  lang,
  race,
  className,
}: {
  t: Strings;
  lang: Lang;
  race: RaceProps;
  className?: string;
}) {
  return (
    <FloatingPanel title={t.raceTitle} className={className}>
      <RacePanel t={t} lang={lang} {...race} className="min-h-0 flex-1" />
    </FloatingPanel>
  );
}
