import type { Lang } from "../i18n";

/**
 * Activity ledger of the driver.
 *
 * Every coin movement and every asset move worth remembering (a car bought, a
 * car pledged against a loan, an NFT locked in the vault) is written here as a
 * small immutable record: the amount of coins that moved, the points it paid,
 * and what it was about. Labels are not stored — the kind is, and the panel
 * renders it in the current language, so switching EN/FA re-labels old rows.
 */
export type HistoryKind =
  /* ---- races & earnings ---- */
  | "raceEntry"
  | "racePrize"
  | "chase"
  | "task"
  | "daily"
  | "coins"
  /* ---- garage ---- */
  | "carBuy"
  | "carSell"
  | "upgrade"
  | "paint"
  /* ---- nft market ---- */
  | "nftBuy"
  | "nftSell"
  | "nftStake"
  | "nftClaim"
  | "nftUnstake"
  /* ---- staking & pools ---- */
  | "lpAdd"
  | "poolCreate"
  | "stake"
  | "stakeClaim"
  | "stakeWithdraw"
  /* ---- loans ---- */
  | "borrow"
  | "repay"
  | "pledge"
  | "release";

/** which direction the coins went, drives the filter and the row colour */
export type HistoryFlow = "in" | "out" | "neutral";

export interface HistoryEntry {
  id: string;
  /** epoch ms */
  at: number;
  kind: HistoryKind;
  /** signed coin movement (0 for asset-only actions) */
  coins: number;
  /** leaderboard points paid by the action (races only) */
  points?: number;
  /** the car / pool / nft / task it was about, already in the player's language */
  detail?: string;
}

export const HISTORY_MAX = 120;

export const FLOW_OF: Record<HistoryKind, HistoryFlow> = {
  raceEntry: "out",
  racePrize: "in",
  chase: "in",
  task: "in",
  daily: "in",
  coins: "in",
  carBuy: "out",
  carSell: "in",
  upgrade: "out",
  paint: "out",
  nftBuy: "out",
  nftSell: "in",
  nftStake: "neutral",
  nftClaim: "in",
  nftUnstake: "neutral",
  lpAdd: "out",
  poolCreate: "out",
  stake: "out",
  stakeClaim: "in",
  stakeWithdraw: "in",
  borrow: "in",
  repay: "out",
  pledge: "neutral",
  release: "neutral",
};

/** one short line per kind, written in both languages */
export const HISTORY_LABEL: Record<HistoryKind, { en: string; fa: string }> = {
  raceEntry: { en: "Race entry", fa: "ورودی مسابقه" },
  racePrize: { en: "Race prize", fa: "جایزه مسابقه" },
  chase: { en: "Chase reward", fa: "پاداش فرار" },
  task: { en: "Mission reward", fa: "پاداش مأموریت" },
  daily: { en: "Daily check-in", fa: "جایزه ورود روزانه" },
  coins: { en: "Coin purchase", fa: "خرید سکه" },
  carBuy: { en: "Car bought", fa: "خرید خودرو" },
  carSell: { en: "Car sold", fa: "فروش خودرو" },
  upgrade: { en: "Upgrade", fa: "ارتقاء" },
  paint: { en: "Paint job", fa: "رنگ‌آمیزی" },
  nftBuy: { en: "NFT bought", fa: "خرید NFT" },
  nftSell: { en: "NFT sold", fa: "فروش NFT" },
  nftStake: { en: "NFT staked", fa: "استیک NFT" },
  nftClaim: { en: "NFT yield", fa: "سود NFT" },
  nftUnstake: { en: "NFT unstaked", fa: "خروج NFT" },
  lpAdd: { en: "Liquidity added", fa: "افزودن نقدینگی" },
  poolCreate: { en: "Pool created", fa: "ساخت استخر" },
  stake: { en: "Coins staked", fa: "استیک سکه" },
  stakeClaim: { en: "Staking yield", fa: "سود استیکینگ" },
  stakeWithdraw: { en: "Stake withdrawn", fa: "برداشت استیک" },
  borrow: { en: "Loan taken", fa: "دریافت وام" },
  repay: { en: "Loan repaid", fa: "بازپرداخت وام" },
  pledge: { en: "Car pledged", fa: "وثیقه‌گذاری خودرو" },
  release: { en: "Collateral freed", fa: "آزادسازی وثیقه" },
};

export const labelOf = (kind: HistoryKind, lang: Lang) => HISTORY_LABEL[kind][lang];
export const flowOf = (kind: HistoryKind) => FLOW_OF[kind];

/** prepend a record and keep the ledger inside its cap */
export function pushHistory(list: HistoryEntry[], entry: Omit<HistoryEntry, "id" | "at"> & { at?: number }): HistoryEntry[] {
  const row: HistoryEntry = {
    id: `h-${(entry.at ?? Date.now()).toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    at: entry.at ?? Date.now(),
    kind: entry.kind,
    coins: Math.round(entry.coins),
    points: entry.points ? Math.round(entry.points) : undefined,
    detail: entry.detail,
  };
  return [row, ...list].slice(0, HISTORY_MAX);
}

/** coin totals of a ledger, used by the summary header */
export function totalsOf(list: HistoryEntry[]) {
  let inCoins = 0;
  let outCoins = 0;
  let points = 0;
  for (const e of list) {
    if (e.coins > 0) inCoins += e.coins;
    else if (e.coins < 0) outCoins += -e.coins;
    points += e.points ?? 0;
  }
  return { inCoins, outCoins, net: inCoins - outCoins, points };
}

/** accept whatever sits in storage, drop anything malformed */
export function sanitizeHistory(raw: unknown): HistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (r): r is HistoryEntry =>
        !!r &&
        typeof r === "object" &&
        typeof (r as HistoryEntry).id === "string" &&
        typeof (r as HistoryEntry).at === "number" &&
        typeof (r as HistoryEntry).coins === "number" &&
        (r as HistoryEntry).kind in HISTORY_LABEL,
    )
    .slice(0, HISTORY_MAX);
}
