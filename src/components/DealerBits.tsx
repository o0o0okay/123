/**
 * The small dealership pieces that are used outside the dealership overlay:
 * the brand shield, the "are you sure you want to sell" dialog and the yellow
 * side rail. They live apart from `Dealership.tsx` so the (much bigger) overlay
 * can be loaded on demand.
 */
import type { MouseEvent } from "react";
import { cn } from "@/utils/cn";
import { BRANDS, carTitle, type BrandId, type Car } from "@/data/cars";
import { fmt, type Strings } from "@/i18n";
import { CoinIcon, StoreIcon, TagIcon } from "@/icons";
import { PaintedImg } from "./PaintContext";
import { GameButton, Modal } from "./ui";

export function BrandBadge({ brand, size = 26 }: { brand: BrandId; size?: number }) {
  const b = BRANDS[brand];
  return (
    <svg
      viewBox="0 0 24 28"
      width={size}
      height={(size * 28) / 24}
      role="img"
      aria-label={b.name}
      className="shrink-0 drop-shadow-[0_2px_0_rgba(0,0,0,0.35)]"
    >
      <path d="M12 1 22.5 4.6v8.2c0 6.4-4.3 10.8-10.5 13.6C5.8 23.6 1.5 19.2 1.5 12.8V4.6z" fill="#11183f" stroke={b.color} strokeWidth="1.8" />
      <path d="M12 4.2 19.6 6.8v6c0 4.7-3.1 8-7.6 10.2-4.5-2.2-7.6-5.5-7.6-10.2v-6z" fill={b.color} />
      <text
        x="12"
        y="16.8"
        textAnchor="middle"
        fontSize="10"
        fontWeight="900"
        fill="#fff"
        stroke="#11183f"
        strokeWidth="0.7"
        paintOrder="stroke"
        fontFamily="'Lilita One', sans-serif"
      >
        {b.initial}
      </text>
    </svg>
  );
}


export function SellConfirmModal({
  t,
  car,
  value,
  coins,
  onConfirm,
  onClose,
}: {
  t: Strings;
  car: Car;
  value: number;
  coins: number;
  onConfirm: (e: MouseEvent<HTMLButtonElement>) => void;
  onClose: () => void;
}) {
  const rows: [string, string, string][] = [
    [t.balance, coins.toLocaleString("en-US"), "text-white"],
    [t.sellValueLabel, `+${value.toLocaleString("en-US")}`, "text-mint-400"],
    [t.balanceAfter, (coins + value).toLocaleString("en-US"), "text-amber-400"],
  ];
  return (
    <Modal title={t.sellTitle} onClose={onClose} width={400}>
      <div className="flex flex-col items-center">
        <div className="relative flex h-[120px] w-[270px] items-center justify-center rounded-[18px] border-[3px] border-ink bg-[radial-gradient(ellipse_at_center,#b8321c,#14204f_75%)]">
          <PaintedImg
            carId={car.id}
            shadow="drop-shadow(0 8px 8px rgba(0,0,0,0.5))"
            src={car.image}
            alt={car.name}
            className="max-h-[108px] w-[240px] animate-pop-in object-contain"
          />
          <span className="absolute -right-[10px] -top-[10px] flex h-[34px] w-[34px] items-center justify-center rounded-full border-[3px] border-ink bg-gradient-to-b from-[#ff6b4a] to-[#c92a12] text-white">
            <TagIcon width={17} height={17} />
          </span>
        </div>
        <div className="mt-[8px] flex items-center gap-[6px]" dir="ltr">
          <BrandBadge brand={car.brand} size={20} />
          <span className="font-display text-[26px] leading-none text-white t-stroke sw-4">{carTitle(car)}</span>
        </div>
        <p className="mt-[8px] text-center font-body text-[14px] font-extrabold text-white/85">
          {fmt(t.sellBody, { n: car.name, p: value.toLocaleString("en-US") })}
        </p>
        <div className="mt-[12px] w-full space-y-[6px]">
          {rows.map(([label, v, color]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-[12px] border-[3px] border-ink bg-navy-950/60 px-[12px] py-[6px] font-body text-[13px] font-black tracking-wider"
            >
              <span className="text-white/55">{label}</span>
              <span className={cn("flex items-center gap-[5px] font-display text-[17px]", color)} dir="ltr">
                <CoinIcon width={16} height={16} />
                {v}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-[18px] flex justify-center gap-[14px]">
        <GameButton variant="grey" className="h-[58px] w-[130px]" onClick={onClose}>
          <span className="font-display text-[21px] text-white t-stroke sw-4">{t.no}</span>
        </GameButton>
        <GameButton variant="red" className="h-[58px] w-[160px]" onClick={onConfirm}>
          <span className="flex items-center gap-[8px] font-display text-[21px] text-white t-stroke sw-4">
            <TagIcon width={20} height={20} />
            {t.sellAction}
          </span>
        </GameButton>
      </div>
    </Modal>
  );
}

export function DealerRail({ label, onClick, className }: { label: string; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      id="dealer-rail"
      onClick={onClick}
      aria-label={label}
      title={label}
      dir="ltr"
      className={cn(
        "group absolute left-0 z-20 flex w-[22px] flex-col items-center gap-[7px] rounded-r-[12px] border-[3px] border-l-0 border-ink bg-gradient-to-b from-[#ffd23a] to-[#ff9a1f] py-[10px] text-ink shadow-[3px_4px_0_#0a1038] transition-[width,filter] duration-200 hover:w-[28px] hover:brightness-110",
        className,
      )}
    >
      <StoreIcon width={15} height={15} className="shrink-0" />
      <span className="rotate-180 font-display text-[11px] leading-none tracking-[0.14em] [writing-mode:vertical-rl]">{label}</span>
    </button>
  );
}
