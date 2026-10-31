import { useState } from "react";
import type { Car, CarStats } from "@/data/cars";
import type { Lang, Strings } from "@/i18n";
import { ArrowRightIcon, BoltIcon, CopyIcon, CrosshairIcon, PlayIcon, SolanaIcon, StoreIcon, UndoIcon } from "@/icons";
import { shortenAddress } from "@/solana";
import { TitleBanner } from "./TitleBanner";
import { CarShowcase } from "./CarShowcase";
import { GarageView, type GarageData } from "./GaragePanel";
import { TasksView, type TaskView } from "./TasksPanel";
import type { DailyView } from "@/data/daily";
import { RaceView, type RaceProps } from "./RacePanel";
import { NewsPanel } from "./NewsPanel";
import { StatPills, StatsRow } from "./Stats";
import { BottomBar, type TabKey } from "./BottomBar";
import { GameButton } from "./ui";

export interface Player {
  name: string;
  id: string;
  provider: string;
  walletAddress: string;
  solBalance: number;
}

import type { MouseEvent } from "react";

interface Props {
  t: Strings;
  lang: Lang;
  /** car currently driven — the home stage only shows owned cars */
  viewCar: Car;
  viewStats: CarStats;
  garage: GarageData;
  ownedCars: Car[];
  tasks: TaskView[];
  taskBadge: number;
  onClaimTask: (id: string, e: MouseEvent<HTMLButtonElement>) => void;
  /** daily login check-in */
  daily: DailyView;
  onClaimDaily: (e: MouseEvent<HTMLButtonElement>) => void;
  race: RaceProps;
  player: Player;
  server: string;
  tab: TabKey;
  onTab: (t: TabKey) => void;
  onPrev: () => void;
  onNext: () => void;
  onOpenDealer: () => void;
  onOpenStaking: () => void;
  /** opens the coin shop (buy coins with SOL) */
  onOpenCoinShop: () => void;
  onEquip: (car: Car) => void;
  onStartChase: () => void;
  onLogout: () => void;
  onCopied?: () => void;
}

/** Post-login screen (mobile layout): cars / garage / race / tasks / news tabs. */
export function WelcomeScreen({
  t,
  lang,
  viewCar,
  viewStats,
  garage,
  ownedCars,
  tasks,
  taskBadge,
  onClaimTask,
  daily,
  onClaimDaily,
  race,
  player,
  server,
  tab,
  onTab,
  onPrev,
  onNext,
  onOpenDealer,
  onOpenStaking,
  onOpenCoinShop,
  onEquip,
  onStartChase,
  onLogout,
  onCopied,
}: Props) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!player.walletAddress) return;
    try {
      void navigator.clipboard.writeText(player.walletAddress);
      setCopied(true);
      onCopied?.();
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex h-full flex-col">
      <TitleBanner
        small={viewCar.cls}
        big={viewCar.name}
        tag={viewCar.rarity}
        tagColor={viewCar.rarityColor}
        accent={viewCar.accent}
      />

      <main className="relative min-h-0 flex-1">
        {tab === "cars" && (
          <CarShowcase car={viewCar} onPrev={onPrev} onNext={onNext} hasMultiple={ownedCars.length > 1} />
        )}
        {tab === "race" && <RaceView t={t} lang={lang} race={race} />}
        {tab === "garage" && <GarageView t={t} garage={garage} ownedCars={ownedCars} onEquip={onEquip} />}
        {tab === "tasks" && (
          <TasksView
            t={t}
            lang={lang}
            tasks={tasks}
            coins={garage.coins}
            onClaim={onClaimTask}
            daily={daily}
            onClaimDaily={onClaimDaily}
          />
        )}
        {tab === "news" && <NewsPanel items={t.news} title={t.tabNews} />}
      </main>

      <section className="shrink-0 space-y-[8px] pt-[2px]">
        <StatPills stats={viewStats} tier={viewCar.tier} powerLabel={t.power} lvLabel={t.lv} />
        <StatsRow
          stats={viewStats}
          coins={garage.coins}
          className="px-[24px]"
          onCoinsClick={onOpenCoinShop}
          labels={{ coins: t.coins, topSpeed: t.topSpeed, armor: t.armor, kmh: t.kmh }}
        />

        {/* wallet + server strip */}
        <div className="mx-[24px] flex items-center justify-between gap-[8px] rounded-full border-[3px] border-ink bg-navy-950/85 px-[14px] py-[5px] font-body text-[11px] font-black tracking-wider text-white/70">
          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-[6px] transition-colors hover:text-white"
            title={player.walletAddress}
          >
            <SolanaIcon width={15} height={15} />
            <span className="font-mono text-amber-400">{shortenAddress(player.walletAddress, 4)}</span>
            <CopyIcon width={13} height={13} className={copied ? "text-mint-400" : "text-white/40"} />
          </button>
          <span className="text-white/25">|</span>
          <span className="text-skyg-300">{server}</span>
          <span className="text-white/25">|</span>
          <span className="text-mint-400">#{player.id}</span>
        </div>
      </section>

      <section className="flex shrink-0 items-end justify-center gap-[10px] px-[22px] pb-[12px] pt-[12px]">
        <GameButton variant="green" className="h-[66px] w-[104px]" onClick={onOpenDealer}>
          <span className="flex flex-col items-center gap-[2px] whitespace-nowrap font-display text-[12px] leading-none tracking-wide text-white t-stroke sw-3">
            <StoreIcon width={20} height={20} />
            {t.dealership}
          </span>
        </GameButton>
        <GameButton variant="green" className="h-[66px] w-[96px]" onClick={onOpenStaking}>
          <span className="flex flex-col items-center gap-[2px] whitespace-nowrap font-display text-[12px] leading-none tracking-wide text-[#04120c]">
            <BoltIcon width={20} height={20} />
            {t.staking}
          </span>
        </GameButton>
        <GameButton variant="grey" className="h-[66px] w-[112px]" onClick={onLogout}>
          <span className="flex items-center gap-[5px] font-display text-[15px] text-white t-stroke sw-3">
            <UndoIcon width={20} height={20} />
            {t.logout}
          </span>
        </GameButton>
        <GameButton variant="orange" className="h-[78px] flex-1 animate-glow" onClick={onStartChase}>
          <span className="flex items-center gap-[10px]">
            <span className="relative flex h-[44px] w-[44px] items-center justify-center rounded-full border-[3px] border-ink bg-gradient-to-b from-[#6fcf36] to-[#3d9a1f] text-white shadow-[0_3px_0_#1f5a10]">
              <CrosshairIcon width={28} height={28} />
              <PlayIcon
                width={14}
                height={14}
                className="absolute -bottom-[4px] -right-[4px] rounded-full bg-ink p-[2px] text-mint-400"
              />
            </span>
            <span className="font-display text-[26px] tracking-wide text-flame-500 t-stroke sw-5 sc-white">
              {t.startChase}
            </span>
            <ArrowRightIcon width={26} height={26} className="text-ink rtl:-scale-x-100" />
          </span>
        </GameButton>
      </section>

      <BottomBar
        car={garage.car}
        tab={tab}
        onTab={onTab}
        onBack={onLogout}
        labels={{ cars: t.tabCars, race: t.tabRace, garage: t.garage, tasks: t.tabTasks, news: t.tabNews }}
        taskBadge={taskBadge}
        status={
          <>
            <span className="h-[8px] w-[8px] shrink-0 rounded-full bg-mint-400 shadow-[0_0_8px_#46f0a0]" />
            <span className="truncate">{garage.coins.toLocaleString("en-US")}</span>
          </>
        }
      />
    </div>
  );
}
