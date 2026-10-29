import type { MouseEvent, ReactNode } from "react";
import { cn } from "@/utils/cn";
import type { TaskDef, TaskIconKey } from "@/data/tasks";
import type { DailyView } from "@/data/daily";
import { fmt, type Lang, type Strings } from "@/i18n";
import { useAnimatedNumber } from "@/hooks";
import { useCoinFly } from "./CoinFlyEffect";
import {
  CarIcon,
  CheckIcon,
  ClipboardIcon,
  CoinIcon,
  EngineIcon,
  GaugeIcon,
  GiftIcon,
  PoliceLightIcon,
  TrophyIcon,
  WalletIcon,
  FlagIcon,
} from "@/icons";
import { FloatingPanel } from "./ui";
import { Countdown, DailyReward } from "./DailyReward";

/** A mission definition combined with the player's live progress. */
export interface TaskView extends TaskDef {
  progress: number;
  claimed: boolean;
}

const ICONS: Record<TaskIconKey, ReactNode> = {
  buy: <WalletIcon width={24} height={24} />,
  upgrade: <EngineIcon width={24} height={24} />,
  chase: <PoliceLightIcon width={24} height={24} />,
  collect: <CoinIcon width={24} height={24} />,
  garage: <CarIcon width={24} height={24} />,
  speed: <GaugeIcon width={24} height={24} />,
  race: <FlagIcon width={24} height={24} />,
  trophy: <TrophyIcon width={24} height={24} />,
};

const COLORS: Record<TaskIconKey, string> = {
  buy: "from-[#ffcf3a] to-[#ff9a1f]",
  upgrade: "from-[#9ef05a] to-[#4fae22]",
  chase: "from-[#ff6b4a] to-[#c92a12]",
  collect: "from-[#ffd23a] to-[#e0a014]",
  garage: "from-[#5fc8ff] to-[#2b7fe0]",
  speed: "from-[#c98cff] to-[#8e3bff]",
  race: "from-[#5fc8ff] to-[#2b7fe0]",
  trophy: "from-[#ffd23a] to-[#e07d12]",
};

/* ------------------------------------------------------------------ */
/* one mission row                                                     */
/* ------------------------------------------------------------------ */

function TaskRow({
  t,
  lang,
  task,
  onClaim,
  dense,
}: {
  t: Strings;
  lang: Lang;
  task: TaskView;
  onClaim: (id: string, e: MouseEvent<HTMLButtonElement>) => void;
  dense?: boolean;
}) {
  const done = task.progress >= task.goal;
  const pct = Math.min(100, Math.round((task.progress / task.goal) * 100));
  const claimable = done && !task.claimed;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[16px] border-[3px] border-ink bg-navy-950/70 p-[9px] shadow-[0_3px_0_#060a28] transition-all",
        claimable && "ring-[2px] ring-mint-400/80 shadow-[0_0_12px_rgba(70,240,160,0.25)]",
        task.claimed && "opacity-70",
      )}
    >
      <div className={cn("flex items-start", dense ? "gap-[7px]" : "gap-[9px]")}>
        {/* icon */}
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-[10px] border-[2.5px] border-ink bg-gradient-to-b text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.28),0_3px_0_#0a1038]",
            dense ? "h-[32px] w-[32px]" : "h-[42px] w-[42px]",
            COLORS[task.icon],
          )}
        >
          <span className={dense ? "[&>svg]:h-[18px] [&>svg]:w-[18px]" : ""}>{ICONS[task.icon]}</span>
        </div>

        {/* title + description */}
        <div className="min-w-0 flex-1">
          <div className={cn("truncate font-display leading-none text-white", dense ? "text-[14px]" : "text-[16px] t-stroke sw-2")}>
            {task.title[lang]}
          </div>
          <div className={cn("font-bold leading-snug text-white/50", dense ? "mt-[1px] line-clamp-1 font-body text-[9px]" : "mt-[3px] font-body text-[10px]")}>
            {task.desc[lang]}
          </div>
        </div>

        {/* reward */}
        <span className="flex shrink-0 items-center gap-[3px] rounded-full border-[2px] border-ink bg-navy-900 px-[7px] py-[2px]">
          <CoinIcon width={14} height={14} />
          <span className="font-display text-[13px] leading-none text-amber-400">
            {task.reward.toLocaleString("en-US")}
          </span>
        </span>
      </div>

      {/* progress + action */}
      <div className={cn("flex items-center gap-[8px]", dense ? "mt-[5px]" : "mt-[8px]")}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between font-body text-[9px] font-black tracking-wider text-white/45">
            <span>{pct}%</span>
            <span className={done ? "text-mint-400" : ""}>
              {Math.min(task.progress, task.goal)} / {task.goal}
            </span>
          </div>
          <div className="mt-[2px] h-[9px] overflow-hidden rounded-full border-[2px] border-ink bg-navy-950" dir="ltr">
            <div
              className={cn(
                "h-full rounded-full bg-gradient-to-r transition-[width] duration-500",
                done ? "from-mint-500 to-mint-400" : "from-skyg-500 to-skyg-300",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {task.claimed ? (
          <span className="flex h-[28px] shrink-0 items-center gap-[3px] rounded-full border-[2.5px] border-ink bg-navy-800 px-[9px] font-body text-[10px] font-black text-mint-400/80">
            <CheckIcon width={12} height={12} />
            {t.claimed}
          </span>
        ) : claimable ? (
          <button
            type="button"
            onClick={(e) => onClaim(task.id, e)}
            className="flex h-[28px] shrink-0 animate-glow items-center gap-[4px] rounded-full border-[2.5px] border-ink bg-gradient-to-b from-[#ffe05a] to-[#ffa41c] px-[11px] font-display text-[13px] text-ink shadow-[0_3px_0_#c9660e] transition-transform hover:brightness-110 active:translate-y-[2px] active:shadow-none"
          >
            <GiftIcon width={14} height={14} />
            {t.claim}
          </button>
        ) : (
          <span className="flex h-[26px] shrink-0 items-center rounded-full border-[2.5px] border-ink bg-navy-950 px-[9px] font-body text-[9px] font-black text-white/35">
            {t.inProgress}
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* sections + panel                                                    */
/* ------------------------------------------------------------------ */

function Section({
  title,
  badge,
  children,
  dense,
}: {
  title: string;
  badge?: string;
  children: ReactNode;
  dense?: boolean;
}) {
  return (
    <div>
      <div className="mb-[5px] flex items-center gap-[6px]">
        <span className="font-display text-[12px] tracking-[0.08em] text-skyg-300">{title}</span>
        {badge && (
          <span className="rounded-full border-[2px] border-ink bg-amber-400 px-[6px] font-body text-[9px] font-black leading-[14px] text-ink">
            {badge}
          </span>
        )}
        <span className="h-[2px] flex-1 rounded bg-white/10" />
      </div>
      <div className={dense ? "space-y-[5px]" : "space-y-[7px]"}>{children}</div>
    </div>
  );
}

interface Props {
  t: Strings;
  lang: Lang;
  tasks: TaskView[];
  coins: number;
  onClaim: (id: string, e: MouseEvent<HTMLButtonElement>) => void;
  /** daily login check-in state (streak, today's reward, countdown) */
  daily: DailyView;
  onClaimDaily: (e: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  dense?: boolean;
}

export function TasksPanel({ t, lang, tasks, coins, onClaim, daily, onClaimDaily, className, dense }: Props) {
  const animatedCoins = useAnimatedNumber(coins);
  const { isPulsing } = useCoinFly();
  const claimable = tasks.filter((x) => !x.claimed && x.progress >= x.goal).length + (daily.claimedToday ? 0 : 1);
  const dailyMissions = tasks.filter((x) => x.scope === "daily");
  const season = tasks.filter((x) => x.scope === "season");
  const dailyDone = dailyMissions.every((x) => x.claimed);

  return (
    <div className={cn("flex h-full flex-col gap-[9px]", className)}>
      {/* balance + claimable counter with pulsing highlight */}
      <div
        id="panel-coin-badge"
        className={cn(
          "flex shrink-0 items-center justify-between rounded-[16px] border-[3px] border-ink bg-gradient-to-r from-navy-800 to-navy-900 px-[13px] py-[7px] shadow-[0_4px_0_#060a28] transition-all duration-300",
          isPulsing && "scale-[1.03] ring-[3px] ring-amber-400 shadow-[0_0_18px_rgba(255,210,58,0.7)]",
        )}
      >
        <div className="flex items-center gap-[9px]">
          <CoinIcon width={30} height={30} className={cn("transition-transform", isPulsing && "scale-125")} />
          <div>
            <div className="font-body text-[10px] font-black tracking-wider text-white/50">{t.coins}</div>
            <div className="font-display text-[22px] leading-none text-amber-400 t-stroke sw-3">
              {animatedCoins.toLocaleString("en-US")}
            </div>
          </div>
        </div>
        <span
          className={cn(
            "flex items-center gap-[5px] rounded-full border-[3px] border-ink px-[10px] py-[3px] font-display text-[13px]",
            claimable > 0 ? "bg-gradient-to-b from-[#9ef05a] to-[#56b92a] text-ink animate-glow" : "bg-navy-950 text-white/35",
          )}
        >
          <GiftIcon width={16} height={16} />
          {fmt(t.readyToClaim, { n: claimable })}
        </span>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 space-y-[10px] overflow-y-auto pe-[2px]">
        <DailyReward t={t} daily={daily} onClaim={onClaimDaily} dense={dense} />

        <Section title={t.dailyTasks} badge={dailyDone ? t.claimed : undefined} dense={dense}>
          {dailyMissions.map((task) => (
            <TaskRow key={task.id} t={t} lang={lang} task={task} onClaim={onClaim} dense={dense} />
          ))}
        </Section>

        <Section title={t.seasonTasks} dense={dense}>
          {season.map((task) => (
            <TaskRow key={task.id} t={t} lang={lang} task={task} onClaim={onClaim} dense={dense} />
          ))}
        </Section>

        <div className="flex items-center justify-center gap-[6px] pb-[2px] font-body text-[10px] font-black tracking-wider text-white/35">
          <ClipboardIcon width={13} height={13} />
          {t.dailyTasks} · {t.resetIn} <Countdown ms={daily.msToReset} />
        </div>
      </div>
    </div>
  );
}

/** Tasks wrapped in the floating titled panel (mobile tab). */
export function TasksView({
  t,
  lang,
  tasks,
  coins,
  onClaim,
  daily,
  onClaimDaily,
  className,
}: Props) {
  return (
    <FloatingPanel title={t.tasksTitle} className={className}>
      <TasksPanel
        t={t}
        lang={lang}
        tasks={tasks}
        coins={coins}
        onClaim={onClaim}
        daily={daily}
        onClaimDaily={onClaimDaily}
        className="min-h-0 flex-1"
      />
    </FloatingPanel>
  );
}
