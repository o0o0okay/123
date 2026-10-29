/**
 * Coin packs sold in the coin shop.
 *
 * `coins` is what the player is credited with (the bonus is already included in
 * that number — the pack art just advertises it, exactly like the reference UI).
 */
export interface CoinPack {
  id: string;
  /** coins credited after a successful payment */
  coins: number;
  /** advertised bonus in percent (0 = no bonus) */
  bonus: number;
  /** price in US dollars; converted to SOL for the Solana payment */
  priceUsd: number;
  /** shows the red HOT ribbon */
  hot?: boolean;
  /** how many coins the art draws */
  art: 1 | 2 | 5 | 8;
}

export const COIN_PACKS: CoinPack[] = [
  { id: "pack-240", coins: 240, bonus: 0, priceUsd: 0.99, art: 1 },
  { id: "pack-720", coins: 720, bonus: 0, priceUsd: 2.99, art: 2 },
  { id: "pack-1320", coins: 1320, bonus: 10, priceUsd: 4.99, hot: true, art: 5 },
  { id: "pack-2880", coins: 2880, bonus: 20, priceUsd: 9.99, hot: true, art: 8 },
];

/** coins the pack would hold without the bonus — used for the "BONUS 10%" label */
export function packBaseCoins(pack: CoinPack): number {
  return Math.round(pack.coins / (1 + pack.bonus / 100));
}

export function packById(id: string): CoinPack | undefined {
  return COIN_PACKS.find((p) => p.id === id);
}

export function formatUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** `240` → `240`, `2880` → `2,880` */
export function formatCoins(n: number): string {
  return n.toLocaleString("en-US");
}
