import { cars } from "./cars";
import { RACES, type RaceId } from "./races";

/**
 * Score board model.
 *
 * There is no server behind this game yet, so the rivals are generated from a
 * seeded PRNG: the same season always yields the same names, cars and scores
 * (a reload cannot shuffle the ladder), and next week brings a fresh field.
 * The player's own entry is real: it is stored in `PlayerState.score` and
 * merged into the same ranking, so their position moves the moment they race.
 */

export interface BoardEntry {
  id: string;
  name: string;
  carId: string;
  /** lifetime points, the metric of the global board */
  total: number;
  /** best single run per mode, the metric of a mode board */
  best: Partial<Record<RaceId, number>>;
  races: number;
  wins: number;
}

export type BoardMode = "all" | RaceId;

export interface BoardRow extends BoardEntry {
  rank: number;
  /** the number this board sorts on */
  value: number;
  me: boolean;
}

export const ME_ID = "me";

/* ------------------------------------------------------------------ */
/* season (a fresh ladder every week)                                  */
/* ------------------------------------------------------------------ */

const WEEK = 7 * 24 * 60 * 60 * 1000;
/** a Monday, so a season always starts at the start of the week */
const EPOCH = Date.UTC(2026, 0, 5);

export function seasonInfo(now = Date.now()) {
  const index = Math.max(1, Math.floor((now - EPOCH) / WEEK) + 1);
  return {
    index,
    /** 1..12, the number shown on the board */
    label: ((index - 1) % 12) + 1,
    endsAt: EPOCH + index * WEEK,
  };
}

/** "2d 7h" / "45m" for the countdown chip */
export function timeLeft(endsAt: number, now = Date.now()) {
  const ms = Math.max(0, endsAt - now);
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return { days: d, hours: h, minutes: m };
}

/* ------------------------------------------------------------------ */
/* rival generation                                                    */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HANDLES = [
  "NitroKing", "DriftQueen", "GhostRiderX", "Blaze", "TurboTom", "RedLine",
  "AsphaltAce", "MidnightZ", "SkyWalker", "Vortex", "Rico", "ShahMaxwell",
  "BernieMax", "RayCarr", "LeoBaird", "Kristofer", "SnowLeopard", "JaxRider",
  "Aria_GT", "داریوش", "سپهر", "نیترو_باز", "MaxBoost", "CarbonGhost",
  "EchoNine", "VoltEdge", "RumbleJr", "PhantomFang", "SteelNerve", "ApexHunt",
  "ZeroCool", "NightOwl", "Quicksilver", "IceBreaker", "GoldDrift", "HexBot",
  "BlueComet", "RogueWave", "ThunderCat", "LunarEcho", "BurningTire", "SilentShift",
];

const RIVAL_COUNT = HANDLES.length;

const cache = new Map<number, BoardEntry[]>();

/** The field the player is up against this season (stable for a given season). */
export function rivalsFor(season: number): BoardEntry[] {
  const hit = cache.get(season);
  if (hit) return hit;

  const rnd = mulberry32((season * 2654435761) ^ 0x5f3759df);

  // deterministic shuffle so the podium changes from season to season
  const order = HANDLES.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const list: BoardEntry[] = [];
  let total = 320_000 + rnd() * 140_000;

  for (let i = 0; i < RIVAL_COUNT; i++) {
    if (i > 0) total *= 0.9 + rnd() * 0.06; // a long tail down to a few thousand
    const races = 18 + Math.floor(rnd() * 62);
    const best: Partial<Record<RaceId, number>> = {};
    for (const mode of RACES) {
      // a single good run is worth roughly 8–22% of a rival's lifetime points
      best[mode.id] = Math.round(total * (0.08 + rnd() * 0.14));
    }
    list.push({
      id: `r${i}`,
      name: HANDLES[order[i]],
      carId: cars[Math.floor(rnd() * cars.length)].id,
      total: Math.round(total / 10) * 10,
      best,
      races,
      wins: Math.round(races * (0.25 + rnd() * 0.5)),
    });
  }

  // the decay loop can cross itself by a hair: sort so the ladder is monotonic
  list.sort((a, b) => b.total - a.total);
  cache.set(season, list);
  return list;
}

/* ------------------------------------------------------------------ */
/* ranking                                                             */
/* ------------------------------------------------------------------ */

export function valueOf(entry: BoardEntry, mode: BoardMode) {
  return mode === "all" ? entry.total : entry.best[mode] ?? 0;
}

/** Rivals + the player, sorted best first, with 1-based ranks. */
export function boardRows(rivals: BoardEntry[], me: BoardEntry | null, mode: BoardMode): BoardRow[] {
  const all = me ? [...rivals, me] : [...rivals];
  return all
    .sort((a, b) => valueOf(b, mode) - valueOf(a, mode) || a.name.localeCompare(b.name))
    .map((e, i) => ({ ...e, rank: i + 1, value: valueOf(e, mode), me: e.id === ME_ID }));
}

/** Points of a board row, formatted like the arcade scoreboards (119,135). */
export function fmtPoints(n: number) {
  return Math.max(0, Math.round(n)).toLocaleString("en-US");
}

export function carOf(id: string) {
  return cars.find((c) => c.id === id) ?? cars[0];
}
