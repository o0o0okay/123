import { useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { carTitle, type Car } from "@/data/cars";
import { fmt, type Lang, type Strings } from "@/i18n";
import type { SfxName } from "@/hooks";
import {
  NFT_CLASSES,
  NFT_COLLECTION,
  NFT_RARITIES,
  NFT_RARITY_COLOR,
  countdownTo,
  nftCar,
  nftClassOf,
  nftSellValue,
  type NftItem,
  type NftRarity,
} from "@/data/nft";
import { CoinIcon, CloseIcon, FilterIcon, SearchIcon, TimerIcon } from "@/icons";
import { PaintedImg } from "./PaintContext";
import { Modal } from "./ui";

export interface NftMarketProps {
  t: Strings;
  lang: Lang;
  layout: "desktop" | "mobile";
  coins: number;
  /** token ids the player owns */
  owned: string[];
  /** token ids locked in the vault */
  staked: string[];
  onBuy: (id: string) => boolean;
  onSell: (id: string) => boolean;
  onClose: () => void;
  onSfx?: (n: SfxName) => void;
  /** jumps to the NFT vault inside staking */
  onOpenVault: () => void;
}

type Mode = "market" | "mine";
type SortKey = "asc" | "desc" | "rare" | "new";
type View = "grid" | "list";

const PAGE = 12;

const SORTS: { key: SortKey; label: keyof Strings }[] = [
  { key: "asc", label: "nftSortAsc" },
  { key: "desc", label: "nftSortDesc" },
  { key: "rare", label: "nftSortRare" },
  { key: "new", label: "nftSortNew" },
];

/* ------------------------------------------------------------------ */
/* small parts                                                         */
/* ------------------------------------------------------------------ */

function GridIcon({ width = 14, height = 14 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="1" y="1" width="6" height="6" rx="1.4" />
      <rect x="9" y="1" width="6" height="6" rx="1.4" />
      <rect x="1" y="9" width="6" height="6" rx="1.4" />
      <rect x="9" y="9" width="6" height="6" rx="1.4" />
    </svg>
  );
}

function ListIcon({ width = 14, height = 14 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="1" y="1.5" width="3" height="3" rx="1" />
      <rect x="6" y="2" width="9" height="2" rx="1" />
      <rect x="1" y="6.5" width="3" height="3" rx="1" />
      <rect x="6" y="7" width="9" height="2" rx="1" />
      <rect x="1" y="11.5" width="3" height="3" rx="1" />
      <rect x="6" y="12" width="9" height="2" rx="1" />
    </svg>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <div className="mb-[6px] font-body text-[9px] font-black uppercase tracking-[0.14em] text-white/35">{children}</div>;
}

function Check({
  on,
  label,
  count,
  onClick,
  data,
}: {
  on: boolean;
  label: string;
  count?: number;
  onClick: () => void;
  data?: Record<string, string>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      {...data}
      className="flex w-full items-center gap-[7px] rounded-[7px] px-[3px] py-[3px] text-start transition-colors hover:bg-white/5"
    >
      <span
        className={cn(
          "flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[4px] border-[1.5px] transition-colors",
          on ? "border-[#8b5cff] bg-[#8b5cff] text-white" : "border-white/25 text-transparent",
        )}
      >
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
          <path d="M2 6.4 4.6 9 10 3.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="min-w-0 flex-1 truncate font-body text-[11px] font-bold text-white/70">{label}</span>
      {count !== undefined && <span className="font-body text-[10px] font-black text-white/30">{count}</span>}
    </button>
  );
}

/** gradient art tile with the car, rarity, countdown and the network tag */
function ArtTile({
  item,
  owned,
  staked,
  now,
  t,
  className,
  pad = "7%",
}: {
  item: NftItem;
  owned?: boolean;
  staked?: boolean;
  now: number;
  t: Strings;
  className?: string;
  /** padding around the car inside the tile */
  pad?: string;
}) {
  const car: Car | undefined = nftCar(item);
  const left = countdownTo(item.endsAt, now);
  return (
    <div
      className={cn("relative overflow-hidden rounded-[9px]", className)}
      style={{ backgroundImage: `linear-gradient(150deg, ${item.palette[0]}, ${item.palette[1]})` }}
      data-art={item.id}
    >
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_72%_18%,rgba(255,255,255,0.5),transparent_58%)] opacity-40" />
      {car && (
        <PaintedImg
          carId={item.carId}
          src={car.image}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_10px_12px_rgba(0,0,0,0.45)]"
          style={{ padding: pad }}
        />
      )}
      <span
        className="absolute start-[6px] top-[6px] rounded-[4px] bg-[#06060c]/60 px-[5px] py-[1px] font-body text-[8px] font-black tracking-wider"
        style={{ color: NFT_RARITY_COLOR[item.rarity] }}
      >
        {item.rarity}
      </span>
      {owned && (
        <span
          className={cn(
            "absolute end-[6px] top-[6px] rounded-[4px] px-[5px] py-[1px] font-body text-[8px] font-black tracking-wider",
            staked ? "bg-[#2a1d52]/85 text-[#c9a8ff]" : "bg-[#04120c]/80 text-[#2fe98a]",
          )}
        >
          {staked ? t.nftStaked : t.nftOwned}
        </span>
      )}
      <div className="absolute inset-x-[6px] bottom-[6px] flex items-center justify-between gap-[4px]">
        <span className="flex items-center gap-[3px] rounded-full bg-black/55 px-[6px] py-[2px] font-body text-[9px] font-bold tabular-nums text-white/85" dir="ltr">
          <TimerIcon width={9} height={9} />
          {left ?? t.nftEnded}
        </span>
        <span className="rounded-[4px] bg-black/55 px-[5px] py-[2px] font-body text-[8px] font-black tracking-wider text-[#f0b90b]">
          SOL
        </span>
      </div>
    </div>
  );
}

function NftCard({
  item,
  t,
  now,
  owned,
  staked,
  onOpen,
}: {
  item: NftItem;
  t: Strings;
  now: number;
  owned: boolean;
  staked: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      data-nft-card={item.id}
      data-owned={owned ? "1" : undefined}
      data-staked={staked ? "1" : undefined}
      onClick={onOpen}
      className="group flex w-full flex-col rounded-[13px] border border-white/10 bg-[#0d0d16] p-[6px] text-start transition-all hover:-translate-y-[2px] hover:border-white/25 hover:bg-[#12121d]"
    >
      <div className="flex items-center gap-[6px] px-[3px] pb-[6px]">
        <span
          className="flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full font-display text-[9px] text-[#0b0b12]"
          style={{ background: item.creator.color }}
        >
          {item.creator.initial}
        </span>
        <span className="min-w-0 flex-1 truncate font-body text-[10px] font-bold text-white/60">{item.creator.name}</span>
        <span className="flex shrink-0 items-center gap-[3px] rounded-full bg-white/5 px-[5px] font-body text-[9px] font-black text-white/50">
          <CoinIcon width={8} height={8} />
          {item.supply}
        </span>
      </div>

      <ArtTile item={item} owned={owned} staked={staked} now={now} t={t} className="aspect-square" />

      <div className="mt-[6px] flex items-center justify-between gap-[4px] px-[2px]">
        <span className="truncate font-display text-[12px] leading-none text-white/85" dir="ltr">
          {item.name}
        </span>
      </div>
      <div className="mt-[4px] flex items-center justify-between gap-[4px] px-[2px] pb-[2px]">
        <span className="truncate font-body text-[7px] font-black uppercase tracking-[0.1em] text-white/35">{t.nftCurrentBid}</span>
        <span className="flex shrink-0 items-center gap-[3px] font-display text-[13px] leading-none text-white" dir="ltr">
          <CoinIcon width={10} height={10} />
          {item.price.toLocaleString("en-US")}
        </span>
      </div>
    </button>
  );
}

function NftRow({
  item,
  t,
  now,
  owned,
  staked,
  onOpen,
}: {
  item: NftItem;
  t: Strings;
  now: number;
  owned: boolean;
  staked: boolean;
  onOpen: () => void;
}) {
  const car = nftCar(item);
  return (
    <button
      type="button"
      data-nft-card={item.id}
      data-owned={owned ? "1" : undefined}
      data-staked={staked ? "1" : undefined}
      onClick={onOpen}
      className="flex w-full items-center gap-[10px] rounded-[13px] border border-white/10 bg-[#0d0d16] p-[6px] pe-[12px] text-start transition-colors hover:border-white/25 hover:bg-[#12121d]"
    >
      <ArtTile item={item} owned={owned} staked={staked} now={now} t={t} className="h-[54px] w-[54px] shrink-0" pad="3%" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-[13px] leading-none text-white" dir="ltr">
          {item.name}
        </div>
        <div className="mt-[3px] truncate font-body text-[9px] font-black tracking-wide text-white/35" dir="ltr">
          {item.creator.name} · {car ? carTitle(car) : ""} · #{item.edition}/{item.supply}
        </div>
      </div>
      <span className="shrink-0 rounded-full px-[7px] py-[1px] font-body text-[8px] font-black tracking-wider" style={{ color: NFT_RARITY_COLOR[item.rarity], background: "rgba(255,255,255,0.06)" }}>
        {item.rarity}
      </span>
      <span className="flex w-[86px] shrink-0 items-center justify-end gap-[3px] font-display text-[14px] leading-none text-white" dir="ltr">
        <CoinIcon width={11} height={11} />
        {item.price.toLocaleString("en-US")}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* panel                                                               */
/* ------------------------------------------------------------------ */

export function NftMarket({
  t,
  lang,
  layout,
  coins,
  owned,
  staked,
  onBuy,
  onSell,
  onClose,
  onSfx,
  onOpenVault,
}: NftMarketProps) {
  const desk = layout === "desktop";
  const priceCap = useMemo(() => Math.ceil(Math.max(...NFT_COLLECTION.map((n) => n.price)) / 1000) * 1000, []);

  const [mode, setMode] = useState<Mode>("market");
  const [tab, setTab] = useState<string>("ALL");
  const [query, setQuery] = useState("");
  const [rarities, setRarities] = useState<NftRarity[]>([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(priceCap);
  const [sort, setSort] = useState<SortKey>("asc");
  const [view, setView] = useState<View>("grid");
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<NftItem | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const click = () => onSfx?.("click");
  const ownedSet = useMemo(() => new Set(owned), [owned]);
  const stakedSet = useMemo(() => new Set(staked), [staked]);

  // countdowns tick once a second
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Escape closes the details card first, then the filter drawer
  useEffect(() => {
    if (!selected && !drawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      if (selected) setSelected(null);
      else setDrawer(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [selected, drawer]);

  /** everything the current mode + filters allow */
  const list = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/[\s'’\-]/g, "");
    const out = NFT_COLLECTION.filter((n) => {
      const isOwned = ownedSet.has(n.id);
      if (mode === "mine" && !isOwned) return false;
      if (mode === "market" && isOwned) return false;
      if (tab !== "ALL" && nftClassOf(n) !== tab) return false;
      if (rarities.length && !rarities.includes(n.rarity)) return false;
      if (n.price < minPrice || n.price > maxPrice) return false;
      if (q) {
        const car = nftCar(n);
        const hay = [n.name, n.creator.name, n.rarity, nftClassOf(n), car ? carTitle(car) : ""]
          .join(" ")
          .toLowerCase()
          .replace(/[\s'’\-]/g, "");
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const rank = (r: NftRarity) => NFT_RARITIES.indexOf(r);
    const cmp: Record<SortKey, (a: NftItem, b: NftItem) => number> = {
      asc: (a, b) => a.price - b.price,
      desc: (a, b) => b.price - a.price,
      rare: (a, b) => rank(b.rarity) - rank(a.rarity) || a.price - b.price,
      new: (a, b) => a.endsAt - b.endsAt,
    };
    return out.sort(cmp[sort]);
  }, [mode, tab, rarities, minPrice, maxPrice, query, sort, ownedSet]);

  // a new filter starts the list from the top again
  useEffect(() => {
    setLimit(PAGE);
  }, [mode, tab, rarities, minPrice, maxPrice, query, sort]);

  const visible = list.slice(0, limit);

  const rarityCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const n of NFT_COLLECTION) {
      if (mode === "mine" ? !ownedSet.has(n.id) : ownedSet.has(n.id)) continue;
      m[n.rarity] = (m[n.rarity] ?? 0) + 1;
    }
    return m;
  }, [mode, ownedSet]);

  const classCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const n of NFT_COLLECTION) {
      if (mode === "mine" ? !ownedSet.has(n.id) : ownedSet.has(n.id)) continue;
      const c = nftClassOf(n);
      m[c] = (m[c] ?? 0) + 1;
    }
    return m;
  }, [mode, ownedSet]);

  const activeFilters = (tab !== "ALL" ? 1 : 0) + rarities.length + (minPrice > 0 || maxPrice < priceCap ? 1 : 0);

  const reset = () => {
    click();
    setTab("ALL");
    setRarities([]);
    setMinPrice(0);
    setMaxPrice(priceCap);
    setQuery("");
    setSort("asc");
  };

  const toggleRarity = (r: NftRarity) => {
    onSfx?.("toggle");
    setRarities((v) => (v.includes(r) ? v.filter((x) => x !== r) : [...v, r]));
  };

  const openDetails = (n: NftItem) => {
    onSfx?.("swoosh");
    setError(null);
    setSelected(n);
  };

  const buy = (n: NftItem) => {
    if (onBuy(n.id)) {
      setError(null);
      setSelected(null);
    }
  };

  const sell = (n: NftItem) => {
    if (stakedSet.has(n.id)) {
      setError(t.nftLocked);
      onSfx?.("error");
      return;
    }
    if (onSell(n.id)) {
      setError(null);
      setSelected(null);
    }
  };

  /* ---------------- pieces ---------------- */

  const coinBadge = (
    <span
      data-nft-coins={coins}
      className="flex shrink-0 items-center gap-[5px] rounded-full border-[2px] border-[#2a2a3c] bg-[#14141f] px-[11px] py-[4px] font-display text-[14px] leading-none text-[#ffd23a]"
      dir="ltr"
    >
      <CoinIcon width={14} height={14} />
      {coins.toLocaleString("en-US")}
    </span>
  );

  const closeBtn = (
    <button
      type="button"
      data-nft-close=""
      onClick={onClose}
      aria-label={t.close}
      className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border-[2px] border-[#2a2a3c] text-white/60 transition-colors hover:border-[#ff6b6b] hover:text-white"
    >
      <CloseIcon width={14} height={14} />
    </button>
  );

  const modeSwitch = (
    <div className="flex shrink-0 items-center gap-[2px] rounded-full border-[2px] border-[#2a2a3c] bg-[#12121c] p-[3px]">
      {([
        ["market", t.nftMarket],
        ["mine", t.nftMine],
      ] as [Mode, string][]).map(([key, label]) => (
        <button
          key={key}
          type="button"
          data-nft-mode={key}
          aria-pressed={mode === key}
          onClick={() => {
            click();
            setMode(key);
            setSelected(null);
          }}
          className={cn(
            "rounded-full px-[12px] py-[4px] font-body text-[10px] font-black uppercase tracking-[0.08em] transition-colors",
            mode === key ? "bg-white text-[#0a0d10]" : "text-white/50 hover:text-white",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );

  const tabs = ["ALL", ...NFT_CLASSES];

  const tabBar = (
    <div className="no-scrollbar flex min-w-0 items-center gap-[16px] overflow-x-auto">
      {tabs.map((key) => (
        <button
          key={key}
          type="button"
          data-nft-tab={key}
          aria-pressed={tab === key}
          onClick={() => {
            click();
            setTab(key);
          }}
          className={cn(
            "relative shrink-0 pb-[6px] font-body text-[11px] font-black uppercase tracking-[0.08em] transition-colors",
            tab === key ? "text-white" : "text-white/40 hover:text-white/80",
          )}
        >
          {key === "ALL" ? t.nftAll : key}
          {tab === key && <span className="absolute inset-x-0 -bottom-[1px] h-[2px] rounded bg-[#8b5cff]" />}
        </button>
      ))}
    </div>
  );

  const searchBox = (
    <label className="flex h-[38px] min-w-0 flex-1 items-center gap-[7px] rounded-full border-[2px] border-[#2a2a3c] bg-[#12121c] px-[12px] focus-within:border-[#8b5cff]/70">
      <SearchIcon width={14} height={14} className="shrink-0 text-white/35" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.nftSearch}
        className="min-w-0 flex-1 bg-transparent font-body text-[11px] font-bold text-white outline-none placeholder:text-white/30"
      />
      {query && (
        <button type="button" onClick={() => setQuery("")} aria-label={t.resetFilters} className="text-white/35 hover:text-white">
          <CloseIcon width={11} height={11} />
        </button>
      )}
    </label>
  );

  const filters = (
    <div className="space-y-[13px]">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-[5px] font-display text-[12px] tracking-wide text-white/80">
          <FilterIcon width={13} height={13} className="text-[#8b5cff]" />
          {t.nftFilter}
        </span>
        <button type="button" onClick={reset} className="font-body text-[9px] font-black uppercase tracking-wider text-[#b48dff] hover:text-white">
          {t.nftReset}
        </button>
      </div>

      <div>
        <SectionTitle>{t.nftCategories}</SectionTitle>
        <div className="space-y-[1px]">
          {NFT_RARITIES.map((r) => (
            <Check
              key={r}
              on={rarities.includes(r)}
              label={r}
              count={rarityCounts[r] ?? 0}
              onClick={() => toggleRarity(r)}
              data={{ "data-nft-rarity": r }}
            />
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>{t.nftItemTypes}</SectionTitle>
        <div className="space-y-[1px]">
          {NFT_CLASSES.map((c) => (
            <Check
              key={c}
              on={tab === c}
              label={c}
              count={classCounts[c] ?? 0}
              onClick={() => {
                onSfx?.("toggle");
                setTab((v) => (v === c ? "ALL" : c));
              }}
              data={{ "data-nft-class": c }}
            />
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>{t.nftCurrency}</SectionTitle>
        <Check on label={t.nftCoin} count={undefined} onClick={() => onSfx?.("toggle")} />
      </div>

      <div>
        <SectionTitle>{t.nftPriceRange}</SectionTitle>
        <div className="flex items-center gap-[5px]">
          {([
            ["min", minPrice, (n: number) => setMinPrice(Math.max(0, Math.min(maxPrice, Math.round(n || 0))))],
            ["max", maxPrice, (n: number) => setMaxPrice(Math.max(0, Math.min(priceCap, Math.round(n || 0))))],
          ] as [string, number, (n: number) => void][]).map(([key, value, set]) => (
            <label key={key} className="flex min-w-0 flex-1 items-center gap-[3px] rounded-[8px] border-[1.5px] border-[#2a2a3c] bg-[#101018] px-[6px] py-[4px] focus-within:border-[#8b5cff]/70">
              <span className="shrink-0 font-body text-[7px] font-black uppercase text-white/30">{key === "min" ? t.nftMin : t.nftMax}</span>
              <input
                type="text"
                inputMode="numeric"
                value={value}
                data-nft-price={key}
                onChange={(e) => set(Number(e.target.value.replace(/[^\d]/g, "")) || 0)}
                className="min-w-0 flex-1 bg-transparent font-body text-[10px] font-black text-white outline-none"
                dir="ltr"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const viewToggle = (
    <div className="flex shrink-0 items-center gap-[2px] rounded-[8px] border border-white/12 bg-[#12121c] p-[2px]">
      {([
        ["grid", <GridIcon key="g" />],
        ["list", <ListIcon key="l" />],
      ] as [View, ReactNode][]).map(([key, icon]) => (
        <button
          key={key}
          type="button"
          data-nft-view={key}
          aria-pressed={view === key}
          aria-label={key === "grid" ? t.nftGrid : t.nftList}
          onClick={() => {
            click();
            setView(key);
          }}
          className={cn(
            "flex h-[24px] w-[26px] items-center justify-center rounded-[6px] transition-colors",
            view === key ? "bg-white/12 text-white" : "text-white/35 hover:text-white/70",
          )}
        >
          {icon}
        </button>
      ))}
    </div>
  );

  const sortSelect = (
    <div className="relative flex shrink-0 items-center">
      <SortGlyph />
      <select
        data-nft-sort=""
        value={sort}
        onChange={(e) => {
          click();
          setSort(e.target.value as SortKey);
        }}
        aria-label={t.nftSort}
        className="appearance-none rounded-[8px] border border-white/12 bg-[#12121c] py-[5px] pe-[22px] ps-[22px] font-body text-[10px] font-black text-white/80 outline-none"
      >
        {SORTS.map((s) => (
          <option key={s.key} value={s.key} className="bg-[#12121c]">
            {t[s.label] as string}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute end-[6px] text-[7px] text-white/40">▼</span>
    </div>
  );

  const grid = view === "grid" ? (
    <div className={cn("grid items-start gap-[10px]", desk ? "grid-cols-[repeat(auto-fill,minmax(168px,1fr))]" : "grid-cols-2")}>
      {visible.map((n) => (
        <NftCard
          key={n.id}
          item={n}
          t={t}
          now={now}
          owned={ownedSet.has(n.id)}
          staked={stakedSet.has(n.id)}
          onOpen={() => openDetails(n)}
        />
      ))}
    </div>
  ) : (
    <div className="space-y-[6px]">
      {visible.map((n) => (
        <NftRow
          key={n.id}
          item={n}
          t={t}
          now={now}
          owned={ownedSet.has(n.id)}
          staked={stakedSet.has(n.id)}
          onOpen={() => openDetails(n)}
        />
      ))}
    </div>
  );

  const empty = (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-[8px] text-center">
      <span className="text-[34px] opacity-40">🖼️</span>
      <div className="font-display text-[16px] text-white/60">{mode === "mine" ? t.nftEmptyMine : t.nftEmpty}</div>
      <div className="font-body text-[10px] font-black text-white/30">{mode === "mine" ? t.nftEmptyMineHint : t.nftResetHint}</div>
      {mode === "mine" && (
        <button
          type="button"
          onClick={() => {
            click();
            setMode("market");
          }}
          className="mt-[2px] rounded-full border-[2px] border-[#8b5cff] bg-[#8b5cff]/15 px-[14px] py-[5px] font-display text-[12px] text-[#d9c6ff]"
        >
          {t.nftMarket}
        </button>
      )}
    </div>
  );

  const count = (
    <div className="flex items-baseline gap-[5px]">
      <span className="font-display text-[19px] leading-none text-white" data-nft-count={list.length} dir="ltr">
        {list.length.toLocaleString("en-US")}
      </span>
      <span className="font-body text-[10px] font-black uppercase tracking-[0.1em] text-white/40">{t.nftItems}</span>
    </div>
  );

  /* ---------------- details ---------------- */

  const details = selected && (
    <Modal title={selected.name} onClose={() => setSelected(null)} width={desk ? 520 : 330}>
      <div className="thin-scroll max-h-[62vh] space-y-[10px] overflow-y-auto pe-[2px]">
        <ArtTile item={selected} owned={ownedSet.has(selected.id)} staked={stakedSet.has(selected.id)} now={now} t={t} className="aspect-[16/10]" />

        <div className="flex items-center gap-[7px] rounded-[10px] border border-white/10 bg-[#0d0d16] px-[9px] py-[6px]">
          <span
            className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full font-display text-[11px] text-[#0b0b12]"
            style={{ background: selected.creator.color }}
          >
            {selected.creator.initial}
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-body text-[7px] font-black uppercase tracking-[0.12em] text-white/30">{t.nftCreator}</div>
            <div className="truncate font-body text-[11px] font-black text-white/80">{selected.creator.name}</div>
          </div>
          <div className="text-end">
            <div className="font-body text-[7px] font-black uppercase tracking-[0.12em] text-white/30">{t.nftSupply}</div>
            <div className="font-display text-[12px] text-white/80" dir="ltr">
              #{selected.edition}/{selected.supply}
            </div>
          </div>
        </div>

        <div>
          <SectionTitle>{t.nftTraits}</SectionTitle>
          <div className="grid grid-cols-2 gap-[5px]">
            {selected.traits.map((tr, i) => (
              <div key={i} className="rounded-[8px] border border-white/10 bg-[#0d0d16] px-[8px] py-[5px]">
                <div className="font-body text-[7px] font-black uppercase tracking-[0.12em] text-[#a98bff]">{tr.key[lang]}</div>
                <div className="mt-[1px] truncate font-body text-[10px] font-black text-white/80">{tr.value[lang]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-[10px] border border-white/10 bg-[#0d0d16] px-[10px] py-[7px]">
          <span className="font-body text-[9px] font-black uppercase tracking-wider text-white/40">{t.nftCurrentBid}</span>
          <span className="flex items-center gap-[4px] font-display text-[16px] leading-none text-white" dir="ltr">
            <CoinIcon width={13} height={13} />
            {selected.price.toLocaleString("en-US")}
          </span>
        </div>

        {error && (
          <div role="alert" className="rounded-[8px] border border-[#ff6b6b]/50 bg-[#ff6b6b]/10 px-[9px] py-[5px] font-body text-[10px] font-black text-[#ff9a9a]">
            {error}
          </div>
        )}

        {ownedSet.has(selected.id) ? (
          stakedSet.has(selected.id) ? (
            <div className="space-y-[6px]">
              <div className="rounded-[8px] border border-[#8b5cff]/40 bg-[#8b5cff]/10 px-[9px] py-[6px] font-body text-[10px] font-black text-[#c9a8ff]">
                {t.nftLocked}
              </div>
              <button
                type="button"
                data-nft-vault=""
                onClick={() => {
                  click();
                  onOpenVault();
                }}
                className="w-full rounded-full border-[2px] border-[#8b5cff] bg-[#8b5cff]/20 py-[8px] font-display text-[13px] text-[#e0d2ff]"
              >
                {t.nftOpenVault}
              </button>
            </div>
          ) : (
            <div className="space-y-[5px]">
              <button
                type="button"
                data-nft-sell=""
                onClick={() => sell(selected)}
                className="w-full rounded-full border-[2px] border-[#ff9a1f] bg-gradient-to-b from-[#ffd23a] to-[#ff9a1f] py-[8px] font-display text-[14px] text-[#2a1602]"
              >
                {t.nftSell} · {nftSellValue(selected).toLocaleString("en-US")}
              </button>
              <div className="text-center font-body text-[9px] font-black text-white/35">
                {fmt(t.nftSellNote, { n: nftSellValue(selected).toLocaleString("en-US") })}
              </div>
            </div>
          )
        ) : (
          <button
            type="button"
            data-nft-buy=""
            disabled={coins < selected.price}
            onClick={() => buy(selected)}
            className={cn(
              "w-full rounded-full border-[2px] py-[8px] font-display text-[14px]",
              coins < selected.price
                ? "cursor-not-allowed border-[#2a2a3c] bg-[#17171f] text-white/30"
                : "border-[#6b46ff] bg-gradient-to-b from-[#9a7cff] to-[#6b46ff] text-white shadow-[0_4px_0_#3b1f8f] active:translate-y-[2px] active:shadow-none",
            )}
          >
            {coins < selected.price ? t.notEnoughCoins : t.nftBuy}
          </button>
        )}
      </div>
    </Modal>
  );

  /* ---------------- layout ---------------- */

  return (
    <div
      className="fixed inset-0 z-[60] flex animate-fade-in flex-col overflow-hidden bg-[#06060c]"
      role="dialog"
      aria-label={t.nft}
    >
      {/* purple glow + faint grid, like the reference market */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_-10%,rgba(139,92,255,0.28),transparent_55%),radial-gradient(ellipse_at_88%_6%,rgba(46,197,255,0.16),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.045] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:46px_46px]" />

      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* header */}
        <header className={cn("flex shrink-0 items-center gap-[10px]", desk ? "px-[22px] py-[12px]" : "px-[14px] py-[9px]")}>
          <span className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#9a7cff] to-[#5b2bd6] font-display text-[16px] text-white shadow-[0_3px_0_#2b1466]">
            N
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-[6px]">
              <span className="font-display text-[17px] leading-none tracking-wide text-white">{t.nft}</span>
              <span className="hidden rounded-full bg-[#8b5cff]/15 px-[7px] py-[2px] font-body text-[8px] font-black tracking-[0.12em] text-[#b48dff] sm:block">
                SOLANA
              </span>
            </div>
            <div className="mt-[2px] truncate font-body text-[9px] font-black tracking-wide text-white/35">{t.nftSub}</div>
          </div>

          {desk && <div className="mx-auto max-w-[420px] flex-1 px-[16px]">{searchBox}</div>}

          <div className="ms-auto flex items-center gap-[8px]">
            {desk && modeSwitch}
            {coinBadge}
            {closeBtn}
          </div>
        </header>

        {/* category tabs + vault cta */}
        <div className={cn("flex shrink-0 items-center gap-[10px] border-b border-white/8", desk ? "px-[22px]" : "px-[14px]")}>
          {tabBar}
          <button
            type="button"
            data-nft-vault-cta=""
            onClick={() => {
              click();
              onOpenVault();
            }}
            className="ms-auto mb-[6px] hidden shrink-0 items-center gap-[5px] rounded-full border border-[#8b5cff]/50 bg-[#8b5cff]/12 px-[10px] py-[4px] font-body text-[9px] font-black uppercase tracking-wider text-[#c9a8ff] transition-colors hover:bg-[#8b5cff]/25 sm:flex"
          >
            ⚡ {t.nftYourStakeCta}
          </button>
        </div>

        {desk ? (
          <div className="flex min-h-0 flex-1 gap-[14px] px-[22px] pb-[18px] pt-[14px]">
            <aside className="thin-scroll w-[214px] shrink-0 overflow-y-auto rounded-[14px] border border-white/10 bg-[#0b0b13]/85 p-[11px]">
              {filters}
            </aside>

            <section className="flex min-w-0 flex-1 flex-col">
              <div className="flex shrink-0 items-center justify-between gap-[10px] pb-[10px]">
                {count}
                <div className="flex items-center gap-[8px]">
                  {viewToggle}
                  {sortSelect}
                </div>
              </div>
              <div className="thin-scroll min-h-0 flex-1 overflow-y-auto pe-[2px]">
                {list.length ? grid : empty}
                {list.length > limit && (
                  <div className="mt-[16px] flex justify-center">
                    <button
                      type="button"
                      data-nft-more=""
                      onClick={() => {
                        click();
                        setLimit((l) => l + PAGE);
                      }}
                      className="rounded-full border border-white/20 bg-[#12121c] px-[20px] py-[7px] font-body text-[11px] font-black uppercase tracking-[0.1em] text-white/80 transition-colors hover:border-[#8b5cff] hover:text-white"
                    >
                      {t.nftLoadMore}
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 items-center gap-[7px] px-[14px] pt-[8px]">
              {searchBox}
              <button
                type="button"
                data-nft-drawer=""
                onClick={() => {
                  click();
                  setDrawer(true);
                }}
                aria-label={t.nftFilter}
                className="relative flex h-[38px] shrink-0 items-center gap-[5px] rounded-full border-[2px] border-[#2a2a3c] bg-[#12121c] px-[11px] font-display text-[12px] text-white/80"
              >
                <FilterIcon width={14} height={14} />
                {t.nftFilter}
                {activeFilters > 0 && (
                  <span className="absolute -right-[5px] -top-[5px] flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#8b5cff] px-[3px] font-body text-[9px] font-black text-white">
                    {activeFilters}
                  </span>
                )}
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-[6px] px-[14px] pt-[9px]">
              {modeSwitch}
              <div className="ms-auto flex items-center gap-[6px]">
                {viewToggle}
                {sortSelect}
              </div>
            </div>

            <div className="shrink-0 px-[14px] pb-[6px] pt-[9px]">{count}</div>

            <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-[14px] pb-[18px]">
              {list.length ? (
                view === "grid" ? (
                  <div className="grid grid-cols-2 items-start gap-[10px]">
                    {visible.map((n) => (
                      <NftCard key={n.id} item={n} t={t} now={now} owned={ownedSet.has(n.id)} staked={stakedSet.has(n.id)} onOpen={() => openDetails(n)} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-[6px]">
                    {visible.map((n) => (
                      <NftRow key={n.id} item={n} t={t} now={now} owned={ownedSet.has(n.id)} staked={stakedSet.has(n.id)} onOpen={() => openDetails(n)} />
                    ))}
                  </div>
                )
              ) : (
                empty
              )}

              {list.length > limit && (
                <div className="mt-[14px] flex justify-center">
                  <button
                    type="button"
                    data-nft-more=""
                    onClick={() => {
                      click();
                      setLimit((l) => l + PAGE);
                    }}
                    className="rounded-full border border-white/20 bg-[#12121c] px-[18px] py-[6px] font-body text-[11px] font-black uppercase tracking-[0.1em] text-white/80"
                  >
                    {t.nftLoadMore}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* mobile filter drawer */}
      {!desk && drawer && (
        <Modal title={t.nftFilter} onClose={() => setDrawer(false)} width={330}>
          <div className="thin-scroll max-h-[56vh] overflow-y-auto pe-[2px]">
            {filters}
            <button
              type="button"
              onClick={() => setDrawer(false)}
              className="mt-[12px] w-full rounded-full border-[2px] border-[#8b5cff] bg-gradient-to-b from-[#9a7cff] to-[#6b46ff] py-[8px] font-display text-[14px] text-white"
            >
              {t.confirm}
            </button>
          </div>
        </Modal>
      )}

      {details}
    </div>
  );
}

function SortGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" className="pointer-events-none absolute start-[6px] text-white/45" aria-hidden="true">
      <path d="M3 1.5v9M1 8.5l2 2 2-2M8 1.5v9M6.5 3l1.5-1.5L9.5 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
