import { useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import type { Car } from "@/data/cars";
import type { Lang, Strings } from "@/i18n";
import { useFullscreen } from "@/hooks";
import {
  BoltIcon,
  ChevronIcon,
  ClipboardIcon,
  CoinIcon,
  FlagIcon,
  FullscreenIcon,
  GearIcon,
  HomeIcon,
  MegaphoneIcon,
  PlusIcon,
  SpeakerIcon,
  StarBurstIcon,
  StoreIcon,
} from "@/icons";
import { CarFace } from "./BottomBar";

/** Tabs the home dock can switch the right-hand panel to. */
export type DockTab = "garage" | "tasks" | "race" | "news";

export interface GameSidebarProps {
  t: Strings;
  lang: Lang;
  /** driver name shown under the greeting */
  playerName: string;
  /** car used as the profile avatar (the one being driven) */
  car: Car;
  soundOn: boolean;
  /** right-panel tab currently shown, used for the blue active pill */
  activeTab: DockTab;
  onTab: (tab: DockTab) => void;
  onOpenDealer: () => void;
  onOpenStaking: () => void;
  onOpenNft: () => void;
  onOpenCoinShop: () => void;
  onToggleSound: () => void;
  onToggleLang: () => void;
  onOptions: () => void;
  /** copies the referral link for the connected driver */
  onInvite: () => void;
  taskBadge: number;
}

const RAIL = 56; // collapsed width
const OPEN = 218; // expanded width
const LABEL = 144; // label column width

export function GameSidebar(p: GameSidebarProps) {
  const { t, lang, taskBadge } = p;
  const fs = useFullscreen();
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const expanded = pinned || hovered || focused;

  /* label column: collapses to zero width so the rail stays centred */
  const label = cn(
    "overflow-hidden whitespace-nowrap text-start transition-all duration-200 ease-out",
    expanded ? "w-[var(--dock-label)] opacity-100 delay-75" : "w-0 opacity-0",
  );

  const menu: { id: DockTab; text: string; icon: ReactNode; badge?: number }[] = [
    { id: "garage", text: t.navHome, icon: <HomeIcon width={16} height={16} /> },
    { id: "tasks", text: t.tabTasks, icon: <ClipboardIcon width={16} height={16} />, badge: taskBadge },
    { id: "race", text: t.tabRace, icon: <FlagIcon width={15} height={15} /> },
    { id: "news", text: t.tabNews, icon: <MegaphoneIcon width={16} height={16} /> },
  ];

  const markets: { id: string; text: string; icon: ReactNode; onClick: () => void; tile: string }[] = [
    {
      id: "dealer",
      text: t.dealership,
      icon: <StoreIcon width={12} height={12} />,
      onClick: p.onOpenDealer,
      tile: "bg-[#fff2d3] text-[#d98a06]",
    },
    {
      id: "staking",
      text: t.staking,
      icon: <BoltIcon width={12} height={12} />,
      onClick: p.onOpenStaking,
      tile: "bg-[#e2f8ec] text-[#12a56e]",
    },
    {
      id: "nft",
      text: t.nft,
      icon: <StarBurstIcon width={11} height={11} />,
      onClick: p.onOpenNft,
      tile: "bg-[#efe9ff] text-[#7c4dff]",
    },
    {
      id: "coins",
      text: t.coinShop,
      icon: <CoinIcon width={11} height={11} />,
      onClick: p.onOpenCoinShop,
      tile: "bg-[#fff6d8] text-[#d09a05]",
    },
  ];

  /* ---------------- section header ---------------- */
  const section = (text: string, count: number) =>
    expanded ? (
      <div className="mt-[7px] mb-[3px] flex w-full shrink-0 items-center gap-[4px] px-[6px]">
        <span className="whitespace-nowrap font-body text-[8.5px] font-black uppercase tracking-[0.15em] text-[#9aa7bd]">
          {text} <span className="text-[#c3cddc]">· {count}</span>
        </span>
        <ChevronIcon width={9} height={9} className="ms-auto shrink-0 text-[#c1cbda]" />
      </div>
    ) : (
      <div className="my-[5px] h-[1px] w-[18px] shrink-0 self-center rounded-full bg-[#c9d6e7]" />
    );

  /* ---------------- rows ---------------- */

  /** top group: plain icon + label, blue pill when current */
  const menuRow = (m: (typeof menu)[number]) => {
    const active = p.activeTab === m.id;
    return (
      <button
        key={m.id}
        type="button"
        data-sidebar-item={m.id}
        data-sidebar-active={active ? "1" : undefined}
        aria-current={active ? "page" : undefined}
        aria-label={m.text}
        title={m.text}
        onClick={() => p.onTab(m.id)}
        className={cn(
          "relative flex h-[30px] w-full shrink-0 items-center gap-[9px] rounded-[10px] transition-all duration-150",
          expanded ? "ps-[7px] pe-[8px]" : "justify-center",
          active
            ? "bg-[linear-gradient(180deg,#5197ff_0%,#2a6ceb_100%)] text-white shadow-[0_5px_12px_rgba(42,108,235,0.32)]"
            : "text-[#39445c] hover:bg-white/75",
        )}
      >
        <span
          className={cn(
            "relative flex shrink-0 items-center justify-center",
            active ? "text-white" : "text-[#8fa0b8]",
          )}
        >
          {m.icon}
        </span>
        <span className={cn(label, "font-body text-[12px] font-extrabold tracking-[0.01em]")}>{m.text}</span>
        {!!m.badge && m.badge > 0 && (
          <span
            data-sidebar-badge=""
            className={cn(
              "absolute flex items-center justify-center rounded-full bg-[#ff4d4f] font-body font-black leading-none text-white shadow-[0_2px_5px_rgba(255,77,79,0.5)]",
              expanded
                ? "end-[7px] top-1/2 h-[16px] min-w-[16px] -translate-y-1/2 px-[4px] text-[9px]"
                : "-end-[4px] -top-[4px] h-[15px] min-w-[15px] px-[3px] text-[8.5px]",
            )}
          >
            {m.badge}
          </span>
        )}
      </button>
    );
  };

  /** second group: sits inside the white "services" card, coloured tile per market */
  const marketRow = (m: (typeof markets)[number]) => (
    <button
      key={m.id}
      type="button"
      data-sidebar-item={m.id}
      aria-label={m.text}
      title={m.text}
      onClick={m.onClick}
      className={cn(
        "flex h-[27px] w-full shrink-0 items-center gap-[8px] rounded-[8px] transition-colors hover:bg-white",
        expanded ? "ps-[4px] pe-[6px]" : "justify-center",
      )}
    >
      <span className={cn("flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-[6px]", m.tile)}>
        {m.icon}
      </span>
      <span className={cn(label, "font-body text-[11.5px] font-bold text-[#45526b]")}>{m.text}</span>
    </button>
  );

  /** small square utility buttons (settings row) */
  const util = (opts: {
    key: string;
    label: string;
    icon: ReactNode;
    onClick: () => void;
    on?: boolean;
    tint: string;
    attrs?: Record<string, string>;
  }) => (
    <button
      key={opts.key}
      type="button"
      {...opts.attrs}
      aria-label={opts.label}
      title={opts.label}
      aria-pressed={opts.on}
      onClick={opts.onClick}
      className={cn(
        "flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[7px] transition-all",
        opts.on ? "bg-[#e8f1ff] text-[#2a6ceb]" : opts.tint,
      )}
    >
      {opts.icon}
    </button>
  );

  const flip = lang === "fa"; // the dock hugs the inline-start edge, so it mirrors in Persian
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
          "pointer-events-auto flex max-h-full flex-col overflow-hidden rounded-[22px] p-[6px]",
          "border border-white/80",
          "bg-[linear-gradient(165deg,rgba(255,255,255,0.95)_0%,rgba(238,246,255,0.89)_55%,rgba(227,240,255,0.93)_100%)]",
          "backdrop-blur-[14px]",
          "shadow-[0_18px_38px_rgba(9,32,84,0.28),inset_0_1px_0_rgba(255,255,255,0.95)]",
          "transition-[width] duration-300 ease-out",
          expanded ? "w-[var(--dock-open)]" : "w-[var(--dock-rail)]",
        )}
      >
        {/* window dots, like the reference card */}
        <div
          aria-hidden="true"
          className={cn("flex shrink-0 items-center gap-[4px] pb-[5px] pt-[1px]", expanded ? "ps-[6px]" : "justify-center")}
        >
          <span className="h-[5px] w-[5px] rounded-full bg-[#ff5f57]" />
          <span className="h-[5px] w-[5px] rounded-full bg-[#febc2e]" />
          <span className="h-[5px] w-[5px] rounded-full bg-[#28c840]" />
        </div>

        {/* profile + expand/collapse toggle */}
        <button
          type="button"
          data-sidebar-toggle=""
          aria-expanded={pinned}
          aria-label={pinned ? t.collapseMenu : t.expandMenu}
          title={pinned ? t.collapseMenu : t.expandMenu}
          onClick={() => setPinned((v) => !v)}
          className={cn(
            "flex w-full shrink-0 items-center gap-[8px] rounded-[12px] p-[2px] transition-colors hover:bg-white/70",
            !expanded && "justify-center",
          )}
        >
          <CarFace
            car={p.car}
            size={30}
            className="shrink-0 border-[2px] border-white shadow-[0_3px_9px_rgba(20,50,110,0.28)]"
          />
          <span className={cn(label, "flex min-w-0 flex-col leading-none")}>
            <span className="font-body text-[8px] font-black uppercase tracking-[0.14em] text-[#9aa7bd]">
              {t.goodDay}
            </span>
            <span className="mt-[3px] truncate font-display text-[13px] tracking-wide text-[#1d2740]">
              {p.playerName}
            </span>
          </span>
          {expanded && (
            <ChevronIcon
              width={11}
              height={11}
              className={cn(
                "ms-auto shrink-0 text-[#a9b5c7] transition-transform duration-300",
                rotate && "rotate-180",
              )}
            />
          )}
        </button>

        {/* scrolling body */}
        <div className="no-scrollbar mt-[4px] flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {section(t.menu, menu.length)}
          <div className="flex flex-col gap-[1px]">{menu.map(menuRow)}</div>

          {section(t.marketsSection, markets.length)}
          <div
            className={cn(
              "flex flex-col gap-[1px] rounded-[14px] border border-white/90 bg-white/80 p-[3px]",
              "shadow-[0_6px_16px_rgba(20,45,95,0.08)]",
            )}
          >
            {markets.map(marketRow)}
          </div>

          {section(t.settingsSection, 4)}
          <div
            className={cn(
              "flex gap-[2px] rounded-[12px] border border-white/90 bg-white/70 p-[3px]",
              expanded ? "justify-between" : "flex-col items-center",
            )}
          >
            {util({
              key: "sound",
              label: t.sound,
              icon: <SpeakerIcon width={13} height={13} muted={!p.soundOn} />,
              onClick: p.onToggleSound,
              on: p.soundOn,
              tint: "bg-[#e6f8ef] text-[#12a56e] hover:bg-[#d6f3e4]",
              attrs: { "data-sidebar-action": "sound" },
            })}
            {util({
              key: "lang",
              label: t.language,
              icon: (
                <span className="font-display text-[9px] leading-none">{lang === "en" ? "فا" : "EN"}</span>
              ),
              onClick: p.onToggleLang,
              tint: "bg-[#efe9ff] text-[#7c4dff] hover:bg-[#e6dcff]",
              attrs: { "data-sidebar-action": "lang" },
            })}
            {util({
              key: "fullscreen",
              label: t.fullscreen,
              icon: <FullscreenIcon width={13} height={13} exit={fs.active} />,
              onClick: fs.toggle,
              on: fs.active,
              tint: "bg-[#e6f1ff] text-[#2a6ceb] hover:bg-[#d8eaff]",
              attrs: { "data-sidebar-action": "fullscreen" },
            })}
            {util({
              key: "options",
              label: t.options,
              icon: <GearIcon width={13} height={13} />,
              onClick: p.onOptions,
              tint: "bg-[#fdecef] text-[#ef5a6f] hover:bg-[#fbdfe4]",
              attrs: { "data-sidebar-item": "settings" },
            })}
          </div>
        </div>

        {/* invite CTA — the blue "+" card at the bottom of the reference */}
        <button
          type="button"
          data-sidebar-invite=""
          onClick={p.onInvite}
          aria-label={t.inviteFriend}
          title={t.inviteFriend}
          className={cn(
            "mt-[6px] flex w-full shrink-0 flex-col items-center justify-center gap-[3px] rounded-[15px]",
            "border border-white/90 bg-white/90 py-[6px] transition-all",
            "shadow-[0_6px_16px_rgba(20,45,95,0.1)] hover:bg-white active:translate-y-[1px]",
          )}
        >
          <span className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-[linear-gradient(180deg,#5aa0ff_0%,#2a6ceb_100%)] text-white shadow-[0_6px_14px_rgba(42,108,235,0.45)]">
            <PlusIcon width={15} height={15} />
          </span>
          <span className={cn(label, "flex flex-col items-center leading-none")}>
            <span className="font-display text-[10.5px] tracking-wide text-[#1d2740]">{t.inviteFriend}</span>
            <span className="mt-[3px] font-body text-[7px] font-black uppercase tracking-[0.12em] text-[#9aa7bd]">
              {t.inviteForFriend}
            </span>
          </span>
        </button>
      </nav>
    </div>
  );
}
