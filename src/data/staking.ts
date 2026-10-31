/**
 * DeFi layer: liquidity pools, single-token staking and collateral-backed loans.
 *
 * Everything is settled in the game's coins, so a position is just an amount of
 * coins locked for a while. Yields accrue by the second from the pool's APR and
 * are only paid out on claim, which keeps the whole thing deterministic: the
 * same position and the same clock always produce the same earnings.
 */

export type TokenId = "hct" | "sol" | "usdc" | "cars";

export interface TokenInfo {
  label: string;
  /** gradient for the round token badge */
  color: string;
  /** text colour of the badge */
  ink: string;
}

export const TOKENS: Record<TokenId, TokenInfo> = {
  hct: { label: "HCT", color: "from-[#b06cff] to-[#6a2bd8]", ink: "#ffffff" },
  sol: { label: "SOL", color: "from-[#2fe9a6] to-[#0b8f5f]", ink: "#04231a" },
  usdc: { label: "USDC", color: "from-[#4aa8ff] to-[#1d5fbf]", ink: "#ffffff" },
  cars: { label: "CARS", color: "from-[#ffd23a] to-[#ff9a1f]", ink: "#3a2600" },
};

export const TOKEN_IDS: TokenId[] = ["hct", "sol", "usdc", "cars"];

export interface PoolInfo {
  id: string;
  a: TokenId;
  b: TokenId;
  /** swap fee as a fraction (0.003 = 0.3%) */
  fee: number;
  /** yearly yield for liquidity providers */
  apr: number;
  /** coins sitting in the pool (the player's share is measured against it) */
  liquidity: number;
  /** reward budget shown in the pool row */
  reward: number;
  /** true for pools the player created */
  custom?: boolean;
}

export interface StakePosition {
  id: string;
  poolId: string;
  kind: "lp" | "single";
  /** label captured at open time, so custom pools keep their name */
  name: string;
  amount: number;
  apr: number;
  /** when the position was opened (drives the lock countdown) */
  startedAt: number;
  /** earnings accrue from here; a claim moves it to "now" */
  accruedAt: number;
  /** 0 = flexible, otherwise the earliest withdrawal time */
  unlockAt: number;
}

export interface Loan {
  id: string;
  principal: number;
  apr: number;
  borrowedAt: number;
  /** cars locked as collateral */
  collateral: string[];
}

export interface DefiState {
  positions: StakePosition[];
  loans: Loan[];
  pools: PoolInfo[];
}

export const DEFAULT_DEFI: DefiState = { positions: [], loans: [], pools: [] };

export const YEAR_MS = 365 * 24 * 60 * 60 * 1000;
/** how much of the collateral's value can be borrowed */
export const LTV = 0.6;
/** yearly interest on a loan */
export const LOAN_APR = 0.14;

/* ------------------------------------------------------------------ */
/* pools                                                               */
/* ------------------------------------------------------------------ */

export const DEFAULT_POOLS: PoolInfo[] = [
  {
    id: "p-hct-sol",
    a: "hct",
    b: "sol",
    fee: 0.003,
    apr: 0.964,
    liquidity: 4_820_000,
    reward: 640_000,
  },
  {
    id: "p-hct-usdc",
    a: "hct",
    b: "usdc",
    fee: 0.0005,
    apr: 1.218,
    liquidity: 2_140_000,
    reward: 320_000,
  },
];

/** the pairs the player can open a new pool with */
export const POOL_PAIRS: { a: TokenId; b: TokenId }[] = [
  { a: "hct", b: "sol" },
  { a: "hct", b: "usdc" },
  { a: "sol", b: "usdc" },
  { a: "cars", b: "hct" },
];

export const FEE_TIERS = [0.0005, 0.003, 0.01];

/** a newly opened pool pays more for a higher fee tier, like a real AMM */
export function aprForFee(fee: number) {
  return Math.round((0.07 + Math.sqrt(fee) * 2.6) * 1000) / 1000;
}

export function poolName(p: PoolInfo) {
  return `${TOKENS[p.a].label} – ${TOKENS[p.b].label}`;
}

export function allPools(defi: DefiState) {
  return [...(defi.pools ?? []), ...DEFAULT_POOLS];
}

/* ------------------------------------------------------------------ */
/* staking tiers                                                       */
/* ------------------------------------------------------------------ */

export interface StakeTier {
  id: string;
  /** lock length in days, 0 = flexible */
  days: number;
  apr: number;
}

export const STAKE_TIERS: StakeTier[] = [
  { id: "flex", days: 0, apr: 0.45 },
  { id: "d7", days: 7, apr: 0.8 },
  { id: "d30", days: 30, apr: 1.3 },
  { id: "d90", days: 90, apr: 2.0 },
];

export const SINGLE_POOL_ID = "stake-hct";
export const SINGLE_POOL_NAME = "HCT VAULT";

/* ------------------------------------------------------------------ */
/* numbers                                                             */
/* ------------------------------------------------------------------ */

export function earnedOf(p: StakePosition, now: number) {
  const dt = Math.max(0, now - p.accruedAt);
  return (p.amount * p.apr * dt) / YEAR_MS;
}

export function debtOf(loan: Loan, now: number) {
  const dt = Math.max(0, now - loan.borrowedAt);
  return loan.principal * (1 + (LOAN_APR * dt) / YEAR_MS);
}

export function interestOf(loan: Loan, now: number) {
  return debtOf(loan, now) - loan.principal;
}

/** percentage of a pool owned by the player's deposit */
export function shareOf(position: StakePosition, pool: PoolInfo | undefined) {
  const total = (pool?.liquidity ?? 0) + position.amount;
  if (total <= 0) return 0;
  return (position.amount / total) * 100;
}

/** 56_400_000 -> "56.4M" */
export function compact(n: number) {
  const v = Math.max(0, n);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(Math.round(v));
}

/** yields keep four decimals while they are tiny */
export function fmtYield(n: number) {
  if (!n) return "0";
  if (n < 0.01) return "<0.01";
  if (n < 1000) return n.toFixed(2);
  return Math.round(n).toLocaleString("en-US");
}

export function pct(fraction: number, digits = 1) {
  return `${(fraction * 100).toFixed(digits)}%`;
}

/** 1.4 -> "1.40" */
export function healthOf(collateralValue: number, debt: number) {
  if (debt <= 0) return Infinity;
  const capacity = collateralValue * LTV;
  return capacity / debt;
}

export function healthTone(health: number) {
  if (health === Infinity) return "idle" as const;
  if (health >= 1.5) return "safe" as const;
  if (health >= 1.15) return "warn" as const;
  return "risk" as const;
}

/** "2d 6h" / "5h 12m" / "unlocked" */
export function lockLeft(unlockAt: number, now: number) {
  const ms = unlockAt - now;
  if (ms <= 0) return { locked: false, days: 0, hours: 0, minutes: 0 };
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return { locked: true, days, hours, minutes };
}

let seq = 0;
export function newId(prefix: string) {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}
