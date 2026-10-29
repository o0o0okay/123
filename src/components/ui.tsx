import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";
import { CheckIcon, CloseIcon } from "@/icons";

/* ------------------------------------------------------------------ */
/* 3D cartoon button                                                   */
/* ------------------------------------------------------------------ */

type Variant = "green" | "orange" | "grey" | "red" | "blue";

const EDGE: Record<Variant, string> = {
  green: "bg-[#2f7f17]",
  orange: "bg-[#c9660e]",
  grey: "bg-[#2a3360]",
  red: "bg-[#8f1c0c]",
  blue: "bg-[#1f4fb3]",
};

const FACE: Record<Variant, string> = {
  green: "bg-gradient-to-b from-[#9ef05a] via-[#6fcf36] to-[#56b92a]",
  orange: "bg-gradient-to-b from-[#ffe05a] via-[#ffbf2a] to-[#ffa41c]",
  grey: "bg-gradient-to-b from-[#5a6aa8] to-[#3d4a86]",
  red: "bg-gradient-to-b from-[#ff6b4a] to-[#e8381c]",
  blue: "bg-gradient-to-b from-[#6fb6ff] to-[#3d8ff5]",
};

interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  faceClassName?: string;
}

export function GameButton({
  variant = "green",
  className,
  faceClassName,
  children,
  ...rest
}: GameButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "group relative select-none rounded-[18px] border-[3px] border-ink pb-[7px] text-center",
        "shadow-[0_6px_14px_rgba(5,10,40,0.35),0_0_0_2px_rgba(255,255,255,0.14)]",
        "transition-[transform,filter] duration-75 hover:brightness-110 active:translate-y-[3px] disabled:opacity-60 disabled:pointer-events-none",
        EDGE[variant],
        className,
      )}
    >
      <span
        className={cn(
          "relative flex h-full w-full items-center justify-center overflow-hidden rounded-[14px]",
          "shadow-[inset_0_3px_0_rgba(255,255,255,0.35),inset_0_-2px_0_rgba(0,0,0,0.08)]",
          "transition-transform duration-75 group-active:translate-y-[5px]",
          FACE[variant],
          faceClassName,
        )}
      >
        {variant === "orange" && (
          <span className="halftone pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-70 [mask-image:linear-gradient(90deg,transparent,#000_70%)]" />
        )}
        {children}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Hexagonal icon badge                                                */
/* ------------------------------------------------------------------ */

export function HexBadge({
  children,
  size = 46,
  color = "teal",
  className,
}: {
  children: ReactNode;
  size?: number;
  color?: "teal" | "green" | "orange" | "purple";
  className?: string;
}) {
  const inner: Record<string, string> = {
    teal: "bg-gradient-to-b from-[#4fd9d2] to-[#1fa7a6]",
    green: "bg-gradient-to-b from-[#5ff0a8] to-[#22c47a]",
    orange: "bg-gradient-to-b from-[#ffcc4a] to-[#ff9a1f]",
    purple: "bg-gradient-to-b from-[#c98cff] to-[#8e3bff]",
  };
  return (
    <div
      className={cn("hex-clip relative shrink-0 bg-ink", className)}
      style={{ width: size, height: size * 1.1 }}
    >
      <div
        className={cn("hex-clip absolute flex items-center justify-center text-white", inner[color])}
        style={{ inset: 4 }}
      >
        <div className="absolute inset-x-0 top-0 h-1/2 bg-white/15" />
        <span className="relative drop-shadow-[0_1px_0_rgba(0,0,0,0.35)]">{children}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pill input                                                          */
/* ------------------------------------------------------------------ */

interface GameInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: ReactNode;
  error?: boolean;
  trailing?: ReactNode;
  badgeColor?: "teal" | "green" | "orange" | "purple";
}

export function GameInput({ icon, error, trailing, badgeColor = "teal", className, ...rest }: GameInputProps) {
  return (
    <label
      className={cn(
        "relative flex h-[46px] items-center rounded-full bg-navy-950 ps-[2px] pe-[6px]",
        "ring-[3px] ring-ink shadow-[inset_0_3px_0_rgba(0,0,0,0.5),0_2px_0_rgba(255,255,255,0.1)]",
        "focus-within:ring-skyg-400 transition-[box-shadow,ring-color]",
        error && "ring-[#ff4f1f] animate-shake",
        className,
      )}
    >
      <HexBadge size={44} color={badgeColor} className="-ms-[2px]">
        {icon}
      </HexBadge>
      <input
        {...rest}
        className={cn(
          "min-w-0 flex-1 bg-transparent px-3 font-body text-[17px] font-extrabold tracking-wide text-white",
          "placeholder:text-white/35 outline-none",
        )}
      />
      {trailing}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Square slot button (the 4 gear slots)                               */
/* ------------------------------------------------------------------ */

interface SlotButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  labelClassName?: string;
}

export function SlotButton({ icon, label, className, labelClassName, ...rest }: SlotButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "group relative h-[95px] w-[95px] rounded-[20px] bg-navy-950",
        "shadow-[0_0_0_3px_rgba(120,200,255,0.45),0_7px_0_#060a28,0_12px_18px_rgba(0,0,0,0.35)]",
        "transition-[transform,filter] duration-75 hover:brightness-110 active:translate-y-[4px] active:shadow-[0_0_0_3px_rgba(120,200,255,0.45),0_3px_0_#060a28]",
        className,
      )}
      aria-label={label}
    >
      <span className="slot-gloss absolute inset-[4px] flex flex-col items-center justify-center gap-[2px] overflow-hidden rounded-[16px] bg-gradient-to-b from-[#2b3a7c] to-[#141d4e] text-mint-400 drop-shadow-[0_2px_0_rgba(0,0,0,0.4)] transition-colors group-hover:text-mint-300">
        {icon}
        <span className={cn("mt-[2px] font-body text-[10px] font-black tracking-[0.12em] text-white/60", labelClassName)}>
          {label}
        </span>
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Carousel arrow                                                      */
/* ------------------------------------------------------------------ */

export function ArrowButton({
  dir,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { dir: "left" | "right" }) {
  return (
    <button
      type="button"
      {...rest}
      aria-label={dir === "left" ? "Previous hero" : "Next hero"}
      className={cn(
        "group h-[60px] w-[44px] transition-transform active:scale-90 hover:scale-105",
        className,
      )}
    >
      <svg viewBox="0 0 44 60" className={cn("h-full w-full", dir === "right" && "-scale-x-100")}>
        <polygon
          points="36,8 10,30 36,52"
          fill="#8ec9ff"
          stroke="#8ec9ff"
          strokeWidth={7}
          strokeLinejoin="round"
          transform="translate(3 5)"
          opacity={0.9}
        />
        <polygon points="36,8 10,30 36,52" fill="#fff" stroke="#fff" strokeWidth={7} strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Toggle switch & segmented control                                   */
/* ------------------------------------------------------------------ */

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn(
        "relative h-[32px] w-[62px] shrink-0 rounded-full border-[3px] border-ink transition-colors",
        on ? "bg-mint-500" : "bg-navy-950",
      )}
    >
      <span
        className={cn(
          "absolute top-[2px] flex h-[22px] w-[22px] items-center justify-center rounded-full border-[2px] border-ink bg-white transition-all",
          on ? "left-[32px]" : "left-[2px]",
        )}
      >
        {on && <CheckIcon width={13} height={13} className="text-mint-600" />}
      </span>
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-full border-[3px] border-ink bg-navy-950 p-[2px]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "min-w-[54px] rounded-full px-3 py-[4px] font-body text-[12px] font-black tracking-wider transition-colors",
            value === o.value ? "bg-mint-500 text-ink" : "text-white/60 hover:text-white",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal shell                                                         */
/* ------------------------------------------------------------------ */

export function Modal({
  title,
  onClose,
  children,
  width = 440,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}) {
  return (
    <div
      className="absolute inset-0 z-40 flex animate-fade-in items-center justify-center bg-navy-950/75 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative animate-slide-up rounded-[26px] border-[4px] border-ink bg-gradient-to-b from-navy-700 to-navy-900 px-[22px] pb-[22px] pt-[34px] shadow-[0_12px_0_#060a28,0_30px_60px_rgba(0,0,0,0.5)]"
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="absolute -top-[24px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[14px] border-[3px] border-ink bg-gradient-to-r from-[#ff7a1a] to-[#ffb32a] px-[26px] py-[5px] font-display text-[22px] text-white t-stroke sw-4 shadow-[0_4px_0_#9a4a08]">
          {title}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -right-[14px] -top-[14px] flex h-[40px] w-[40px] items-center justify-center rounded-full border-[3px] border-ink bg-gradient-to-b from-[#ff6b4a] to-[#e8381c] text-white shadow-[0_3px_0_#7a1a0c] transition-transform active:translate-y-[2px]"
        >
          <CloseIcon width={20} height={20} />
        </button>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Floating titled panel (used for the mobile SHOP / GARAGE tabs)      */
/* ------------------------------------------------------------------ */

export function FloatingPanel({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute inset-x-[22px] bottom-[12px] top-[16px] flex animate-slide-up flex-col gap-[10px] rounded-[22px] border-[4px] border-ink bg-navy-950/80 px-[12px] pb-[12px] pt-[36px] shadow-[0_8px_0_#060a28,0_0_0_3px_rgba(120,200,255,0.35)] backdrop-blur-[2px]",
        className,
      )}
    >
      <div className="absolute -top-[20px] left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-[12px] border-[3px] border-ink bg-gradient-to-r from-[#ff7a1a] to-[#ffb32a] px-[20px] py-[4px] font-display text-[20px] text-white t-stroke sw-4 shadow-[0_4px_0_#9a4a08]">
        {title}
      </div>
      {children}
    </div>
  );
}
