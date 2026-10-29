import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import type { Strings } from "@/i18n";
import { BackpackIcon, CheckIcon, PhantomIcon, SolanaIcon, SolflareIcon, WalletIcon } from "@/icons";
import type { SolanaWalletInfo } from "@/solana";
import { GameButton, Modal } from "./ui";

interface Props {
  t: Strings;
  wallets: SolanaWalletInfo[];
  connecting: boolean;
  selectedWallet: string | null;
  onSelect: (wallet: SolanaWalletInfo) => void;
  onDemoConnect: () => void;
  onClose: () => void;
}

const WALLET_ICONS: Record<string, ReactNode> = {
  phantom: <PhantomIcon width={32} height={32} />,
  solflare: <SolflareIcon width={32} height={32} />,
  backpack: <BackpackIcon width={32} height={32} />,
  solana: <SolanaIcon width={32} height={32} />,
};

export function WalletModal({
  t,
  wallets,
  connecting,
  selectedWallet,
  onSelect,
  onDemoConnect,
  onClose,
}: Props) {
  return (
    <Modal title={t.selectWallet} onClose={onClose} width={450}>
      <div className="space-y-[10px]">
        {/* Real Solana Wallets */}
        {wallets.map((w) => {
          const isSelected = selectedWallet === w.id;
          return (
            <button
              key={w.id}
              type="button"
              disabled={connecting}
              onClick={() => onSelect(w)}
              className={cn(
                "group relative flex w-full items-center justify-between rounded-[16px] border-[3px] border-ink bg-navy-950/70 p-[12px] transition-all",
                "hover:bg-navy-800/80 hover:border-skyg-400 active:translate-y-[2px]",
                isSelected && "border-mint-400 bg-navy-800",
                connecting && "opacity-60 pointer-events-none"
              )}
            >
              <div className="flex items-center gap-[12px]">
                <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[12px] border-[2px] border-ink bg-navy-900 shadow-[0_2px_0_#0a1038]">
                  {WALLET_ICONS[w.id] || <WalletIcon width={28} height={28} className="text-mint-400" />}
                </div>
                <div className="text-start">
                  <div className="font-display text-[20px] text-white t-stroke sw-3 leading-tight">
                    {w.name}
                  </div>
                  <div className="font-body text-[12px] text-white/50">
                    {w.id === "phantom"
                      ? t.phantomDesc
                      : w.id === "solflare"
                      ? t.solflareDesc
                      : w.id === "backpack"
                      ? t.backpackDesc
                      : "Solana Wallet Adapter"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-[8px]">
                {w.installed ? (
                  <span className="rounded-full border-[2px] border-ink bg-mint-500/20 px-[10px] py-[2px] font-body text-[11px] font-black text-mint-400">
                    {t.installed}
                  </span>
                ) : (
                  <span className="rounded-full border-[2px] border-ink bg-white/10 px-[10px] py-[2px] font-body text-[11px] font-black text-white/40">
                    {t.notDetected}
                  </span>
                )}
                {isSelected && connecting && (
                  <span className="h-[12px] w-[12px] animate-spin rounded-full border-[2px] border-mint-400 border-t-transparent" />
                )}
              </div>
            </button>
          );
        })}

        {/* Demo Wallet option (ensures seamless testing on any machine) */}
        <div className="pt-[4px]">
          <div className="mb-[8px] flex items-center gap-[8px] font-body text-[11px] font-black tracking-wider text-white/40">
            <span className="h-[1px] flex-1 bg-white/15" />
            <span>SOLANA DEV / DEMO</span>
            <span className="h-[1px] flex-1 bg-white/15" />
          </div>

          <button
            type="button"
            disabled={connecting}
            onClick={onDemoConnect}
            className={cn(
              "group relative flex w-full items-center justify-between rounded-[16px] border-[3px] border-mint-500/60 bg-gradient-to-r from-navy-800 to-navy-900 p-[12px] transition-all",
              "hover:border-mint-400 hover:brightness-110 active:translate-y-[2px]"
            )}
          >
            <div className="flex items-center gap-[12px]">
              <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[12px] border-[2px] border-ink bg-gradient-to-tr from-[#9945FF] to-[#14F195] text-navy-950 shadow-[0_2px_0_#0a1038]">
                <SolanaIcon width={28} height={28} />
              </div>
              <div className="text-start">
                <div className="flex items-center gap-[6px]">
                  <span className="font-display text-[20px] text-mint-400 t-stroke sw-3 leading-tight">
                    {t.demoWallet}
                  </span>
                  <span className="rounded-full bg-amber-400 px-[6px] py-[1px] font-body text-[10px] font-black text-ink">
                    DEV
                  </span>
                </div>
                <div className="font-body text-[12px] text-white/60">{t.demoWalletDesc}</div>
              </div>
            </div>

            <CheckIcon width={22} height={22} className="text-mint-400 opacity-80 group-hover:opacity-100" />
          </button>
        </div>
      </div>

      <div className="mt-[20px] flex justify-center">
        <GameButton variant="grey" className="h-[52px] w-[140px]" onClick={onClose}>
          <span className="font-display text-[18px] text-white t-stroke sw-3">{t.back}</span>
        </GameButton>
      </div>
    </Modal>
  );
}
