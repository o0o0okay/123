import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface TitleBannerProps {
  small: string;
  big: string;
  tag?: string;
  tagColor?: string;
  accent?: string;
  icon?: ReactNode;
  onIconClick?: () => void;
  /** accessible label / tooltip for the round icon button */
  iconLabel?: string;
  /** visual tone so garage vs shop are instantly distinguishable */
  iconTone?: "shop" | "garage";
  className?: string;
}

/** Hexagonal badge with a car silhouette, used as the game emblem. */
export function HexEmblem({ accent = "#ff3b2f", className }: { accent?: string; className?: string }) {
  return (
    <svg viewBox="0 0 70 78" className={cn("h-[78px] w-[70px] drop-shadow-[0_4px_0_rgba(10,16,56,0.6)]", className)}>
      <defs>
        <linearGradient id="hexMetal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eaf0fb" />
          <stop offset="1%" stopColor="#8a96b4" />
          <stop offset="100%" stopColor="#8a96b4" />
        </linearGradient>
      </defs>
      <polygon
        points="35,2 67,20 67,58 35,76 3,58 3,20"
        fill="url(#hexMetal)"
        stroke="#1b2142"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <polygon points="35,10 60,24 60,54 35,68 10,54 10,24" fill="#2b3147" stroke="#4a5272" strokeWidth="2" strokeLinejoin="round" />
      {/* car silhouette */}
      <path
        d="M16 41.5l2.6-6.2c.5-1.2 1.7-2 3-2h18.8c1.3 0 2.5.8 3 2l2.6 6.2h1.5c1.4 0 2.5 1.1 2.5 2.5v2.3c0 1.2-1 2.2-2.2 2.2h-2.6a3.6 3.6 0 0 0-7.1 0H30.9a3.6 3.6 0 0 0-7.1 0h-3.3c-1.2 0-2.2-1-2.2-2.2V44c0-1.4 1.1-2.5 2.5-2.5z"
        fill={accent}
        stroke="#2a0d0d"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M22.5 34.5h17l-2.4 5.2h-12z" fill="#9fd8ff" stroke="#2a0d0d" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="23.8" cy="46.3" r="2.1" fill="#0f1535" />
      <circle cx="40.2" cy="46.3" r="2.1" fill="#0f1535" />
    </svg>
  );
}

/** Nameplate copied from the reference: dark slanted strip + orange banner + rarity + round icon. */
export function TitleBanner({
  small,
  big,
  tag,
  tagColor = "#ff9a1f",
  accent,
  icon,
  onIconClick,
  iconLabel,
  iconTone = "shop",
  className,
}: TitleBannerProps) {
  return (
    <header className={cn("relative h-[132px] shrink-0", className)} dir="ltr">
      {/* dark slanted strip */}
      <div className="absolute left-[150px] top-[32px] flex h-[36px] w-[205px] items-center bg-ink/95 ps-[34px] [clip-path:polygon(0_0,100%_0,calc(100%-18px)_100%,0_100%)] shadow-[0_3px_0_rgba(0,0,0,0.3)]">
        <span className="font-display text-[22px] tracking-wider text-white">{small}</span>
        <span className="halftone absolute inset-y-0 right-[14px] w-[56px] opacity-40 [mask-image:linear-gradient(90deg,transparent,#000)]" />
      </div>

      {/* orange banner */}
      <div className="absolute left-[134px] top-[65px] h-[60px] w-[284px] rounded-[12px] bg-ink shadow-[0_6px_0_rgba(10,16,56,0.55)]">
        <div className="absolute inset-[3px] overflow-hidden rounded-[9px] bg-gradient-to-r from-[#ff7a1a] via-[#ff9c22] to-[#ffb42c]">
          <div className="absolute inset-y-0 left-0 w-[80px] bg-[#ee6512]/80 [clip-path:polygon(0_0,100%_0,55%_100%,0_100%)]" />
          <div className="checker absolute inset-y-0 right-0 w-[96px] opacity-25 [mask-image:linear-gradient(90deg,transparent,#000_60%)]" />
          <div className="absolute inset-x-0 top-0 h-[10px] bg-white/25" />
          <div className="absolute inset-x-0 bottom-0 h-[7px] bg-[#c9560c]/60" />
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center whitespace-nowrap font-display italic tracking-wide text-white t-stroke sw-5",
              big.length > 13 ? "text-[27px]" : big.length > 10 ? "text-[33px]" : "text-[40px]",
            )}
          >
            {big}
          </span>
        </div>
      </div>

      {/* rarity / tag */}
      {tag && (
        <span
          className="absolute left-[344px] top-[24px] font-display text-[22px] italic tracking-wide t-stroke sw-4"
          style={{ color: tagColor }}
        >
          {tag}
        </span>
      )}

      {/* hex emblem */}
      <HexEmblem accent={accent} className="absolute left-[96px] top-[22px]" />

      {/* round icon button: garage (owned car) / shop (locked car) */}
      {icon && (
        <button
          type="button"
          id="banner-action-btn"
          aria-label={iconLabel}
          title={iconLabel}
          onClick={onIconClick}
          className={cn(
            "absolute left-[400px] top-[90px] flex h-[54px] w-[54px] items-center justify-center rounded-full border-[3px] bg-navy-800 shadow-[0_4px_0_#0a1038,0_0_0_3px_rgba(10,16,56,0.5)] transition-transform hover:scale-110 active:translate-y-[2px]",
            iconTone === "garage"
              ? "border-amber-400 text-amber-400 hover:shadow-[0_4px_0_#0a1038,0_0_0_4px_rgba(255,210,58,0.35)]"
              : "border-skyg-400 text-skyg-300 hover:shadow-[0_4px_0_#0a1038,0_0_0_4px_rgba(111,193,255,0.35)]",
          )}
        >
          {icon}
        </button>
      )}
    </header>
  );
}
