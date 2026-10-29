import { useEffect, useRef, useState, type MouseEvent } from "react";
import { cn } from "@/utils/cn";
import type { Car } from "@/data/cars";
import { policeCar } from "@/data/cars";
import { ordinal, type RaceMode, type RaceResult } from "@/data/races";
import { fmt, type Lang, type Strings } from "@/i18n";
import { CoinIcon, FlagIcon, SkullIcon, StarBurstIcon, TrophyIcon, UndoIcon } from "@/icons";
import { RACE_ICONS } from "./RacePanel";
import { PaintedImg } from "./PaintContext";
import { GameButton } from "./ui";

interface Props {
  t: Strings;
  lang: Lang;
  mode: RaceMode;
  car: Car;
  /** null while racing, set when the simulation is done */
  result: RaceResult | null;
  onCollect: (e: MouseEvent<HTMLButtonElement>) => void;
  onAgain: () => void;
  onClose: () => void;
  onStageTick?: () => void;
}

/** Full-screen race: animated road scene for ~3.5s, then the result card. */
export function RaceOverlay({ t, lang, mode, car, result, onCollect, onAgain, onClose, onStageTick }: Props) {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const collected = useRef(false);

  // stage timeline while racing
  useEffect(() => {
    if (result) return;
    setStage(0);
    setProgress(0);
    const timers = [
      window.setTimeout(() => setStage(1), 700),
      window.setTimeout(() => setStage(2), 1900),
      window.setTimeout(() => setStage(3), 2900),
    ];
    const id = window.setInterval(() => setProgress((p) => Math.min(100, p + 1.6)), 50);
    return () => {
      timers.forEach(window.clearTimeout);
      window.clearInterval(id);
    };
  }, [result, mode.id]);

  useEffect(() => {
    if (!result) onStageTick?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const stages = [t.raceStage1, t.raceStage2, t.raceStage3, t.raceStage4];
  const isDuel = mode.id === "demolition";
  const isPursuit = mode.id === "pursuit";

  return (
    <div className="absolute inset-0 z-50 flex animate-fade-in flex-col items-center justify-center bg-navy-950/88 backdrop-blur-[3px]">
      {!result ? (
        /* ---------------- racing scene ---------------- */
        <div className="flex w-full max-w-[520px] flex-col items-center px-[20px]">
          <div className="flex items-center gap-[10px]">
            <span className={cn("flex h-[48px] w-[48px] items-center justify-center rounded-[13px] border-[3px] border-ink bg-gradient-to-b text-white shadow-[0_3px_0_#0a1038]", mode.color)}>
              {RACE_ICONS[mode.id]}
            </span>
            <span className="font-display text-[30px] text-white t-stroke sw-5">{mode.title[lang]}</span>
          </div>

          {/* road */}
          <div className="relative mt-[18px] h-[200px] w-full overflow-hidden rounded-[22px] border-[4px] border-ink bg-[#1a1f3a] shadow-[0_8px_0_#060a28]">
            <div className="absolute inset-x-0 top-0 h-[60px] bg-gradient-to-b from-[#2a66da] to-[#1a1f3a]" />
            <div className="absolute inset-x-0 bottom-0 h-[130px] bg-[#2c3148]" />
            <div className="road-lines absolute inset-x-0 bottom-[60px] h-[6px]" />
            <div className="road-lines-fast absolute inset-x-0 bottom-[28px] h-[4px] opacity-60" />
            <div className="absolute inset-x-0 bottom-[126px] h-[4px] bg-white/30" />

            {/* rival / police */}
            {(isPursuit || isDuel || mode.rivals > 0) && (
              <img
                src={isPursuit || isDuel ? policeCar.image : car.image}
                alt=""
                className={cn(
                  "absolute bottom-[40px] w-[150px] drop-shadow-[0_6px_6px_rgba(0,0,0,0.5)] transition-all duration-700",
                  isPursuit ? "left-[6%]" : isDuel ? "left-[58%]" : stage >= 2 ? "left-[8%]" : "left-[42%]",
                  !isPursuit && !isDuel && "brightness-[0.6] hue-rotate-90",
                  isDuel && stage >= 2 && "translate-x-[18px] rotate-[10deg]",
                  isDuel && stage >= 3 && "rotate-[22deg] opacity-50 brightness-[0.6]",
                )}
              />
            )}
            {/* player */}
            <PaintedImg
              carId={car.id}
              shadow="drop-shadow(0 8px 8px rgba(0,0,0,0.55))"
              src={car.image}
              alt={car.name}
              className={cn(
                "absolute bottom-[22px] w-[190px] transition-all duration-700 car-shake",
                isPursuit ? "left-[48%]" : isDuel ? (stage >= 2 ? "left-[30%]" : "left-[10%]") : stage >= 2 ? "left-[50%]" : stage >= 1 ? "left-[30%]" : "left-[14%]",
              )}
            />
            {/* nitro flash */}
            {stage === 1 && <div className="absolute inset-0 animate-fade-in bg-[#46f0a0]/15" />}
            {/* finish flag */}
            {stage >= 3 && (
              <FlagIcon width={40} height={40} className="absolute right-[12px] top-[56px] animate-pop-in text-white drop-shadow" />
            )}
            {/* demolition hit flash */}
            {isDuel && stage >= 2 && (
              <StarBurstIcon width={64} height={64} className="absolute left-[52%] top-[62px] animate-pop-in text-amber-400 drop-shadow-[0_0_14px_#ffd23a]" />
            )}
          </div>

          <div key={stage} className="mt-[16px] animate-pop-in font-display text-[26px] text-amber-400 t-stroke sw-4">
            {stages[stage]}
          </div>
          <div className="mt-[8px] h-[22px] w-[340px] overflow-hidden rounded-full border-[3px] border-ink bg-navy-950">
            <div
              className="h-full rounded-full bg-gradient-to-r from-lime-500 to-mint-400 transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        /* ---------------- result card ---------------- */
        <div className="relative w-[440px] max-w-[94%] animate-slide-up rounded-[26px] border-[4px] border-ink bg-gradient-to-b from-navy-700 to-navy-900 px-[22px] pb-[20px] pt-[46px] shadow-[0_12px_0_#060a28,0_30px_60px_rgba(0,0,0,0.5)]">
          <div
            className={cn(
              "absolute -top-[26px] left-1/2 flex -translate-x-1/2 items-center gap-[8px] whitespace-nowrap rounded-[14px] border-[3px] border-ink px-[26px] py-[5px] font-display text-[26px] text-white t-stroke sw-4",
              result.won
                ? "bg-gradient-to-r from-[#9ef05a] to-[#3d9a1f] shadow-[0_4px_0_#1f5a10]"
                : "bg-gradient-to-r from-[#ff6b4a] to-[#c92a12] shadow-[0_4px_0_#7a1a0c]",
            )}
          >
            {result.won ? <TrophyIcon width={26} height={26} /> : <SkullIcon width={26} height={26} />}
            {result.won ? t.victory : t.defeat}
          </div>

          <div className="flex items-center gap-[12px]">
            <span className={cn("flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[13px] border-[3px] border-ink bg-gradient-to-b text-white", mode.color)}>
              {RACE_ICONS[mode.id]}
            </span>
            <div className="min-w-0">
              <div className="font-display text-[22px] leading-none text-white t-stroke sw-3">{mode.title[lang]}</div>
              <div className="mt-[3px] font-body text-[11px] font-black tracking-wider text-white/50">{car.name}</div>
            </div>
            <div className="ms-auto text-end">
              <div className="font-body text-[9px] font-black tracking-wider text-white/45">{t.youPlaced}</div>
              <div className={cn("font-display text-[34px] leading-none t-stroke sw-4", result.won ? "text-amber-400" : "text-white")}>
                {mode.rivals === 0 ? (result.won ? "1st" : "2nd") : `${ordinal(result.place)}`}
                {mode.rivals > 1 && <span className="font-body text-[12px] text-white/50"> / {result.total}</span>}
              </div>
            </div>
          </div>

          <div className="mt-[12px] flex items-center justify-between rounded-[14px] border-[3px] border-ink bg-navy-950/70 px-[14px] py-[8px]">
            <span className="font-body text-[10px] font-black tracking-wider text-white/50">{mode.unit[lang]}</span>
            <span className="font-display text-[26px] leading-none text-mint-400 t-stroke sw-3">{result.score}</span>
          </div>

          <div className="mt-[8px] space-y-[5px]">
            {result.highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-[8px] rounded-[10px] border-[2px] border-ink bg-navy-950/50 px-[10px] py-[5px] font-body text-[12px] font-bold text-white/80">
                <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-skyg-300" />
                {h[lang]}
              </div>
            ))}
            <div className="flex items-center justify-between px-[4px] font-body text-[10px] font-black tracking-wider text-white/40">
              <span>{t.damage}</span>
              <span className={result.damage > 60 ? "text-[#ff8a6a]" : "text-white/70"}>{result.damage}%</span>
            </div>
          </div>

          {/* prize */}
          <div className="mt-[12px] flex items-center justify-between rounded-[16px] border-[3px] border-ink bg-gradient-to-r from-[#ffd23a] to-[#ff9a1f] px-[14px] py-[8px] shadow-[0_4px_0_#b96a08]">
            <span className="font-display text-[16px] text-ink">{t.prize}</span>
            <span className="flex items-center gap-[6px] font-display text-[28px] leading-none text-ink">
              <CoinIcon width={26} height={26} />+{result.reward.toLocaleString("en-US")}
            </span>
          </div>

          <div className="mt-[14px] flex justify-center gap-[10px]">
            <GameButton variant="grey" className="h-[56px] w-[96px]" onClick={onClose}>
              <span className="flex items-center gap-[5px] font-display text-[16px] text-white t-stroke sw-3">
                <UndoIcon width={18} height={18} />
                {t.backToGarage}
              </span>
            </GameButton>
            <GameButton
              variant="orange"
              className="h-[56px] min-w-[150px] flex-1 animate-glow"
              onClick={(e) => {
                if (collected.current) return;
                collected.current = true;
                onCollect(e);
              }}
            >
              <span className="flex items-center gap-[6px] whitespace-nowrap font-display text-[17px] text-flame-500 t-stroke sw-4 sc-white">
                <CoinIcon width={20} height={20} />
                {t.collectPrize}
              </span>
            </GameButton>
            <GameButton variant="green" className="h-[56px] w-[104px]" onClick={onAgain}>
              <span className="font-display text-[15px] leading-tight text-white t-stroke sw-3">{t.raceAgain}</span>
            </GameButton>
          </div>
          <div className="mt-[6px] text-center font-body text-[10px] font-black text-white/35">
            {fmt(t.feeDeducted, { n: mode.fee.toLocaleString("en-US") })}
          </div>
        </div>
      )}
    </div>
  );
}
