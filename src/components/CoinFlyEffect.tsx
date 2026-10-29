import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CoinIcon } from "@/icons";

export interface CoinFlyOptions {
  startX?: number;
  startY?: number;
  startEl?: HTMLElement | null;
  targetId?: string;
  amount: number;
}

interface Particle {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  controlX: number;
  controlY: number;
  delay: number;
  duration: number;
  size: number;
  spin: number;
  scatterX: number;
  scatterY: number;
}

interface ImpactSpark {
  id: number;
  x: number;
  y: number;
  color: string;
  angle: number;
  dist: number;
}

interface FloatingPopup {
  id: number;
  x: number;
  y: number;
  text: string;
}

interface CoinFlyContextType {
  triggerCoinFly: (opts: CoinFlyOptions) => void;
  isPulsing: boolean;
}

const CoinFlyContext = createContext<CoinFlyContextType>({
  triggerCoinFly: () => {},
  isPulsing: false,
});

export function useCoinFly() {
  return useContext(CoinFlyContext);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function CoinFlyProvider({
  children,
  onCoinTick,
  onAllArrived,
}: {
  children: ReactNode;
  onCoinTick?: () => void;
  onAllArrived?: (amount: number) => void;
}) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [sparks, setSparks] = useState<ImpactSpark[]>([]);
  const [popups, setPopups] = useState<FloatingPopup[]>([]);
  const [isPulsing, setIsPulsing] = useState(false);
  const pulseTimer = useRef<number | null>(null);

  const triggerPulse = useCallback(() => {
    setIsPulsing(true);
    if (pulseTimer.current) window.clearTimeout(pulseTimer.current);
    pulseTimer.current = window.setTimeout(() => setIsPulsing(false), 700);
  }, []);

  const triggerCoinFly = useCallback(
    ({ startX, startY, startEl, targetId, amount }: CoinFlyOptions) => {
      let sx = startX ?? window.innerWidth / 2;
      let sy = startY ?? window.innerHeight / 2;

      if (startEl) {
        const rect = startEl.getBoundingClientRect();
        sx = rect.left + rect.width / 2;
        sy = rect.top + rect.height / 2;
      }

      let tx = window.innerWidth - 80;
      let ty = 40;

      const targetEl =
        (targetId ? document.getElementById(targetId) : null) ||
        document.getElementById("desktop-top-coin-badge") ||
        document.getElementById("mobile-top-coin-badge") ||
        document.getElementById("panel-coin-badge") ||
        document.getElementById("shop-coin-badge") ||
        document.getElementById("top-shop-coin-badge");

      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        tx = rect.left + rect.width / 2;
        ty = rect.top + rect.height / 2;
      }

      const pad = 28;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const count = Math.min(10, Math.max(6, Math.floor(amount / 400)));
      const newParticles: Particle[] = [];
      const batchId = Date.now();

      const dx = tx - sx;
      const dy = ty - sy;
      const len = Math.hypot(dx, dy) || 1;
      // perpendicular unit vector — used for a *tiny* visible curve, never off-screen
      const nx = -dy / len;
      const ny = dx / len;

      for (let i = 0; i < count; i++) {
        const t = (i + 0.5) / count - 0.5; // -0.5 .. 0.5
        // gentle bend, scaled to distance so short hops stay almost straight
        const bend = clamp(len * 0.12, 18, 42) * (t >= 0 ? 1 : -1) * (0.35 + Math.abs(t));
        const midX = clamp((sx + tx) / 2 + nx * bend, pad, vw - pad);
        const midY = clamp((sy + ty) / 2 + ny * bend * 0.4, pad, vh - pad);

        newParticles.push({
          id: batchId + i,
          startX: sx,
          startY: sy,
          targetX: tx,
          targetY: ty,
          controlX: midX,
          controlY: midY,
          delay: i * 28,
          duration: 480 + Math.random() * 80,
          size: 22 + (i % 3) * 3,
          spin: (Math.random() > 0.5 ? 1 : -1) * (220 + Math.random() * 180),
          scatterX: (Math.random() - 0.5) * 36,
          scatterY: (Math.random() - 0.5) * 28,
        });
      }

      setParticles((prev) => [...prev, ...newParticles]);

      newParticles.forEach((p, idx) => {
        window.setTimeout(() => {
          onCoinTick?.();

          const sparkCount = 3;
          const newSparks: ImpactSpark[] = [];
          for (let s = 0; s < sparkCount; s++) {
            newSparks.push({
              id: Date.now() + Math.random(),
              x: tx,
              y: ty,
              color: s % 2 === 0 ? "#ffd23a" : "#fff",
              angle: (s * Math.PI * 2) / sparkCount + (Math.random() - 0.5) * 0.4,
              dist: 12 + Math.random() * 14,
            });
          }
          setSparks((prev) => [...prev, ...newSparks]);
          triggerPulse();
          setParticles((prev) => prev.filter((item) => item.id !== p.id));

          if (idx === newParticles.length - 1) {
            setPopups((prev) => [
              ...prev,
              { id: Date.now(), x: tx, y: ty, text: `+${amount.toLocaleString("en-US")}` },
            ]);
            onAllArrived?.(amount);
          }
        }, p.delay + p.duration);
      });

      window.setTimeout(() => {
        setSparks((prev) => prev.filter((s) => Date.now() - s.id > 500));
      }, 1400);
      window.setTimeout(() => {
        setPopups((prev) => prev.filter((pop) => Date.now() - pop.id > 1200));
      }, 1600);
    },
    [onCoinTick, onAllArrived, triggerPulse],
  );

  return (
    <CoinFlyContext.Provider value={{ triggerCoinFly, isPulsing }}>
      {children}

      <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
        {particles.map((p) => (
          <FlyingCoin key={p.id} particle={p} />
        ))}

        {sparks.map((s) => (
          <span
            key={s.id}
            className="absolute h-[5px] w-[5px] rounded-full shadow-[0_0_8px_#ffd23a]"
            style={{
              left: s.x,
              top: s.y,
              backgroundColor: s.color,
              transform: `translate(${Math.cos(s.angle) * s.dist}px, ${Math.sin(s.angle) * s.dist}px) scale(0)`,
              transition: "transform 0.35s ease-out, opacity 0.35s ease-out",
              opacity: 0,
            }}
          />
        ))}

        {popups.map((pop) => (
          <div
            key={pop.id}
            className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-[4px] font-display text-[22px] text-amber-400 t-stroke sw-4 animate-float-up drop-shadow-[0_4px_12px_rgba(255,210,58,0.7)]"
            style={{ left: pop.x, top: pop.y - 10 }}
          >
            <CoinIcon width={20} height={20} className="text-amber-400" />
            <span>{pop.text}</span>
          </div>
        ))}
      </div>
    </CoinFlyContext.Provider>
  );
}

/** Quadratic bezier, stays on the start→target path. */
function bezier(t: number, a: number, b: number, c: number) {
  const u = 1 - t;
  return u * u * a + 2 * u * t * b + t * t * c;
}

function FlyingCoin({ particle: p }: { particle: Particle }) {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    let raf = 0;
    let start = 0;
    const delay = p.delay;
    const dur = p.duration;

    const tick = (now: number) => {
      if (!start) start = now;
      const elapsed = now - start - delay;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const raw = Math.min(1, elapsed / dur);
      // ease-in-out cubic: slow start, smooth landing
      const t = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;

      // tiny scatter only in the first 18% so coins don't stack, then they merge onto the path
      const scatterFade = Math.max(0, 1 - raw / 0.18);
      const x = bezier(t, p.startX, p.controlX, p.targetX) + p.scatterX * scatterFade;
      const y = bezier(t, p.startY, p.controlY, p.targetY) + p.scatterY * scatterFade;
      const scale = 0.55 + Math.sin(Math.PI * t) * 0.35; // grow mid-flight, shrink into the wallet
      const rot = p.spin * t;
      const opacity = raw < 0.06 ? raw / 0.06 : raw > 0.92 ? (1 - raw) / 0.08 : 1;

      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.opacity = String(Math.max(0, opacity));
      el.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${rot}deg)`;

      if (raw < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [p]);

  return (
    <div
      ref={elRef}
      className="absolute will-change-transform"
      style={{
        left: p.startX,
        top: p.startY,
        transform: "translate(-50%, -50%) scale(0.45)",
        opacity: 0,
      }}
    >
      <div
        className="flex items-center justify-center rounded-full bg-gradient-to-tr from-[#e07d12] via-[#ffd23a] to-[#fff5a0] shadow-[0_0_10px_rgba(255,210,58,0.85),0_3px_6px_rgba(0,0,0,0.45)] ring-[2px] ring-ink"
        style={{ width: p.size, height: p.size }}
      >
        <CoinIcon width={p.size - 4} height={p.size - 4} className="text-amber-900" />
      </div>
    </div>
  );
}
