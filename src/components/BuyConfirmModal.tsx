import { cn } from "@/utils/cn";
import type { Car } from "@/data/cars";
import { fmt, type Lang, type Strings } from "@/i18n";
import { CartIcon, CoinIcon } from "@/icons";
import { PaintedImg } from "./PaintContext";
import { GameButton, Modal } from "./ui";

/** Confirmation dialog shown before a car is bought (used by the dealership). */
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
    // the purchase row is the money leaving the wallet: same red as the ledger
    [t.price, `−${car.price.toLocaleString("en-US")}`, "text-flame-400"],
    [t.balanceAfter, after.toLocaleString("en-US"), "text-amber-400"],
  ];

  return (
    <Modal title={t.buyTitle} onClose={onClose} width={400}>
      <div className="flex flex-col items-center">
        <div className="relative flex h-[130px] w-[280px] items-center justify-center rounded-[18px] border-[3px] border-ink bg-[radial-gradient(ellipse_at_center,#3d8ff5,#14204f_75%)]">
          <PaintedImg
            carId={car.id}
            shadow="drop-shadow(0 8px 8px rgba(0,0,0,0.5))"
            src={car.image}
            alt={car.name}
            className="max-h-[118px] w-[250px] animate-pop-in object-contain"
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
