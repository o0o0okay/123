import { useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import type { Lang, Strings } from "@/i18n";
import {
  BoltIcon,
  CarIcon,
  ChevronIcon,
  ClipboardIcon,
  CoinIcon,
  FlagIcon,
  GearIcon,
  GiftIcon,
  HomeIcon,
  MegaphoneIcon,
  StarBurstIcon,
  StoreIcon,
} from "@/icons";

/** Tabs the home dock can switch the right-hand panel to. */
export type DockTab = "garage" | "tasks" | "race" | "news";

export interface GameSidebarProps {
  t: Strings;
  lang: Lang;
  /** right-panel tab currently shown, used for the green active marker */
  activeTab: DockTab;
  onTab: (tab: DockTab) => void;
  onOpenDealer: () => void;
  onOpenStaking: () => void;
  onOpenNft: () => void;
  onOpenCoinShop: () => void;
  onOptions: () => void;
  /** copies the referral link for the connected driver */
  onInvite: () => void;
  taskBadge: number;
}

interface DockItem {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  /** mint marker + green text (right-panel tab currently open) */
  active?: boolean;
  badge?: number;
  /** icon colour of the tile (markets keep their top-bar colour) */
  tone?: string;
}

const RAIL = 50; // collapsed width (fits the empty strip next to the card)
const OPEN = 184; // expanded width
const LABEL = 112; // label column width

/**
 * Left-edge navigation dock of the home screen.
 *
 * Collapsed it is a slim icon rail sitting in the empty margin next to the
 * driver card (exactly the slot marked on the design); hovering / focusing it
 * slides the labels out over the stage, and the chevron at the bottom pins it
 * open (needed on touch screens, where there is no hover).
 */
export function GameSidebar(p: GameSidebarProps) {
  const { t, lang, taskBadge } = p;
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const expanded = pinned || hovered || focused;

  const label = cn(
    "overflow-hidden whitespace-nowrap text-start transition-[width,opacity] duration-200 ease-out",
    expanded ? "w-[var(--dock-label)] opacity-100 delay-100" : "w-0 opacity-0",
  );

  const nav: DockItem[] = [
    { id: "home", label: t.navHome, icon: <HomeIcon width={17} height={17} />, onClick: () => p.onTab("garage"), active: p.activeTab === "garage" },
    {
      id: "tasks",
      label: t.tabTasks,
      icon: <ClipboardIcon width={17} height={17} />,
      onClick: () => p.onTab("tasks"),
      active: p.activeTab === "tasks",
      badge: taskBadge,
    },
    { id: "race", label: t.tabRace, icon: <FlagIcon width={17} height={17} />, onClick: () => p.onTab("race"), active: p.activeTab === "race" },
    { id: "news", label: t.tabNews, icon: <MegaphoneIcon width={17} height={17} />, onClick: () => p.onTab("news"), active: p.activeTab === "news" },
  ];

  const markets: DockItem[] = [
    {
      id: "dealer",
      label: t.dealership,
      icon: <StoreIcon width={17} height={17} />,
      onClick: p.onOpenDealer,
      tone: "bg-[#ffd23a]/15 text-amber-400",
    },
    {
      id: "staking",
      label: t.staking,
      icon: <BoltIcon width={16} height={16} />,
      onClick: p.onOpenStaking,
      tone: "bg-mint-400/15 text-mint-400",
    },
    {
      id: "nft",
      label: t.nft,
      icon: <StarBurstIcon width={16} height={16} />,
      onClick: p.onOpenNft,
      tone: "bg-[#b48dff]/18 text-[#c4a7ff]",
    },
    {
      id: "coins",
      label: t.coinShop,
      icon: <CoinIcon width={16} height={16} />,
      onClick: p.onOpenCoinShop,
      tone: "bg-[#ffb020]/16 text-[#ffc94a]",
    },
  ];

  const renderItem = (item: DockItem) => (
    <button
      key={item.id}
      type="button"
      data-sidebar-item={item.id}
      data-sidebar-active={item.active ? "1" : undefined}
      aria-current={item.active ? "page" : undefined}
      aria-label={item.label}
      title={item.label}
      onClick={item.onClick}
      className={cn(
        "group/item relative flex h-[36px] w-full shrink-0 items-center gap-[7px] overflow-hidden rounded-[11px] ps-[4px] pe-[6px]",
        "transition-colors duration-150",
        expanded ? "justify-start" : "justify-center",
        item.active ? "bg-mint-400/10 text-mint-400" : "text-white/70 hover:bg-white/10 hover:text-white",
      )}
    >
      {/* active rail marker, flush with the dock edge like the reference */}
      {item.active && (
        <span className="absolute start-[-5px] top-1/2 h-[20px] w-[3px] -translate-y-1/2 rounded-full bg-mint-400 shadow-[0_0_10px_#46f0a0]" />
      )}
      <span
        className={cn(
          "relative flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-[8px] border-[2px] transition-colors",
          item.tone
            ? cn(item.tone, "border-transparent")
            : item.active
              ? "border-mint-400/40 bg-mint-400/15"
              : "border-transparent bg-white/5 group-hover/item:bg-white/10",
        )}
      >
        {item.icon}
        {!!item.badge && item.badge > 0 && (
          <span className="absolute -end-[4px] -top-[4px] flex h-[15px] min-w-[15px] items-center justify-center rounded-full border-[2px] border-[#0a1230] bg-flame-500 px-[2px] font-body text-[8px] font-black leading-none text-white">
            {item.badge}
          </span>
        )}
      </span>
      <span className={label}>{item.label}</span>
    </button>
  );

  /* the chevron always points towards the panel it would reveal */
  const flip = lang === "fa"; // the dock sits at the inline start edge, so it mirrors in Persian
  const rotate = expanded !== flip;

  return (
    <div className="pointer-events-none absolute inset-y-0 start-0 z-30 flex items-center py-[8px] ps-[6px]">
      <nav
        data-sidebar=""
        data-expanded={expanded ? "1" : undefined}
        data-pinned={pinned ? "1" : undefined}
        aria-label={t.menu}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
        }}
        style={
          {
            "--dock-label": `${LABEL}px`,
            "--dock-open": `${OPEN}px`,
            "--dock-rail": `${RAIL}px`,
          } as CSSProperties
        }
        className={cn(
          "pointer-events-auto flex max-h-full flex-col overflow-hidden rounded-[20px] p-[5px]",
          "border-[2.5px] border-[#39468a] bg-[#0b1230]/95 backdrop-blur-[6px]",
          "shadow-[0_14px_34px_rgba(4,9,32,0.6),inset_0_1px_0_rgba(255,255,255,0.08)]",
          "transition-[width] duration-300 ease-out",
          expanded ? "w-[var(--dock-open)]" : "w-[var(--dock-rail)]",
        )}
      >
        {/* invite friend — the pill sits above the menu, like the reference */}
        <button
          type="button"
          data-sidebar-invite=""
          onClick={p.onInvite}
          aria-label={t.inviteFriend}
          title={t.inviteFriend}
          className={cn(
            "group/invite relative mb-[7px] flex h-[38px] w-full shrink-0 items-center gap-[7px] overflow-hidden rounded-[11px] px-[4px]",
            "border-[2px] border-[#5aa0ff]/70 bg-[linear-gradient(135deg,#1b3785_0%,#101d52_55%,#0a1230_100%)]",
            "shadow-[0_0_14px_rgba(80,150,255,0.28)] transition-all hover:border-[#8dc2ff] hover:brightness-110 active:translate-y-[1px]",
          )}
        >
          <span className="flex h-[25px] w-[25px] shrink-0 items-center justify-center rounded-[7px] bg-gradient-to-b from-[#8cc0ff] to-[#3d6bff] text-white shadow-[0_2px_0_#1c3aa8]">
            <GiftIcon width={15} height={15} />
          </span>
          <span className={cn(label, "flex flex-col leading-none")}>
            <span className="font-display text-[11px] tracking-wide text-white">{t.inviteFriend}</span>
            <span className="mt-[2px] font-body text-[7px] font-black tracking-[0.14em] text-skyg-300/70">
              {t.inviteForFriend}
            </span>
          </span>
        </button>

        <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-[2px] overflow-y-auto">
          {nav.map(renderItem)}
          <div className="my-[5px] h-[1px] w-full shrink-0 rounded bg-white/10" />
          {markets.map(renderItem)}
          <div className="my-[5px] h-[1px] w-full shrink-0 rounded bg-white/10" />
          {renderItem({
            id: "settings",
            label: t.options,
            icon: <GearIcon width={17} height={17} />,
            onClick: p.onOptions,
            tone: "bg-skyg-400/15 text-skyg-300",
          })}
        </div>

        {/* bottom row: version tag (expanded) + pin toggle */}
        <div className="mt-[6px] flex shrink-0 items-center gap-[6px] border-t-[1.5px] border-white/10 pt-[6px]">
          <button
            type="button"
            data-sidebar-toggle=""
            aria-expanded={pinned}
            aria-label={pinned ? t.collapseMenu : t.expandMenu}
            title={pinned ? t.collapseMenu : t.expandMenu}
            onClick={() => setPinned((v) => !v)}
            className={cn(
              "flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[8px] border-[2px] border-white/15",
              "bg-white/5 text-white/65 transition-all hover:border-mint-400/60 hover:bg-mint-400/10 hover:text-mint-400",
            )}
          >
            <ChevronIcon width={14} height={14} className={cn("transition-transform duration-300", rotate && "rotate-180")} />
          </button>
          <span className={cn(label, "flex items-center gap-[5px] font-body text-[8px] font-black tracking-[0.1em] text-white/35")}>
            <CarIcon width={12} height={12} />
            HEAT CHASE v1.5.0
          </span>
        </div>
      </nav>
    </div>
  );
}
