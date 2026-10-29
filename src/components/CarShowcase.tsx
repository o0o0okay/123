import { cn } from "@/utils/cn";
import type { Car } from "@/data/cars";
import { CoinIcon, LockIcon } from "@/icons";
import { ArrowButton } from "./ui";

interface Props {
  car: Car;
  onPrev: () => void;
  onNext: () => void;
  variant?: "mobile" | "desktop";
  /** car is not owned yet -> dimmed, lock badge and BUY button */
  locked?: boolean;
  onBuy?: () => void;
  labels?: { locked: string; buy: string };
}

/** Centre stage: the browsed car, its shadow and the carousel arrows. */
export function CarShowcase({ car, onPrev, onNext, variant = "mobile", locked, onBuy, labels }: Props) {
  const desk = variant === "desktop";
  return (
    <div className="relative h-full" dir="ltr">
      {/* speed streaks behind the car */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-60">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="absolute h-[3px] rounded-full bg-white/70 blur-[1px]"
            style={{
              width: `${40 + i * 18}px`,
              left: `${8 + i * 6}%`,
              top: `${34 + i * 13}%`,
              opacity: 0.5 - i * 0.08,
            }}
          />
        ))}
      </div>

      {/* car */}
      <div
        className={cn(
          "absolute flex items-center justify-center",
          desk ? "inset-x-[70px] bottom-[34px] top-[72px]" : "inset-x-[26px] bottom-[30px] top-[56px]",
        )}
      >
        <div
          className={cn(
            "absolute bottom-[2px] left-1/2 h-[38px] -translate-x-1/2 rounded-[50%] bg-[#0b2470] blur-[9px]",
            desk ? "w-[300px]" : "w-[240px]",
          )}
        />
        <div className="relative w-full animate-bob">
          <img
            key={car.id}
            src={car.image}
            alt={car.name}
            draggable={false}
            className={cn(
              "max-h-full w-full max-w-none animate-pop-in object-contain drop-shadow-[0_14px_12px_rgba(8,20,90,0.5)] transition-[filter]",
              locked && "brightness-[0.45] saturate-[0.55]",
            )}
          />
        </div>
      </div>

      {/* locked overlay */}
      {locked && (
        <>
          <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center">
            <div key={car.id} className="flex animate-pop-in flex-col items-center gap-[6px]">
              <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-[4px] border-ink bg-navy-800/95 text-amber-400 shadow-[0_5px_0_#0a1038,0_0_0_4px_rgba(255,210,58,0.25)]">
                <LockIcon width={38} height={38} />
              </span>
              <span className="rounded-full border-[3px] border-ink bg-navy-950/90 px-[14px] py-[2px] font-display text-[15px] tracking-wide text-white">
                {labels?.locked ?? "LOCKED"}
              </span>
            </div>
          </div>

          {onBuy && (
            <button
              type="button"
              onClick={onBuy}
              className={cn(
                "absolute left-1/2 z-10 flex -translate-x-1/2 animate-glow items-center gap-[8px] rounded-full border-[3px] border-ink bg-gradient-to-b from-[#ffe05a] to-[#ffa41c] py-[5px] pe-[18px] ps-[6px] shadow-[0_5px_0_#c9660e] transition-transform hover:brightness-110 active:translate-y-[3px] active:shadow-none",
                desk ? "bottom-[14px]" : "bottom-[24px]",
              )}
            >
              <span className="flex items-center gap-[5px] rounded-full bg-ink/85 px-[10px] py-[3px]">
                <CoinIcon width={18} height={18} />
                <span className="font-display text-[17px] leading-none text-amber-400">
                  {car.price.toLocaleString("en-US")}
                </span>
              </span>
              <span className="font-display text-[21px] leading-none text-flame-500 t-stroke sw-4 sc-white">
                {labels?.buy ?? "BUY"}
              </span>
            </button>
          )}
        </>
      )}

      {/* carousel arrows */}
      <ArrowButton
        dir="left"
        onClick={onPrev}
        className={cn("absolute z-10", desk ? "left-[2px] top-1/2 -translate-y-1/2" : "bottom-[26px] left-[30px]")}
      />
      <ArrowButton
        dir="right"
        onClick={onNext}
        className={cn("absolute z-10", desk ? "right-[2px] top-1/2 -translate-y-1/2" : "bottom-[26px] right-[30px]")}
      />
    </div>
  );
}
