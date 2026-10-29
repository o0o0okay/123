import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import type { CarStats } from "@/data/cars";
import { useAnimatedNumber } from "@/hooks";
import { useCoinFly } from "./CoinFlyEffect";
import { BumperIcon, CoinIcon, GaugeIcon, PowerIcon } from "@/icons";
import { HexBadge } from "./ui";

/** POWER pill + TIER pill (the row under the car, mirroring the reference). */
export function StatPills({
  stats,
  tier,
  powerLabel,
  lvLabel,
}: {
  stats: CarStats;
  tier: number;
  powerLabel: string;
  lvLabel: string;
}) {
  return (
    <div className="flex items-center justify-center gap-[16px]" dir="ltr">
      <div className="relative flex h-[38px] w-[184px] items-center rounded-full bg-navy-950/90 ps-[56px] pe-[18px] ring-[3px] ring-ink shadow-[inset_0_3px_0_rgba(0,0,0,0.45)]">
        <HexBadge size={48} color="orange" className="absolute -left-[6px] -top-[7px]">
          <PowerIcon width={26} height={26} />
        </HexBadge>
        <span className="font-body text-[11px] font-black tracking-wider text-white/55">{powerLabel}</span>
        <span
          key={stats.power}
          className="ms-auto animate-pop-in font-display text-[23px] text-amber-400 t-stroke sw-3"
        >
          {stats.power}
        </span>
      </div>

      <div className="flex h-[38px] w-[132px] overflow-hidden rounded-full bg-white ring-[3px] ring-ink shadow-[0_3px_0_rgba(10,16,56,0.4)]">
        <div className="flex w-[62px] items-center justify-start bg-navy-800 ps-[12px] font-display text-[15px] text-white [clip-path:polygon(0_0,100%_0,76%_100%,0_100%)]">
          {lvLabel}
        </div>
        <div
          key={tier}
          className="flex flex-1 animate-pop-in items-center justify-center font-display text-[23px] text-ink"
        >
          {tier}
        </div>
      </div>
    </div>
  );
}

/** COINS / TOP SPEED / BODY — the three numbers that matter in a chase game. */
export function StatsRow({
  stats,
  coins,
  labels,
  className,
}: {
  stats: CarStats;
  coins: number;
  labels: { coins: string; topSpeed: string; armor: string; kmh: string };
  className?: string;
}) {
  const animatedCoins = useAnimatedNumber(coins);
  const { isPulsing } = useCoinFly();

  const items = [
    {
      id: "mobile-top-coin-badge",
      icon: <CoinIcon width={26} height={26} className={cn("transition-transform", isPulsing && "scale-125")} />,
      value: animatedCoins.toLocaleString("en-US"),
      suffix: "",
      color: "text-amber-400",
      label: labels.coins,
      pulsing: isPulsing,
    },
    {
      id: "stat-speed",
      icon: <GaugeIcon width={26} height={26} />,
      value: `${stats.topSpeed}`,
      suffix: labels.kmh,
      color: "text-mint-400",
      label: labels.topSpeed,
      pulsing: false,
    },
    {
      id: "stat-armor",
      icon: <BumperIcon width={26} height={26} />,
      value: String(stats.armor),
      suffix: "",
      color: "text-skyg-300",
      label: labels.armor,
      pulsing: false,
    },
  ];
  return (
    <div className={cn("flex items-stretch justify-between gap-[8px]", className)} dir="ltr">
      {items.map((it, i) => (
        <div
          key={i}
          id={it.id}
          className={cn(
            "flex flex-1 items-center gap-[8px] rounded-[14px] border-[3px] border-ink bg-navy-950/75 px-[10px] py-[6px] shadow-[inset_0_2px_0_rgba(255,255,255,0.06)] transition-all duration-300",
            it.pulsing && "scale-[1.06] ring-[3px] ring-amber-400 shadow-[0_0_18px_rgba(255,210,58,0.7)]",
          )}
        >
          <span className={cn("shrink-0 drop-shadow-[0_2px_0_rgba(0,0,0,0.35)]", it.color)}>{it.icon}</span>
          <div className="min-w-0">
            <div className="truncate font-body text-[9px] font-black tracking-wider text-white/50">{it.label}</div>
            <div className="flex items-baseline gap-[3px]">
              <span className="truncate font-display text-[20px] leading-none text-white t-stroke sw-2">{it.value}</span>
              {it.suffix && <span className="font-body text-[9px] font-black text-white/45">{it.suffix}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Small label + value block used inside garage upgrade rows. */
export function MiniStat({
  icon,
  label,
  value,
  color = "text-white",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-[8px]">
      <span className="shrink-0 text-skyg-300">{icon}</span>
      <div className="min-w-0">
        <div className="truncate font-body text-[9px] font-black tracking-wider text-white/45">{label}</div>
        <div className={cn("truncate font-display text-[17px] leading-none", color)}>{value}</div>
      </div>
    </div>
  );
}
