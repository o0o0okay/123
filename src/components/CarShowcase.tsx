import { cn } from "@/utils/cn";
import type { Car } from "@/data/cars";
import { PaintedImg } from "./PaintContext";
import { ArrowButton } from "./ui";

interface Props {
  car: Car;
  onPrev: () => void;
  onNext: () => void;
  variant?: "mobile" | "desktop";
  /** hide the carousel arrows when the player owns a single car */
  hasMultiple?: boolean;
}

/** Centre stage: the owned car shown on the home screen, its shadow and the carousel arrows. */
export function CarShowcase({ car, onPrev, onNext, variant = "mobile", hasMultiple = true }: Props) {
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
          <PaintedImg
            key={car.id}
            carId={car.id}
            shadow="drop-shadow(0 14px 12px rgba(8,20,90,0.5))"
            src={car.image}
            alt={car.name}
            draggable={false}
            className="max-h-full w-full max-w-none animate-pop-in object-contain"
          />
        </div>
      </div>

      {/* carousel arrows (only when there is more than one owned car) */}
      {hasMultiple && (
        <>
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
        </>
      )}
    </div>
  );
}
