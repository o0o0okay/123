import { cars, type Car } from "./cars";

/**
 * Car NFTs.
 *
 * Every car in the game has a small "mint run" of tokens: a fixed palette, a
 * rarity, a creator and a price in coins. The collection is generated from the
 * garage data with a seeded RNG, so the market looks the same on every reload
 * and a token id always points at the same car art.
 */

export type NftRarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC";

export const NFT_RARITIES: NftRarity[] = ["COMMON", "RARE", "EPIC", "LEGENDARY", "MYTHIC"];

export const NFT_RARITY_COLOR: Record<NftRarity, string> = {
  COMMON: "#8ec9ff",
  RARE: "#46f0a0",
  EPIC: "#c66bff",
  LEGENDARY: "#ffd23a",
  MYTHIC: "#ff5d8f",
};

export interface NftCreator {
  /** handle shown on the card under the avatar */
  name: string;
  initial: string;
  color: string;
}

export interface NftTrait {
  key: { en: string; fa: string };
  value: { en: string; fa: string };
}

export interface NftItem {
  id: string;
  /** which car art is drawn on the tile */
  carId: string;
  /** display name, e.g. "COMET '21 #002" */
  name: string;
  /** mint number (1-based) */
  edition: number;
  /** mint run size */
  supply: number;
  rarity: NftRarity;
  /** gradient behind the car on the card */
  palette: [string, string];
  creator: NftCreator;
  /** current bid / buy-now price in coins */
  price: number;
  /** auction countdown target */
  endsAt: number;
  traits: NftTrait[];
}

/* ------------------------------------------------------------------ */
/* deterministic mint                                                  */
/* ------------------------------------------------------------------ */

const CREATORS: NftCreator[] = [
  { name: "nullmint", initial: "N", color: "#7b5cff" },
  { name: "apex.studio", initial: "A", color: "#2ec5ff" },
  { name: "neonvault", initial: "V", color: "#ff5d8f" },
  { name: "ghost.garage", initial: "G", color: "#2fe98a" },
  { name: "hexa.lab", initial: "H", color: "#ffd23a" },
];

const PALETTES: [string, string][] = [
  ["#ff9a3d", "#ffd23a"],
  ["#7b5cff", "#2ec5ff"],
  ["#ff5d8f", "#ffb86b"],
  ["#2fe98a", "#0e7c6b"],
  ["#3d8ff5", "#7b5cff"],
  ["#f0603c", "#ffd23a"],
  ["#00c2ff", "#7b5cff"],
  ["#c66bff", "#ff5d8f"],
  ["#46f0a0", "#3d8ff5"],
  ["#ffb32a", "#ff5d3d"],
  ["#8ec9ff", "#46f0a0"],
  ["#a15cff", "#00d1ff"],
];

const RARITY_MULT: Record<NftRarity, number> = {
  COMMON: 1,
  RARE: 1.5,
  EPIC: 2.4,
  LEGENDARY: 4,
  MYTHIC: 6.5,
};

/** daily coin yield per staked NFT, as a fraction of its price */
const RARITY_YIELD: Record<NftRarity, number> = {
  COMMON: 0.0022,
  RARE: 0.003,
  EPIC: 0.004,
  LEGENDARY: 0.0052,
  MYTHIC: 0.0068,
};

const SUPPLY: Record<NftRarity, number> = {
  COMMON: 50,
  RARE: 25,
  EPIC: 12,
  LEGENDARY: 5,
  MYTHIC: 1,
};

/** small deterministic LCG so the mint run never shuffles between reloads */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function rarityFor(tier: number, roll: number): NftRarity {
  // a higher tier car nudges the roll towards the rare end of the table
  const r = Math.min(0.999, roll + Math.min(0.2, Math.max(0, tier - 1) * 0.04));
  if (r > 0.95) return "MYTHIC";
  if (r > 0.86) return "LEGENDARY";
  if (r > 0.68) return "EPIC";
  if (r > 0.42) return "RARE";
  return "COMMON";
}

function round10(n: number) {
  return Math.round(n / 10) * 10;
}

function mint(): NftItem[] {
  const out: NftItem[] = [];
  const stamp = Date.now();
  cars.forEach((car, ci) => {
    const editions = car.tier >= 4 ? 3 : 2;
    for (let e = 0; e < editions; e++) {
      const r = rng(ci * 977 + e * 131 + 17);
      const rarity = rarityFor(car.tier, r());
      const base = car.price > 0 ? car.price : 7200;
      const price = round10(Math.max(950, Math.min(45_000, (base * 0.3 + 700) * RARITY_MULT[rarity] * (0.85 + r() * 0.45))));
      const palette = PALETTES[Math.floor(r() * PALETTES.length)];
      const creator = CREATORS[Math.floor(r() * CREATORS.length)];
      const supply = SUPPLY[rarity];
      const edition = 1 + Math.floor(r() * supply);
      const shorter = String(car.year).slice(-2);
      out.push({
        id: `${car.id}-nft-${e + 1}`,
        carId: car.id,
        name: `${car.name} '${shorter} #${String(edition).padStart(3, "0")}`,
        edition,
        supply,
        rarity,
        palette,
        creator,
        price,
        // 3h … 72h left, staggered per token
        endsAt: stamp + Math.round((3 + r() * 69) * 3_600_000),
        traits: [
          { key: { en: "CLASS", fa: "کلاس" }, value: { en: car.cls, fa: car.cls } },
          { key: { en: "RARITY", fa: "کمیابی" }, value: { en: rarity, fa: rarity } },
          { key: { en: "YEAR", fa: "سال" }, value: { en: String(car.year), fa: String(car.year) } },
          { key: { en: "DRIVE", fa: "محرکه" }, value: { en: car.drive, fa: car.drive } },
          { key: { en: "POWER", fa: "قدرت" }, value: { en: `${car.bhp} BHP`, fa: `${car.bhp} اسب بخار` } },
          { key: { en: "MINT", fa: "ضرب" }, value: { en: `${edition} / ${supply}`, fa: `${edition} از ${supply}` } },
        ],
      });
    }
  });
  return out;
}

export const NFT_COLLECTION: NftItem[] = mint();

/** classes shown as the marketplace tabs (from the garage data, never hardcoded) */
export const NFT_CLASSES: string[] = Array.from(new Set(cars.map((c) => c.cls)));

export function nftById(id: string): NftItem | undefined {
  return NFT_COLLECTION.find((n) => n.id === id);
}

export function nftCar(item: NftItem): Car | undefined {
  return cars.find((c) => c.id === item.carId);
}

export function nftClassOf(item: NftItem): string {
  return nftCar(item)?.cls ?? "OTHER";
}

/** what the marketplace pays when the player sells a token (5% fee) */
export function nftSellValue(item: NftItem): number {
  return Math.max(1, Math.round(item.price * 0.95));
}

/** coins per day while the token sits in the vault */
export function nftDayYield(item: NftItem): number {
  return Math.max(3, Math.round(item.price * RARITY_YIELD[item.rarity]));
}

export const DAY_MS = 24 * 60 * 60 * 1000;

export interface NftStake {
  id: string;
  nftId: string;
  startedAt: number;
  /** earnings accrue from here; a claim moves it to "now" */
  accruedAt: number;
}

export interface NftState {
  /** ids of the tokens the player owns */
  owned: string[];
  /** tokens locked in the NFT vault */
  stakes: NftStake[];
}

export const DEFAULT_NFT: NftState = { owned: [], stakes: [] };

/** coins accrued by one staked token since its last claim */
export function nftStakeEarned(stake: NftStake, item: NftItem | undefined, now: number): number {
  if (!item) return 0;
  return (nftDayYield(item) * Math.max(0, now - stake.accruedAt)) / DAY_MS;
}

/** short "12 : 04 : 33 : 09" countdown used on the cards */
export function countdownTo(target: number, now: number): string | null {
  const left = target - now;
  if (left <= 0) return null;
  const s = Math.floor(left / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d)} : ${p(h)} : ${p(m)} : ${p(sec)}`;
}

export function compactCoins(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}
