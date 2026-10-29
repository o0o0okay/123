import { useState } from "react";
import { cn } from "@/utils/cn";
import type { Car } from "@/data/cars";
import { PAINTS, paintById, paintFilterWith, type Paint } from "@/data/paints";
import type { Lang, Strings } from "@/i18n";
import { CheckIcon, CoinIcon, SprayIcon } from "@/icons";
import { GameButton, Modal } from "./ui";

/* ------------------------------------------------------------------ */
/* garage row                                                          */
/* ------------------------------------------------------------------ */

/** Compact "paint shop" row inside the garage panel — opens the paint picker. */
export function PaintRow({
  t,
  lang,
  paintId,
  onOpen,
}: {
  t: Strings;
  lang: Lang;
  paintId: string;
  onOpen: () => void;
}) {
  const paint = paintById(paintId);
  return (
    <button
      type="button"
      id="garage-paint-btn"
      onClick={onOpen}
      aria-label={t.paintShop}
      className="flex shrink-0 items-center gap-[10px] rounded-[16px] border-[3px] border-ink bg-navy-950/65 p-[8px] text-start transition-transform active:translate-y-[2px]"
    >
      <span
        className="relative flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[12px] border-[3px] border-ink text-ink shadow-[inset_0_2px_0_rgba(255,255,255,0.35),0_3px_0_#0a1038]"
        style={{ background: paint.swatch }}
      >
        <SprayIcon width={26} height={26} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-[6px]">
          <span className="font-display text-[16px] leading-none text-white t-stroke sw-2">{t.paintShop}</span>
          <span className="rounded-full border-[2px] border-ink bg-navy-800 px-[6px] py-[1px] font-body text-[9px] font-black text-skyg-300">
            {paint.price === 0 ? t.free : `${paint.price.toLocaleString("en-US")} ${t.coins}`}
          </span>
        </span>
        <span className="mt-[3px] block truncate font-body text-[10px] font-bold text-white/45">
          {t.paintCurrent}: {paint.name[lang]}
        </span>
      </span>

      <span className="shrink-0 rounded-full border-[2.5px] border-ink bg-gradient-to-b from-[#ffd23a] to-[#ff9a1f] px-[13px] py-[4px] font-display text-[13px] text-ink shadow-[0_3px_0_#9a4a08]">
        {t.changeColor}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* paint picker modal                                                  */
/* ------------------------------------------------------------------ */

/** Colour picker: previews the paint live, applying it charges coins. */
export function PaintModal({
  t,
  lang,
  car,
  paintId,
  coins,
  onApply,
  onClose,
}: {
  t: Strings;
  lang: Lang;
  car: Car;
  /** paint currently sprayed on the car */
  paintId: string;
  coins: number;
  onApply: (paintId: string) => void;
  onClose: () => void;
}) {
  const [sel, setSel] = useState(paintId);
  const picked = paintById(sel);
  const isCurrent = picked.id === paintById(paintId).id;
  const affordable = coins >= picked.price;

  const chip = (p: Paint) => {
    const active = p.id === sel;
    const worn = p.id === paintById(paintId).id;
    return (
      <button
        key={p.id}
        type="button"
        onClick={() => setSel(p.id)}
        aria-pressed={active}
        aria-label={p.name[lang]}
        className={cn(
          "relative flex flex-col items-center gap-[3px] rounded-[13px] border-[2.5px] px-[4px] py-[6px] transition-all",
          active
            ? "-translate-y-[1px] border-amber-400 bg-[#2b3f7d] shadow-[0_0_0_2px_rgba(255,210,58,0.35)]"
            : "border-ink bg-navy-950/60 hover:bg-navy-800/70",
        )}
      >
        <span
          className="h-[30px] w-[30px] rounded-full border-[2px] border-ink shadow-[inset_0_2px_0_rgba(255,255,255,0.45)]"
          style={{ background: p.swatch }}
        />
        <span className="w-full truncate text-center font-body text-[9px] font-black leading-none text-white/75">
          {p.name[lang]}
        </span>
        <span className="flex items-center gap-[2px] font-display text-[10px] leading-none text-amber-400">
          <CoinIcon width={9} height={9} />
          {p.price === 0 ? t.free : p.price.toLocaleString("en-US")}
        </span>
        {worn && (
          <span className="absolute -right-[4px] -top-[4px] flex h-[15px] w-[15px] items-center justify-center rounded-full border-[2px] border-ink bg-mint-400 text-ink">
            <CheckIcon width={9} height={9} />
          </span>
        )}
      </button>
    );
  };

  return (
    <Modal title={t.paintTitle} onClose={onClose} width={470}>
      {/* live preview */}
      <div className="relative flex h-[150px] w-full items-center justify-center overflow-hidden rounded-[18px] border-[3px] border-ink bg-[radial-gradient(ellipse_at_center,#3d8ff5,#14204f_75%)]">
        <img
          key={sel}
          src={car.image}
          alt={car.name}
          draggable={false}
          className="max-h-[128px] w-[300px] animate-pop-in object-contain"
          style={{ filter: paintFilterWith(sel, "drop-shadow(0 10px 10px rgba(0,0,0,0.5))") }}
        />
        <span
          className="absolute start-[10px] top-[8px] rounded-full border-[2px] border-ink px-[10px] font-body text-[10px] font-black leading-[18px] text-ink"
          style={{ background: picked.swatch }}
        >
          {picked.name[lang]}
        </span>
        <span className="absolute end-[10px] top-[8px] rounded-full border-[2px] border-ink bg-navy-950/85 px-[10px] font-body text-[10px] font-black leading-[18px] text-white/70">
          {car.name}
        </span>
      </div>

      {/* colours */}
      <div className="mt-[12px] grid grid-cols-4 gap-[8px]">{PAINTS.map(chip)}</div>

      {/* pay & apply */}
      <div className="mt-[14px] flex items-center justify-between gap-[10px]">
        <span className="flex flex-col gap-[2px]">
          <span className="flex items-center gap-[6px] rounded-full border-[3px] border-ink bg-navy-950 px-[12px] py-[4px] font-body text-[12px] font-black text-amber-400">
            <CoinIcon width={16} height={16} />
            {coins.toLocaleString("en-US")}
          </span>
          <span className="ps-[4px] font-body text-[9px] font-black text-white/40">{t.paintHint}</span>
        </span>

        {isCurrent ? (
          <span className="flex h-[52px] w-[168px] items-center justify-center rounded-[16px] border-[3px] border-ink bg-navy-900 font-display text-[17px] text-mint-400">
            {t.paintApplied}
          </span>
        ) : (
          <GameButton
            variant={affordable ? "orange" : "grey"}
            className="h-[52px] w-[168px]"
            disabled={!affordable}
            onClick={() => onApply(sel)}
          >
            <span className="flex items-center gap-[7px] font-display text-[19px] text-flame-500 t-stroke sw-4 sc-white">
              <SprayIcon width={20} height={20} className={affordable ? "text-ink" : "text-white/60"} />
              {affordable ? (
                <>
                  {t.paintApply}
                  <span className="flex items-center gap-[3px] text-[15px] text-amber-400">
                    <CoinIcon width={13} height={13} />
                    {picked.price.toLocaleString("en-US")}
                  </span>
                </>
              ) : (
                <span className="text-[14px] text-white/70">{t.paintNoCoins}</span>
              )}
            </span>
          </GameButton>
        )}
      </div>
    </Modal>
  );
}
