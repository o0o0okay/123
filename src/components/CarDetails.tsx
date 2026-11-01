import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { BRANDS, carTitle, ppOf, STAT_MAX, type Car, type CarStats } from "@/data/cars";
import type { Lang, Strings } from "@/i18n";
import { BumperIcon, CoinIcon, GaugeIcon, LockIcon, NitroIcon, PowerIcon, TireIcon } from "@/icons";
import { PaintedImg } from "./PaintContext";
import { BrandBadge } from "./DealerBits";

export interface CarDetailsProps {
  t: Strings;
  lang: Lang;
  car: Car;
  /** live stats (owned cars carry their upgrades) */
  stats: CarStats;
  mode: "buy" | "sell";
  /** shop price in BUY, money back in SELL */
  price: number;
  equipped?: boolean;
  /** SELL only: the car is pledged as loan collateral and cannot be sold */
  locked?: boolean;
  /** desktop shows the keyboard hint under the description */
  desk?: boolean;
}

/**
 * Everything about one car, as a vertical card.
 *
 * Shown next to the showroom grid on desktop and inside a sheet on mobile, so
 * the selected car can be studied without leaving the list (and without opening
 * the comparison board).
 */
export function CarDetails({ t, lang, car, stats, mode, price, equipped, locked, desk }: CarDetailsProps) {
  const bars: { key: string; label: string; icon: ReactNode; value: number; max: number; suffix?: string; tint: string }[] = [
    {
      key: "topSpeed",
      label: t.topSpeed,
      icon: <GaugeIcon width={11} height={11} />,
      value: stats.topSpeed,
      max: STAT_MAX.topSpeed,
      suffix: t.kmh,
      tint: "from-[#2fd98a] to-[#46f0a0]",
    },
    {
      key: "armor",
      label: t.armor,
      icon: <BumperIcon width={11} height={11} />,
      value: stats.armor,
      max: STAT_MAX.armor,
      tint: "from-[#2b7fe0] to-[#6fc1ff]",
    },
    {
      key: "accel",
      label: t.accel,
      icon: <TireIcon width={11} height={11} />,
      value: stats.accel,
      max: STAT_MAX.accel,
      tint: "from-[#4fae22] to-[#9ef05a]",
    },
    {
      key: "boost",
      label: t.boost,
      icon: <NitroIcon width={11} height={11} />,
      value: stats.boost,
      max: STAT_MAX.boost,
      tint: "from-[#8e3bff] to-[#c98cff]",
    },
  ];

  const specs: [string, string][] = [
    [t.yearLabel, String(car.year)],
    [t.drivetrainShort, car.drive],
    ["BHP", String(car.bhp)],
    ["PP", String(ppOf(car))],
  ];

  return (
    <div id="dealer-details" className="flex flex-col gap-[7px]">
      {/* brand + rarity */}
      <div className="flex items-center justify-between gap-[6px]">
        <span className="flex items-center gap-[5px] font-body text-[10px] font-black tracking-[0.08em] text-white/60">
          <BrandBadge brand={car.brand} size={16} />
          {BRANDS[car.brand].name}
        </span>
        <span
          className="shrink-0 rounded-full border-[2px] px-[6px] font-body text-[9px] font-black leading-[14px]"
          style={{ color: car.rarityColor, borderColor: `${car.rarityColor}66`, background: `${car.rarityColor}1f` }}
        >
          {car.rarity}
        </span>
      </div>

      <div className="truncate font-display text-[19px] leading-none text-white t-stroke sw-3" dir="ltr">
        {carTitle(car)}
      </div>

      {/* car on its plate */}
      <div className="relative flex h-[86px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] border-[3px] border-ink bg-[radial-gradient(ellipse_at_center,#2f5fc4,#101a44_78%)]">
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[24px] bg-[#0a1238]/60" />
        <PaintedImg
          carId={car.id}
          shadow="drop-shadow(0 6px 5px rgba(0,0,0,0.5))"
          src={car.image}
          alt={car.name}
          draggable={false}
          className="relative max-h-[74px] max-w-[93%] object-contain"
        />
      </div>

      {/* quick specs */}
      <div className="grid grid-cols-2 gap-[5px]" dir="ltr">
        {specs.map(([label, value]) => (
          <div key={label} className="rounded-[9px] border-[2px] border-ink bg-navy-950/60 px-[6px] py-[3px]">
            <div className="truncate font-body text-[8px] font-black tracking-wider text-white/40">{label}</div>
            <div className="font-display text-[13px] leading-none text-white">{value}</div>
          </div>
        ))}
      </div>

      {/* stat bars */}
      <div className="mt-[1px]">
        <div className="mb-[4px] flex items-center gap-[5px] font-display text-[10px] tracking-[0.06em] text-skyg-300">
          <PowerIcon width={11} height={11} />
          {t.baseStats}
          <span className="h-[2px] flex-1 rounded bg-white/10" />
        </div>
        {bars.map((b) => (
          <div key={b.key} data-stat={b.key} className="mb-[5px] last:mb-0" dir="ltr">
            <div className="flex items-center justify-between gap-[4px] font-body text-[9px] font-black tracking-wide text-white/45">
              <span className="flex items-center gap-[3px]">
                {b.icon}
                {b.label}
              </span>
              <span className="text-white/85">
                {b.value}
                {b.suffix && <span className="ms-[2px] text-[8px] text-white/35">{b.suffix}</span>}
              </span>
            </div>
            <div className="mt-[2px] h-[6px] overflow-hidden rounded-full border-[1.5px] border-ink bg-navy-950">
              <div
                className={cn("h-full rounded-full bg-gradient-to-r", b.tint)}
                style={{ width: `${Math.max(4, Math.min(100, (b.value / b.max) * 100))}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* price (or, for a pledged car, the reason it cannot be sold) */}
      <div
        data-detail-locked={locked || undefined}
        className={cn(
          "flex items-center justify-between gap-[6px] rounded-[11px] border-[3px] px-[8px] py-[5px]",
          locked ? "border-[#8a5a12] bg-[#2a1f0c]/80" : "border-ink bg-navy-950/70",
        )}
      >
        <span className="font-body text-[9px] font-black tracking-[0.08em] text-white/45">
          {locked ? t.lockedPill : mode === "sell" ? t.sellValueLabel : equipped ? t.equipped : t.price}
        </span>
        <span
          className={cn(
            "flex items-center gap-[4px] font-display text-[16px] leading-none",
            locked ? "text-amber-300" : mode === "sell" ? "text-mint-400" : "text-amber-400",
          )}
          dir="ltr"
        >
          {locked ? <LockIcon width={13} height={13} /> : <CoinIcon width={14} height={14} />}
          {locked ? t.lockedValue : price === 0 ? t.free : `${mode === "sell" ? "+" : ""}${price.toLocaleString("en-US")}`}
        </span>
      </div>

      {locked && (
        <p
          data-detail-locked-note=""
          className="rounded-[9px] border-[2px] border-[#8a5a12]/70 bg-[#2a1f0c]/60 px-[7px] py-[4px] font-body text-[9px] font-black leading-snug text-amber-300/90"
        >
          {t.lockedSellNote}
        </p>
      )}

      {/* blurb */}
      <p className="font-body text-[11px] font-bold leading-snug text-white/55">{car.desc[lang]}</p>

      {desk && (
        <div className="mt-[1px] flex items-center justify-center gap-[5px] rounded-[9px] border-[2px] border-dashed border-white/15 px-[6px] py-[4px] font-body text-[9px] font-black tracking-wide text-white/35">
          {t.browseHint}
        </div>
      )}
    </div>
  );
}
