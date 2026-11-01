import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import type { NewsItem } from "@/i18n";
import { CloseIcon, MegaphoneIcon } from "@/icons";

const TAG_COLORS = ["bg-[#ff9a1f]", "bg-mint-500", "bg-[#ff4f1f]", "bg-skyg-400"];

/**
 * News board (mobile tab + desktop right panel).
 *
 * Only the card list scrolls: the title banner is a normal flex item, so the
 * panel itself never moves and no card can be cut off by the frame.
 * Tapping a card opens the full story in a dialog; the body scrolls only when
 * the text is longer than the box, and there is exactly one dialog at a time
 * (`open` is a single item, so opening another story replaces the first).
 */
export function NewsPanel({
  items,
  title,
  className,
  closeLabel = "CLOSE",
  moreLabel = "DETAILS",
}: {
  items: NewsItem[];
  title: string;
  className?: string;
  /** label of the dismiss button inside a story */
  closeLabel?: string;
  /** hint on every card that it opens the full story */
  moreLabel?: string;
}) {
  const [open, setOpen] = useState<NewsItem | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  /** how far the list still has to go, so the edge can hint at more news */
  const [more, setMore] = useState(false);

  // a shorter list (or a resized frame) must not keep a stale "there is more" hint
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const measure = () => setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 6);
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      ro?.disconnect();
    };
  }, [items.length]);

  // Escape closes the story before it reaches the game shortcuts
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      setOpen(null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  return (
    <div className={cn("absolute inset-x-[28px] bottom-[14px] top-[18px] animate-slide-up", className)}>
      <div className="relative flex h-full flex-col overflow-hidden rounded-[24px] border-[4px] border-ink bg-navy-950/80 shadow-[0_8px_0_#060a28,0_0_0_3px_rgba(120,200,255,0.35)] backdrop-blur-[2px]">
        {/* title: part of the flow, so the frame never covers it and never scrolls */}
        <div className="relative z-10 flex shrink-0 justify-center px-[12px] pb-[10px] pt-[12px]">
          <div className="flex items-center gap-2 whitespace-nowrap rounded-[12px] border-[3px] border-ink bg-gradient-to-r from-[#ff7a1a] to-[#ffb32a] px-[20px] py-[4px] font-display text-[20px] text-white t-stroke sw-4 shadow-[0_4px_0_#9a4a08]">
            <MegaphoneIcon width={22} height={22} className="text-white drop-shadow" />
            {title}
          </div>
        </div>

        {/* the only scrolling element in the panel */}
        <div className="relative min-h-0 flex-1">
          <div
            ref={listRef}
            data-news-list=""
            className="thin-scroll h-full space-y-[10px] overflow-y-auto overscroll-contain px-[14px] pb-[16px] pt-[2px] [touch-action:pan-y]"
          >
            {items.map((n, i) => (
              <button
                key={n.title}
                type="button"
                data-news={i}
                onClick={() => setOpen(n)}
                aria-haspopup="dialog"
                className={cn(
                  "block w-full rounded-[16px] border-[3px] border-ink bg-gradient-to-b from-navy-700 to-navy-800 p-[12px] text-start",
                  "shadow-[inset_0_2px_0_rgba(255,255,255,0.08)] transition-transform hover:-translate-y-[1px] hover:brightness-110 active:translate-y-[1px]",
                )}
              >
                <div className="mb-[4px] flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "rounded-full border-[2px] border-ink px-[10px] py-[1px] font-body text-[11px] font-black tracking-wider text-ink",
                      TAG_COLORS[i % TAG_COLORS.length],
                    )}
                  >
                    {n.tag}
                  </span>
                  <span className="font-body text-[11px] font-bold text-white/50">{n.date}</span>
                </div>
                <h3 className="truncate font-display text-[19px] tracking-wide text-amber-400 t-stroke sw-3">{n.title}</h3>
                <p className="mt-[2px] line-clamp-2 font-body text-[13px] font-bold leading-snug text-white/85">{n.body}</p>
                <span className="mt-[6px] flex items-center justify-end gap-[3px] font-body text-[10px] font-black uppercase tracking-wider text-skyg-300/80">
                  {moreLabel}
                  <span className="text-[12px] leading-none">›</span>
                </span>
              </button>
            ))}
          </div>

          {/* soft edge: the list continues below the fold */}
          {more && (
            <div className="pointer-events-none absolute inset-x-[3px] bottom-[3px] h-[34px] rounded-b-[18px] bg-gradient-to-t from-navy-950 to-transparent" />
          )}
        </div>
      </div>

      {open && (
        <div
          // `fixed` inside the scaled game canvas covers the whole play area,
          // so the story is never clipped by the panel it came from
          className="fixed inset-0 z-[70] flex animate-fade-in items-center justify-center bg-navy-950/80 px-[20px] backdrop-blur-[3px]"
          role="dialog"
          aria-modal="true"
          aria-label={open.title}
          data-news-dialog={open.title}
          onClick={() => setOpen(null)}
        >
          <div
            className="relative w-full max-w-[420px] animate-slide-up rounded-[24px] border-[4px] border-ink bg-gradient-to-b from-navy-700 to-navy-900 p-[16px] pb-[14px] shadow-[0_12px_0_#060a28,0_30px_60px_rgba(0,0,0,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              data-news-close=""
              onClick={() => setOpen(null)}
              aria-label={closeLabel}
              className="absolute -right-[12px] -top-[12px] flex h-[38px] w-[38px] items-center justify-center rounded-full border-[3px] border-ink bg-gradient-to-b from-[#ff6b4a] to-[#e8381c] text-white shadow-[0_3px_0_#7a1a0c] transition-transform active:translate-y-[2px]"
            >
              <CloseIcon width={19} height={19} />
            </button>

            <div className="flex items-center justify-between gap-2 pe-[26px]">
              <span
                className={cn(
                  "rounded-full border-[2px] border-ink px-[10px] py-[1px] font-body text-[11px] font-black tracking-wider text-ink",
                  TAG_COLORS[Math.max(0, items.findIndex((x) => x.title === open.title)) % TAG_COLORS.length],
                )}
              >
                {open.tag}
              </span>
              <span className="font-body text-[11px] font-bold text-white/45">{open.date}</span>
            </div>

            <h3 className="mt-[8px] font-display text-[22px] leading-tight tracking-wide text-amber-400 t-stroke sw-3">
              {open.title}
            </h3>

            {/* long stories scroll inside the card instead of growing it */}
            <div
              data-news-body=""
              className="thin-scroll mt-[6px] max-h-[300px] overflow-y-auto overscroll-contain pe-[6px] font-body text-[13px] font-bold leading-relaxed text-white/85 [touch-action:pan-y]"
            >
              <p className="whitespace-pre-line">{open.body}</p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(null)}
              className="mt-[12px] w-full rounded-full border-[3px] border-ink bg-gradient-to-b from-[#6fb6ff] to-[#3d8ff5] py-[6px] font-display text-[16px] text-white shadow-[0_3px_0_#1b4a8a] transition-transform active:translate-y-[2px] active:shadow-none"
            >
              {closeLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
