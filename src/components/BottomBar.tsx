import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import type { Car } from "@/data/cars";
import { ClipboardIcon, FlagIcon, GearIcon, MegaphoneIcon, UndoIcon } from "@/icons";

export function CarFace({ car, size = 64, className }: { car: Car; size?: number; className?: string }) {
  const w = size * car.face.zoom;
  const h = w * (car.imgH / car.imgW);
  return (
    <div className={cn("relative overflow-hidden rounded-full bg-navy-700", className)} style={{ width: size, height: size }}>
      <img
        src={car.image}
        alt=""
        draggable={false}
        className="absolute max-w-none"
        style={{ width: w, height: h, left: size / 2 - car.face.x * w, top: size / 2 - car.face.y * h }}
      />
    </div>
  );
}

function Tab({
  active,
  label,
  onClick,
  children,
  badge,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
  badge?: number;
}) {
  return (
    <button type="button" onClick={onClick} className="group flex w-[56px] flex-col items-center gap-[2px]">
      <span
        className={cn(
          "relative flex h-[44px] w-[44px] items-center justify-center rounded-full border-[3px] bg-navy-800 transition-all",
          active
            ? "border-skyg-300 shadow-[0_0_0_3px_rgba(111,193,255,0.4),0_4px_0_#0a1038] -translate-y-[6px]"
            : "border-[#3a4f9a] shadow-[0_4px_0_#0a1038] opacity-80 group-hover:opacity-100",
        )}
      >
        {children}
        {active && (
          <span className="pointer-events-none absolute inset-[-3px] rounded-full border-[3px] border-skyg-300/60 animate-ring-pulse" />
        )}
        {!!badge && badge > 0 && (
          <span className="absolute -right-[5px] -top-[5px] flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-[2px] border-ink bg-[#ff4f1f] px-[3px] font-body text-[9px] font-black text-white">
            {badge}
          </span>
        )}
      </span>
      <span
        className={cn(
          "whitespace-nowrap font-display text-[10px] tracking-wide t-stroke sw-3",
          active ? "text-white" : "text-white/45",
        )}
      >
        {label}
      </span>
    </button>
  );
}

export type TabKey = "cars" | "race" | "garage" | "tasks" | "news";

interface Props {
  car: Car;
  tab: TabKey;
  onTab: (t: TabKey) => void;
  onBack: () => void;
  labels: { cars: string; race: string; garage: string; tasks: string; news: string };
  status?: ReactNode;
  taskBadge?: number;
}

export function BottomBar({ car, tab, onTab, onBack, labels, status, taskBadge }: Props) {
  return (
    <footer className="relative h-[90px] shrink-0" dir="ltr">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 540 90" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 12H110C148 12 158 30 196 30H540V90H0Z" fill="#17245f" />
        <path d="M0 12H110C148 12 158 30 196 30H540" fill="none" stroke="#4d86e8" strokeWidth="3" />
        <path d="M0 15H109C147 15 157 33 195 33H540" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
      </svg>

      <button
        type="button"
        onClick={onBack}
        aria-label="Exit"
        className="absolute left-[12px] top-[26px] flex h-[54px] w-[58px] items-center justify-center rounded-[16px] border-[3px] border-[#4a62b4] bg-gradient-to-b from-navy-600 to-navy-800 text-white shadow-[0_4px_0_#0a1038] transition-transform active:translate-y-[3px] active:shadow-none"
      >
        <UndoIcon width={28} height={28} />
      </button>

      {status && (
        <div className="absolute left-[76px] top-[56px] flex max-w-[100px] items-center gap-[5px] truncate font-body text-[9px] font-black tracking-wider text-white/55">
          {status}
        </div>
      )}

      <div className="absolute left-[196px] right-[8px] top-[-8px] flex justify-between">
        <Tab active={tab === "cars"} label={labels.cars} onClick={() => onTab("cars")}>
          <CarFace car={car} size={38} />
        </Tab>
        <Tab active={tab === "garage"} label={labels.garage} onClick={() => onTab("garage")}>
          <span className="relative flex h-[40px] w-[40px] items-center justify-center rounded-full bg-gradient-to-b from-[#ffcf3a] to-[#ff9a1f] text-ink">
            <GearIcon width={24} height={24} />
          </span>
        </Tab>
        <Tab active={tab === "tasks"} label={labels.tasks} onClick={() => onTab("tasks")} badge={taskBadge}>
          <span className="relative flex h-[40px] w-[40px] items-center justify-center rounded-full bg-gradient-to-b from-[#8fd0ff] to-[#3d8ff5] text-white">
            <ClipboardIcon width={24} height={24} />
          </span>
        </Tab>
        <Tab active={tab === "race"} label={labels.race} onClick={() => onTab("race")}>
          <span className="relative flex h-[40px] w-[40px] items-center justify-center rounded-full bg-gradient-to-b from-[#ff6b4a] to-[#c92a12] text-white">
            <FlagIcon width={22} height={22} />
          </span>
        </Tab>
        <Tab active={tab === "news"} label={labels.news} onClick={() => onTab("news")}>
          <span className="relative flex h-[40px] w-[40px] items-center justify-center rounded-full bg-gradient-to-b from-[#ff6b4a] to-[#c92a12] text-amber-400">
            <MegaphoneIcon width={24} height={24} />
            <span className="absolute -right-[2px] -top-[2px] h-[13px] w-[13px] rounded-full border-[2px] border-ink bg-mint-400" />
          </span>
        </Tab>
      </div>
    </footer>
  );
}
