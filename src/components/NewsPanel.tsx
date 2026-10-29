import { cn } from "@/utils/cn";
import type { NewsItem } from "@/i18n";
import { MegaphoneIcon } from "@/icons";

const TAG_COLORS = ["bg-[#ff9a1f]", "bg-mint-500", "bg-[#ff4f1f]", "bg-skyg-400"];

export function NewsPanel({
  items,
  title,
  className,
}: {
  items: NewsItem[];
  title: string;
  className?: string;
}) {
  return (
    <div className={cn("absolute inset-x-[28px] bottom-[14px] top-[18px] animate-slide-up", className)}>
      <div className="relative h-full rounded-[24px] border-[4px] border-ink bg-navy-950/80 shadow-[0_8px_0_#060a28,0_0_0_3px_rgba(120,200,255,0.35)] backdrop-blur-[2px]">
        {/* Keep the title fully inside the panel so it cannot be hidden behind the tab bar. */}
        <div className="absolute left-1/2 top-[12px] z-10 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-[12px] border-[3px] border-ink bg-gradient-to-r from-[#ff7a1a] to-[#ffb32a] px-[20px] py-[4px] font-display text-[20px] text-white t-stroke sw-4 shadow-[0_4px_0_#9a4a08]">
          <MegaphoneIcon width={22} height={22} className="text-white drop-shadow" />
          {title}
        </div>
        <div className="no-scrollbar h-full space-y-[10px] overflow-y-auto px-[14px] pb-[14px] pt-[64px]">
          {items.map((n, i) => (
            <article
              key={n.title}
              className="rounded-[16px] border-[3px] border-ink bg-gradient-to-b from-navy-700 to-navy-800 p-[12px] shadow-[inset_0_2px_0_rgba(255,255,255,0.08)]"
            >
              <div className="mb-[4px] flex items-center justify-between gap-2">
                <span
                  className={`rounded-full border-[2px] border-ink px-[10px] py-[1px] font-body text-[11px] font-black tracking-wider text-ink ${TAG_COLORS[i % TAG_COLORS.length]}`}
                >
                  {n.tag}
                </span>
                <span className="font-body text-[11px] font-bold text-white/50">{n.date}</span>
              </div>
              <h3 className="font-display text-[19px] tracking-wide text-amber-400 t-stroke sw-3">{n.title}</h3>
              <p className="mt-[2px] font-body text-[13px] font-bold leading-snug text-white/85">{n.body}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
