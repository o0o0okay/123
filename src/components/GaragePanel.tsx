import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import type { Car, UpgradeKey } from "@/data/cars";
import { UPGRADES, carStats, upgradeCost } from "@/data/cars";
import type { Lang, Strings } from "@/i18n";
import type { HistoryEntry } from "@/data/history";
import { useAnimatedNumber, useDragScroll } from "@/hooks";
import { useCoinFly } from "./CoinFlyEffect";
import { BumperIcon, CoinIcon, EngineIcon, GaugeIcon, LockIcon, NitroIcon, PowerIcon, TireIcon } from "@/icons";
import { PaintRow } from "./PaintShop";
import { usePaintFilter } from "./PaintContext";
import { FloatingPanel } from "./ui";

/**
 * One place that describes how a tunable part looks and reads.
 * Adding a part = add it to `UPGRADES` in data/cars.ts and drop one entry here;
 * the row, the pips, the cost button and the section all pick it up automatically.
 */
const UPGRADE_UI: Record<
  UpgradeKey,
  { icon: ReactNode; color: string; name: keyof Strings; desc: keyof Strings; unit: keyof Strings }
> = {
  engine: {
    icon: <EngineIcon width={28} height={28} />,
    color: "from-[#ff8a3a] to-[#ff5a1f]",
    name: "upgEngine",
    desc: "engineDesc",
    unit: "kmh",
  },
  body: {
    icon: <BumperIcon width={28} height={28} />,
    color: "from-[#5fc8ff] to-[#2b7fe0]",
    name: "upgBody",
    desc: "bodyDesc",
    unit: "armor",
  },
  tires: {
    icon: <TireIcon width={28} height={28} />,
    color: "from-[#9ef05a] to-[#4fae22]",
    name: "upgTires",
    desc: "tiresDesc",
    unit: "accel",
  },
  nitro: {
    icon: <NitroIcon width={28} height={28} />,
    color: "from-[#c98cff] to-[#8e3bff]",
    name: "upgNitro",
    desc: "nitroDesc",
    unit: "boost",
  },
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
  /** opens the coin shop from the balance card */
  onOpenShop?: () => void;
  className?: string;
  showStats?: boolean;
}

/** Titled divider between garage sections. */
function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="shrink-0 space-y-[6px]" data-section={title}>
      <div className="flex items-center gap-[6px] px-[2px]">
        <span className="font-display text-[12px] leading-none tracking-[0.08em] text-skyg-300">{title}</span>
        {hint}
        <span className="h-[2px] flex-1 rounded bg-white/10" />
      </div>
      {children}
    </section>
  );
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
  const def = UPGRADES.find((u) => u.key === k)!;
  const ui = UPGRADE_UI[k];
  const maxLevel = def.maxLevel;
  const maxed = level >= maxLevel;
  const cost = upgradeCost(k, level);
  const affordable = coins >= cost;
  const effect = `+${def.perLevel} ${t[ui.unit] as string}`;

  return (
    <div
      data-upgrade={k}
      className="flex items-center gap-[9px] rounded-[16px] border-[3px] border-ink bg-navy-950/65 p-[7px]"
    >
      <div
        className={cn(
          "flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[12px] border-[3px] border-ink bg-gradient-to-b text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.3),0_3px_0_#0a1038]",
          ui.color,
        )}
      >
        {ui.icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-[6px]">
          <span className="font-display text-[16px] leading-none text-white t-stroke sw-2">
            {t[ui.name] as string}
          </span>
          <span className="rounded-full border-[2px] border-ink bg-navy-800 px-[6px] py-[1px] font-body text-[10px] font-black text-skyg-300">
            {t.level} {level}
          </span>
        </div>
        <div className="mt-[2px] truncate font-body text-[10px] font-bold text-white/45">{t[ui.desc] as string}</div>

        {/* level pips */}
        <div className="mt-[4px] flex items-center gap-[3px]">
          {Array.from({ length: maxLevel }).map((_, i) => (
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

/**
 * The garage: coin balance, run reward, live stats, paint and the upgrade list.
 *
 * Layout is built to grow: the balance stays pinned at the top and the power
 * total stays pinned at the bottom, while everything in between lives in one
 * scrolling page. New parts / sections only make that page longer — nothing
 * gets squeezed into a one-row scroll window.
 */
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
  onOpenShop,
  className,
  showStats = true,
}: Props) {
  const animatedCoins = useAnimatedNumber(coins);
  const { isPulsing } = useCoinFly();
  const stats = carStats(car, levels);
  const lv = (k: UpgradeKey) => levels[k];
  const maxedCount = UPGRADES.filter((u) => lv(u.key) >= u.maxLevel).length;

  // only advertise scrolling when the page really is taller than the panel
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [more, setMore] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => {
      setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 8);
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div className={cn("flex h-full min-h-0 flex-col overflow-hidden", className)}>
      {/* pinned: coin balance */}
      <div
        id="garage-balance"
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
        {onOpenShop && (
          <button
            type="button"
            id="garage-coin-shop"
            onClick={onOpenShop}
            aria-label={t.coinShop}
            title={t.coinShop}
            className="flex h-[30px] items-center gap-[4px] rounded-full border-[2.5px] border-ink bg-gradient-to-b from-[#9ef05a] to-[#3d9a1f] px-[10px] font-display text-[13px] leading-none text-white shadow-[0_3px_0_#1f5a10] transition-transform hover:brightness-110 active:translate-y-[2px]"
          >
            + {t.coinShop}
          </button>
        )}
      </div>

      {/* the whole body scrolls as one page, so every section keeps its natural height */}
      <div className="relative min-h-0 flex-1">
        <div
          id="garage-scroll"
          ref={scrollRef}
          className="thin-scroll flex h-full flex-col gap-[9px] overflow-y-auto pb-[6px] pe-[4px] pt-[9px]"
        >
          {/* run reward — the row disappears entirely once it is collected */}
          {runReward > 0 && (
            <button
              type="button"
              id="garage-collect"
              onClick={onCollect}
              className="flex shrink-0 items-center justify-between gap-[10px] rounded-[16px] border-[3px] border-ink bg-gradient-to-r from-[#ffd23a] to-[#ff9a1f] px-[12px] py-[7px] shadow-[0_4px_0_#b96a08] animate-glow transition-transform active:translate-y-[2px]"
            >
              <span className="flex min-w-0 items-center gap-[6px]">
                <CoinIcon width={20} height={20} className="shrink-0" />
                <span className="font-display text-[22px] leading-none text-ink" dir="ltr">
                  +{runReward.toLocaleString("en-US")}
                </span>
                <span className="truncate font-body text-[9px] font-black tracking-wider text-ink/55">
                  {t.lastChase}
                </span>
              </span>
              <span className="shrink-0 rounded-full border-[3px] border-ink bg-mint-500 px-[13px] py-[3px] font-display text-[15px] leading-none text-ink shadow-[0_2px_0_#1b7a42]">
                {t.collect}
              </span>
            </button>
          )}

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

          {/* paint */}
          <Section title={t.paintSection}>
            <PaintRow t={t} lang={lang} carId={car.id} paintId={paintId} onOpen={onOpenPaint} />
          </Section>

          {/* upgrades — new parts simply append to this list */}
          <Section
            title={t.upgradesTitle}
            hint={
              <span className="rounded-full border-[2px] border-ink bg-navy-800 px-[6px] font-body text-[9px] font-black leading-[14px] text-skyg-300">
                {maxedCount}/{UPGRADES.length}
              </span>
            }
          >
            <div id="garage-upgrades" className="space-y-[8px] pb-[2px]">
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

              {/* reserved slot so the list visibly ends somewhere — future parts drop in above */}
              <div className="flex items-center justify-center gap-[6px] rounded-[16px] border-[3px] border-dashed border-white/15 bg-navy-950/30 px-[10px] py-[9px] font-body text-[10px] font-black tracking-wider text-white/25">
                <LockIcon width={12} height={12} />
                {t.moreUpgradesSoon}
              </div>
            </div>
          </Section>
        </div>

        {/* fade + hint: only when there is more of the page below */}
        {more && (
          <div
            id="garage-more"
            className="pointer-events-none absolute inset-x-0 bottom-0 flex h-[34px] animate-fade-in items-end justify-center bg-gradient-to-t from-navy-950/95 via-navy-950/60 to-transparent pb-[1px]"
          >
            <span className="font-body text-[9px] font-black tracking-[0.14em] text-white/30">{t.scrollForMore}</span>
          </div>
        )}
      </div>

      {/* pinned: total power */}
      <div className="mt-[9px] flex shrink-0 items-center justify-between rounded-[16px] border-[3px] border-ink bg-gradient-to-r from-[#ff7a1a] to-[#ffb32a] px-[14px] py-[7px] shadow-[0_4px_0_#9a4a08]">
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
  const scroll = useDragScroll(activeId, cars.length);
  return (
    <div
      ref={scroll.ref}
      {...scroll.dragProps}
      className="drag-x no-scrollbar flex shrink-0 gap-[8px] overflow-x-auto pb-[11px] pt-[2px]"
      dir="ltr"
    >
      {cars.map((c, i) => {
        const active = c.id === activeId;
        return (
          <button
            key={c.id}
            type="button"
            aria-current={active}
            data-active={active}
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
  /** coin ledger shown by the history tab */
  history: HistoryEntry[];
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
  /** opens the coin shop from the balance card */
  onOpenShop?: () => void;
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
