// Solana Wallet Adapter interface definitions and detection

export type SolanaCluster = "mainnet-beta" | "devnet";

export interface SolanaWalletInfo {
  id: "phantom" | "solflare" | "backpack" | "solana";
  name: string;
  icon: string;
  installed: boolean;
  adapter?: SolanaProvider;
}

export interface SolanaProvider {
  isPhantom?: boolean;
  isSolflare?: boolean;
  isBackpack?: boolean;
  publicKey?: { toBase58: () => string; toString: () => string };
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{
    publicKey: { toBase58: () => string; toString: () => string };
  }>;
  disconnect: () => Promise<void>;
  signMessage?: (
    message: Uint8Array,
    format?: string,
  ) => Promise<{ signature: Uint8Array }>;
}

declare global {
  interface Window {
    solana?: SolanaProvider;
    phantom?: { solana?: SolanaProvider };
    solflare?: SolanaProvider;
    backpack?: SolanaProvider;
  }
}

export function detectWallets(): SolanaWalletInfo[] {
  if (typeof window === "undefined") return [];

  const phantomAdapter = window.phantom?.solana || (window.solana?.isPhantom ? window.solana : undefined);
  const solflareAdapter = window.solflare;
  const backpackAdapter = window.backpack;

  return [
    {
      id: "phantom",
      name: "Phantom",
      icon: "phantom",
      installed: !!phantomAdapter,
      adapter: phantomAdapter,
    },
    {
      id: "solflare",
      name: "Solflare",
      icon: "solflare",
      installed: !!solflareAdapter,
      adapter: solflareAdapter,
    },
    {
      id: "backpack",
      name: "Backpack",
      icon: "backpack",
      installed: !!backpackAdapter,
      adapter: backpackAdapter,
    },
    {
      id: "solana",
      name: "Browser Wallet",
      icon: "solana",
      installed: !!window.solana && !phantomAdapter && !solflareAdapter && !backpackAdapter,
      adapter: window.solana,
    },
  ];
}

// Generate demo address for quick testing / dev mode
export function generateDemoAddress(): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let addr = "";
  for (let i = 0; i < 44; i++) {
    addr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return addr;
}

export function shortenAddress(addr: string, chars = 4): string {
  if (!addr) return "";
  if (addr.length <= chars * 2 + 3) return addr;
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}
