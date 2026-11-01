import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { BRANDS, carTitle, ppOf, type BrandId, type Car, type CarStats, type Drive } from "@/data/cars";
import { fmt, type Lang, type Strings } from "@/i18n";
import { useAnimatedNumber } from "@/hooks";
import { useCoinFly } from "./CoinFlyEffect";
import {
  BumperIcon,
  CartIcon,
  CheckIcon,
  CloseIcon,
  CoinIcon,
  FilterIcon,
  GaugeIcon,
  InfoIcon,
  KeyIcon,
  LockIcon,
  NitroIcon,
  CompareIcon,
  SearchIcon,
  SortIcon,
  StoreIcon,
  TagIcon,
  TireIcon,
  UndoIcon,
} from "@/icons";
import { PaintedImg } from "./PaintContext";
import { CompareButton, CompareModal, type CompareEntry } from "./CarCompare";
import { BrandBadge } from "./DealerBits";
import { CarDetails } from "./CarDetails";
import { Modal, Toggle } from "./ui";

export type SortKey = "price-asc" | "price-desc" | "pp-asc" | "pp-desc" | "bhp-desc" | "name-asc" | "year-desc";
export type MarketMode = "buy" | "sell";

const DRIVES: Drive[] = ["FWD", "RWD", "AWD", "MR", "4WD"];
const BRAND_IDS = Object.keys(BRANDS) as BrandId[];

const SORTS: { key: SortKey; label: keyof Strings; short: { en: string; fa: string } }[] = [
  { key: "pp-asc", label: "sortPpAsc", short: { en: "PP ↑", fa: "PP ↑" } },
  { key: "pp-desc", label: "sortPpDesc", short: { en: "PP ↓", fa: "PP ↓" } },
  { key: "price-asc", label: "sortPriceAsc", short: { en: "PRICE ↑", fa: "قیمت ↑" } },
  { key: "price-desc", label: "sortPriceDesc", short: { en: "PRICE ↓", fa: "قیمت ↓" } },
  { key: "bhp-desc", label: "sortBhp", short: { en: "BHP", fa: "قدرت" } },
  { key: "name-asc", label: "sortName", short: { en: "A–Z", fa: "الفبا" } },
  { key: "year-desc", label: "sortYear", short: { en: "NEWEST", fa: "جدید" } },
];

/** Soft blue "bokeh" dots in the background (x%, y%, size px, opacity). */
const BOKEH: [number, number, number, number][] = [
  [6, 18, 10, 0.35], [14, 72, 6, 0.4], [22, 40, 14, 0.18], [37, 85, 8, 0.3], [48, 12, 5, 0.45],
  [58, 64, 12, 0.2], [66, 30, 7, 0.35], [77, 80, 10, 0.25], [86, 22, 6, 0.4], [93, 58, 13, 0.2],
];

/* ------------------------------------------------------------------ */
/* small shared parts                                                  */
/* ------------------------------------------------------------------ */

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-[6px] flex items-center gap-[6px] font-display text-[12px] tracking-[0.08em] text-skyg-300">
      {children}
      <span className="h-[2px] flex-1 rounded bg-white/10" />
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex shrink-0 items-center gap-[5px] whitespace-nowrap rounded-full border-[2.5px] border-ink px-[9px] py-[3px] font-body text-[11px] font-black transition-colors",
        active
          ? "bg-gradient-to-b from-[#ffd23a] to-[#ff9a1f] text-ink"
          : "bg-navy-950/70 text-white/65 hover:text-white",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* filter sidebar (desktop column / mobile drawer)                     */
/* ------------------------------------------------------------------ */

interface FilterPanelProps {
  t: Strings;
  mode: MarketMode;
  sort: SortKey;
  setSort: (s: SortKey) => void;
  brand: BrandId | "all";
  setBrand: (b: BrandId | "all") => void;
  drives: Drive[];
  toggleDrive: (d: Drive) => void;
  minPrice: number;
  setMinPrice: (n: number) => void;
  maxPrice: number;
  setMaxPrice: (n: number) => void;
  /** highest price in the showroom, the top of the range */
  priceCap: number;
  affordable: boolean;
  setAffordable: (v: boolean) => void;
  brandCounts: Record<string, number>;
  onReset: () => void;
  children?: ReactNode;
}

/** One end of the price range: a coin-prefixed field that accepts a typed number. */
function PriceField({
  id,
  label,
  value,
  cap,
  onCommit,
}: {
  id: "min" | "max";
  label: string;
  value: number;
  cap: number;
  onCommit: (n: number) => void;
}) {
  // while typing we keep the raw digits, so a thousand separator never moves the caret;
  // the moment the real value changes from elsewhere (the slider, a reset) we drop the draft
  const [draft, setDraft] = useState<string | null>(null);
  const shown =
    draft === null
      ? value.toLocaleString("en-US")
      : draft === ""
        ? ""
        : Number(draft) === value
          ? draft
          : value.toLocaleString("en-US");

  return (
    <label className="flex min-w-0 flex-1 flex-col gap-[2px]">
      <span className="truncate font-body text-[9px] font-black tracking-wider text-white/45">{label}</span>
      <span className="flex h-[28px] items-center gap-[4px] rounded-[9px] border-[2.5px] border-ink bg-navy-950/85 px-[6px] shadow-[inset_0_2px_0_rgba(0,0,0,0.4)] transition-colors focus-within:border-skyg-400">
        <CoinIcon width={12} height={12} className="shrink-0 text-amber-400" />
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          dir="ltr"
          data-price={id}
          aria-label={label}
          value={shown}
          onChange={(e) => {
            const digits = e.target.value
              .replace(/[^\d]/g, "")
              .replace(/^0+(?=\d)/, "")
              .slice(0, 9);
            setDraft(digits);
            if (digits) onCommit(Math.min(cap, Number(digits)));
          }}
          onBlur={() => setDraft(null)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.currentTarget.blur();
          }}
          className="min-w-0 flex-1 bg-transparent font-display text-[13px] leading-none tabular-nums text-amber-400 outline-none"
        />
      </span>
    </label>
  );
}

/** The rail under the two fields: both ends are draggable. */
function PriceRange({
  min,
  max,
  cap,
  minLabel,
  maxLabel,
  onMin,
  onMax,
}: {
  min: number;
  max: number;
  cap: number;
  minLabel: string;
  maxLabel: string;
  onMin: (n: number) => void;
  onMax: (n: number) => void;
}) {
  const pct = (n: number) => (cap > 0 ? Math.min(100, Math.max(0, (n / cap) * 100)) : 0);
  const lo = pct(min);
  const hi = pct(max);
  return (
    <div className="price-range mt-[8px]" dir="ltr">
      {/* the rail and the selected slice */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[6px] -translate-y-1/2 rounded-full border-[2px] border-ink bg-navy-950" />
      <div
        className="pointer-events-none absolute top-1/2 h-[6px] -translate-y-1/2 rounded-full bg-gradient-to-r from-[#ffd23a] to-[#ff9a1f]"
        style={{ left: `${lo}%`, right: `${100 - hi}%` }}
      />
      <input
        type="range"
        min={0}
        max={cap}
        step={1000}
        value={min}
        onChange={(e) => onMin(Number(e.target.value))}
        aria-label={minLabel}
        data-range="min"
        // when both thumbs are stacked the min one must stay grabbable
        style={{ zIndex: lo > 50 ? 5 : 3 }}
      />
      <input
        type="range"
        min={0}
        max={cap}
        step={1000}
        value={max}
        onChange={(e) => onMax(Number(e.target.value))}
        aria-label={maxLabel}
        data-range="max"
        style={{ zIndex: 4 }}
      />
    </div>
  );
}

function FilterPanel(p: FilterPanelProps) {
  const { t } = p;
  return (
    <div className="space-y-[14px]">
      {p.children}

      {/* sort */}
      <div>
        <SectionTitle>
          <SortIcon width={13} height={13} />
          {t.sortBy}
        </SectionTitle>
        <div className="space-y-[3px]">
          {SORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => p.setSort(s.key)}
              aria-pressed={p.sort === s.key}
              className={cn(
                "flex w-full items-center gap-[8px] rounded-[10px] px-[9px] py-[5px] text-start font-body text-[12px] font-extrabold transition-colors",
                p.sort === s.key
                  ? "bg-skyg-500/25 text-white ring-[2px] ring-skyg-400/70"
                  : "text-white/60 hover:bg-white/5 hover:text-white",
              )}
            >
              <span
                className={cn(
                  "h-[10px] w-[10px] shrink-0 rounded-full border-[2px]",
                  p.sort === s.key ? "border-amber-400 bg-amber-400" : "border-white/40",
                )}
              />
              {t[s.label] as string}
            </button>
          ))}
        </div>
      </div>

      {/* brand */}
      <div>
        <SectionTitle>{t.brandLabel}</SectionTitle>
        <div className="flex flex-wrap gap-[5px]">
          <Chip active={p.brand === "all"} onClick={() => p.setBrand("all")}>
            {t.any}
          </Chip>
          {BRAND_IDS.map((id) => (
            <Chip key={id} active={p.brand === id} onClick={() => p.setBrand(id)}>
              <BrandBadge brand={id} size={13} />
              {BRANDS[id].name}
              <span className="opacity-60">{p.brandCounts[id] ?? 0}</span>
            </Chip>
          ))}
        </div>
      </div>

      {/* drivetrain */}
      <div>
        <SectionTitle>{t.drivetrain}</SectionTitle>
        <div className="flex flex-wrap gap-[5px]" dir="ltr">
          {DRIVES.map((d) => (
            <Chip key={d} active={p.drives.includes(d)} onClick={() => p.toggleDrive(d)}>
              {d}
            </Chip>
          ))}
        </div>
      </div>

      {/* price range + toggles (buy mode only) */}
      {p.mode === "buy" && (
        <div>
          <SectionTitle>{t.priceRange}</SectionTitle>

          {/* two ends of the range, editable by typing a round number */}
          <div className="flex items-end gap-[6px]">
            <PriceField
              id="min"
              label={t.minPrice}
              value={p.minPrice}
              cap={p.priceCap}
              onCommit={p.setMinPrice}
            />
            <span className="mb-[7px] h-[2px] w-[8px] shrink-0 rounded-full bg-white/30" />
            <PriceField
              id="max"
              label={t.maxPrice}
              value={p.maxPrice}
              cap={p.priceCap}
              onCommit={p.setMaxPrice}
            />
          </div>

          <PriceRange
            min={p.minPrice}
            max={p.maxPrice}
            cap={p.priceCap}
            minLabel={t.minPrice}
            maxLabel={t.maxPrice}
            onMin={p.setMinPrice}
            onMax={p.setMaxPrice}
          />

          <p className="mt-[2px] font-body text-[8px] font-black tracking-wide text-white/35">{t.priceRangeHint}</p>
        </div>
      )}
      {p.mode === "buy" && (
        <div className="space-y-[8px]">
          <div className="flex items-center justify-between gap-[8px] font-body text-[12px] font-extrabold text-white/80">
            {t.affordableOnly}
            <Toggle on={p.affordable} onChange={p.setAffordable} />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={p.onReset}
        className="w-full rounded-full border-[2.5px] border-ink bg-navy-950/80 py-[6px] font-display text-[13px] tracking-wide text-white/70 transition-colors hover:text-white"
      >
        {t.resetFilters}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* dealership                                                          */
/* ------------------------------------------------------------------ */

export interface DealershipProps {
  t: Strings;
  lang: Lang;
  layout: "mobile" | "desktop";
  cars: Car[];
  owned: string[];
  /** owned cars pledged as loan collateral: they cannot be sold */
  locked?: string[];
  activeId: string;
  coins: number;
  sellValueOf: (car: Car) => number;
  /** live stats of a car (owned cars include their upgrades) */
  statsOf: (car: Car) => CarStats;
  onBuy: (car: Car) => void;
  onSell: (car: Car) => void;
  onEquip: (car: Car) => void;
  onClose: () => void;
  onSfx?: (name: "click" | "toggle" | "swoosh") => void;
}

export function Dealership({
  t,
  lang,
  layout,
  cars,
  owned,
  locked = [],
  activeId,
  coins,
  sellValueOf,
  statsOf,
  onBuy,
  onSell,
  onEquip,
  onClose,
  onSfx,
}: DealershipProps) {
  const desk = layout === "desktop";
  const priceCap = useMemo(() => Math.ceil(Math.max(...cars.map((c) => c.price)) / 5000) * 5000, [cars]);

  const [mode, setMode] = useState<MarketMode>("buy");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("pp-asc");
  const [brand, setBrand] = useState<BrandId | "all">("all");
  const [drives, setDrives] = useState<Drive[]>([]);
  const [minPrice, setMinPriceRaw] = useState(0);
  const [maxPrice, setMaxPriceRaw] = useState(priceCap);
  const [affordable, setAffordable] = useState(false);
  const [selectedId, setSelectedId] = useState(activeId);
  const [drawer, setDrawer] = useState(false);
  /** ids of the two cars in the comparison (max 2) */
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  /** mobile only: the details sheet of the selected car */
  const [detailsOpen, setDetailsOpen] = useState(false);
  /** the scrolling card container — used to move the selection with the arrow keys */
  const gridRef = useRef<HTMLDivElement | null>(null);

  /** keep a price inside the showroom range */
  const clampPrice = (n: number) => Math.max(0, Math.min(priceCap, Math.round(n || 0)));
  /** moving one end of the range pushes the other one along instead of crossing it */
  const setMinPrice = (n: number) => {
    const v = clampPrice(n);
    setMinPriceRaw(v);
    setMaxPriceRaw((m) => Math.max(m, v));
  };
  const setMaxPrice = (n: number) => {
    const v = clampPrice(n);
    setMaxPriceRaw(v);
    setMinPriceRaw((m) => Math.min(m, v));
  };

  const lockedSet = useMemo(() => new Set(locked), [locked]);
  const animatedCoins = useAnimatedNumber(coins);
  const { isPulsing } = useCoinFly();
  const click = () => onSfx?.("click");

  // Escape closes the mobile filter drawer before the dealership itself
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      setDrawer(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [drawer]);

  // Escape closes the comparison board (or empties the queue) before the dealership itself
  useEffect(() => {
    if (!compareOpen && compareIds.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      if (compareOpen) setCompareOpen(false);
      else setCompareIds([]);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [compareOpen, compareIds.length]);

  /* ---------------- filtering + sorting ---------------- */
  const list = useMemo(() => {
    const norm = (s: string) => s.toLowerCase().replace(/[\s'’\-]/g, "");
    const q = norm(query.trim());
    const priceOf = (c: Car) => (mode === "sell" ? sellValueOf(c) : c.price);

    const out = cars.filter((c) => {
      const isOwned = owned.includes(c.id);
      if (mode === "sell" && !isOwned) return false;
      // a car already in the garage is not for sale any more
      if (mode === "buy" && isOwned) return false;
      if (brand !== "all" && c.brand !== brand) return false;
      if (drives.length && !drives.includes(c.drive)) return false;
      if (mode === "buy") {
        if (c.price < minPrice || c.price > maxPrice) return false;
        if (affordable && c.price > coins) return false;
      }
      if (q) {
        const b = BRANDS[c.brand];
        const hay = norm(
          [c.name, carTitle(c), b.name, c.cls, c.rarity, c.drive, String(c.year), b.country.en, b.country.fa].join(" "),
        );
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const cmp: Record<SortKey, (a: Car, b: Car) => number> = {
      "price-asc": (a, b) => priceOf(a) - priceOf(b),
      "price-desc": (a, b) => priceOf(b) - priceOf(a),
      "pp-asc": (a, b) => ppOf(a) - ppOf(b),
      "pp-desc": (a, b) => ppOf(b) - ppOf(a),
      "bhp-desc": (a, b) => b.bhp - a.bhp,
      "name-asc": (a, b) => carTitle(a).localeCompare(carTitle(b)),
      "year-desc": (a, b) => b.year - a.year,
    };
    return out.sort((a, b) => cmp[sort](a, b) || a.price - b.price);
  }, [cars, owned, mode, brand, drives, minPrice, maxPrice, affordable, coins, query, sort, sellValueOf]);

  const selected = list.find((c) => c.id === selectedId) ?? list[0] ?? null;
  const activeCar = cars.find((c) => c.id === activeId);
  const sortLabel = t[SORTS.find((s) => s.key === sort)!.label] as string;

  /** cars that are still for sale (the BUY tab never shows the garage) */
  const forSale = useMemo(() => {
    const ownedSet = new Set(owned);
    return cars.filter((c) => !ownedSet.has(c.id));
  }, [cars, owned]);

  const brandCounts = useMemo(() => {
    const m: Record<string, number> = {};
    const src = mode === "buy" ? forSale : cars.filter((c) => owned.includes(c.id));
    for (const c of src) m[c.brand] = (m[c.brand] ?? 0) + 1;
    return m;
  }, [cars, owned, forSale, mode]);

  const activeFilters =
    (brand !== "all" ? 1 : 0) +
    drives.length +
    (mode === "buy" && (minPrice > 0 || maxPrice < priceCap) ? 1 : 0) +
    (mode === "buy" && affordable ? 1 : 0);

  const crumbs = [t.dealership, ...(brand === "all" ? [t.allBrands] : [BRANDS[brand].country[lang], BRANDS[brand].name])];

  /* ---------------- actions ---------------- */
  const reset = () => {
    click();
    setQuery("");
    setBrand("all");
    setDrives([]);
    setMinPriceRaw(0);
    setMaxPriceRaw(priceCap);
    setAffordable(false);
    setSort("pp-asc");
  };
  const toggleDrive = (d: Drive) => {
    onSfx?.("toggle");
    setDrives((v) => (v.includes(d) ? v.filter((x) => x !== d) : [...v, d]));
  };
  const select = (c: Car) => {
    if (c.id !== selected?.id) onSfx?.("swoosh");
    setSelectedId(c.id);
  };
  /** how many cards sit on one row of the grid (1 when it cannot be measured) */
  const columnsOfGrid = (grid: HTMLElement): number => {
    const tiles = Array.from(grid.querySelectorAll<HTMLElement>("[data-car-tile]"));
    if (tiles.length < 2) return 1;
    // a real layout tells us: every tile of the first row shares the same offsetTop
    const firstTop = tiles[0].offsetTop;
    const firstRow = tiles.filter((t) => t.offsetTop === firstTop).length;
    if (firstRow > 1 && firstRow < tiles.length) return firstRow;
    // fall back to the width of one card against the visible width of the grid
    const cardW = tiles[0].getBoundingClientRect().width;
    const gridW = grid.getBoundingClientRect().width;
    if (cardW > 4 && gridW > 4) return Math.max(1, Math.round((gridW + 14) / (cardW + 14)));
    return 1;
  };

  /** a right-to-left grid flows the other way, so ← and → swap meaning for those players */
  const gridIsRtl = (grid: HTMLElement | null): boolean => {
    if (!grid) return false;
    const dir = grid.closest("[dir]")?.getAttribute("dir");
    if (dir) return dir === "rtl";
    return typeof getComputedStyle === "function" && getComputedStyle(grid).direction === "rtl";
  };

  /** keeps the newly selected card visible inside the grid (never scrolls the page) */
  const revealSelection = (id: string) => {
    const grid = gridRef.current;
    if (!grid) return;
    const tile = Array.from(grid.querySelectorAll<HTMLElement>("[data-car-tile]")).find((t) => t.dataset.carTile === id);
    tile?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  };

  /** double-click / primary button behaviour */
  const primary = (car: Car) => {
    const isOwned = owned.includes(car.id);
    if (mode === "sell") {
      // onSell() carries the guard too; the tile stays inert for pledged cars
      if (isOwned) onSell(car);
      return;
    }
    if (isOwned) {
      if (car.id !== activeId) onEquip(car);
      return;
    }
    onBuy(car);
  };

  /* ---------------- keyboard: arrow keys move the selection ---------------- */
  const keyHandlers = useRef<{ primary: (car: Car) => void; selected: Car | null }>({
    primary: () => undefined,
    selected: null,
  });
  keyHandlers.current.primary = primary;
  keyHandlers.current.selected = selected;

  useEffect(() => {
    // modals own the keyboard while they are open
    if (compareOpen || drawer || detailsOpen) return;

    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable) return;

      if (e.key === "Enter") {
        const car = keyHandlers.current.selected;
        if (!car) return;
        e.preventDefault();
        keyHandlers.current.primary(car);
        return;
      }

      const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
      if (!keys.includes(e.key) || !list.length) return;
      e.preventDefault();

      const grid = gridRef.current;
      const cols = grid ? columnsOfGrid(grid) : 1;
      const hDir = grid && gridIsRtl(grid) ? -1 : 1;
      const idx = Math.max(0, list.findIndex((c) => c.id === selected?.id));
      let next = idx;
      if (e.key === "Home") next = 0;
      else if (e.key === "End") next = list.length - 1;
      else if (e.key === "ArrowUp") next = idx - cols;
      else if (e.key === "ArrowDown") next = idx + cols;
      else if (e.key === "ArrowLeft") next = idx - hDir;
      else next = idx + hDir;

      next = Math.max(0, Math.min(list.length - 1, next));
      if (next === idx) return;
      onSfx?.("toggle");
      setSelectedId(list[next].id);
      revealSelection(list[next].id);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* Escape closes the details sheet before the dealership itself */
  useEffect(() => {
    if (!detailsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      setDetailsOpen(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [detailsOpen]);

  /* ---------------- comparison ---------------- */
  const toEntry = (car: Car): CompareEntry => {
    const isOwned = owned.includes(car.id);
    return {
      car,
      owned: isOwned,
      equipped: car.id === activeId,
      stats: statsOf(car),
      price: car.price,
      sellValue: isOwned ? sellValueOf(car) : undefined,
    };
  };

  const toggleCompare = (car: Car) => {
    onSfx?.("toggle");
    setCompareIds((cur) => {
      if (cur.includes(car.id)) return cur.filter((id) => id !== car.id);
      // keep the queue at two slots: newest wins, the oldest drops out
      return [...cur, car.id].slice(-2);
    });
  };

  /** action-bar button: toggles the selected car in/out of the queue, opens the board at 2/2 */
  const openCompare = (fallback?: Car) => {
    const car = fallback ?? selected;
    if (!car) return;
    click();
    if (compareIds.includes(car.id)) {
      setCompareIds((cur) => cur.filter((id) => id !== car.id));
      return;
    }
    const next = [...compareIds, car.id].slice(-2);
    setCompareIds(next);
    if (next.length === 2) setCompareOpen(true);
  };

  const compareEntries = compareIds
    .map((id) => cars.find((c) => c.id === id))
    .filter((c): c is Car => !!c)
    .map(toEntry);

  const filterProps: FilterPanelProps = {
    t,
    mode,
    sort,
    setSort: (s) => {
      click();
      setSort(s);
    },
    brand,
    setBrand: (b) => {
      click();
      setBrand(b);
    },
    drives,
    toggleDrive,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    priceCap,
    affordable,
    setAffordable: (v) => {
      onSfx?.("toggle");
      setAffordable(v);
    },
    brandCounts,
    onReset: reset,
  };

  /* ---------------- pieces ---------------- */
  const coinBadge = (
    <span
      id="dealer-coin-badge"
      dir="ltr"
      className={cn(
        "flex shrink-0 items-center gap-[6px] rounded-full border-[3px] border-ink bg-navy-950/80 px-[12px] py-[4px] font-display text-[17px] leading-none text-amber-400 transition-all duration-300",
        isPulsing && "scale-110 ring-[3px] ring-amber-400 shadow-[0_0_18px_rgba(255,210,58,0.7)]",
      )}
    >
      <CoinIcon width={20} height={20} />
      {animatedCoins.toLocaleString("en-US")}
    </span>
  );

  const closeBtn = (
    <button type="button" onClick={onClose} aria-label={t.menu} className="group flex shrink-0 items-center gap-[8px]">
      <span className="flex h-[40px] w-[44px] items-center justify-center rounded-[8px] border-[3px] border-ink bg-gradient-to-b from-[#ff5a4a] to-[#b81d1d] text-white shadow-[0_3px_0_#5a0d0d] transition-transform group-active:translate-y-[2px]">
        <UndoIcon width={22} height={22} />
      </span>
      <span className="font-body text-[12px] font-black tracking-[0.14em] text-white/85">{t.menu}</span>
    </button>
  );

  const searchBox = (
    <label className="flex h-[40px] min-w-0 flex-1 items-center gap-[8px] rounded-full border-[3px] border-ink bg-navy-950/85 px-[12px] shadow-[inset_0_3px_0_rgba(0,0,0,0.45)] transition-colors focus-within:border-skyg-400">
      <SearchIcon width={18} height={18} className="shrink-0 text-white/50" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.searchCars}
        aria-label={t.searchCars}
        className="min-w-0 flex-1 bg-transparent font-body text-[13px] font-extrabold text-white outline-none placeholder:text-white/35"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          aria-label="Clear search"
          className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white"
        >
          <CloseIcon width={11} height={11} />
        </button>
      )}
    </label>
  );

  const modeSwitch = (
    <div className="flex rounded-full border-[3px] border-ink bg-navy-950 p-[3px]">
      {(["buy", "sell"] as const).map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={mode === m}
          onClick={() => {
            click();
            setMode(m);
          }}
          className={cn(
            "flex h-[32px] flex-1 items-center justify-center gap-[6px] rounded-full px-[10px] font-display text-[15px] tracking-wide transition-colors",
            mode === m
              ? m === "buy"
                ? "bg-gradient-to-b from-[#ffd23a] to-[#ff9a1f] text-ink"
                : "bg-gradient-to-b from-[#ff6b4a] to-[#c92a12] text-white"
              : "text-white/55 hover:text-white",
          )}
        >
          {m === "buy" ? <CartIcon width={15} height={15} /> : <TagIcon width={15} height={15} />}
          {m === "buy" ? t.buy : t.sellTab}
          <span className="rounded-full bg-black/25 px-[6px] font-body text-[10px] font-black leading-[16px]">
            {m === "buy" ? forSale.length : owned.length}
          </span>
        </button>
      ))}
    </div>
  );

  const renderAction = (car: Car, big: boolean) => {
    const isOwned = owned.includes(car.id);
    const base = cn(
      "flex shrink-0 items-center justify-center gap-[6px] whitespace-nowrap rounded-[14px] border-[3px] border-ink font-display tracking-wide transition-transform active:translate-y-[2px]",
      big ? "h-[52px] min-w-[190px] px-[18px] text-[19px]" : "h-[46px] min-w-[132px] px-[12px] text-[16px]",
    );
    if (mode === "sell") {
      if (!isOwned) return null;
      // pledged cars cannot be sold: say so here instead of failing after a tap
      if (lockedSet.has(car.id))
        return (
          <span
            data-locked-action=""
            title={t.lockedSellNote}
            className={cn(base, "cursor-not-allowed bg-navy-900 text-amber-300/80")}
          >
            <LockIcon width={16} height={16} />
            {t.lockedPill}
          </span>
        );
      if (owned.length <= 1) return <span className={cn(base, "bg-navy-900 text-white/35")}>{t.lastCar}</span>;
      return (
        <button
          type="button"
          onClick={() => onSell(car)}
          className={cn(base, "bg-gradient-to-b from-[#ff6b4a] to-[#c92a12] text-white t-stroke sw-3 shadow-[0_4px_0_#7a1a0c] hover:brightness-110")}
        >
          <TagIcon width={18} height={18} />
          {t.sellAction}
          <span dir="ltr">+{sellValueOf(car).toLocaleString("en-US")}</span>
        </button>
      );
    }
    // BUY: the list only holds cars that are not in the garage yet
    if (coins < car.price)
      return (
        <span className={cn(base, "bg-navy-900 font-body text-[12px] font-black text-white/40")}>
          {fmt(t.needMore, { n: (car.price - coins).toLocaleString("en-US") })}
        </span>
      );
    return (
      <button
        type="button"
        onClick={() => onBuy(car)}
        className={cn(base, "animate-glow bg-gradient-to-b from-[#ffe05a] to-[#ffa41c] text-ink shadow-[0_4px_0_#c9660e] hover:brightness-110")}
      >
        <CartIcon width={18} height={18} />
        {t.buy}
        <span dir="ltr" className="flex items-center gap-[3px]">
          <CoinIcon width={15} height={15} />
          {car.price.toLocaleString("en-US")}
        </span>
      </button>
    );
  };

  const renderCard = (car: Car) => {
    const isSel = selected?.id === car.id;
    const inCompare = compareIds.includes(car.id);
    const price = mode === "sell" ? sellValueOf(car) : car.price;
    // a car pledged for a loan stays visible in the garage list, but it is not for sale
    const isLocked = mode === "sell" && lockedSet.has(car.id);
    // sell mode is money coming in (green); buying is a spend, so the price is
    // shown neutral while affordable and red once the player cannot pay it
    const priceClass =
      mode === "sell"
        ? isLocked
          ? "text-amber-300/80"
          : "text-mint-400"
        : coins >= car.price
          ? "text-amber-400"
          : "text-flame-400";
    return (
      // every tile is exactly the same size: a fixed card + a one-line name plate
      <div key={car.id} className="flex min-w-0 flex-col">
        <button
          type="button"
          data-car-tile={car.id}
          data-selected={isSel || undefined}
          data-locked={isLocked ? "1" : undefined}
          onClick={() => select(car)}
          onDoubleClick={() => primary(car)}
          aria-label={carTitle(car)}
          aria-pressed={isSel}
          className={cn(
            // items-stretch overrides Chrome's UA `button { align-items: flex-start }` so the content centres
            "relative flex w-full flex-col items-stretch rounded-[14px] border-[3px] px-[9px] pb-[7px] pt-[6px] transition-all duration-150",
            desk ? "h-[148px]" : "h-[164px]",
            isSel
              ? "-translate-y-[2px] border-skyg-300 bg-[#2b4f93]/90 shadow-[0_0_0_3px_rgba(111,193,255,0.35),0_6px_0_#060a28]"
              : inCompare
                ? "border-skyg-400/80 bg-[#243a72]/85 shadow-[0_0_0_2px_rgba(111,193,255,0.25),0_4px_0_#060a28]"
                : isLocked
                  ? "border-[#8a5a12] bg-navy-800/60 shadow-[0_4px_0_#060a28]"
                  : "border-ink bg-navy-800/75 shadow-[0_4px_0_#060a28] hover:-translate-y-[1px] hover:bg-navy-700/85",
          )}
        >
          {/* SELL lists the garage: a collateral car outranks the "in use" label,
              and both sit inside the tile so they can never cover a neighbour */}
          {mode === "sell" && (isLocked || car.id === activeId) && (
            <span
              data-card-badge={isLocked ? "locked" : "equipped"}
              className={cn(
                "absolute left-1/2 top-[3px] z-10 flex -translate-x-1/2 items-center gap-[3px] whitespace-nowrap rounded-full border-[2px] border-ink px-[7px] font-body text-[9px] font-black leading-[15px]",
                isLocked ? "bg-amber-400 text-ink" : "bg-skyg-300 text-ink",
              )}
            >
              {isLocked && <LockIcon width={8} height={8} />}
              {isLocked ? t.lockedPill : t.equipped}
            </span>
          )}
          <div
            className={cn("flex shrink-0 items-start justify-between gap-[4px]", desk ? "h-[28px]" : "h-[31px]")}
            dir="ltr"
          >
            <BrandBadge brand={car.brand} size={desk ? 22 : 24} />
            <div className="text-end font-body text-[10px] font-black leading-[1.2] text-white/70">
              {car.bhp} BHP
              <br />
              {car.drive}
            </div>
          </div>
          <div className="relative my-[2px] flex min-h-0 w-full flex-1 items-center justify-center">
            <PaintedImg
              carId={car.id}
              shadow="drop-shadow(0 5px 4px rgba(0,0,0,0.5))"
              src={car.image}
              alt=""
              draggable={false}
              className="max-h-full max-w-[94%] object-contain"
            />
          </div>
          <div
            className={cn(
              "flex h-[18px] shrink-0 items-center justify-center gap-[4px] font-display text-[17px] italic leading-none",
              priceClass,
            )}
            dir="ltr"
          >
            {isLocked ? (
              <>
                <LockIcon width={13} height={13} />
                {t.lockedValue}
              </>
            ) : (
              <>
                <CoinIcon width={15} height={15} />
                {mode === "sell" ? `+${price.toLocaleString("en-US")}` : price === 0 ? t.free : price.toLocaleString("en-US")}
              </>
            )}
          </div>
          <div
            className="mt-[3px] flex h-[14px] shrink-0 items-center justify-center font-display text-[13px] leading-none tracking-wide text-white/85"
            dir="ltr"
          >
            PP {ppOf(car)}
          </div>
        </button>
        <div className="mt-[6px] flex h-[16px] items-center justify-center px-[2px]" dir="ltr">
          <span className="w-full truncate text-center font-body text-[12px] font-extrabold leading-none text-white/85">
            {carTitle(car)}
          </span>
        </div>
      </div>
    );
  };

  const allOwned = mode === "buy" && forSale.length === 0;
  const emptyState = (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-[10px] text-center">
      {allOwned ? (
        <CheckIcon width={40} height={40} className="text-mint-400/70" />
      ) : (
        <SearchIcon width={40} height={40} className="text-white/25" />
      )}
      <div className="font-display text-[18px] text-white/60">{allOwned ? t.garageComplete : t.noResults}</div>
      {!allOwned && (
        <button
          type="button"
          onClick={reset}
          className="rounded-full border-[2.5px] border-ink bg-gradient-to-b from-[#ffd23a] to-[#ff9a1f] px-[16px] py-[5px] font-display text-[14px] text-ink"
        >
          {t.resetFilters}
        </button>
      )}
    </div>
  );

  const grid = list.length ? (
    <div
      className={cn(
        "grid items-start gap-x-[14px] gap-y-[18px]",
        desk ? "grid-cols-[repeat(auto-fill,minmax(158px,1fr))]" : "grid-cols-2 gap-x-[12px] gap-y-[16px]",
      )}
    >
      {list.map(renderCard)}
    </div>
  ) : (
    emptyState
  );

  const detailsOf = (car: Car) => (
    <CarDetails
      t={t}
      lang={lang}
      car={car}
      stats={statsOf(car)}
      mode={mode}
      price={mode === "sell" ? sellValueOf(car) : car.price}
      equipped={car.id === activeId}
      locked={mode === "sell" && lockedSet.has(car.id)}
      desk={desk}
    />
  );

  const stat = (icon: ReactNode, label: string, value: number, color: string) => (
    <div className="flex items-center gap-[6px]">
      <span className={color}>{icon}</span>
      <div>
        <div className="font-body text-[9px] font-black tracking-wider text-white/45">{label}</div>
        <div className="font-display text-[16px] leading-none text-white">{value}</div>
      </div>
    </div>
  );

  const actionBar = selected && (
    <div
      className={cn(
        "relative flex shrink-0 items-center border-t-[3px] border-[#4d86e8]/60 bg-[#0b1238]/90",
        desk ? "gap-[16px] px-[28px] py-[9px]" : "gap-[10px] px-[14px] py-[8px]",
      )}
    >
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-[12px] border-[2px] border-ink bg-[radial-gradient(ellipse_at_center,#2f5fc4,#14204f_75%)]",
          desk ? "h-[56px] w-[96px]" : "h-[48px] w-[74px]",
        )}
      >
        <PaintedImg carId={selected.id} src={selected.image} alt="" className="max-h-[88%] max-w-[90%] object-contain" />
        {/* on mobile the same panel is a sheet, opened from here */}
        {!desk && (
          <button
            type="button"
            id="dealer-details-btn"
            onClick={() => {
              click();
              setDetailsOpen(true);
            }}
            aria-label={t.details}
            title={t.details}
            className="absolute -bottom-[6px] -right-[6px] flex h-[22px] w-[22px] items-center justify-center rounded-full border-[2px] border-ink bg-skyg-400 text-ink shadow-[0_2px_0_#0a1038] transition-transform active:translate-y-[1px]"
          >
            <InfoIcon width={13} height={13} />
          </button>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-[6px]" dir="ltr">
          <BrandBadge brand={selected.brand} size={16} />
          <span className={cn("truncate font-display leading-none text-white t-stroke sw-2", desk ? "text-[20px]" : "text-[16px]")}>
            {BRANDS[selected.brand].name} {carTitle(selected)}
          </span>
        </div>
        <div className="mt-[3px] truncate font-body text-[11px] font-black tracking-wider text-white/50" dir="ltr">
          {selected.cls} · {selected.rarity} · {selected.drive} · {selected.bhp} BHP · PP {ppOf(selected)}
        </div>
      </div>
      {desk && (
        <div className="flex items-center gap-[14px]">
          {stat(<GaugeIcon width={20} height={20} />, t.topSpeed, selected.topSpeed, "text-mint-400")}
          {stat(<BumperIcon width={20} height={20} />, t.armor, selected.armor, "text-skyg-300")}
          {stat(<TireIcon width={20} height={20} />, t.accel, selected.accel, "text-lime-400")}
          {stat(<NitroIcon width={20} height={20} />, t.boost, selected.boost, "text-[#c98cff]")}
        </div>
      )}
      <CompareButton
        t={t}
        active={compareIds.includes(selected.id)}
        count={compareIds.length}
        onClick={() => openCompare(selected)}
        className={desk ? undefined : "h-[44px] min-w-[46px] justify-center px-[8px] text-[13px]"}
        labelClassName={desk ? undefined : "hidden sm:inline"}
      />
      {renderAction(selected, desk)}
    </div>
  );

  const tickerText = selected
    ? [
        selected.desc[lang],
        `${BRANDS[selected.brand].name} ${carTitle(selected)}`,
        BRANDS[selected.brand].country[lang],
        `${t.drivetrainShort}: ${selected.drive}`,
        `${selected.bhp} BHP`,
        `PP ${ppOf(selected)}`,
        selected.rarity,
      ].join("   ■   ")
    : t.noResults;

  const ticker = (
    <div className="relative h-[28px] shrink-0 overflow-hidden bg-black/45" dir="ltr">
      <div
        key={selected?.id ?? "none"}
        className="dealer-marquee absolute inset-y-0 left-0 flex w-max items-center whitespace-nowrap font-body text-[13px] font-bold text-white/80"
      >
        <span className="px-[30px]">{tickerText}</span>
        <span className="px-[30px]" aria-hidden="true">
          {tickerText}
        </span>
      </div>
    </div>
  );

  /* ---------------- layout ---------------- */
  return (
    <div className="absolute inset-0 z-40 flex animate-fade-in flex-col overflow-hidden" role="dialog" aria-label={t.dealership}>
      {/* backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,#1f3f86_0%,#0f1b4d_50%,#060a24_100%)]" />
      <div className="hex-pattern absolute inset-0 opacity-20" />
      {BOKEH.map(([x, y, s, o], i) => (
        <span
          key={i}
          className="pointer-events-none absolute rounded-full bg-[#3d8ff5] blur-[2px]"
          style={{ left: `${x}%`, top: `${y}%`, width: s, height: s, opacity: o }}
        />
      ))}

      <div className="relative flex min-h-0 flex-1 flex-col">
        {desk ? (
          <>
            {/* header: breadcrumb · active car · coins · menu */}
            <header className="flex h-[58px] shrink-0 items-center justify-between gap-[16px] px-[28px]">
              <nav className="flex min-w-0 items-center gap-[10px] font-body text-[15px] font-extrabold text-white/90">
                <StoreIcon width={22} height={22} className="shrink-0 text-amber-400" />
                {crumbs.map((c, i) => (
                  <span key={i} className="flex items-center gap-[10px] whitespace-nowrap">
                    {i > 0 && <span className="h-[16px] w-[2px] bg-white/30" />}
                    <span className={i === crumbs.length - 1 ? "text-white" : "text-white/70"}>{c}</span>
                  </span>
                ))}
              </nav>
              <div className="flex items-center gap-[16px]">
                {activeCar && (
                  <span className="flex items-center gap-[7px] whitespace-nowrap font-body text-[14px] font-extrabold text-white/85" dir="ltr">
                    <KeyIcon width={17} height={17} className="text-white/70" />
                    {BRANDS[activeCar.brand].name} {carTitle(activeCar)}
                  </span>
                )}
                {coinBadge}
                {closeBtn}
              </div>
            </header>

            {/* sidebar + grid */}
            <div className="flex min-h-0 flex-1 gap-[18px] px-[28px] pb-[8px]">
              <aside className="thin-scroll w-[262px] shrink-0 overflow-y-auto rounded-[20px] border-[3px] border-ink bg-navy-950/60 p-[12px] pe-[8px] shadow-[0_6px_0_#060a28]">
                <FilterPanel {...filterProps}>
                  {searchBox}
                  {modeSwitch}
                </FilterPanel>
              </aside>
              <section className="flex min-w-0 flex-1 flex-col">
                <div className="flex shrink-0 items-center justify-between">
                  <div className="flex items-center gap-[8px] font-body text-[15px] font-extrabold text-white/90">
                    <SortIcon width={18} height={18} className="text-white/70" />
                    {sortLabel}
                  </div>
                  <div className="font-body text-[12px] font-black tracking-wider text-white/50">
                    {fmt(t.resultsCount, { n: list.length })}
                  </div>
                </div>
                <div className="flex min-h-0 flex-1 gap-[14px] pt-[14px]">
                  <div ref={gridRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-[10px] pe-[4px]">
                    {grid}
                  </div>
                  <aside
                    id="dealer-details-panel"
                    className="thin-scroll w-[216px] shrink-0 overflow-y-auto rounded-[18px] border-[3px] border-ink bg-navy-950/60 p-[9px] pb-[11px] shadow-[0_5px_0_#060a28]"
                  >
                    {selected ? detailsOf(selected) : null}
                  </aside>
                </div>
              </section>
            </div>
          </>
        ) : (
          <>
            {/* mobile header */}
            <header className="flex shrink-0 items-center justify-between gap-[8px] px-[14px] pb-[8px] pt-[12px]">
              {closeBtn}
              <div className="min-w-0 flex-1 text-center">
                <div className="flex items-center justify-center gap-[6px] font-display text-[21px] leading-none text-white t-stroke sw-3">
                  <StoreIcon width={20} height={20} className="text-amber-400" />
                  {t.dealership}
                </div>
                <div className="mt-[3px] truncate font-body text-[10px] font-black tracking-wider text-white/50">
                  {crumbs.slice(1).join(" | ")}
                </div>
              </div>
              {coinBadge}
            </header>

            {/* search + filter drawer button */}
            <div className="flex shrink-0 items-center gap-[8px] px-[14px]">
              {searchBox}
              <button
                type="button"
                onClick={() => {
                  click();
                  setDrawer(true);
                }}
                aria-label={t.filters}
                className="relative flex h-[40px] shrink-0 items-center gap-[6px] rounded-full border-[3px] border-ink bg-gradient-to-b from-navy-600 to-navy-800 px-[12px] font-display text-[14px] text-white shadow-[0_3px_0_#0a1038]"
              >
                <FilterIcon width={16} height={16} />
                {t.filters}
                {activeFilters > 0 && (
                  <span className="absolute -right-[6px] -top-[6px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-[2px] border-ink bg-[#ff4f1f] px-[3px] font-body text-[10px] font-black text-white">
                    {activeFilters}
                  </span>
                )}
              </button>
            </div>

            {/* buy / sell + count */}
            <div className="mt-[8px] flex shrink-0 items-center gap-[10px] px-[14px]">
              <div className="flex-1">{modeSwitch}</div>
              <div className="shrink-0 font-body text-[11px] font-black tracking-wider text-white/50">
                {fmt(t.resultsCount, { n: list.length })}
              </div>
            </div>

            {/* quick sort chips */}
            <div className="no-scrollbar mt-[8px] flex shrink-0 items-center gap-[6px] overflow-x-auto px-[14px] pb-[2px]">
              <SortIcon width={16} height={16} className="shrink-0 text-white/60" />
              {SORTS.map((s) => (
                <Chip key={s.key} active={sort === s.key} onClick={() => filterProps.setSort(s.key)}>
                  {s.short[lang]}
                </Chip>
              ))}
            </div>

            <div ref={gridRef} className="no-scrollbar mt-[4px] min-h-0 flex-1 overflow-y-auto px-[14px] pb-[10px] pt-[14px]">
              {grid}
            </div>
          </>
        )}

        {actionBar}
        {ticker}
      </div>

      {/* mobile: details of the selected car */}
      {!desk && detailsOpen && selected && (
        <Modal title={t.details} onClose={() => setDetailsOpen(false)} width={330}>
          <div className="thin-scroll max-h-[58vh] overflow-y-auto pe-[2px]">{detailsOf(selected)}</div>
        </Modal>
      )}

      {/* comparison tray */}
      {compareIds.length > 0 && !compareOpen && (
        <div
          className={cn(
            "absolute inset-x-0 z-30 flex justify-center px-[10px]",
            desk ? "bottom-[104px]" : "bottom-[96px]",
          )}
        >
          <div className="flex max-w-full items-center gap-[8px] rounded-[16px] border-[3px] border-ink bg-navy-950/92 px-[9px] py-[7px] shadow-[0_6px_0_#060a28,0_0_22px_rgba(111,193,255,0.25)] backdrop-blur-[2px]">
            <span className="hidden shrink-0 items-center gap-[5px] font-body text-[10px] font-black tracking-wider text-white/45 sm:flex">
              <CompareIcon width={13} height={13} className="text-skyg-300" />
              {t.compareTray}
            </span>

            {[0, 1].map((i) => {
              const entry = compareEntries[i];
              return (
                <div
                  key={i}
                  className={cn(
                    "flex h-[38px] items-center gap-[5px] rounded-[10px] border-[2.5px] border-ink px-[6px]",
                    entry ? "bg-navy-800" : "border-dashed bg-navy-950/60",
                  )}
                >
                  {entry ? (
                    <>
                      <PaintedImg carId={entry.car.id} src={entry.car.image} alt="" className="h-[26px] w-[40px] object-contain" />
                      <span className="hidden max-w-[92px] truncate font-display text-[12px] leading-none text-white/85 sm:inline" dir="ltr">
                        {carTitle(entry.car)}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleCompare(entry.car)}
                        aria-label={t.compareRemove}
                        className="flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white"
                      >
                        <CloseIcon width={9} height={9} />
                      </button>
                    </>
                  ) : (
                    <span className="px-[6px] font-body text-[10px] font-black text-white/30">+ {t.comparePick}</span>
                  )}
                </div>
              );
            })}

            {activeCar && !compareIds.includes(activeCar.id) && compareIds.length < 2 && (
              <button
                type="button"
                onClick={() => toggleCompare(activeCar)}
                className="hidden h-[38px] shrink-0 items-center gap-[4px] rounded-[10px] border-[2.5px] border-ink bg-[#22346e] px-[8px] font-body text-[10px] font-black text-mint-400 transition-transform active:translate-y-[2px] sm:flex"
              >
                <KeyIcon width={12} height={12} />
                {t.myCar}
              </button>
            )}

            <button
              type="button"
              disabled={compareIds.length < 2}
              onClick={() => {
                click();
                setCompareOpen(true);
              }}
              className={cn(
                "flex h-[38px] shrink-0 items-center gap-[5px] rounded-[10px] border-[2.5px] border-ink px-[10px] font-display text-[14px] tracking-wide transition-transform active:translate-y-[2px]",
                compareIds.length === 2
                  ? "animate-glow bg-gradient-to-b from-[#ffe05a] to-[#ffa41c] text-ink shadow-[0_3px_0_#c9660e]"
                  : "bg-navy-900 text-white/30",
              )}
            >
              <CompareIcon width={15} height={15} />
              {t.compareOpen}
            </button>

            <button
              type="button"
              onClick={() => {
                click();
                setCompareIds([]);
              }}
              aria-label={t.compareClear}
              className="flex h-[38px] w-[30px] shrink-0 items-center justify-center rounded-[10px] border-[2.5px] border-ink bg-navy-800 text-white/55 transition-transform active:translate-y-[2px]"
            >
              <CloseIcon width={13} height={13} />
            </button>
          </div>
        </div>
      )}

      {/* comparison board */}
      {compareOpen && compareEntries.length === 2 && (
        <CompareModal
          t={t}
          desk={desk}
          a={compareEntries[0]}
          b={compareEntries[1]}
          onClose={() => {
            click();
            setCompareOpen(false);
          }}
          onClear={() => {
            click();
            setCompareOpen(false);
            setCompareIds([]);
          }}
          onSwap={() => {
            onSfx?.("swoosh");
            setCompareIds(([x, y]) => [y, x]);
          }}
        />
      )}

      {/* mobile filter sidebar (drawer) */}
      {!desk && (
        <>
          <div
            className={cn(
              "absolute inset-0 z-30 bg-navy-950/70 transition-opacity duration-300",
              drawer ? "opacity-100" : "pointer-events-none opacity-0",
            )}
            onClick={() => setDrawer(false)}
          />
          <aside
            aria-hidden={!drawer}
            className={cn(
              "no-scrollbar absolute inset-y-0 left-0 z-40 w-[310px] overflow-y-auto border-r-[4px] border-ink bg-gradient-to-b from-navy-800 to-navy-950 px-[14px] pb-[18px] pt-[14px] shadow-[8px_0_30px_rgba(0,0,0,0.5)] transition-transform duration-300",
              drawer ? "translate-x-0" : "pointer-events-none -translate-x-full",
            )}
          >
            <div className="mb-[12px] flex items-center justify-between">
              <span className="flex items-center gap-[8px] font-display text-[20px] text-white t-stroke sw-3">
                <FilterIcon width={18} height={18} className="text-amber-400" />
                {t.filters}
              </span>
              <button
                type="button"
                onClick={() => setDrawer(false)}
                aria-label="Close filters"
                className="flex h-[32px] w-[32px] items-center justify-center rounded-full border-[3px] border-ink bg-gradient-to-b from-[#ff6b4a] to-[#e8381c] text-white"
              >
                <CloseIcon width={14} height={14} />
              </button>
            </div>
            <FilterPanel {...filterProps} />
          </aside>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* sell confirmation                                                   */
/* ------------------------------------------------------------------ */


/* ------------------------------------------------------------------ */
/* side rail next to the main menu                                     */
/* ------------------------------------------------------------------ */
