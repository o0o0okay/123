/**
 * Solana payments for the coin shop.
 *
 * The game is a static single-page build, so this module talks to the network
 * the same way a wallet app would:
 *
 * 1. `quoteFor()` turns a USD pack price into a SOL amount (fixed quote rate,
 *    override with `VITE_SOL_USD`).
 * 2. `payUri()` builds a Solana Pay transfer request — the player pays it with
 *    any wallet (deep link / QR / copy).
 * 3. `findTransfer()` polls the treasury through plain JSON-RPC and looks for
 *    a confirmed transfer of at least the quoted amount coming from the
 *    player's wallet. The signature it returns is the receipt.
 *
 * Configuration (all optional, set them in `.env`):
 *   VITE_SOLANA_TREASURY = <base58 address that receives the SOL>
 *   VITE_SOLANA_RPC      = https://api.mainnet-beta.solana.com
 *   VITE_SOLANA_NETWORK  = mainnet-beta | devnet
 *   VITE_SOL_USD         = 150
 *
 * Without a treasury the shop runs in demo mode: the payment sheet says so and
 * the coins are credited after a simulated confirmation, so the flow can be
 * tested with the built-in demo wallet.
 */

const FALLBACK_SOL_USD = 150;
const LAMPORTS = 1_000_000_000;

export type PayNetwork = "mainnet-beta" | "devnet";

export interface PayConfig {
  network: PayNetwork;
  rpc: string;
  treasury: string;
  solUsd: number;
}

function env(key: string): string {
  const source = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  return (source[key] ?? "").trim();
}

/** quick override for testing without a rebuild: localStorage.setItem("hc_solana_treasury", "<address>") */
function stored(key: string): string {
  try {
    return (globalThis.localStorage?.getItem(key) ?? "").trim();
  } catch {
    return "";
  }
}

export function payConfig(): PayConfig {
  const network: PayNetwork = env("VITE_SOLANA_NETWORK") === "mainnet-beta" ? "mainnet-beta" : "devnet";
  const rpc =
    env("VITE_SOLANA_RPC") ||
    (network === "mainnet-beta" ? "https://api.mainnet-beta.solana.com" : "https://api.devnet.solana.com");
  const rate = Number(env("VITE_SOL_USD"));
  return {
    network,
    rpc,
    treasury: env("VITE_SOLANA_TREASURY") || stored("hc_solana_treasury"),
    solUsd: Number.isFinite(rate) && rate > 0 ? rate : FALLBACK_SOL_USD,
  };
}

/** base58 public keys are 32–44 chars of this alphabet */
export function isValidAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address.trim());
}

/** `true` when a treasury is configured, i.e. a real transfer can be requested */
export function livePaymentsEnabled(): boolean {
  return isValidAddress(payConfig().treasury);
}

export interface PayQuote {
  /** pack price in USD */
  usd: number;
  /** SOL amount to transfer */
  sol: number;
  /** the same amount in lamports */
  lamports: number;
  /** USD price of one SOL used for the quote */
  rate: number;
}

export function quoteFor(priceUsd: number, rate = payConfig().solUsd): PayQuote {
  const sol = Math.max(0.0001, Math.round((priceUsd / rate) * 1e6) / 1e6);
  return { usd: priceUsd, sol, lamports: Math.round(sol * LAMPORTS), rate };
}

/** `0.0066` → `0.0066 SOL` (trailing zeros trimmed, never scientific notation) */
export function formatSol(sol: number): string {
  const fixed = sol.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
  return `${fixed || "0"} SOL`;
}

/** Solana Pay transfer request, e.g. `solana:<recipient>?amount=0.0066&label=…` */
export function payUri(opts: {
  treasury: string;
  sol: number;
  label: string;
  message?: string;
  memo?: string;
}): string {
  const params = new URLSearchParams();
  params.set("amount", opts.sol.toFixed(6).replace(/0+$/, "").replace(/\.$/, ""));
  params.set("label", opts.label);
  if (opts.message) params.set("message", opts.message);
  if (opts.memo) params.set("memo", opts.memo);
  return `solana:${opts.treasury}?${params.toString()}`;
}

/* ------------------------------------------------------------------ */
/* JSON-RPC                                                            */
/* ------------------------------------------------------------------ */

interface RpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params: unknown[];
}

export async function rpcCall<T>(method: string, params: unknown[], rpcUrl = payConfig().rpc): Promise<T> {
  const body: RpcRequest = { jsonrpc: "2.0", id: 1, method, params };
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`RPC ${res.status}`);
  const json = (await res.json()) as { result?: T; error?: { message?: string } };
  if (json.error) throw new Error(json.error.message ?? "RPC error");
  if (json.result === undefined) throw new Error("Empty RPC result");
  return json.result;
}

interface SignatureInfo {
  signature: string;
  blockTime: number | null;
  err: unknown;
}

interface ParsedInstruction {
  program?: string;
  parsed?: { type?: string; info?: { source?: string; destination?: string; lamports?: number } };
}

interface ParsedTx {
  transaction?: { message?: { instructions?: ParsedInstruction[] } };
  meta?: { err?: unknown } | null;
}

export interface FoundTransfer {
  signature: string;
  lamports: number;
}

/**
 * Looks for a confirmed `system.transfer` into `treasury` of at least `lamports`
 * lamports, sent from `from` (when given), no older than `since` (unix seconds).
 */
export async function findTransfer(opts: {
  treasury?: string;
  lamports: number;
  from?: string;
  since: number;
  /** stop scanning at this already-known signature */
  skip?: string;
  limit?: number;
  rpcUrl?: string;
}): Promise<FoundTransfer | null> {
  const cfg = payConfig();
  const treasury = opts.treasury ?? cfg.treasury;
  if (!isValidAddress(treasury)) return null;

  const signatures = await rpcCall<SignatureInfo[]>(
    "getSignaturesForAddress",
    [treasury, { limit: opts.limit ?? 25 }],
    opts.rpcUrl,
  );

  for (const item of signatures) {
    if (opts.skip && item.signature === opts.skip) break;
    if (item.err) continue;
    // give the chain a little slack for clock skew
    if (item.blockTime && item.blockTime < opts.since - 90) break;

    const tx = await rpcCall<ParsedTx | null>(
      "getTransaction",
      [item.signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }],
      opts.rpcUrl,
    );
    if (!tx || tx.meta?.err) continue;

    for (const ix of tx.transaction?.message?.instructions ?? []) {
      if (ix.program !== "system" || ix.parsed?.type !== "transfer") continue;
      const info = ix.parsed.info ?? {};
      if (info.destination !== treasury) continue;
      if ((info.lamports ?? 0) < opts.lamports) continue;
      if (opts.from && info.source !== opts.from) continue;
      return { signature: item.signature, lamports: info.lamports ?? 0 };
    }
  }
  return null;
}

/** unix seconds, the unit the RPC uses for `blockTime` */
export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}
