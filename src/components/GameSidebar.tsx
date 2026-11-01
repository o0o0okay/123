import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
  type SVGProps,
} from "react";
import { cn } from "@/utils/cn";
import type { Car } from "@/data/cars";
import type { Lang, Strings } from "@/i18n";
import type { StakingTab } from "./Staking";
import { useFullscreen } from "@/hooks";
import {
  BoltIcon,
  CarIcon,
  ChevronIcon,
  ClipboardIcon,
  CoinIcon,
  FlagIcon,
  FullscreenIcon,
  GearIcon,
  HistoryIcon,
  MegaphoneIcon,
  PlusIcon,
  SpeakerIcon,
  StarBurstIcon,
  StoreIcon,
} from "@/icons";
import { CarFace } from "./BottomBar";

/** Tabs the home dock can switch the right-hand panel to. */
export type DockTab = "garage" | "tasks" | "race" | "news" | "history";

/** one row of a dock item's accordion (e.g. the two views of the race panel) */
export interface DockSubItem {
  id: string;
  text: string;
  /** highlighted when the panel is currently showing this view */
  active: boolean;
  onSelect: () => void;
}

/** every clickable section of the dock */
export type DockId = DockTab | "dealer" | "staking" | "nft" | "coins";

/** children per section — only sections that hold tabs of their own have any */
export type DockSubs = Partial<Record<DockId, DockSubItem[]>>;

/** Width of the collapsed rail, in stage pixels (kept in sync with DesktopView). */
export const DOCK_RAIL = 56;
/** Width of the expanded dock, in stage pixels (kept in sync with DesktopView). */
export const DOCK_OPEN = 190;

const LABEL = 118; // label column width while expanded

/**
 * One optical glyph size per group — mixed sizes (and non-square boxes) made the
 * rail look uneven. Every icon sits centred in a fixed box so the rows line up.
 */
const ICON = { menu: 17, market: 14, util: 14, cta: 14, chevron: 10, hint: 7 } as const;
/** fixed hit/alignment box around a menu glyph (identical collapsed/expanded) */
const MENU_BOX = 26;
const MARKET_BOX = 22;
const UTIL_BOX = 26;

/**
 * Ink box of each rail icon inside the shared 24-unit grid: `[cx, cy, side]`,
 * measured from the rendered paths. The drawings do not fill that grid evenly
 * (the car ink is 20.8 × 10.9, the clipboard 14 × 19.5), so passing the same
 * `width` made every glyph a different size and nudged it off-centre. Reading
 * this table instead, `icon()` draws a square viewBox tight around the ink, so
 * one number means one true optical size and the glyph is centred to the pixel.
 */
const INK = {
  car: [12, 10.85, 20.8],
  clipboard: [12, 12.25, 19.5],
  flag: [11.65, 12, 19],
  megaphone: [11.5, 12.5, 17],
  store: [12, 12.5, 18],
  bolt: [12, 12, 20],
  star: [12.05, 11.85, 20.1],
  coin: [12, 12, 21],
  speaker: [12.4, 12, 18.8],
  gear: [12, 12, 20.6],
  fullscreen: [12, 12, 16],
  plus: [12, 12, 15],
  chevron: [12.75, 12, 13],
  history: [12, 12, 19.4],
} as const satisfies Record<string, readonly [number, number, number]>;

type GlyphName = keyof typeof INK;
type GlyphProps = SVGProps<SVGSVGElement>;

/** render an icon at a given optical (ink) size, centred in its own box */
function icon<E extends object = object>(
  Icon: ComponentType<GlyphProps & E>,
  name: GlyphName,
  size: number,
  extra?: E,
) {
  const [cx, cy, side] = INK[name];
  const half = side / 2;
  const viewBox = `${(cx - half).toFixed(2)} ${(cy - half).toFixed(2)} ${side} ${side}`;
  const props = { width: size, height: size, viewBox, ...extra } as GlyphProps & E;
  return <Icon {...props} />;
}

export interface GameSidebarProps {
  t: Strings;
  lang: Lang;
  /** driver name shown under the greeting */
  playerName: string;
  /** car used as the profile avatar (the one being driven) */
  car: Car;
  soundOn: boolean;
  /** right-panel tab currently shown, used for the amber active pill */
  activeTab: DockTab;
  onTab: (tab: DockTab) => void;
  onOpenDealer: () => void;
  /** opens the staking screen; the dock's children pick one of its tabs */
  onOpenStaking: (tab?: StakingTab) => void;
  onOpenNft: () => void;
  onOpenCoinShop: () => void;
  onToggleSound: () => void;
  onToggleLang: () => void;
  onOptions: () => void;
  /** copies the referral link for the connected driver */
  onInvite: () => void;
  taskBadge: number;
  /** accordion children of the sections that have tabs of their own */
  subs?: DockSubs;
  /** reports every open/close so the layout can make room for the dock */
  onExpandedChange?: (open: boolean) => void;
}

/**
 * Left-edge navigation dock of the home screen.
 *
 * Collapsed it is a slim rail in the gutter next to the driver card. It is
 * opened by a deliberate click (the profile button or the rail itself) — never
 * by hovering, so moving the pointer across the edge of the screen cannot
 * disturb the home board. Opening compacts the layout to make room; a click on
 * the chevron, anywhere outside, or Escape closes it again.
 */
export function GameSidebar(p: GameSidebarProps) {
  const { t, lang, taskBadge } = p;
  const fs = useFullscreen();
  const [open, setOpen] = useState(false);
  /** dock section whose accordion is out; only one section is ever unfolded */
  const [openSub, setOpenSub] = useState<DockId | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

  const expanded = open;
  const subsOf = (id: DockId) => p.subs?.[id] ?? [];

  // picking a section that holds tabs unfolds it, so its views are one click away.
  // Only the active tab is watched: `subs` is rebuilt by the parent on every
  // render and must not slam the curtain the player just opened.
  const subsRef = useRef(p.subs);
  subsRef.current = p.subs;
  useEffect(() => {
    const list = subsRef.current?.[p.activeTab];
    setOpenSub(list && list.length ? p.activeTab : null);
  }, [p.activeTab]);

  // let the home layout compact / relax around the dock
  const notify = p.onExpandedChange;
  useEffect(() => {
    notify?.(expanded);
  }, [expanded, notify]);

  // outside click + Escape close the panel
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const el = navRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => setOpen((v) => !v);

  /** a click on the empty part of the rail opens it; clicks on a button are its own */
  const onRailClick = (e: React.MouseEvent<HTMLElement>) => {
    if (open) return;
    if ((e.target as HTMLElement).closest("button")) return;
    setOpen(true);
  };

  /* label column: collapses to zero width so the rail stays centred */
  const label = cn(
    "overflow-hidden whitespace-nowrap text-start transition-all duration-200 ease-out",
    expanded ? "w-[var(--dock-label)] opacity-100 delay-75" : "w-0 opacity-0",
  );

  const menu: { id: DockTab; text: string; icon: ReactNode; badge?: number }[] = [
    { id: "garage", text: t.garage, icon: icon(CarIcon, "car", ICON.menu) },
    { id: "tasks", text: t.tabTasks, icon: icon(ClipboardIcon, "clipboard", ICON.menu), badge: taskBadge },
    { id: "race", text: t.tabRace, icon: icon(FlagIcon, "flag", ICON.menu) },
    { id: "news", text: t.tabNews, icon: icon(MegaphoneIcon, "megaphone", ICON.menu) },
    { id: "history", text: t.historyTitle, icon: icon(HistoryIcon, "history", ICON.menu) },
  ];

  const markets: { id: string; text: string; icon: ReactNode; onClick: () => void; tone: string }[] = [
    {
      id: "dealer",
      text: t.dealership,
      icon: icon(StoreIcon, "store", ICON.market),
      onClick: p.onOpenDealer,
      tone: "bg-amber-400/15 text-amber-400",
    },
    {
      id: "staking",
      text: t.staking,
      icon: icon(BoltIcon, "bolt", ICON.market),
      onClick: () => p.onOpenStaking(),
      tone: "bg-mint-400/15 text-mint-400",
    },
    {
      id: "nft",
      text: t.nft,
      icon: icon(StarBurstIcon, "star", ICON.market),
      onClick: p.onOpenNft,
      tone: "bg-[#b48dff]/18 text-[#c4a7ff]",
    },
    {
      id: "coins",
      text: t.coinShop,
      icon: icon(CoinIcon, "coin", ICON.market),
      onClick: p.onOpenCoinShop,
      tone: "bg-[#ffb020]/16 text-[#ffc94a]",
    },
  ];

  /** section label (expanded) or a hairline divider (rail) */
  const section = (text: string, count: number) =>
    expanded ? (
      <div className="mt-[8px] mb-[3px] flex w-full shrink-0 items-center gap-[4px] px-[7px]">
        <span className="whitespace-nowrap font-body text-[8.5px] font-black uppercase tracking-[0.15em] text-skyg-300/55">
          {text} <span className="text-white/25">· {count}</span>
        </span>
        {icon(ChevronIcon, "chevron", 9, { className: "ms-auto shrink-0 text-white/20" })}
      </div>
    ) : (
      <div className="my-[6px] h-[2px] w-[20px] shrink-0 self-center rounded-full bg-white/12" />
    );

  /* ---------------- rows ---------------- */

  /**
   * The curtain: a grid whose row track goes 0fr → 1fr, so the children slide
   * out under their parent. It is a sibling of the row — never nested inside
   * its button — and is closed to clicks while folded.
   */
  const curtain = (id: DockId, subs: DockSubItem[]) => {
    const unfolded = expanded && openSub === id;
    return (
      <div
        data-sidebar-curtain={id}
        aria-hidden={!unfolded}
        className={cn(
          "grid transition-all duration-300 ease-out",
          unfolded ? "mt-[1px] grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="relative flex flex-col gap-[1px] py-[2px]">
            {/* guide line that ties the children to their parent row */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-[14px] start-[20px] w-[2px] rounded-full bg-white/12"
            />
            {subs.map((sub) => (
              <button
                key={sub.id}
                type="button"
                tabIndex={unfolded ? undefined : -1}
                data-sidebar-sub={`${id}:${sub.id}`}
                data-sidebar-sub-active={sub.active ? "1" : undefined}
                aria-current={sub.active ? "true" : undefined}
                onClick={() => {
                  sub.onSelect();
                  setOpenSub(id);
                }}
                className={cn(
                  "relative ms-[30px] flex h-[24px] items-center rounded-[7px] pe-[7px] ps-[11px] text-start transition-colors",
                  sub.active
                    ? "bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                    : "text-white/55 hover:bg-white/8 hover:text-white",
                )}
              >
                {/* elbow that meets the guide line */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute start-[-10px] top-1/2 h-[2px] w-[10px] -translate-y-1/2",
                    sub.active ? "bg-amber-400/70" : "bg-white/12",
                  )}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "me-[7px] h-[5px] w-[5px] shrink-0 rounded-full",
                    sub.active ? "bg-amber-400" : "bg-white/25",
                  )}
                />
                <span className="overflow-hidden whitespace-nowrap font-body text-[11px] font-extrabold tracking-wide">
                  {sub.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Top group: icon + label, amber pill when current (same look as the panel
   * tabs). Sections that hold tabs of their own get an accordion: the chevron
   * unfolds their views right under the row, like a curtain.
   */
  const menuRow = (m: (typeof menu)[number]) => {
    const active = p.activeTab === m.id;
    const subs = subsOf(m.id);
    const hasChildren = subs.length > 0;
    const unfolded = expanded && openSub === m.id;
    /** row click lands on the section and pulls its curtain down */
    const pick = () => {
      p.onTab(m.id);
      setOpenSub(hasChildren ? m.id : null);
    };

    return (
      <div key={m.id} className="relative shrink-0">
        <button
          type="button"
          data-sidebar-item={m.id}
          data-sidebar-active={active ? "1" : undefined}
          data-sidebar-unfolded={unfolded ? "1" : undefined}
          aria-current={active ? "page" : undefined}
          aria-label={m.text}
          aria-expanded={hasChildren ? unfolded : undefined}
          title={m.text}
          onClick={pick}
          className={cn(
            "relative flex h-[31px] w-full shrink-0 items-center gap-[9px] rounded-[11px] transition-all duration-150",
            expanded ? "ps-[7px]" : "justify-center",
            // leave room for the accordion chevron on the end side
            expanded ? (hasChildren ? "pe-[24px]" : "pe-[8px]") : "",
            active
              ? "bg-gradient-to-b from-[#ffd23a] to-[#ff9a1f] shadow-[0_3px_0_#9a4a08]"
              : "text-white/70 hover:bg-white/10 hover:text-white",
          )}
        >
          <span
            data-sidebar-glyph="menu"
            style={{ width: MENU_BOX, height: MENU_BOX }}
            className={cn(
              "relative flex shrink-0 items-center justify-center",
              active ? "text-[#5c3306]" : "text-skyg-300/70",
            )}
          >
            {m.icon}
          </span>
          <span
            className={cn(
              label,
              "font-display text-[11.5px] tracking-wide",
              active ? "text-[#4a2a00]" : "text-white/80",
            )}
          >
            {m.text}
          </span>
          {!!m.badge && m.badge > 0 && (
            <span
              data-sidebar-badge=""
              className={cn(
                "absolute flex items-center justify-center rounded-full border-[2px] border-ink bg-flame-500 font-body font-black leading-none text-white",
                expanded
                  ? cn("top-1/2 h-[16px] min-w-[16px] -translate-y-1/2 px-[4px] text-[9px]", hasChildren ? "end-[25px]" : "end-[6px]")
                  : "-end-[2px] -top-[3px] h-[15px] min-w-[15px] px-[3px] text-[8.5px]",
              )}
            >
              {m.badge}
            </span>
          )}
        </button>

        {/* the curtain itself: a sibling button so no button nests in another */}
        {hasChildren && expanded && (
          <button
            type="button"
            data-sidebar-accordion={m.id}
            aria-expanded={unfolded}
            aria-label={unfolded ? t.collapseMenu : t.expandMenu}
            title={unfolded ? t.collapseMenu : t.expandMenu}
            onClick={(e) => {
              e.stopPropagation();
              setOpenSub(unfolded ? null : m.id);
            }}
            className={cn(
              "absolute end-[3px] top-[6px] flex h-[19px] w-[19px] items-center justify-center rounded-[6px] transition-colors",
              active ? "text-[#5c3306]/70 hover:bg-[#5c3306]/15" : "text-white/40 hover:bg-white/10 hover:text-white",
            )}
          >
            {icon(ChevronIcon, "chevron", 10, {
              className: cn(
                "transition-transform duration-300",
                unfolded ? "rotate-90" : flip ? "rotate-180" : undefined,
              ),
            })}
          </button>
        )}

        {hasChildren && expanded && curtain(m.id, subs)}
      </div>
    );
  };

  /**
   * Second group: inset card, one coloured glyph per market. A market that has
   * tabs of its own (staking) unfolds them under its tile the same way.
   */
  const marketRow = (m: (typeof markets)[number]) => {
    const id = m.id as DockId;
    const subs = subsOf(id);
    const hasChildren = subs.length > 0;
    const unfolded = expanded && openSub === id;

    return (
      <div key={m.id} className="relative shrink-0">
        <button
          type="button"
          data-sidebar-item={m.id}
          data-sidebar-children={hasChildren ? "1" : undefined}
          aria-label={m.text}
          aria-expanded={hasChildren ? unfolded : undefined}
          title={m.text}
          onClick={() => {
            m.onClick();
            if (hasChildren) setOpenSub(id);
          }}
          className={cn(
            "flex h-[28px] w-full shrink-0 items-center gap-[8px] rounded-[9px] transition-colors hover:bg-white/10",
            expanded ? "ps-[5px]" : "justify-center",
            expanded ? (hasChildren ? "pe-[21px]" : "pe-[6px]") : "",
          )}
        >
          <span
            data-sidebar-glyph="market"
            style={{ width: MARKET_BOX, height: MARKET_BOX }}
            className={cn("flex shrink-0 items-center justify-center rounded-[7px]", m.tone)}
          >
            {m.icon}
          </span>
          <span className={cn(label, "font-body text-[11px] font-extrabold tracking-wide text-white/75")}>{m.text}</span>
        </button>

        {hasChildren && expanded && (
          <button
            type="button"
            data-sidebar-accordion={m.id}
            aria-expanded={unfolded}
            aria-label={unfolded ? t.collapseMenu : t.expandMenu}
            title={unfolded ? t.collapseMenu : t.expandMenu}
            onClick={(e) => {
              e.stopPropagation();
              setOpenSub(unfolded ? null : id);
            }}
            className="absolute end-[2px] top-[5px] flex h-[18px] w-[18px] items-center justify-center rounded-[6px] text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            {icon(ChevronIcon, "chevron", 9, {
              className: cn(
                "transition-transform duration-300",
                unfolded ? "rotate-90" : flip ? "rotate-180" : undefined,
              ),
            })}
          </button>
        )}

        {hasChildren && expanded && curtain(id, subs)}
      </div>
    );
  };

  /** small square utility buttons (settings row) */
  const util = (opts: {
    key: string;
    label: string;
    icon: ReactNode;
    onClick: () => void;
    on?: boolean;
    tone: string;
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
      style={{ width: UTIL_BOX, height: UTIL_BOX }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[8px] border-[2px] transition-all",
        "active:translate-y-[1px]",
        opts.on ? "border-mint-400/70 bg-mint-400/15 text-mint-400" : cn("border-white/10 bg-navy-800/70 hover:brightness-125", opts.tone),
      )}
    >
      {opts.icon}
    </button>
  );

  const flip = lang === "fa"; // the dock hugs the inline-start edge, so it mirrors in Persian
  const rotate = expanded !== flip;

  return (
    <div className="pointer-events-none absolute inset-y-0 start-0 z-30 flex items-stretch py-[6px] ps-[6px]">
      <nav
        ref={navRef}
        data-sidebar=""
        data-expanded={expanded ? "1" : undefined}
        data-pinned={expanded ? "1" : undefined}
        aria-label={t.menu}
        onClick={onRailClick}
        style={
          {
            "--dock-label": `${LABEL}px`,
            "--dock-open": `${DOCK_OPEN}px`,
            "--dock-rail": `${DOCK_RAIL}px`,
          } as CSSProperties
        }
        className={cn(
          "pointer-events-auto flex h-full max-h-full shrink-0 flex-col overflow-hidden rounded-[20px] p-[6px]",
          "border-[3px] border-ink",
          "bg-[linear-gradient(180deg,#1e2c6b_0%,#141d52_48%,#0b1236_100%)]",
          "shadow-[0_8px_0_#060a28,0_18px_34px_rgba(4,9,32,0.5),inset_0_1px_0_rgba(160,205,255,0.28)]",
          "transition-[width] duration-300 ease-out",
          expanded ? "w-[var(--dock-open)]" : "w-[var(--dock-rail)]",
        )}
      >
        {/* profile header — also the pin / close control */}
        <button
          type="button"
          data-sidebar-toggle=""
          aria-expanded={expanded}
          aria-label={expanded ? t.collapseMenu : t.expandMenu}
          title={expanded ? t.collapseMenu : t.expandMenu}
          onClick={toggle}
          className={cn(
            "flex w-full shrink-0 items-center gap-[8px] rounded-[12px] p-[2px] transition-colors hover:bg-white/10",
            !expanded && "justify-center",
          )}
        >
          <span className="relative shrink-0">
            <CarFace car={p.car} size={30} className="border-[2.5px] border-amber-400 shadow-[0_2px_0_#0a1038]" />
            {!expanded && (
              /* collapsed hint: the rail is opened with a click */
              <span
                data-sidebar-hint=""
                className="absolute -end-[3px] -bottom-[3px] flex h-[13px] w-[13px] items-center justify-center rounded-full border-[2px] border-ink bg-gradient-to-b from-[#ffd23a] to-[#ff9a1f] text-[#4a2a00]"
              >
                {icon(ChevronIcon, "chevron", ICON.hint, { className: rotate ? "rotate-180" : undefined })}
              </span>
            )}
          </span>
          <span className={cn(label, "flex min-w-0 flex-col leading-none")}>
            <span className="font-body text-[8px] font-black uppercase tracking-[0.14em] text-skyg-300/60">
              {t.goodDay}
            </span>
            <span className="mt-[3px] truncate font-display text-[13px] tracking-wide text-white">{p.playerName}</span>
          </span>
          {expanded && (
            <span className="ms-auto flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[7px] border-[2px] border-white/15 bg-navy-800/80 text-white/60">
{icon(ChevronIcon, "chevron", ICON.chevron, {
                className: cn("transition-transform duration-300", rotate && "rotate-180"),
              })}
            </span>
          )}
        </button>

        {/* scrolling body — keeps the rail usable on short screens */}
        <div className="no-scrollbar mt-[2px] flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {section(t.menu, menu.length)}
          <div className="flex flex-col gap-[2px]">{menu.map(menuRow)}</div>

          {section(t.marketsSection, markets.length)}
          <div className="flex flex-col gap-[1px] rounded-[12px] border-[2px] border-white/10 bg-navy-950/45 p-[3px]">
            {markets.map(marketRow)}
          </div>

          {section(t.settingsSection, 4)}
          <div
            className={cn(
              "flex rounded-[12px] border-[2px] border-white/10 bg-navy-950/45 p-[3px]",
              expanded ? "justify-between" : "flex-col items-center gap-[3px]",
            )}
          >
            {util({
              key: "sound",
              label: t.sound,
              icon: icon(SpeakerIcon, "speaker", ICON.util, { muted: !p.soundOn }),
              onClick: p.onToggleSound,
              on: p.soundOn,
              tone: "text-mint-400",
              attrs: { "data-sidebar-action": "sound" },
            })}
            {util({
              key: "lang",
              label: t.language,
              icon: <span className="font-display text-[9px] leading-none">{lang === "en" ? "فا" : "EN"}</span>,
              onClick: p.onToggleLang,
              tone: "text-skyg-300",
              attrs: { "data-sidebar-action": "lang" },
            })}
            {util({
              key: "fullscreen",
              label: t.fullscreen,
              icon: icon(FullscreenIcon, "fullscreen", ICON.util, { exit: fs.active }),
              onClick: fs.toggle,
              on: fs.active,
              tone: "text-skyg-300",
              attrs: { "data-sidebar-action": "fullscreen" },
            })}
            {util({
              key: "options",
              label: t.options,
              icon: icon(GearIcon, "gear", ICON.util),
              onClick: p.onOptions,
              tone: "text-amber-400",
              attrs: { "data-sidebar-item": "settings" },
            })}
          </div>

          {/* invite CTA, pinned to the bottom of the dock */}
          <div className="min-h-[8px] flex-1 shrink-0" aria-hidden="true" />
          <button
            type="button"
            data-sidebar-invite=""
            onClick={p.onInvite}
            aria-label={t.inviteFriend}
            title={t.inviteFriend}
            className={cn(
              "flex w-full shrink-0 items-center justify-center rounded-[13px] border-[2.5px] border-ink",
              "bg-gradient-to-b from-[#ffd23a] to-[#ff9a1f] py-[6px] shadow-[0_4px_0_#9a4a08]",
              "transition-all hover:brightness-110 active:translate-y-[2px] active:shadow-none",
              expanded ? "gap-[6px] px-[6px]" : "flex-col gap-[2px] px-0",
            )}
          >
            <span className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full border-[2px] border-ink bg-gradient-to-b from-[#9ef05a] to-[#3d9a1f] text-white shadow-[0_2px_0_#1f5a10]">
              {icon(PlusIcon, "plus", ICON.cta)}
            </span>
            <span className={cn(label, "flex flex-col leading-none", !expanded && "hidden")}>
              <span className="font-display text-[10.5px] tracking-wide text-[#4a2a00]">{t.inviteFriend}</span>
              <span className="mt-[2px] font-body text-[7px] font-black uppercase tracking-[0.1em] text-[#7a4a08]">
                {t.inviteForFriend}
              </span>
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}
