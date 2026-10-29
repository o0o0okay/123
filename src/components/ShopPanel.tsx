import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { STAT_MAX, type Car } from "@/data/cars";
import { fmt, type Lang, type Strings } from "@/i18n";
import { BumperIcon, CartIcon, CheckIcon, CoinIcon, GaugeIcon, LockIcon, NitroIcon, StoreIcon, TireIcon } from "@/icons";
import { FloatingPanel, GameButton, Modal } from "./ui";

/** Everything the shop needs from the app state. */
export interface ShopProps {
  cars: Car[];
  owned: string[];
  activeId: string;
  viewId: string;
  coins: number;
  onBuy: (car: Car) => void;
  onEquip: (car: Car) => void;
  onPreview: (car: Car) => void;
  /** opens the full dealership (buy & sell, search, sort) */
  onOpenDealer?: () => void;
}

/* ------------------------------------------------------------------ */
/* stat bar                                                            */
/* ------------------------------------------------------------------ */

function StatBar({
  icon,
  label,
  value,
  max,
  bar,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  max: number;
  bar: string;
  color: string;
}) {
  const pct = Math.max(6, Math.min(100, (value / max) * 100));
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-[4px]">
        <span className="flex min-w-0 items-center gap-[4px] font-body text-[9px] font-black tracking-wider text-white/55">
          <span className={cn("shrink-0", color)}>{icon}</span>
          <span className="truncate">{label}</span>
        </span>
        <span className="font-display text-[12px] leading-none text-white">{value}</span>
      </div>
      <div className="mt-[3px] h-[7px] overflow-hidden rounded-full border-[1.5px] border-ink bg-navy-950" dir="ltr">
        <div className={cn("h-full rounded-full bg-gradient-to-r", bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* car card                                                            */
/* ------------------------------------------------------------------ */

function ShopCard({
  t,
  lang,
  car,
  owned,
  active,
  viewing,
  coins,
  onBuy,
  onEquip,
  onPreview,
}: {
  t: Strings;
  lang: Lang;
  car: Car;
  owned: boolean;
  active: boolean;
  viewing: boolean;
  coins: number;
  onBuy: (c: Car) => void;
  onEquip: (c: Car) => void;
  onPreview: (c: Car) => void;
}) {
  const affordable = coins >= car.price;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[18px] border-[3px] border-ink bg-gradient-to-b from-navy-700/95 to-navy-900/95 p-[10px] ps-[14px] shadow-[0_4px_0_#060a28]",
        viewing && "ring-[3px] ring-skyg-300/80",
      )}
    >
      {/* rarity stripe */}
      <span className="absolute inset-y-0 start-0 w-[6px]" style={{ background: car.rarityColor }} />

      <div className="flex items-center gap-[10px]">
        <button
          type="button"
          onClick={() => onPreview(car)}
          aria-label={car.name}
          className="relative flex h-[66px] w-[108px] shrink-0 items-center justify-center rounded-[12px] border-[2px] border-ink bg-[radial-gradient(ellipse_at_center,#2f5fc4,#14204f_75%)] transition-transform hover:scale-[1.03]"
        >
          <img
            src={car.image}
            alt=""
            draggable={false}
            className={cn(
              "max-h-[58px] w-[98px] object-contain drop-shadow-[0_4px_4px_rgba(0,0,0,0.45)]",
              !owned && "brightness-[0.6] saturate-[0.7]",
            )}
          />
          {!owned && (
            <span className="absolute -right-[7px] -top-[7px] flex h-[24px] w-[24px] items-center justify-center rounded-full border-[2px] border-ink bg-navy-800 text-amber-400">
              <LockIcon width={13} height={13} />
            </span>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[19px] leading-none text-white t-stroke sw-2">{car.name}</div>
          <div className="mt-[4px] flex flex-wrap items-center gap-[6px]">
            <span
              className="rounded-full border-[2px] border-ink px-[6px] font-body text-[9px] font-black leading-[15px] text-ink"
              style={{ background: car.rarityColor }}
            >
              {car.rarity}
            </span>
            <span className="font-body text-[10px] font-black text-white/50">
              {car.cls} · {t.lv} {car.tier}
            </span>
          </div>
          <p className="mt-[4px] line-clamp-2 font-body text-[10px] font-bold leading-snug text-white/55">
            {car.desc[lang]}
          </p>
        </div>
      </div>

      {/* base stats */}
      <div className="mt-[8px] grid grid-cols-2 gap-x-[12px] gap-y-[5px]">
        <StatBar
          icon={<GaugeIcon width={12} height={12} />}
          label={t.topSpeed}
          value={car.topSpeed}
          max={STAT_MAX.topSpeed}
          bar="from-mint-500 to-mint-400"
          color="text-mint-400"
        />
        <StatBar
          icon={<BumperIcon width={12} height={12} />}
          label={t.armor}
          value={car.armor}
          max={STAT_MAX.armor}
          bar="from-skyg-500 to-skyg-300"
          color="text-skyg-300"
        />
        <StatBar
          icon={<TireIcon width={12} height={12} />}
          label={t.accel}
          value={car.accel}
          max={STAT_MAX.accel}
          bar="from-lime-500 to-lime-400"
          color="text-lime-400"
        />
        <StatBar
          icon={<NitroIcon width={12} height={12} />}
          label={t.boost}
          value={car.boost}
          max={STAT_MAX.boost}
          bar="from-[#8e3bff] to-[#c98cff]"
          color="text-[#c98cff]"
        />
      </div>

      {/* price / status + action */}
      <div className="mt-[9px] flex items-center justify-between gap-[8px]">
        {owned ? (
          <span className="flex items-center gap-[5px] rounded-full border-[2px] border-ink bg-mint-500/20 px-[10px] py-[3px] font-body text-[11px] font-black text-mint-400">
            <CheckIcon width={12} height={12} />
            {t.owned}
          </span>
        ) : (
          <span className="flex items-center gap-[5px] rounded-full border-[2px] border-ink bg-navy-950 px-[10px] py-[3px]">
            <CoinIcon width={16} height={16} />
            <span className="font-display text-[16px] leading-none text-amber-400">
              {car.price === 0 ? t.free : car.price.toLocaleString("en-US")}
            </span>
          </span>
        )}

        {owned ? (
          active ? (
            <span className="rounded-full border-[2.5px] border-ink bg-navy-800 px-[14px] py-[4px] font-display text-[14px] text-skyg-300">
              {t.equipped}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onEquip(car)}
              className="rounded-full border-[2.5px] border-ink bg-gradient-to-b from-[#9ef05a] to-[#56b92a] px-[18px] py-[4px] font-display text-[14px] text-ink shadow-[0_3px_0_#2f7f17] transition-transform active:translate-y-[2px] active:shadow-none"
            >
              {t.equip}
            </button>
          )
        ) : affordable ? (
          <button
            type="button"
            onClick={() => onBuy(car)}
            className="flex items-center gap-[6px] rounded-full border-[2.5px] border-ink bg-gradient-to-b from-[#ffe05a] to-[#ffa41c] px-[16px] py-[4px] font-display text-[15px] text-ink shadow-[0_3px_0_#c9660e] transition-transform hover:brightness-110 active:translate-y-[2px] active:shadow-none"
          >
            <CartIcon width={16} height={16} />
            {t.buy}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onBuy(car)}
            className="rounded-full border-[2.5px] border-ink bg-navy-900 px-[12px] py-[4px] font-body text-[11px] font-black text-white/45"
          >
            {fmt(t.needMore, { n: (car.price - coins).toLocaleString("en-US") })}
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* shop panel                                                          */
/* ------------------------------------------------------------------ */

import { useAnimatedNumber } from "@/hooks";
import { useCoinFly } from "./CoinFlyEffect";

export function ShopPanel({
  t,
  lang,
  className,
  cars,
  owned,
  activeId,
  viewId,
  coins,
  onBuy,
  onEquip,
  onPreview,
  onOpenDealer,
}: ShopProps & { t: Strings; lang: Lang; className?: string }) {
  const animatedCoins = useAnimatedNumber(coins);
  const { isPulsing } = useCoinFly();

  return (
    <div className={cn("flex h-full flex-col gap-[10px]", className)}>
      {/* balance + owned counter with pulse effect */}
      <div
        id="shop-coin-badge"
        className={cn(
          "flex shrink-0 items-center justify-between rounded-[16px] border-[3px] border-ink bg-gradient-to-r from-navy-800 to-navy-900 px-[14px] py-[8px] shadow-[0_4px_0_#060a28] transition-all duration-300",
          isPulsing && "scale-[1.03] ring-[3px] ring-amber-400 shadow-[0_0_20px_rgba(255,210,58,0.7)]",
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
          <div className="font-body text-[10px] font-black tracking-wider text-white/50">{t.carsOwned}</div>
          <div className="font-display text-[22px] leading-none text-mint-400">
            {owned.length}/{cars.length}
          </div>
        </div>
      </div>

      {onOpenDealer && (
        <button
          type="button"
          id="shop-dealer-btn"
          onClick={onOpenDealer}
          className="group flex shrink-0 items-center gap-[10px] rounded-[16px] border-[3px] border-ink bg-gradient-to-r from-[#ffd23a] via-[#ffb32a] to-[#ff8a1a] px-[12px] py-[7px] text-start shadow-[0_4px_0_#9a4a08] transition-transform hover:brightness-110 active:translate-y-[2px] active:shadow-none"
        >
          <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[10px] border-[2.5px] border-ink bg-navy-900 text-amber-400">
            <StoreIcon width={20} height={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[17px] leading-none text-ink">{t.dealership}</span>
            <span className="mt-[3px] block truncate font-body text-[10px] font-black text-ink/70">{t.dealerSub}</span>
          </span>
          <span className="font-display text-[20px] text-ink transition-transform group-hover:translate-x-[3px] rtl:-scale-x-100">›</span>
        </button>
      )}

      <div className="no-scrollbar min-h-0 flex-1 space-y-[10px] overflow-y-auto px-[3px] pb-[4px] pt-[3px]">
        {cars.map((car) => (
          <ShopCard
            key={car.id}
            t={t}
            lang={lang}
            car={car}
            owned={owned.includes(car.id)}
            active={activeId === car.id}
            viewing={viewId === car.id}
            coins={coins}
            onBuy={onBuy}
            onEquip={onEquip}
            onPreview={onPreview}
          />
        ))}
      </div>
    </div>
  );
}

/** Shop wrapped in the floating titled panel (mobile tab). */
export function ShopView({
  t,
  lang,
  shop,
  className,
}: {
  t: Strings;
  lang: Lang;
  shop: ShopProps;
  className?: string;
}) {
  return (
    <FloatingPanel title={t.shopTitle} className={className}>
      <ShopPanel t={t} lang={lang} {...shop} className="min-h-0 flex-1" />
    </FloatingPanel>
  );
}

/* ------------------------------------------------------------------ */
/* purchase confirmation                                               */
/* ------------------------------------------------------------------ */

export function BuyConfirmModal({
  t,
  lang,
  car,
  coins,
  onConfirm,
  onClose,
}: {
  t: Strings;
  lang: Lang;
  car: Car;
  coins: number;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const after = coins - car.price;
  const rows: [string, string, string][] = [
    [t.balance, coins.toLocaleString("en-US"), "text-white"],
    [t.price, `-${car.price.toLocaleString("en-US")}`, "text-[#ff6b4a]"],
    [t.balanceAfter, after.toLocaleString("en-US"), "text-amber-400"],
  ];

  return (
    <Modal title={t.buyTitle} onClose={onClose} width={400}>
      <div className="flex flex-col items-center">
        <div className="relative flex h-[130px] w-[280px] items-center justify-center rounded-[18px] border-[3px] border-ink bg-[radial-gradient(ellipse_at_center,#3d8ff5,#14204f_75%)]">
          <img
            src={car.image}
            alt={car.name}
            className="max-h-[118px] w-[250px] animate-pop-in object-contain drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)]"
          />
        </div>
        <div className="mt-[8px] font-display text-[30px] leading-none text-white t-stroke sw-4">{car.name}</div>
        <span
          className="mt-[6px] rounded-full border-[2px] border-ink px-[10px] font-body text-[11px] font-black leading-[18px] text-ink"
          style={{ background: car.rarityColor }}
        >
          {car.rarity} · {car.cls}
        </span>
        <p className="mt-[8px] text-center font-body text-[13px] font-bold leading-snug text-white/65">{car.desc[lang]}</p>
        <p className="mt-[8px] text-center font-body text-[15px] font-extrabold text-white/90">
          {fmt(t.buyBody, { n: car.name, p: car.price.toLocaleString("en-US") })}
        </p>

        <div className="mt-[12px] w-full space-y-[6px]">
          {rows.map(([label, value, color]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-[12px] border-[3px] border-ink bg-navy-950/60 px-[12px] py-[6px] font-body text-[13px] font-black tracking-wider"
            >
              <span className="text-white/55">{label}</span>
              <span className={cn("flex items-center gap-[5px] font-display text-[17px]", color)}>
                <CoinIcon width={16} height={16} />
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-[18px] flex justify-center gap-[14px]">
        <GameButton variant="grey" className="h-[58px] w-[130px]" onClick={onClose}>
          <span className="font-display text-[21px] text-white t-stroke sw-4">{t.no}</span>
        </GameButton>
        <GameButton variant="orange" className="h-[58px] w-[160px]" onClick={onConfirm}>
          <span className="flex items-center gap-[8px] font-display text-[22px] text-flame-500 t-stroke sw-4 sc-white">
            <CartIcon width={22} height={22} className="text-ink" />
            {t.buy}
          </span>
        </GameButton>
      </div>
    </Modal>
  );
}
