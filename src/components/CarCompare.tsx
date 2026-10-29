import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { BRANDS, carTitle, ppOf, type Car, type CarStats } from "@/data/cars";
import type { Strings } from "@/i18n";
import { BumperIcon, CloseIcon, CoinIcon, CompareIcon, GaugeIcon, KeyIcon, NitroIcon, TagIcon, TireIcon, TrophyIcon } from "@/icons";
import { PaintedImg } from "./PaintContext";
import { BrandBadge } from "./Dealership";

/** One side of a comparison: a car plus its live numbers. */
export interface CompareEntry {
  car: Car;
  owned: boolean;
  equipped: boolean;
  /** live stats — owned cars include their upgrades */
  stats: CarStats;
  /** shop price (0 = starter) */
  price: number;
  /** coins paid back when selling (owned cars only) */
  sellValue?: number;
}

type Better = "higher" | "lower" | "none";

const num = (n: number) => n.toLocaleString("en-US");

/* ------------------------------------------------------------------ */
/* a single comparison row                                             */
/* ------------------------------------------------------------------ */

function Row({
  label,
  icon,
  a,
  b,
  better = "higher",
  suffix,
  max,
  tint,
}: {
  label: string;
  icon?: ReactNode;
  a: number;
  b: number;
  better?: Better;
  suffix?: string;
  /** when set, draws a progress bar relative to this value */
  max?: number;
  tint?: string;
}) {
  const aWins = better !== "none" && (better === "higher" ? a > b : a < b);
  const bWins = better !== "none" && (better === "higher" ? b > a : b < a);
  const delta = Math.abs(a - b);

  const cell = (v: number, wins: boolean, other: number) => (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-[4px]">
        {wins && <TrophyIcon width={12} height={12} className="shrink-0 text-amber-400" />}
        <span
          className={cn(
            "font-display text-[17px] leading-none tabular-nums",
            wins ? "text-mint-400" : "text-white/85",
          )}
        >
          {num(v)}
          {suffix && <span className="ms-[2px] font-body text-[9px] font-black text-white/40">{suffix}</span>}
        </span>
        {wins && delta > 0 && (
          <span className="rounded-full border-[1.5px] border-ink bg-mint-500/25 px-[5px] font-body text-[9px] font-black leading-[13px] text-mint-400">
            +{num(delta)}
          </span>
        )}
        {!wins && v !== other && delta > 0 && (
          <span className="font-body text-[9px] font-black text-white/25">−{num(delta)}</span>
        )}
      </div>
      {max !== undefined && (
        <div className="mt-[3px] h-[6px] overflow-hidden rounded-full border-[1.5px] border-ink bg-navy-950" dir="ltr">
          <div
            className={cn("h-full rounded-full bg-gradient-to-r", wins ? "from-mint-500 to-mint-400" : tint ?? "from-skyg-500 to-skyg-300")}
            style={{ width: `${Math.max(4, Math.min(100, (v / max) * 100))}%` }}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="flex items-center gap-[8px] rounded-[12px] border-[2.5px] border-ink bg-navy-950/55 px-[10px] py-[6px]">
      {cell(a, aWins, b)}
      <div className="flex w-[92px] shrink-0 flex-col items-center gap-[1px] text-center">
        <span className="flex items-center gap-[4px] font-body text-[9px] font-black leading-none tracking-wider text-white/50">
          {icon}
          {label}
        </span>
      </div>
      {cell(b, bWins, a)}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* text-only row (rarity / drivetrain / year)                          */
/* ------------------------------------------------------------------ */

function TextRow({ label, a, b, icon }: { label: string; a: string; b: string; icon?: ReactNode }) {
  const cell = (v: string) => (
    <div className="min-w-0 flex-1 truncate text-start font-display text-[15px] leading-none text-white/85">{v}</div>
  );
  return (
    <div className="flex items-center gap-[8px] rounded-[12px] border-[2.5px] border-ink bg-navy-950/40 px-[10px] py-[5px]">
      {cell(a)}
      <div className="flex w-[92px] shrink-0 items-center justify-center gap-[4px] font-body text-[9px] font-black tracking-wider text-white/40">
        {icon}
        {label}
      </div>
      {cell(b)}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* car header column                                                   */
/* ------------------------------------------------------------------ */

function CarHead({
  entry,
  t,
  desk,
  wins,
}: {
  entry: CompareEntry;
  t: Strings;
  desk: boolean;
  wins: number;
}) {
  const { car } = entry;
  const status = entry.equipped ? t.equipped : entry.owned ? t.owned : `${num(entry.price)} ${t.coins}`;
  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-1 flex-col items-center rounded-[16px] border-[3px] px-[8px] pb-[7px] pt-[9px]",
        entry.owned ? "border-skyg-300/80 bg-[#22346e]/85" : "border-ink bg-navy-800/70",
      )}
    >
      <span
        className="absolute -top-[10px] start-[6px] rounded-full border-[2px] border-ink px-[7px] font-body text-[9px] font-black leading-[15px] text-ink"
        style={{ background: entry.owned ? "#9ef05a" : "#ffd23a" }}
      >
        {entry.owned ? t.myCar : t.forSale}
      </span>
      {wins > 0 && (
        <span className="absolute -top-[10px] end-[6px] flex items-center gap-[3px] rounded-full border-[2px] border-ink bg-navy-950 px-[6px] font-body text-[9px] font-black leading-[15px] text-amber-400">
          <TrophyIcon width={9} height={9} />
          {wins}
        </span>
      )}

      <div className={cn("relative flex w-full items-center justify-center", desk ? "h-[62px]" : "h-[52px]")}>
        <PaintedImg
          carId={car.id}
          shadow="drop-shadow(0 4px 4px rgba(0,0,0,0.5))"
          src={car.image}
          alt={car.name}
          draggable={false}
          className="max-h-full max-w-[96%] object-contain"
        />
      </div>

      <div className="mt-[3px] flex min-w-0 items-center gap-[4px]" dir="ltr">
        <BrandBadge brand={car.brand} size={desk ? 15 : 13} />
        <span className="truncate font-display text-[15px] leading-none text-white t-stroke sw-2">
          {BRANDS[car.brand].name} {carTitle(car)}
        </span>
      </div>

      <div className="mt-[3px] flex max-w-full flex-wrap items-center justify-center gap-[3px]">
        <span
          className="rounded-full border-[2px] border-ink px-[5px] font-body text-[8px] font-black leading-[13px] text-ink"
          style={{ background: car.rarityColor }}
        >
          {car.rarity}
        </span>
        <span className="rounded-full border-[2px] border-ink bg-navy-950 px-[5px] font-body text-[8px] font-black leading-[13px] text-skyg-300">
          {car.cls} · {t.lv} {car.tier}
        </span>
      </div>

      <span
        className={cn(
          "mt-[4px] flex items-center gap-[3px] rounded-full border-[2px] border-ink px-[8px] py-[1px] font-display text-[12px] leading-none",
          entry.equipped ? "bg-navy-800 text-skyg-300" : entry.owned ? "bg-mint-500/20 text-mint-400" : "bg-amber-400/20 text-amber-400",
        )}
      >
        {entry.equipped ? <KeyIcon width={11} height={11} /> : entry.owned ? <TagIcon width={11} height={11} /> : <CoinIcon width={11} height={11} />}
        {status}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* shortcut button used inside the action bar                          */
/* ------------------------------------------------------------------ */

export function CompareButton({
  t,
  active,
  count,
  onClick,
  className,
  labelClassName,
}: {
  t: Strings;
  active?: boolean;
  count: number;
  onClick: () => void;
  className?: string;
  /** lets the caller hide the word on narrow screens, leaving the icon + counter */
  labelClassName?: string;
}) {
  return (
    <button
      type="button"
      id="dealer-compare-btn"
      onClick={onClick}
      aria-pressed={active}
      title={t.compareHint}
      className={cn(
        "relative flex h-[46px] shrink-0 items-center gap-[6px] rounded-[14px] border-[3px] border-ink px-[12px] font-display text-[15px] tracking-wide shadow-[0_4px_0_#0a1038] transition-transform active:translate-y-[2px] active:shadow-none",
        active
          ? "bg-gradient-to-b from-[#8fd0ff] to-[#3d8ff5] text-ink"
          : "bg-gradient-to-b from-navy-600 to-navy-800 text-white hover:brightness-110",
        className,
      )}
    >
      <CompareIcon width={18} height={18} />
      <span className={labelClassName}>{t.compare}</span>
      {count > 0 && (
        <span className="flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-[2px] border-ink bg-amber-400 px-[3px] font-body text-[10px] font-black text-ink">
          {count}
        </span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* the comparison board                                                */
/* ------------------------------------------------------------------ */

export function CompareModal({
  t,
  desk,
  a,
  b,
  onClose,
  onClear,
  onSwap,
}: {
  t: Strings;
  desk: boolean;
  a: CompareEntry;
  b: CompareEntry;
  onClose: () => void;
  onClear: () => void;
  onSwap: () => void;
}) {
  const sa = a.stats;
  const sb = b.stats;

  // count category wins (higher is better everywhere we score)
  const score = (key: "topSpeed" | "armor" | "accel" | "boost" | "power") => {
    const va = sa[key];
    const vb = sb[key];
    return va === vb ? [0, 0] : va > vb ? [1, 0] : [0, 1];
  };
  let winsA = 0;
  let winsB = 0;
  for (const k of ["topSpeed", "armor", "accel", "boost", "power"] as const) {
    const [x, y] = score(k);
    winsA += x;
    winsB += y;
  }
  const overall = winsA === winsB ? "tie" : winsA > winsB ? "a" : "b";

  const verdict =
    overall === "tie"
      ? t.compareTie
      : overall === "a"
        ? `${carTitle(a.car)} ${t.compareWins}`
        : `${carTitle(b.car)} ${t.compareWins}`;

  return (
    <div
      className="absolute inset-0 z-50 flex animate-fade-in items-center justify-center bg-navy-950/80 px-[10px] py-[10px] backdrop-blur-[3px]"
      role="dialog"
      aria-label={t.compareTitle}
      onClick={onClose}
    >
      <div
        className={cn(
          "relative flex max-h-full w-full flex-col overflow-hidden rounded-[22px] border-[4px] border-ink bg-gradient-to-b from-navy-700 to-navy-950 shadow-[0_12px_0_#060a28,0_30px_60px_rgba(0,0,0,0.55)]",
          desk ? "max-w-[760px]" : "max-w-[520px]",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* title + close */}
        <div className="flex shrink-0 items-center justify-between gap-[8px] border-b-[3px] border-ink/60 bg-navy-950/70 px-[12px] py-[8px]">
          <span className="flex items-center gap-[7px] font-display text-[20px] leading-none text-white t-stroke sw-3">
            <CompareIcon width={20} height={20} className="text-skyg-300" />
            {t.compareTitle}
          </span>
          <div className="flex items-center gap-[6px]">
            <button
              type="button"
              onClick={onSwap}
              title={t.compareSwap}
              aria-label={t.compareSwap}
              className="flex h-[32px] items-center gap-[4px] rounded-full border-[2.5px] border-ink bg-navy-800 px-[10px] font-body text-[10px] font-black text-skyg-300 transition-transform active:translate-y-[2px]"
            >
              <CompareIcon width={13} height={13} />
              {t.compareSwap}
            </button>
            <button
              type="button"
              onClick={onClear}
              className="flex h-[32px] items-center gap-[4px] rounded-full border-[2.5px] border-ink bg-navy-800 px-[10px] font-body text-[10px] font-black text-white/60 transition-transform active:translate-y-[2px]"
            >
              {t.compareClear}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.close}
              className="flex h-[32px] w-[32px] items-center justify-center rounded-full border-[2.5px] border-ink bg-gradient-to-b from-[#ff6b4a] to-[#e8381c] text-white shadow-[0_3px_0_#7a1a0c] transition-transform active:translate-y-[2px]"
            >
              <CloseIcon width={14} height={14} />
            </button>
          </div>
        </div>

        {/* body */}
        <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-[10px] pb-[10px] pt-[14px]">
          <div className="flex items-stretch gap-[8px]">
            <CarHead entry={a} t={t} desk={desk} wins={winsA} />
            <CarHead entry={b} t={t} desk={desk} wins={winsB} />
          </div>

          {/* verdict */}
          <div
            className={cn(
              "mt-[10px] flex items-center justify-center gap-[7px] rounded-[12px] border-[2.5px] border-ink px-[10px] py-[5px] text-center font-display text-[14px] leading-none",
              overall === "tie" ? "bg-navy-800 text-white/70" : "bg-gradient-to-r from-[#ffb32a] to-[#ff7a1a] text-ink",
            )}
          >
            <TrophyIcon width={15} height={15} />
            {verdict}
          </div>

          {/* numbers */}
          <div className="mt-[10px] space-y-[6px]">
            <Row label={t.power} icon={<CompareIcon width={10} height={10} />} a={sa.power} b={sb.power} tint="from-[#ff9a1f] to-[#ffd23a]" />
            <Row label={t.topSpeed} icon={<GaugeIcon width={10} height={10} />} a={sa.topSpeed} b={sb.topSpeed} max={400} suffix={t.kmh} />
            <Row label={t.armor} icon={<BumperIcon width={10} height={10} />} a={sa.armor} b={sb.armor} max={160} />
            <Row label={t.accel} icon={<TireIcon width={10} height={10} />} a={sa.accel} b={sb.accel} max={120} tint="from-lime-500 to-lime-400" />
            <Row label={t.boost} icon={<NitroIcon width={10} height={10} />} a={sa.boost} b={sb.boost} max={130} tint="from-[#8e3bff] to-[#c98cff]" />
            <Row label="PP" a={ppOf(a.car)} b={ppOf(b.car)} />
            <Row label="BHP" a={a.car.bhp} b={b.car.bhp} tint="from-[#ff6b4a] to-[#ffb32a]" />
          </div>

          <div className="mt-[6px] space-y-[6px]">
            <TextRow label={t.drivetrainShort} a={a.car.drive} b={b.car.drive} />
            <TextRow label={t.rarityLabel} a={a.car.rarity} b={b.car.rarity} />
            <TextRow label={t.yearLabel} a={String(a.car.year)} b={String(b.car.year)} />
            <TextRow
              label={t.comparePrice}
              a={a.owned ? t.owned : num(a.price)}
              b={b.owned ? t.owned : num(b.price)}
              icon={<CoinIcon width={10} height={10} />}
            />
          </div>

          {/* upgrade hint when a car is tuned */}
          <p className="mt-[8px] text-center font-body text-[10px] font-bold leading-snug text-white/35">{t.compareNote}</p>
        </div>
      </div>
    </div>
  );
}
