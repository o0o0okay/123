import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { CANVAS_W, type Viewport } from "@/hooks";
import type { Lang } from "@/i18n";

/** Full-bleed background used by the desktop layout (fills the whole window, no letterbox). */
function DesktopBackdrop() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg,#4aa6ff 0%,#2f80f0 28%,#2a62d6 62%,#1e3ba8 100%)" }}
      />
      <div className="diag-stripes absolute inset-0 [mask-image:linear-gradient(180deg,#000,transparent_45%)]" />
      <div className="hex-pattern absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,#000_15%,rgba(0,0,0,0.3)_80%)]" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 30% 52% at 50% 54%, rgba(180,225,255,0.62), transparent 72%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, transparent 52%, rgba(8,14,56,0.6) 100%)" }}
      />
    </>
  );
}

export function GameCanvas({
  children,
  lang,
  viewport,
}: {
  children: ReactNode;
  lang: Lang;
  viewport: Viewport;
}) {
  const { scale, width, height, letterboxed, mode } = viewport;
  const desktop = mode === "desktop";

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-navy-950">
      {desktop ? (
        <DesktopBackdrop />
      ) : (
        <>
          {/* page backdrop (only visible when letterboxed) */}
          <div className="hex-pattern absolute inset-0 opacity-30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(47,122,232,0.28),transparent_65%)]" />
        </>
      )}

      <div
        // the stage is the scaled play area: overlays portal into it so their
        // `fixed` boxes cover the stage (and stay centred) instead of some panel
        data-game-stage=""
        dir={lang === "fa" ? "rtl" : "ltr"}
        className={cn(
          "relative shrink-0 select-none",
          !desktop && "overflow-hidden",
          lang === "fa" ? "font-fa" : "font-body",
          !desktop && letterboxed && "rounded-[28px] shadow-[0_0_0_6px_#141c4a,0_30px_90px_rgba(0,0,0,0.65)]",
        )}
        style={{ width: desktop ? width : CANVAS_W, height, transform: `scale(${scale})` }}
      >
        {/* --- mobile background layers --- */}
        {!desktop && (
          <>
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg,#48a3ff 0%,#2f80f0 28%,#2a66da 56%,#2247b9 80%,#1b3399 100%)",
              }}
            />
            <div className="diag-stripes absolute inset-0 [mask-image:linear-gradient(180deg,#000,transparent_38%)]" />
            <div className="hex-pattern absolute inset-0 [mask-image:linear-gradient(180deg,rgba(0,0,0,0.5),#000_30%,#000_62%,rgba(0,0,0,0.25))]" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 58% 30% at 50% 40%, rgba(175,222,255,0.55), transparent 72%)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, transparent 68%, rgba(8,14,56,0.5) 100%)" }}
            />
          </>
        )}

        {/* --- content --- */}
        <div className="relative h-full">{children}</div>
      </div>
    </div>
  );
}
