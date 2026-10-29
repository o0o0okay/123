import type { MouseEvent, ReactNode } from "react";
import { cn } from "@/utils/cn";
import type { Car, UpgradeKey } from "@/data/cars";
import { UPGRADES, carStats, upgradeCost, MAX_LEVEL } from "@/data/cars";
import type { Lang, Strings } from "@/i18n";
import { useAnimatedNumber } from "@/hooks";
import { useCoinFly } from "./CoinFlyEffect";
import { BumperIcon, CoinIcon, EngineIcon, GaugeIcon, NitroIcon, PowerIcon, TireIcon } from "@/icons";
import { PaintRow } from "./PaintShop";
import { usePaintFilter } from "./PaintContext";
import { FloatingPanel } from "./ui";

const ICONS: Record<UpgradeKey, ReactNode> = {
  engine: <EngineIcon width={28} height={28} />,
  body: <BumperIcon width={28} height={28} />,
  tires: <TireIcon width={28} height={28} />,
  nitro: <NitroIcon width={28} height={28} />,
};

const NAMES: Record<UpgradeKey, keyof Strings> = {
  engine: "upgEngine",
  body: "upgBody",
  tires: "upgTires",
  nitro: "upgNitro",
};

const DESCS: Record<UpgradeKey, keyof Strings> = {
  engine: "engineDesc",
  body: "bodyDesc",
  tires: "tiresDesc",
  nitro: "nitroDesc",
};

const COLORS: Record<UpgradeKey, string> = {
  engine: "from-[#ff8a3a] to-[#ff5a1f]",
  body: "from-[#5fc8ff] to-[#2b7fe0]",
  tires: "from-[#9ef05a] to-[#4fae22]",
  nitro: "from-[#c98cff] to-[#8e3bff]",
};

interface Props {
  t: Strings;
  lang: Lang;
  car: Car;
  levels: Record<UpgradeKey, number>;
  coins: number;
  runReward: number;
  /** paint currently sprayed on the car */
  paintId: string;
  onUpgrade: (key: UpgradeKey) => void;
  onCollect: (e: MouseEvent<HTMLButtonElement>) => void;
  onOpenPaint: () => void;
  className?: string;
  showStats?: boolean;
}

/** Upgrade row: icon, level pips, effect and the cost button. */
function UpgradeRow({
  t,
  k,
  level,
  coins,
  onUpgrade,
}: {
  t: Strings;
  k: UpgradeKey;
  level: number;
  coins: number;
  onUpgrade: (k: UpgradeKey) => void;
}) {
  const maxed = level >= MAX_LEVEL;
  const cost = upgradeCost(k, level);
  const affordable = coins >= cost;
  const def = UPGRADES.find((u) => u.key === k)!;

  const effect = (() => {
    switch (k) {
      case "engine":
        return `+${def.perLevel} ${t.kmh}`;
      case "body":
        return `+${def.perLevel} ${t.armor}`;
      case "tires":
        return `+${def.perLevel} ${t.accel}`;
      case "nitro":
        return `+${def.perLevel} ${t.boost}`;
    }
  })();

  return (
    <div className="flex items-center gap-[10px] rounded-[16px] border-[3px] border-ink bg-navy-950/65 p-[8px]">
      <div
        className={cn(
          "flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[12px] border-[3px] border-ink bg-gradient-to-b text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.3),0_3px_0_#0a1038]",
          COLORS[k],
        )}
      >
        {ICONS[k]}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-[6px]">
          <span className="font-display text-[16px] leading-none text-white t-stroke sw-2">
            {t[NAMES[k]] as string}
          </span>
          <span className="rounded-full border-[2px] border-ink bg-navy-800 px-[6px] py-[1px] font-body text-[10px] font-black text-skyg-300">
            {t.level} {level}
          </span>
        </div>
        <div className="mt-[3px] font-body text-[10px] font-bold text-white/45">{t[DESCS[k]] as string}</div>

        {/* level pips */}
        <div className="mt-[5px] flex items-center gap-[3px]">
          {Array.from({ length: MAX_LEVEL }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-[7px] flex-1 rounded-full border-[1.5px] border-ink",
                i < level ? "bg-gradient-to-b from-mint-400 to-mint-600" : "bg-navy-900",
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex w-[86px] shrink-0 flex-col items-end gap-[4px]">
        <span className="font-body text-[10px] font-black text-mint-400">{effect}</span>
        {maxed ? (
          <span className="rounded-full border-[2.5px] border-ink bg-gradient-to-b from-amber-400 to-amber-500 px-[12px] py-[3px] font-display text-[13px] text-ink">
            {t.maxed}
          </span>
        ) : (
          <button
            type="button"
            disabled={!affordable}
            onClick={() => onUpgrade(k)}
            className={cn(
              "flex items-center gap-[4px] rounded-full border-[2.5px] border-ink px-[10px] py-[3px] transition-transform active:translate-y-[2px]",
              affordable
                ? "bg-gradient-to-b from-[#9ef05a] to-[#56b92a] text-ink shadow-[0_3px_0_#2f7f17]"
                : "bg-navy-900 text-white/30 shadow-none",
            )}
          >
            <CoinIcon width={14} height={14} className={affordable ? "" : "opacity-40"} />
            <span className="font-display text-[13px] leading-none">{cost.toLocaleString("en-US")}</span>
          </button>
        )}
      </div>
    </div>
  );
}

/** The garage: coin balance, run reward, live stats and the four upgrade rows. */
export function GaragePanel({
  t,
  lang,
  car,
  levels,
  coins,
  runReward,
  paintId,
  onUpgrade,
  onCollect,
  onOpenPaint,
  className,
  showStats = true,
}: Props) {
  const animatedCoins = useAnimatedNumber(coins);
  const { isPulsing } = useCoinFly();
  const stats = carStats(car, levels);
  const lv = (k: UpgradeKey) => levels[k];

  return (
    <div className={cn("flex h-full flex-col gap-[10px] overflow-hidden", className)}>
      {/* coin balance with pulse */}
      <div
        className={cn(
          "flex shrink-0 items-center justify-between rounded-[16px] border-[3px] border-ink bg-gradient-to-r from-navy-800 to-navy-900 px-[14px] py-[8px] shadow-[0_4px_0_#060a28] transition-all duration-300",
          isPulsing && "scale-[1.03] ring-[3px] ring-amber-400 shadow-[0_0_18px_rgba(255,210,58,0.7)]",
        )}
      >
        <div className="flex items-center gap-[10px]">
          <CoinIcon width={32} height={32} className={cn("transition-transform", isPulsing && "scale-125")} />
          <div>
            <div className="font-body text-[10px] font-black tracking-wider text-white/50">{t.coins}</div>
            <div className="font-display text-[24px] leading-none text-amber-400 t-stroke sw-3">
              {animatedCoins.toLocaleString("en-US")}
            </div>
          </div>
        </div>
        <div className="text-end">
          <div className="font-body text-[10px] font-black tracking-wider text-white/50">{t.collected}</div>
          <div className="font-display text-[18px] leading-none text-mint-400">{t.runReward}</div>
        </div>
      </div>

      {/* run reward */}
      <button
        type="button"
        onClick={onCollect}
        disabled={runReward <= 0}
        className={cn(
          "flex shrink-0 items-center justify-between rounded-[16px] border-[3px] border-ink px-[14px] py-[8px] transition-transform active:translate-y-[2px]",
          runReward > 0
            ? "bg-gradient-to-r from-[#ffd23a] to-[#ff9a1f] shadow-[0_4px_0_#b96a08] animate-glow"
            : "bg-navy-950/60",
        )}
      >
        <div className="text-start">
          <div className="font-body text-[10px] font-black tracking-wider text-ink/70">{t.lastChase}</div>
          <div
            className={cn(
              "font-display text-[22px] leading-none",
              runReward > 0 ? "text-ink" : "text-white/30",
            )}
          >
            +{runReward.toLocaleString("en-US")}
          </div>
        </div>
        <span
          className={cn(
            "rounded-full border-[3px] border-ink px-[14px] py-[4px] font-display text-[15px]",
            runReward > 0 ? "bg-mint-500 text-ink shadow-[0_2px_0_#1b7a42]" : "bg-navy-900 text-white/30",
          )}
        >
          {t.collect}
        </span>
      </button>

      {/* live stats */}
      {showStats && (
        <div className="grid shrink-0 grid-cols-2 gap-[8px]">
          <div className="flex items-center gap-[8px] rounded-[12px] border-[3px] border-ink bg-navy-950/65 px-[10px] py-[6px]">
            <GaugeIcon width={24} height={24} className="text-mint-400" />
            <div>
              <div className="font-body text-[9px] font-black text-white/45">{t.topSpeed}</div>
              <div className="font-display text-[18px] leading-none text-white">
                {stats.topSpeed} <span className="text-[10px] text-white/50">{t.kmh}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-[8px] rounded-[12px] border-[3px] border-ink bg-navy-950/65 px-[10px] py-[6px]">
            <BumperIcon width={24} height={24} className="text-skyg-300" />
            <div>
              <div className="font-body text-[9px] font-black text-white/45">{t.armor}</div>
              <div className="font-display text-[18px] leading-none text-white">{stats.armor}</div>
            </div>
          </div>
          <div className="flex items-center gap-[8px] rounded-[12px] border-[3px] border-ink bg-navy-950/65 px-[10px] py-[6px]">
            <TireIcon width={24} height={24} className="text-lime-400" />
            <div>
              <div className="font-body text-[9px] font-black text-white/45">{t.accel}</div>
              <div className="font-display text-[18px] leading-none text-white">{stats.accel}</div>
            </div>
          </div>
          <div className="flex items-center gap-[8px] rounded-[12px] border-[3px] border-ink bg-navy-950/65 px-[10px] py-[6px]">
            <NitroIcon width={24} height={24} className="text-[#c98cff]" />
            <div>
              <div className="font-body text-[9px] font-black text-white/45">{t.boost}</div>
              <div className="font-display text-[18px] leading-none text-white">{stats.boost}</div>
            </div>
          </div>
        </div>
      )}

      {/* paint shop */}
      <PaintRow t={t} lang={lang} paintId={paintId} onOpen={onOpenPaint} />

      {/* upgrade rows */}
      <div className="no-scrollbar min-h-0 flex-1 space-y-[8px] overflow-y-auto pe-[2px]">
        {UPGRADES.map((u) => (
          <UpgradeRow
            key={u.key}
            t={t}
            k={u.key}
            level={lv(u.key)}
            coins={coins}
            onUpgrade={onUpgrade}
          />
        ))}
      </div>

      {/* total power footer */}
      <div className="flex shrink-0 items-center justify-between rounded-[16px] border-[3px] border-ink bg-gradient-to-r from-[#ff7a1a] to-[#ffb32a] px-[14px] py-[7px] shadow-[0_4px_0_#9a4a08]">
        <span className="flex items-center gap-[8px] font-display text-[17px] text-white t-stroke sw-3">
          <PowerIcon width={22} height={22} />
          {t.power}
        </span>
        <span className="font-display text-[24px] leading-none text-white t-stroke sw-4">{stats.power}</span>
      </div>
    </div>
  );
}

/** Car thumbnail that respects the paint sprayed on that car. */
function PickThumb({ car }: { car: Car }) {
  const filter = usePaintFilter(car.id);
  return (
    <img src={car.image} alt={car.name} className="h-[80%] w-full object-contain" draggable={false} style={{ filter: filter || undefined }} />
  );
}

/** Small horizontal car picker used at the top of the mobile garage. */
export function CarPicker({
  cars,
  activeId,
  onSelect,
  labels,
}: {
  cars: Car[];
  activeId: string;
  onSelect: (i: number) => void;
  labels: { select: string; selected: string };
}) {
  return (
    <div className="no-scrollbar flex shrink-0 gap-[8px] overflow-x-auto pb-[11px] pt-[2px]" dir="ltr">
      {cars.map((c, i) => {
        const active = c.id === activeId;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(i)}
            className={cn(
              "relative flex h-[52px] w-[76px] shrink-0 items-center justify-center rounded-[14px] border-[3px] transition-all",
              active
                ? "border-mint-400 bg-navy-800 shadow-[0_3px_0_#0a1038]"
                : "border-ink bg-navy-950/70 opacity-75 hover:opacity-100",
            )}
          >
            <PickThumb car={c} />
            <span
              className={cn(
                "absolute -bottom-[9px] rounded-full border-[2px] border-ink px-[6px] py-[1px] font-body text-[8px] font-black",
                active ? "bg-mint-400 text-ink" : "bg-navy-900 text-white/50",
              )}
            >
              {active ? labels.selected : labels.select}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Garage data coming from the app state (always refers to an OWNED car). */
export interface GarageData {
  car: Car;
  lang: Lang;
  levels: Record<UpgradeKey, number>;
  coins: number;
  runReward: number;
  /** paint currently sprayed on the car */
  paintId: string;
  onUpgrade: (key: UpgradeKey) => void;
  onCollect: (e: MouseEvent<HTMLButtonElement>) => void;
  /** opens the paint picker (rendered by the app shell) */
  onOpenPaint: () => void;
}

/** Garage tab: picker of owned cars + upgrade panel, inside the floating panel. */
export function GarageView({
  t,
  garage,
  ownedCars,
  onEquip,
  showStats = false,
  floating = true,
  className,
}: {
  t: Strings;
  garage: GarageData;
  ownedCars: Car[];
  onEquip: (car: Car) => void;
  showStats?: boolean;
  floating?: boolean;
  className?: string;
}) {
  const body = (
    <>
      <CarPicker
        cars={ownedCars}
        activeId={garage.car.id}
        onSelect={(i) => onEquip(ownedCars[i])}
        labels={{ select: t.select, selected: t.selected }}
      />
      <GaragePanel t={t} {...garage} showStats={showStats} className="min-h-0 flex-1" />
    </>
  );
  if (!floating) return <div className={cn("flex h-full flex-col gap-[8px]", className)}>{body}</div>;
  return (
    <FloatingPanel title={t.garageTitle} className={className}>
      {body}
    </FloatingPanel>
  );
}
