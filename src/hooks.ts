import { useCallback, useEffect, useRef, useState } from "react";

/* ---------------- design canvases ---------------- */
// Mobile: portrait 540 x 960 (letterboxed on larger portrait screens)
export const CANVAS_W = 540;
export const CANVAS_H = 960;
const CANVAS_MAX_H = 1140;

// Desktop: landscape, minimum design size 1280 x 720. The layout is flex/grid based,
// so any extra room (other aspect ratios) is absorbed by the centre column.
export const DESK_W = 1280;
export const DESK_H = 720;
const DESK_MAX_W = 1920;
const DESK_MAX_H = 900;

export type LayoutMode = "mobile" | "desktop";

export interface Viewport {
  mode: LayoutMode;
  scale: number;
  width: number;
  height: number;
  letterboxed: boolean;
}

function computeViewport(): Viewport {
  const W = window.innerWidth;
  const H = window.innerHeight;

  // Landscape + wide enough => desktop layout
  if (W >= 1000 && W / H >= 1.2) {
    const scale = Math.min(W / DESK_W, H / DESK_H);
    return {
      mode: "desktop",
      scale,
      width: Math.min(W / scale, DESK_MAX_W),
      height: Math.min(H / scale, DESK_MAX_H),
      letterboxed: false,
    };
  }

  const scale = Math.min(W / CANVAS_W, H / CANVAS_H);
  const height = Math.min(H / scale, CANVAS_MAX_H);
  const letterboxed = CANVAS_W * scale < W - 2 || height * scale < H - 2;
  return { mode: "mobile", scale, width: CANVAS_W, height, letterboxed };
}

/** Picks the mobile / desktop layout and scales the design canvas to the window. */
export function useViewport(): Viewport {
  const [vp, setVp] = useState<Viewport>(computeViewport);

  useEffect(() => {
    const update = () => setVp(computeViewport());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return vp;
}

/** Fullscreen helper for the desktop top bar. */
export function useFullscreen() {
  const [active, setActive] = useState(() => !!document.fullscreenElement);

  useEffect(() => {
    const onChange = () => setActive(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = useCallback(() => {
    try {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void document.documentElement.requestFullscreen().catch(() => undefined);
    } catch {
      /* not supported */
    }
  }, []);

  return { active, toggle };
}

export type SfxName = "click" | "success" | "error" | "swoosh" | "toggle" | "coin" | "coinJingle";

function getAudioCtor(): typeof AudioContext | null {
  try {
    const w = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    return w.AudioContext || w.webkitAudioContext || null;
  } catch {
    return null;
  }
}

/**
 * Robust WebAudio SFX – works the same on mobile and desktop.
 * - AudioContext is created lazily inside the user gesture that triggers the sound
 *   so iOS/Android autoplay policies are satisfied.
 * - If the context is suspended we resume it first and only then schedule tones.
 * - A one-time global touch/click listener pre-warms the context so the very
 *   first tap is not silent on iOS.
 */
export function useSfx(enabled: boolean, vibration: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const unlockedRef = useRef(false);

  // One-time unlock: create a silent buffer on the first real user interaction
  // so subsequent sounds are not blocked on iOS Safari / Chrome mobile.
  useEffect(() => {
    const unlock = () => {
      if (unlockedRef.current) return;
      const Ctor = getAudioCtor();
      if (!Ctor) return;
      try {
        const ctx = ctxRef.current ?? new Ctor();
        ctxRef.current = ctx;
        if (ctx.state === "suspended") {
          void ctx.resume().then(() => {
            try {
              const buf = ctx.createBuffer(1, 1, 22050);
              const src = ctx.createBufferSource();
              src.buffer = buf;
              src.connect(ctx.destination);
              src.start(0);
            } catch {
              /* ignore */
            }
          });
        } else {
          try {
            const buf = ctx.createBuffer(1, 1, 22050);
            const src = ctx.createBufferSource();
            src.buffer = buf;
            src.connect(ctx.destination);
            src.start(0);
          } catch {
            /* ignore */
          }
        }
        unlockedRef.current = true;
      } catch {
        /* ignore */
      }
      window.removeEventListener("touchend", unlock);
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("touchend", unlock, { passive: true });
    window.addEventListener("click", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("touchend", unlock);
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return useCallback(
    (name: SfxName) => {
      // Haptics should work even when sound is muted
      if (vibration && typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate(name === "error" ? [30, 40, 30] : name === "coin" ? 8 : 14);
        } catch {
          /* ignore */
        }
      }
      if (!enabled) return;

      try {
        const Ctor = getAudioCtor();
        if (!Ctor) return;

        let ctx = ctxRef.current;
        if (!ctx) {
          ctx = new Ctor();
          ctxRef.current = ctx;
        }

        const playAll = () => {
          if (!ctx) return;
          const t0 = ctx.currentTime;

          const tone = (
            f0: number,
            f1: number,
            dur: number,
            type: OscillatorType,
            vol: number,
            start = 0,
          ) => {
            try {
              const osc = ctx!.createOscillator();
              const gain = ctx!.createGain();
              osc.type = type;
              osc.frequency.setValueAtTime(f0, t0 + start);
              const safeF1 = Math.max(1, f1);
              osc.frequency.exponentialRampToValueAtTime(safeF1, t0 + start + dur);
              gain.gain.setValueAtTime(vol, t0 + start);
              gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur + 0.02);
              osc.connect(gain).connect(ctx!.destination);
              osc.start(t0 + start);
              osc.stop(t0 + start + dur + 0.04);
            } catch {
              /* ignore single tone failure */
            }
          };

          switch (name) {
            case "click":
              tone(720, 360, 0.08, "square", 0.14);
              break;
            case "toggle":
              tone(480, 820, 0.1, "triangle", 0.16);
              break;
            case "swoosh":
              tone(300, 1100, 0.16, "sine", 0.14);
              break;
            case "coin":
              // Single sparkling coin impact chime
              tone(1318.5, 1760, 0.08, "sine", 0.16);
              tone(2637, 2637, 0.05, "triangle", 0.08, 0.02);
              break;
            case "coinJingle":
              // Rapid cascading coin pickup jingle
              tone(987.77, 1318.5, 0.09, "sine", 0.15, 0);
              tone(1174.66, 1567.98, 0.09, "sine", 0.16, 0.06);
              tone(1318.51, 1760.0, 0.1, "sine", 0.17, 0.12);
              tone(1760.0, 2093.0, 0.18, "triangle", 0.18, 0.18);
              break;
            case "success":
              tone(523, 659, 0.12, "triangle", 0.18);
              tone(659, 784, 0.12, "triangle", 0.18, 0.11);
              tone(784, 1046, 0.24, "triangle", 0.18, 0.22);
              break;
            case "error":
              tone(240, 120, 0.28, "sawtooth", 0.14);
              break;
          }
        };

        if (ctx.state === "suspended") {
          void ctx.resume().then(playAll).catch(playAll);
        } else {
          playAll();
        }
      } catch {
        /* audio not available */
      }
    },
    [enabled, vibration],
  );
}

/** Smoothly animates a numeric value towards `target` (ease-out, always settles exactly). */
export function useAnimatedNumber(target: number, duration = 600) {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const from = displayRef.current;
    const to = target;
    if (from === to) return;
    const t0 = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - t0) / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      const value = progress >= 1 ? to : Math.round(from + (to - from) * ease);
      displayRef.current = value;
      setDisplay(value);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
      else rafRef.current = null;
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}
