import { useState, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { carStats, type Car, type CarStats } from "@/data/cars";
import type { Lang, Strings } from "@/i18n";
import type { Settings } from "@/settings";
import { useAnimatedNumber, useDragScroll, useFullscreen } from "@/hooks";
import { useCoinFly } from "./CoinFlyEffect";
import { shortenAddress, type SolanaWalletInfo } from "@/solana";
import {
  ArrowRightIcon,
  BackpackIcon,
  BoltIcon,
  CartIcon,
  ClipboardIcon,
  CoinIcon,
  CopyIcon,
  CrosshairIcon,
  FullscreenIcon,
  GearIcon,
  PhantomIcon,
  PoliceLightIcon,
  SolanaIcon,
  SolflareIcon,
  SpeakerIcon,
  StarBurstIcon,
  StoreIcon,
  UndoIcon,
  WalletIcon,
} from "@/icons";
import { HexEmblem, TitleBanner } from "./TitleBanner";
import { prefetch } from "./lazy";
import { CarShowcase } from "./CarShowcase";
import { GarageView, type GarageData } from "./GaragePanel";
import { TasksPanel, type TaskView } from "./TasksPanel";
import type { DailyView } from "@/data/daily";
import { RacePanel, type RaceProps } from "./RacePanel";
import { NewsPanel } from "./NewsPanel";
import { StatPills, StatsRow } from "./Stats";
import { CarFace } from "./BottomBar";
import { SlotButton } from "./ui";
import type { Player } from "./WelcomeScreen";

export type RightTab = "race" | "garage" | "tasks" | "news";

export interface DesktopViewProps {
  t: Strings;
  lang: Lang;
  settings: Settings;

  /** car currently driven — the home stage only shows owned cars */
  viewCar: Car;
  viewStats: CarStats;
  /** position of the driven car inside the owned-cars roster */
  viewIdx: number;
  garage: GarageData;
  ownedCars: Car[];
  tasks: TaskView[];
  taskBadge: number;
  onClaimTask: (id: string, e: MouseEvent<HTMLButtonElement>) => void;
  /** daily login check-in */
  daily: DailyView;
  onClaimDaily: (e: MouseEvent<HTMLButtonElement>) => void;
  race: RaceProps;
  onSelectCar: (i: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onOpenDealer: () => void;
  onOpenStaking: () => void;
  /** opens the NFT marketplace */
  onOpenNft: () => void;
  /** opens the coin shop (buy coins with SOL) */
  onOpenCoinShop: () => void;
  onEquip: (car: Car) => void;

  screen: "login" | "loading" | "home";
  player: Player | null;

  wallets: SolanaWalletInfo[];
  connecting: boolean;
  selectedWallet: string | null;
  onConnectWallet: (w: SolanaWalletInfo) => void;
  onDemoConnect: () => void;
  onOpenWalletModal: () => void;

  onOptions: () => void;
  onExit: () => void;
  onLogout: () => void;
  onStartChase: () => void;
  onToggleSound: () => void;
  onToggleLang: () => void;
  onCopied?: () => void;
  rightTab: RightTab;
  onRightTab: (t: RightTab) => void;
}

const PANEL =
  "relative w-full rounded-[26px] border-[4px] border-ink bg-gradient-to-b from-navy-700 to-navy-900 px-[24px] pb-[22px] pt-[40px] " +
  "shadow-[0_10px_0_#060a28,0_26px_50px_rgba(0,0,0,0.4),0_0_0_3px_rgba(120,200,255,0.3)]";

function PanelTag({ children }: { children: ReactNode }) {
  return (
    <div className="absolute -top-[22px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[14px] border-[3px] border-ink bg-gradient-to-r from-[#ff7a1a] to-[#ffb32a] px-[26px] py-[4px] font-display text-[21px] text-white t-stroke sw-4 shadow-[0_4px_0_#9a4a08]">
      {children}
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-[44px] w-[44px] items-center justify-center rounded-full border-[3px] bg-navy-800 text-skyg-300",
        "shadow-[0_4px_0_#0a1038] transition-all hover:-translate-y-[1px] hover:brightness-125 active:translate-y-[2px] active:shadow-none",
        active ? "border-mint-400 text-mint-400" : "border-skyg-400",
      )}
    >
      {children}
    </button>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-[8px] border-[2px] border-ink bg-navy-700 px-[8px] py-[1px] font-body text-[12px] font-black text-white shadow-[0_2px_0_#0a1038]">
      {children}
    </kbd>
  );
}

/* ---------------- Top Bar ---------------- */
function TopBar(p: DesktopViewProps) {
  const { t, viewCar, settings, garage } = p;
  const fs = useFullscreen();
  const animatedCoins = useAnimatedNumber(garage.coins);
  const { isPulsing } = useCoinFly();

  return (
    <header className="flex h-[58px] shrink-0 items-center justify-between px-[36px]">
      <div className="flex items-center gap-[12px]" dir="ltr">
        <HexEmblem accent={viewCar.accent} className="h-[48px] w-[43px]" />
        <div className="leading-none">
          <div className="font-display text-[30px] italic tracking-wide text-white t-stroke sw-5">HEAT CHASE</div>
          <div className="mt-[2px] flex items-center gap-[6px] font-body text-[11px] font-black tracking-[0.2em] text-skyg-300/90">
            <SolanaIcon width={14} height={14} />
            <span>SOLANA ARENA · {t.season}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-[10px]">
        {/* Dealership (buy & sell) */}
        <button
          type="button"
          id="desktop-dealer-btn"
          onClick={p.onOpenDealer}
          onPointerEnter={() => prefetch.dealership()}
          onFocus={() => prefetch.dealership()}
          title={t.dealerSub}
          className="flex h-[44px] items-center gap-[7px] rounded-full border-[3px] border-ink bg-gradient-to-b from-[#ffd23a] to-[#ff9a1f] px-[14px] font-display text-[15px] tracking-wide text-ink shadow-[0_4px_0_#9a4a08] transition-all hover:-translate-y-[1px] hover:brightness-110 active:translate-y-[2px] active:shadow-none"
        >
          <StoreIcon width={20} height={20} />
          {t.dealership}
        </button>
        {/* Staking (pools · staking · loans) */}
        <button
          type="button"
          id="desktop-staking-btn"
          onClick={p.onOpenStaking}
          onPointerEnter={() => prefetch.staking()}
          onFocus={() => prefetch.staking()}
          title={t.stakingSub}
          className="flex h-[44px] items-center gap-[7px] rounded-full border-[3px] border-ink bg-gradient-to-b from-[#4bf5a0] to-[#16a86a] px-[14px] font-display text-[15px] tracking-wide text-[#04120c] shadow-[0_4px_0_#0b6a44] transition-all hover:-translate-y-[1px] hover:brightness-110 active:translate-y-[2px] active:shadow-none"
        >
          <BoltIcon width={18} height={18} />
          {t.staking}
        </button>
        {/* NFT market (car tokens) */}
        <button
          type="button"
          id="desktop-nft-btn"
          onClick={p.onOpenNft}
          onPointerEnter={() => prefetch.nft()}
          onFocus={() => prefetch.nft()}
          title={t.nftSub}
          className="flex h-[44px] items-center gap-[7px] rounded-full border-[3px] border-ink bg-gradient-to-b from-[#b48dff] to-[#6b46ff] px-[14px] font-display text-[15px] tracking-wide text-white shadow-[0_4px_0_#3b1f8f] transition-all hover:-translate-y-[1px] hover:brightness-110 active:translate-y-[2px] active:shadow-none"
        >
          <StarBurstIcon width={18} height={18} />
          {t.nft}
        </button>

        {/* Top Shop / Coins Button with pulsating highlight & coin fly target */}
        <button
          type="button"
          id="desktop-top-coin-badge"
          onClick={p.onOpenCoinShop}
          title={t.coinShop}
          className={cn(
            "me-[2px] flex items-center gap-[8px] rounded-full border-[3px] border-ink bg-navy-950/80 py-[4px] pe-[6px] ps-[14px] font-body text-[13px] font-black text-amber-400 transition-all duration-300 hover:brightness-125",
            isPulsing && "scale-[1.12] ring-[4px] ring-amber-400 shadow-[0_0_24px_rgba(255,210,58,0.85)] bg-navy-900",
          )}
        >
          <CoinIcon width={20} height={20} className={cn("transition-transform duration-200", isPulsing && "scale-125")} />
          <span className="font-display text-[15px] leading-none">{animatedCoins.toLocaleString("en-US")}</span>
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-[2px] border-ink bg-gradient-to-b from-[#9ef05a] to-[#3d9a1f] text-white shadow-[0_2px_0_#1f5a10]">
            <CartIcon width={15} height={15} />
          </span>
        </button>
        <button
          type="button"
          onClick={() => p.onRightTab("tasks")}
          title={t.tabTasks}
          className="relative flex h-[44px] w-[44px] items-center justify-center rounded-full border-[3px] border-skyg-400 bg-navy-800 text-skyg-300 shadow-[0_4px_0_#0a1038] transition-all hover:-translate-y-[1px] hover:brightness-125 active:translate-y-[2px] active:shadow-none"
        >
          <ClipboardIcon width={22} height={22} />
          {p.taskBadge > 0 && (
            <span className="absolute -right-[5px] -top-[5px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-[2px] border-ink bg-[#ff4f1f] px-[3px] font-body text-[10px] font-black text-white">
              {p.taskBadge}
            </span>
          )}
        </button>
        <div className="me-[6px] flex items-center gap-[8px] rounded-full border-[3px] border-ink bg-navy-950/80 px-[14px] py-[6px] font-body text-[12px] font-black tracking-wider text-white/80">
          <span className="h-[8px] w-[8px] rounded-full bg-mint-400 shadow-[0_0_8px_#46f0a0]" />
          12,578 {t.online}
        </div>
        <IconBtn label={t.sound} active={settings.sound} onClick={p.onToggleSound}>
          <SpeakerIcon width={22} height={22} muted={!settings.sound} />
        </IconBtn>
        <IconBtn label={t.language} onClick={p.onToggleLang}>
          <span className="font-display text-[15px] leading-none">{settings.lang === "en" ? "فا" : "EN"}</span>
        </IconBtn>
        <IconBtn label={t.fullscreen} active={fs.active} onClick={fs.toggle}>
          <FullscreenIcon width={22} height={22} exit={fs.active} />
        </IconBtn>
        <IconBtn label={t.options} onClick={p.onOptions}>
          <GearIcon width={22} height={22} />
        </IconBtn>
      </div>
    </header>
  );
}

/* ---------------- Solana Login Panel ---------------- */
function SolanaLoginPanel(p: DesktopViewProps) {
  const { t, wallets, connecting, selectedWallet } = p;

  const find = (id: SolanaWalletInfo["id"]): SolanaWalletInfo =>
    wallets.find((w) => w.id === id) || { id, name: id, icon: id, installed: false };

  const slots: { wallet: SolanaWalletInfo; label: string; icon: ReactNode }[] = [
    { wallet: find("phantom"), label: "PHANTOM", icon: <PhantomIcon width={32} height={32} /> },
    { wallet: find("solflare"), label: "SOLFLARE", icon: <SolflareIcon width={32} height={32} /> },
    { wallet: find("backpack"), label: "BACKPACK", icon: <BackpackIcon width={32} height={32} /> },
  ];

  return (
    <div className={cn(PANEL, "animate-slide-up")}>
      <PanelTag>{t.account}</PanelTag>

      <div className="mb-[16px] rounded-[18px] border-[3px] border-ink bg-navy-950/90 p-[14px] text-center shadow-[inset_0_2px_0_rgba(255,255,255,0.06)]">
        <div className="flex items-center justify-center gap-[8px]">
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border-[2px] border-ink bg-gradient-to-tr from-[#9945FF] to-[#14F195] text-navy-950 shadow-[0_2px_0_#0a1038]">
            <SolanaIcon width={24} height={24} />
          </div>
          <span className="font-display text-[24px] leading-none text-white t-stroke sw-3">SOLANA NETWORK</span>
        </div>
        <p className="mt-[6px] font-body text-[12px] font-extrabold text-skyg-300/80">
          Sign in with your Solana wallet to enter the garage
        </p>
      </div>

      <button
        type="button"
        disabled={connecting}
        onClick={p.onOpenWalletModal}
        className="group relative h-[76px] w-full animate-glow rounded-[18px] border-[3px] border-ink bg-gradient-to-b from-[#ffe05a] via-[#ffbf2a] to-[#ffa41c] shadow-[0_7px_0_#c9660e] transition-transform active:translate-y-[3px]"
      >
        <span className="flex items-center justify-center gap-[10px]">
          <span className="relative flex h-[44px] w-[44px] items-center justify-center rounded-full border-[3px] border-ink bg-gradient-to-b from-[#9ef05a] to-[#3d9a1f] text-white shadow-[0_3px_0_#1f5a10]">
            <WalletIcon width={26} height={26} className="text-[#dfe6f3]" />
          </span>
          <span className="font-display text-[27px] tracking-wide text-flame-500 t-stroke sw-5 sc-white">
            {connecting ? t.connectingWallet : t.connectWallet}
          </span>
        </span>
      </button>

      <div className="my-[14px] flex items-center gap-[10px] font-body text-[11px] font-black tracking-[0.18em] text-white/45">
        <span className="h-[2px] flex-1 rounded bg-white/15" />
        {t.selectWallet}
        <span className="h-[2px] flex-1 rounded bg-white/15" />
      </div>

      <div className="grid grid-cols-3 gap-[10px]" dir="ltr">
        {slots.map((s) => (
          <SlotButton
            key={s.wallet.id}
            className={cn("h-[76px] w-full rounded-[18px]", selectedWallet === s.wallet.id && "ring-2 ring-mint-400")}
            labelClassName="text-[9px] tracking-[0.02em]"
            icon={s.icon}
            label={s.label}
            onClick={() => p.onConnectWallet(s.wallet)}
          />
        ))}
      </div>

      <button
        type="button"
        disabled={connecting}
        onClick={p.onDemoConnect}
        className="mt-[14px] flex w-full items-center justify-between rounded-[14px] border-[2px] border-mint-500/50 bg-navy-950/70 px-[14px] py-[9px] transition-all hover:border-mint-400 hover:bg-navy-800/80 active:translate-y-[2px]"
      >
        <div className="flex items-center gap-[8px]">
          <SolanaIcon width={18} height={18} />
          <span className="font-display text-[15px] tracking-wide text-mint-400">{t.demoWallet}</span>
        </div>
        <span className="font-body text-[11px] font-black text-white/40">{t.demoWalletDesc}</span>
      </button>
    </div>
  );
}

/* ---------------- Connected Driver Panel ---------------- */
function DriverPanel(p: DesktopViewProps) {
  const { t, player, garage } = p;
  const [copied, setCopied] = useState(false);
  if (!player) return null;

  const car = garage.car;
  const stats = carStats(car, garage.levels);

  const copy = () => {
    if (!player.walletAddress) return;
    try {
      void navigator.clipboard.writeText(player.walletAddress);
      setCopied(true);
      p.onCopied?.();
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={cn(PANEL, "animate-slide-up")}>
      <PanelTag>{t.welcomeBack}</PanelTag>

      <div className="mb-[12px] flex items-center gap-[14px]">
        <CarFace car={car} size={76} className="shrink-0 border-[4px] border-skyg-300 shadow-[0_4px_0_#0a1038]" />
        <div className="min-w-0">
          <div className="font-body text-[10px] font-black tracking-wider text-white/45">{t.equipped}</div>
          <div className="truncate font-display text-[24px] leading-tight text-white t-stroke sw-4">{car.name}</div>
          <button
            type="button"
            onClick={copy}
            className="mt-[2px] flex items-center gap-[6px] font-mono text-[13px] font-black text-amber-400 hover:underline"
            title={player.walletAddress}
          >
            <span>{shortenAddress(player.walletAddress, 6)}</span>
            <CopyIcon width={13} height={13} className={copied ? "text-mint-400" : "text-white/40"} />
          </button>
        </div>
      </div>

      <div className="space-y-[7px]">
        {(
          [
            [t.playerId, `#${player.id}`, "text-amber-400"],
            [t.topSpeed, `${stats.topSpeed} ${t.kmh}`, "text-mint-400"],
            [t.armor, String(stats.armor), "text-skyg-300"],
            [t.power, String(stats.power), "text-amber-400"],
          ] as [string, string, string][]
        ).map(([label, value, color]) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-[14px] border-[3px] border-ink bg-navy-950/60 px-[14px] py-[7px] font-body text-[13px] font-black tracking-wider"
          >
            <span className="text-white/60">{label}</span>
            <span className={color}>{value}</span>
          </div>
        ))}
      </div>

      {/* run reward — hidden completely when there is nothing to collect */}
      {garage.runReward > 0 && (
        <button
          type="button"
          id="driver-collect"
          onClick={garage.onCollect}
          className="mt-[12px] flex w-full items-center justify-between gap-[8px] rounded-[14px] border-[3px] border-ink bg-gradient-to-r from-[#ffd23a] to-[#ff9a1f] px-[12px] py-[7px] shadow-[0_4px_0_#b96a08] transition-transform active:translate-y-[2px]"
        >
          <span className="flex min-w-0 items-center gap-[5px]">
            <CoinIcon width={18} height={18} className="shrink-0" />
            <span className="font-display text-[18px] leading-none text-ink" dir="ltr">
              +{garage.runReward.toLocaleString("en-US")}
            </span>
            <span className="truncate font-body text-[9px] font-black tracking-wider text-ink/55">
              {t.lastChase}
            </span>
          </span>
          <span className="shrink-0 rounded-full border-[3px] border-ink bg-mint-500 px-[11px] py-[2px] font-display text-[14px] leading-none text-ink shadow-[0_2px_0_#1b7a42]">
            {t.collect}
          </span>
        </button>
      )}

      <button
        type="button"
        onClick={p.onStartChase}
        className="group relative mt-[12px] h-[80px] w-full animate-glow rounded-[18px] border-[3px] border-ink bg-gradient-to-b from-[#ffe05a] via-[#ffbf2a] to-[#ffa41c] shadow-[0_7px_0_#c9660e] transition-transform active:translate-y-[3px]"
      >
        <span className="flex items-center justify-center gap-[10px]">
          <span className="relative flex h-[44px] w-[44px] items-center justify-center rounded-full border-[3px] border-ink bg-gradient-to-b from-[#6fcf36] to-[#3d9a1f] text-white shadow-[0_3px_0_#1f5a10]">
            <CrosshairIcon width={28} height={28} />
          </span>
          <span className="font-display text-[26px] tracking-wide text-flame-500 t-stroke sw-5 sc-white">{t.startChase}</span>
          <ArrowRightIcon width={24} height={24} className="text-ink rtl:-scale-x-100" />
        </span>
      </button>

      <button
        type="button"
        onClick={p.onLogout}
        className="mt-[12px] flex h-[50px] w-full items-center justify-center gap-[8px] rounded-[16px] border-[3px] border-ink bg-gradient-to-b from-navy-600 to-navy-800 font-display text-[18px] text-white t-stroke sw-3 shadow-[0_4px_0_#0a1038] transition-all hover:brightness-125 active:translate-y-[2px] active:shadow-none"
      >
        <UndoIcon width={22} height={22} />
        {t.disconnectWallet}
      </button>
    </div>
  );
}

/* ---------------- Car Roster (owned cars only) ---------------- */
function Roster({
  cars: ownedCars,
  viewIdx,
  onSelect,
}: {
  cars: Car[];
  viewIdx: number;
  onSelect: (i: number) => void;
}) {
  const scroll = useDragScroll(viewIdx, ownedCars.length);
  return (
    <div
      ref={scroll.ref}
      {...scroll.dragProps}
      className="drag-x no-scrollbar absolute inset-x-[44px] top-0 z-10 overflow-x-auto"
      dir="ltr"
    >
      <div className="mx-auto flex w-max gap-[10px] px-[6px] pb-[6px] pt-[4px]">
        {ownedCars.map((c, i) => {
          const active = i === viewIdx;
          return (
            <button
              key={c.id}
              type="button"
              aria-current={active}
              data-active={active}
              aria-label={`${c.cls} ${c.name}`}
              title={`${c.cls} ${c.name}`}
              onClick={() => onSelect(i)}
              className={cn(
                "relative h-[52px] w-[52px] rounded-full border-[3px] transition-all",
                active
                  ? "scale-110 border-white shadow-[0_0_0_3px_rgba(111,193,255,0.55),0_4px_0_#0a1038]"
                  : "border-[#3a4f9a] opacity-75 shadow-[0_4px_0_#0a1038] hover:scale-105 hover:opacity-100",
              )}
            >
              <CarFace car={c} size={46} />
              <span
                className="absolute -bottom-[2px] -right-[2px] h-[15px] w-[15px] rounded-full border-[2.5px] border-ink"
                style={{ background: c.rarityColor }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Footer ---------------- */
function Footer(p: DesktopViewProps) {
  const { t } = p;
  return (
    <footer className="flex h-[50px] shrink-0 items-center justify-between border-t-[3px] border-[#4d86e8] bg-[#17245f] px-[36px]">
      <button
        type="button"
        onClick={p.screen === "home" ? p.onLogout : p.onExit}
        className="flex h-[38px] items-center gap-[8px] rounded-[12px] border-[3px] border-[#4a62b4] bg-gradient-to-b from-navy-600 to-navy-800 px-[14px] font-display text-[16px] tracking-wide text-white shadow-[0_3px_0_#0a1038] transition-all hover:brightness-125 active:translate-y-[2px] active:shadow-none"
      >
        <UndoIcon width={20} height={20} />
        {p.screen === "home" ? t.logout : t.exit}
      </button>

      <div className="flex items-center gap-[22px] font-body text-[12px] font-extrabold text-white/60">
        <span className="flex items-center gap-[7px]">
          <Kbd>←</Kbd>
          <Kbd>→</Kbd>
          {t.hintHero}
        </span>
        <span className="flex items-center gap-[7px]">
          <Kbd>Enter</Kbd>
          {t.hintSubmit}
        </span>
        <span className="flex items-center gap-[7px]">
          <Kbd>Esc</Kbd>
          {t.hintClose}
        </span>
      </div>

      <div className="flex items-center gap-[6px] font-body text-[12px] font-black tracking-wider text-white/55" dir="ltr">
        <PoliceLightIcon width={16} height={16} />
        <span>HEAT CHASE v1.5.0</span>
      </div>
    </footer>
  );
}

/* ---------------- Root ---------------- */
export function DesktopView(p: DesktopViewProps) {
  const { t, lang, viewCar, viewStats } = p;
  const loggedIn = p.screen === "home" && !!p.player;

  const tabs: [RightTab, string][] = [
    ["garage", t.garage],
    ["tasks", t.tabTasks],
    ["race", t.tabRace],
    ["news", t.tabNews],
  ];

  return (
    <div className="relative flex h-full flex-col">
      <TopBar {...p} />

      <div className="relative grid min-h-0 flex-1 grid-cols-[370px_minmax(0,1fr)_350px] gap-[24px] px-[34px] pb-[10px] pt-[8px]">
        {/* left: login or driver card */}
        <aside className="flex min-h-0 items-center">
          {loggedIn ? <DriverPanel {...p} /> : <SolanaLoginPanel {...p} />}
        </aside>

        {/* centre: car stage */}
        <section className="relative flex min-w-0 flex-col items-center">
          <div className="-mt-[14px] w-[560px] shrink-0">
            <TitleBanner
              small={viewCar.cls}
              big={viewCar.name}
              tag={viewCar.rarity}
              tagColor={viewCar.rarityColor}
              accent={viewCar.accent}
            />
          </div>

          <div className="relative min-h-0 w-full flex-1">
            <CarShowcase
              variant="desktop"
              car={viewCar}
              onPrev={p.onPrev}
              onNext={p.onNext}
              hasMultiple={p.ownedCars.length > 1}
            />
            <Roster cars={p.ownedCars} viewIdx={p.viewIdx} onSelect={p.onSelectCar} />
          </div>

          <div className="w-full shrink-0 space-y-[10px] pt-[4px]">
            <StatPills stats={viewStats} tier={viewCar.tier} powerLabel={t.power} lvLabel={t.lv} />
            <StatsRow
              stats={viewStats}
              coins={p.garage.coins}
              className="px-[4px]"
              onCoinsClick={p.onOpenCoinShop}
              labels={{ coins: t.coins, topSpeed: t.topSpeed, armor: t.armor, kmh: t.kmh }}
            />
          </div>
        </section>

        {/* right: shop / garage / news */}
        <aside className="absolute bottom-[-2px] end-[34px] top-[8px] z-20 flex w-[350px] flex-col">
          <div className="absolute -top-[4px] left-1/2 z-10 flex -translate-x-1/2 rounded-full border-[3px] border-ink bg-navy-950 p-[3px]">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => p.onRightTab(key)}
                className={cn(
                  "relative min-w-[60px] whitespace-nowrap rounded-full px-[9px] py-[4px] font-display text-[13px] tracking-wide transition-colors",
                  p.rightTab === key
                    ? "bg-gradient-to-b from-[#ffd23a] to-[#ff9a1f] text-white t-stroke sw-3"
                    : "text-white/55 hover:text-white",
                )}
              >
                {label}
                {key === "tasks" && p.taskBadge > 0 && (
                  <span className="absolute -right-[6px] -top-[6px] flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-[2px] border-ink bg-[#ff4f1f] px-[3px] font-body text-[9px] font-black text-white">
                    {p.taskBadge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {p.rightTab === "news" ? (
            <NewsPanel items={t.news} title={t.tabNews} className="inset-x-0 bottom-0 top-[26px]" closeLabel={t.close} moreLabel={t.details} />
          ) : (
            <div
              key={p.rightTab}
              className="absolute inset-x-0 bottom-0 top-[26px] animate-slide-up rounded-[22px] border-[4px] border-ink bg-navy-950/80 px-[12px] pb-[12px] pt-[26px] shadow-[0_8px_0_#060a28,0_0_0_3px_rgba(120,200,255,0.35)] backdrop-blur-[2px]"
            >
              {p.rightTab === "race" ? (
                <RacePanel t={t} lang={lang} {...p.race} dense className="h-full" />
              ) : p.rightTab === "tasks" ? (
                <TasksPanel
                  t={t}
                  lang={lang}
                  tasks={p.tasks}
                  coins={p.garage.coins}
                  onClaim={p.onClaimTask}
                  daily={p.daily}
                  onClaimDaily={p.onClaimDaily}
                  dense
                  className="h-full"
                />
              ) : (
                <GarageView
                  t={t}
                  garage={p.garage}
                  ownedCars={p.ownedCars}
                  onEquip={p.onEquip}
                  showStats
                  floating={false}
                  className="h-full"
                />
              )}
            </div>
          )}
        </aside>
      </div>

      <Footer {...p} />
    </div>
  );
}
