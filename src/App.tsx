import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { GameCanvas } from "./components/GameCanvas";
import { TitleBanner } from "./components/TitleBanner";
import { CarShowcase } from "./components/CarShowcase";
import { GarageView, type GarageData } from "./components/GaragePanel";
import { BuyConfirmModal } from "./components/BuyConfirmModal";
import { PaintModal } from "./components/PaintShop";
import { PaintProvider } from "./components/PaintContext";
import { NewsPanel } from "./components/NewsPanel";
import { StatPills, StatsRow } from "./components/Stats";
import { BottomBar, type TabKey } from "./components/BottomBar";
import { WelcomeScreen, type Player } from "./components/WelcomeScreen";
import { DesktopView, type RightTab } from "./components/DesktopView";
import { ExitDialog, LoadingOverlay, OptionsModal, Toast, type ToastData, type ToastType } from "./components/Overlays";
import { GameButton, SlotButton } from "./components/ui";
import { CoinFlyProvider, useCoinFly } from "./components/CoinFlyEffect";
import { cars, carStats, sellValue, upgradeCost, MAX_LEVEL, type Car, type UpgradeKey } from "./data/cars";
import { paintById } from "./data/paints";
import { fmt, strings } from "./i18n";
import { loadSettings, saveSettings, type Settings } from "./settings";
import { loadPlayer, savePlayer, levelsOf, paintOf, ZERO_LEVELS, type PlayerState } from "./player";
import { useSfx, useViewport } from "./hooks";
import { detectWallets, generateDemoAddress, type SolanaWalletInfo } from "./solana";
import { TASKS, type TaskMetric } from "./data/tasks";
import type { CoinPack } from "./data/coinPacks";
import { claimDaily, DEFAULT_DAILY, resolveDaily } from "./data/daily";
import { TasksView, type TaskView } from "./components/TasksPanel";
import { RaceView, type RaceProps } from "./components/RacePanel";
import { SellConfirmModal } from "./components/DealerBits";
import { LazyPanel, panels, prefetch, preloadPanels } from "./components/lazy";
import { simulateRace, type RaceMode, type RaceResult } from "./data/races";
import { ME_ID, type BoardEntry } from "./data/leaderboard";
import {
  LOAN_APR,
  LTV,
  SINGLE_POOL_ID,
  SINGLE_POOL_NAME,
  aprForFee,
  allPools,
  debtOf,
  earnedOf,
  newId,
  poolName,
  type Loan,
  type PoolInfo,
  type StakePosition,
  type StakeTier,
  type TokenId,
} from "./data/staking";
import { nftById, nftSellValue, nftStakeEarned } from "./data/nft";
import {
  BackpackIcon,
  BoltIcon,
  GearIcon,
  StarBurstIcon,
  PhantomIcon,
  PlayIcon,
  SolanaIcon,
  SolflareIcon,
  StoreIcon,
  WalletIcon,
} from "./icons";

type Screen = "login" | "loading" | "home";

const WALLET_STORAGE_KEY = "hc_connected_wallet";

const UPG_NAME: Record<UpgradeKey, "upgEngine" | "upgBody" | "upgTires" | "upgNitro"> = {
  engine: "upgEngine",
  body: "upgBody",
  tires: "upgTires",
  nitro: "upgNitro",
};

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const sfx = useSfx(settings.sound, settings.vibration);

  return (
    <CoinFlyProvider onCoinTick={() => sfx("coin")}>
      <AppContent settings={settings} setSettings={setSettings} sfx={sfx} />
    </CoinFlyProvider>
  );
}

function AppContent({
  settings,
  setSettings,
  sfx,
}: {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  sfx: (name: import("./hooks").SfxName) => void;
}) {
  /* ----------------------------- state ----------------------------- */
  const viewport = useViewport();
  const isDesktop = viewport.mode === "desktop";
  const { triggerCoinFly } = useCoinFly();

  const [draftSettings, setDraftSettings] = useState<Settings | null>(null);
  const [screen, setScreen] = useState<Screen>("login");
  const [tab, setTab] = useState<TabKey>("garage");
  const [rightTab, setRightTab] = useState<RightTab>("garage");
  const [exitOpen, setExitOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>(loadPlayer);
  /** car waiting for purchase confirmation */
  const [buyTarget, setBuyTarget] = useState<Car | null>(null);
  /** paint picker modal (garage) */
  const [paintOpen, setPaintOpen] = useState(false);
  /** dealership overlay + car waiting for sale confirmation */
  const [dealerOpen, setDealerOpen] = useState(false);
  /** staking / liquidity / loans overlay */
  const [stakingOpen, setStakingOpen] = useState(false);
  /** NFT marketplace overlay */
  const [nftOpen, setNftOpen] = useState(false);
  /** which board the staking panel opens on (pools / stake / nft / loans) */
  const [stakingTab, setStakingTab] = useState<"pools" | "stake" | "nft" | "loans">("pools");
  const [sellTarget, setSellTarget] = useState<Car | null>(null);
  /** active race: mode + (null while running) result */
  const [coinShopOpen, setCoinShopOpen] = useState(false);
  const [raceMode, setRaceMode] = useState<RaceMode | null>(null);
  const [raceResult, setRaceResult] = useState<RaceResult | null>(null);
  const [raceBest, setRaceBest] = useState(false);
  const raceTimer = useRef<number | null>(null);
  /** latest committed score, readable from the race timeout without stale closures */
  const scoreRef = useRef(playerState.score);
  scoreRef.current = playerState.score;

  // Solana wallet state
  const [wallets, setWallets] = useState<SolanaWalletInfo[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const t = strings[settings.lang];
  const lang = settings.lang;

  /* ---------------- derived car state ---------------- */
  const owned = playerState.owned;
  const ownedCars = cars.filter((c) => owned.includes(c.id));
  const coins = playerState.coins;

  // driven car (always owned) -> showcase / banner / stat rows / garage
  const activeCar = cars.find((c) => c.id === playerState.activeCarId) ?? ownedCars[0] ?? cars[0];
  const activeLevels = levelsOf(playerState, activeCar.id);
  const activeStats = carStats(activeCar, activeLevels);
  const activePaint = paintOf(playerState, activeCar.id);
  /** position of the driven car inside the owned-cars carousel */
  const activeIdx = Math.max(0, ownedCars.findIndex((c) => c.id === activeCar.id));

  // missions: stored metrics + values derived from the garage
  const maxOwnedSpeed = Math.max(
    0,
    ...ownedCars.map((c) => carStats(c, levelsOf(playerState, c.id)).topSpeed),
  );
  const metricValue = (m: TaskMetric): number =>
    m === "ownCars" ? playerState.owned.length : m === "speed" ? maxOwnedSpeed : playerState.taskProgress[m] ?? 0;
  const tasks: TaskView[] = TASKS.map((d) => ({
    ...d,
    progress: Math.min(metricValue(d.metric), d.goal),
    claimed: playerState.tasksClaimed.includes(d.id),
  }));
  const loginReady = tasks.filter((x) => !x.claimed && x.progress >= x.goal).length;

  /* ---------------- daily check-in ---------------- */
  // `clock` only exists to re-evaluate the daily view at midnight / after a claim
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setClock(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const daily = resolveDaily(playerState.daily ?? DEFAULT_DAILY, new Date(clock));
  const taskBadge = loginReady + (daily.claimedToday ? 0 : 1);

  /* persist player progress */
  useEffect(() => {
    savePlayer(playerState);
  }, [playerState]);

  /* Warm the on-demand panels (dealership, coin shop, race overlay) while idle */
  useEffect(() => {
    preloadPanels();
  }, []);

  /* Detect wallets + auto-reconnect */
  useEffect(() => {
    setWallets(detectWallets());
    try {
      const saved = localStorage.getItem(WALLET_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Player;
        if (parsed.walletAddress) {
          setPlayer(parsed);
          setScreen("home");
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  /* ----------------------------- helpers --------------------------- */
  const toastTimer = useRef<number | null>(null);
  const showToast = useCallback((message: string, type: ToastType = "info") => {
    setToast({ id: Date.now(), message, type });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = lang === "fa" ? "هیت چیس — فرار از پلیس" : "Heat Chase — Police Escape";
  }, [lang]);

  /* ---------------- browsing the owned cars ---------------- */
  /** the home stage only ever shows cars the player owns */
  const showCar = (car: Car) => {
    if (!owned.includes(car.id)) return;
    setPlayerState((p) => (p.activeCarId === car.id ? p : { ...p, activeCarId: car.id }));
  };

  const changeCar = (dir: 1 | -1) => {
    if (ownedCars.length < 2) return;
    sfx("swoosh");
    showCar(ownedCars[(activeIdx + dir + ownedCars.length) % ownedCars.length]);
  };

  const selectCar = (i: number) => {
    const car = ownedCars[i];
    if (!car || car.id === activeCar.id) return;
    sfx("swoosh");
    showCar(car);
  };

  /** advance a mission metric */
  const bumpTask = (metric: TaskMetric, by = 1) =>
    setPlayerState((p) => ({
      ...p,
      taskProgress: { ...p.taskProgress, [metric]: (p.taskProgress[metric] ?? 0) + by },
    }));

  /* ---------------- buying / equipping cars ---------------- */
  const requestBuy = (car: Car) => {
    if (owned.includes(car.id)) return;
    if (coins < car.price) {
      sfx("error");
      showToast(fmt(t.needMore, { n: (car.price - coins).toLocaleString("en-US") }), "error");
      return;
    }
    sfx("click");
    setBuyTarget(car);
  };

  const confirmBuy = () => {
    const car = buyTarget;
    if (!car) return;
    if (coins < car.price || owned.includes(car.id)) {
      setBuyTarget(null);
      return;
    }
    sfx("success");
    setPlayerState((p) => ({
      ...p,
      coins: p.coins - car.price,
      owned: [...p.owned, car.id],
      activeCarId: car.id,
      upgrades: { ...p.upgrades, [car.id]: p.upgrades[car.id] ?? { ...ZERO_LEVELS } },
    }));
    setBuyTarget(null);
    bumpTask("buy");
    showToast(fmt(t.purchased, { n: car.name }), "success");
  };

  const equip = (car: Car) => {
    if (!owned.includes(car.id)) return;
    sfx("click");
    setPlayerState((p) => ({ ...p, activeCarId: car.id }));
    showToast(fmt(t.carSelected, { n: car.name }), "success");
  };

  /* ---------------- dealership: buy & sell ---------------- */
  const openDealer = () => {
    sfx("swoosh");
    setDealerOpen(true);
  };

  const closeDealer = () => {
    sfx("click");
    setDealerOpen(false);
  };

  /* ---------------- staking / liquidity / loans ---------------- */
  const openStaking = () => {
    sfx("swoosh");
    // start the chunk before the first render asks for it
    prefetch.staking();
    setStakingTab("pools");
    setStakingOpen(true);
  };

  const closeStaking = () => {
    sfx("click");
    setStakingOpen(false);
  };

  /* ---------------- nft market / vault ---------------- */
  const openNft = () => {
    sfx("swoosh");
    prefetch.nft();
    setNftOpen(true);
  };

  const closeNft = () => {
    sfx("click");
    setNftOpen(false);
  };

  /** the vault lives inside staking, so the market hands over to it */
  const openNftVault = () => {
    sfx("swoosh");
    prefetch.staking();
    setNftOpen(false);
    setStakingTab("nft");
    setStakingOpen(true);
  };

  /** and the other way round: the vault sends the player to the market */
  const openNftFromStaking = () => {
    sfx("swoosh");
    prefetch.nft();
    setStakingOpen(false);
    setNftOpen(true);
  };

  /** cars pledged against a loan: the dealership must not offer them for sale */
  const collateralIds = playerState.defi.loans.flatMap((l) => l.collateral);

  const ownedNfts = playerState.nft.owned.map((id) => nftById(id)).filter((n): n is NonNullable<typeof n> => !!n);

  const buyNft = (id: string) => {
    const item = nftById(id);
    if (!item) return false;
    if (playerState.nft.owned.includes(id)) return false;
    if (coins < item.price) {
      sfx("error");
      showToast(t.notEnoughCoins, "error");
      return false;
    }
    sfx("coinJingle");
    setPlayerState((p) => ({
      ...p,
      coins: p.coins - item.price,
      nft: { ...p.nft, owned: [...p.nft.owned, id] },
    }));
    showToast(fmt(t.nftBoughtToast, { n: item.name }), "success");
    return true;
  };

  const sellNft = (id: string) => {
    const item = nftById(id);
    if (!item) return false;
    if (!playerState.nft.owned.includes(id)) return false;
    if (playerState.nft.stakes.some((x) => x.nftId === id)) {
      sfx("error");
      showToast(t.nftLocked, "error");
      return false;
    }
    const payout = nftSellValue(item);
    sfx("coinJingle");
    setPlayerState((p) => ({
      ...p,
      coins: p.coins + payout,
      nft: { ...p.nft, owned: p.nft.owned.filter((x) => x !== id) },
    }));
    showToast(fmt(t.nftSoldToast, { n: payout.toLocaleString("en-US") }), "success");
    return true;
  };

  const stakeNft = (id: string) => {
    const item = nftById(id);
    if (!item) return false;
    if (!playerState.nft.owned.includes(id)) return false;
    if (playerState.nft.stakes.some((x) => x.nftId === id)) return false;
    const at = now();
    sfx("coinJingle");
    setPlayerState((p) => ({
      ...p,
      nft: {
        ...p.nft,
        stakes: [...p.nft.stakes, { id: newId("ns"), nftId: id, startedAt: at, accruedAt: at }],
      },
    }));
    showToast(fmt(t.nftStakedToast, { n: item.name }), "success");
    return true;
  };

  const claimNftStake = (stakeId: string) => {
    const stake = playerState.nft.stakes.find((x) => x.id === stakeId);
    const item = stake ? nftById(stake.nftId) : undefined;
    if (!stake || !item) return false;
    const reward = Math.floor(nftStakeEarned(stake, item, now()));
    if (reward < 1) {
      sfx("error");
      showToast(fmt(t.tooSmall, { n: "1" }), "error");
      return false;
    }
    sfx("coinJingle");
    setPlayerState((p) => ({
      ...p,
      coins: p.coins + reward,
      nft: {
        ...p.nft,
        stakes: p.nft.stakes.map((x) => (x.id === stakeId ? { ...x, accruedAt: now() } : x)),
      },
    }));
    showToast(fmt(t.nftClaimedToast, { n: reward.toLocaleString("en-US") }), "success");
    return true;
  };

  const unstakeNft = (stakeId: string) => {
    const stake = playerState.nft.stakes.find((x) => x.id === stakeId);
    const item = stake ? nftById(stake.nftId) : undefined;
    if (!stake || !item) return false;
    sfx("swoosh");
    setPlayerState((p) => ({
      ...p,
      nft: { ...p.nft, stakes: p.nft.stakes.filter((x) => x.id !== stakeId) },
    }));
    showToast(fmt(t.nftUnstakedToast, { n: item.name }), "success");
    return true;
  };

  const now = () => Date.now();

  /** money in: every defi action pays from the coin balance */
  const spend = (amount: number) => coins >= amount && amount > 0;

  const addLiquidity = (poolId: string, amount: number) => {
    if (!spend(amount)) {
      sfx("error");
      showToast(t.notEnoughCoins, "error");
      return false;
    }
    const pool = allPools(playerState.defi).find((p) => p.id === poolId);
    sfx("coinJingle");
    setPlayerState((p) => {
      const existing = p.defi.positions.find((x) => x.poolId === poolId && x.kind === "lp");
      const positions = existing
        ? p.defi.positions.map((x) => (x.id === existing.id ? { ...x, amount: x.amount + amount, updatedAt: now() } : x))
        : [
            ...p.defi.positions,
            {
              id: newId("lp"),
              poolId,
              kind: "lp" as const,
              name: pool ? poolName(pool) : poolId,
              amount,
              apr: pool?.apr ?? 0.5,
              startedAt: now(),
              accruedAt: now(),
              unlockAt: 0,
            },
          ];
      return { ...p, coins: p.coins - amount, defi: { ...p.defi, positions } };
    });
    showToast(fmt(t.depositedToast, { n: amount.toLocaleString("en-US") }), "success");
    return true;
  };

  const createPool = (a: TokenId, b: TokenId, fee: number, amount: number) => {
    if (!spend(amount)) {
      sfx("error");
      showToast(t.notEnoughCoins, "error");
      return false;
    }
    const pool: PoolInfo = {
      id: newId(`p-${a}-${b}`),
      a,
      b,
      fee,
      apr: aprForFee(fee),
      // a fresh pool is mostly virtual liquidity, the deposit is the real part
      liquidity: Math.max(250_000, amount),
      reward: 0,
      custom: true,
    };
    sfx("coinJingle");
    setPlayerState((p) => ({
      ...p,
      coins: p.coins - amount,
      defi: {
        ...p.defi,
        pools: [pool, ...p.defi.pools],
        positions: [
          ...p.defi.positions,
          {
            id: newId("lp"),
            poolId: pool.id,
            kind: "lp" as const,
            name: poolName(pool),
            amount,
            apr: pool.apr,
            startedAt: now(),
            accruedAt: now(),
            unlockAt: 0,
          },
        ],
      },
    }));
    showToast(fmt(t.poolCreatedToast, { n: poolName(pool) }), "success");
    return true;
  };

  const stake = (amount: number, tier: StakeTier) => {
    if (!spend(amount)) {
      sfx("error");
      showToast(t.notEnoughCoins, "error");
      return false;
    }
    const at = now();
    const position: StakePosition = {
      id: newId("st"),
      poolId: SINGLE_POOL_ID,
      kind: "single",
      name: SINGLE_POOL_NAME,
      amount,
      apr: tier.apr,
      startedAt: at,
      accruedAt: at,
      unlockAt: at + tier.days * 86_400_000,
    };
    sfx("coinJingle");
    setPlayerState((p) => ({ ...p, coins: p.coins - amount, defi: { ...p.defi, positions: [...p.defi.positions, position] } }));
    showToast(fmt(t.stakedToast, { n: amount.toLocaleString("en-US") }), "success");
    return true;
  };

  const claimPosition = (id: string) => {
    const position = playerState.defi.positions.find((p) => p.id === id);
    if (!position) return false;
    const reward = Math.floor(earnedOf(position, now()));
    // a fraction of a coin is not worth a transaction
    if (reward < 1) {
      return false;
    }
    sfx("coinJingle");
    setPlayerState((p) => ({
      ...p,
      coins: p.coins + reward,
      defi: {
        ...p.defi,
        positions: p.defi.positions.map((x) => (x.id === id ? { ...x, accruedAt: now() } : x)),
      },
    }));
    showToast(fmt(t.claimedToast, { n: reward.toLocaleString("en-US") }), "success");
    return true;
  };

  const withdrawPosition = (id: string) => {
    const position = playerState.defi.positions.find((p) => p.id === id);
    if (!position) return false;
    if (position.unlockAt > now()) return false;
    const payout = position.amount + Math.floor(earnedOf(position, now()));
    sfx("coinJingle");
    setPlayerState((p) => ({
      ...p,
      coins: p.coins + payout,
      defi: { ...p.defi, positions: p.defi.positions.filter((x) => x.id !== id) },
    }));
    showToast(fmt(t.withdrawnToast, { n: payout.toLocaleString("en-US") }), "success");
    return true;
  };

  const borrow = (amount: number, collateral: string[]) => {
    if (amount <= 0 || !collateral.length) return false;
    const loan: Loan = { id: newId("ln"), principal: amount, apr: LOAN_APR, borrowedAt: now(), collateral };
    sfx("coinJingle");
    setPlayerState((p) => ({ ...p, coins: p.coins + amount, defi: { ...p.defi, loans: [...p.defi.loans, loan] } }));
    showToast(fmt(t.borrowedToast, { n: amount.toLocaleString("en-US") }), "success");
    return true;
  };

  const repayLoan = (id: string) => {
    const loan = playerState.defi.loans.find((l) => l.id === id);
    if (!loan) return false;
    const cost = Math.ceil(debtOf(loan, now()));
    if (coins < cost) {
      sfx("error");
      showToast(t.notEnoughCoins, "error");
      return false;
    }
    sfx("coinJingle");
    setPlayerState((p) => ({
      ...p,
      coins: p.coins - cost,
      defi: { ...p.defi, loans: p.defi.loans.filter((l) => l.id !== id) },
    }));
    showToast(fmt(t.repaidToast, { n: cost.toLocaleString("en-US") }), "success");
    return true;
  };

  /** value of a set of owned cars, the number the LTV is measured against */
  const valueOfIds = (ids: string[]) =>
    ownedCars.filter((c) => ids.includes(c.id)).reduce((sum, c) => sum + sellValueOf(c), 0);

  /** add one (or more) free cars to an existing loan */
  const addCollateral = (loanId: string, carIds: string[]) => {
    const loan = playerState.defi.loans.find((l) => l.id === loanId);
    if (!loan) return false;
    const used = new Set(playerState.defi.loans.flatMap((l) => l.collateral));
    const fresh = carIds.filter((id) => owned.includes(id) && !used.has(id));
    if (!fresh.length) return false;
    sfx("coinJingle");
    setPlayerState((p) => ({
      ...p,
      defi: {
        ...p.defi,
        loans: p.defi.loans.map((l) => (l.id === loanId ? { ...l, collateral: [...l.collateral, ...fresh] } : l)),
      },
    }));
    const names = fresh.map((id) => cars.find((c) => c.id === id)?.name ?? id).join(" · ");
    showToast(fmt(t.pledgedToast, { n: names }), "success");
    return true;
  };

  /**
   * Free a single pledged car.
   *
   * The loan has to stay covered at the LTV after the car leaves, otherwise it
   * would be under-collateralised; in that case the player is told how much of
   * the debt has to go first.
   */
  const releaseCollateral = (loanId: string, carId: string) => {
    const loan = playerState.defi.loans.find((l) => l.id === loanId);
    if (!loan || !loan.collateral.includes(carId)) return false;
    const car = cars.find((c) => c.id === carId);
    if (!car) return false;
    const remaining = loan.collateral.filter((id) => id !== carId);
    const after = valueOfIds(remaining) * LTV;
    const debt = debtOf(loan, now());
    if (debt > after) {
      sfx("error");
      showToast(fmt(t.releaseBlocked, { n: Math.ceil(debt - after).toLocaleString("en-US") }), "error");
      return false;
    }
    sfx("swoosh");
    setPlayerState((p) => ({
      ...p,
      defi: {
        ...p.defi,
        loans: p.defi.loans.map((l) => (l.id === loanId ? { ...l, collateral: remaining } : l)),
      },
    }));
    showToast(fmt(t.releasedToast, { n: car.name }), "success");
    return true;
  };

  /* ---------------- coin shop (buy coins with SOL) ---------------- */
  const openCoinShop = () => {
    sfx("click");
    setCoinShopOpen(true);
  };

  const closeCoinShop = () => {
    sfx("click");
    setCoinShopOpen(false);
  };

  /** called by the coin shop once a payment is confirmed */
  const purchasePack = (pack: CoinPack) => {
    sfx("coinJingle");
    setPlayerState((p) => ({ ...p, coins: p.coins + pack.coins }));
    triggerCoinFly({
      amount: pack.coins,
      targetId: isDesktop ? "desktop-top-coin-badge" : "mobile-top-coin-badge",
    });
    showToast(fmt(t.packPurchased, { n: pack.coins.toLocaleString("en-US") }), "success");
  };

  const sellValueOf = (car: Car) => sellValue(car, levelsOf(playerState, car.id));

  const requestSell = (car: Car) => {
    if (!owned.includes(car.id)) return;
    if (playerState.defi.loans.some((l) => l.collateral.includes(car.id))) {
      sfx("error");
      showToast(t.collateralLocked, "error");
      return;
    }
    if (owned.length <= 1) {
      sfx("error");
      showToast(t.cantSellLast, "error");
      return;
    }
    sfx("click");
    setSellTarget(car);
  };

  const confirmSell = (e: MouseEvent<HTMLButtonElement>) => {
    const car = sellTarget;
    if (!car) return;
    if (!owned.includes(car.id) || owned.length <= 1) {
      setSellTarget(null);
      return;
    }
    const value = sellValueOf(car);
    sfx("coinJingle");
    if (value > 0) triggerCoinFly({ startEl: e.currentTarget, amount: value, targetId: "dealer-coin-badge" });
    setPlayerState((p) => {
      const nextOwned = p.owned.filter((id) => id !== car.id);
      const upgrades = { ...p.upgrades };
      delete upgrades[car.id];
      const paints = { ...p.paints };
      delete paints[car.id];
      return {
        ...p,
        coins: p.coins + value,
        owned: nextOwned,
        activeCarId: p.activeCarId === car.id ? nextOwned[0] : p.activeCarId,
        upgrades,
        paints,
      };
    });
    setSellTarget(null);
    showToast(fmt(t.soldToast, { n: car.name, p: value.toLocaleString("en-US") }), "success");
  };

  /* ---------------- garage: upgrades & coins ---------------- */
  const upgrade = (key: UpgradeKey) => {
    const level = activeLevels[key];
    if (level >= MAX_LEVEL) return;
    const cost = upgradeCost(key, level);
    if (coins < cost) {
      sfx("error");
      showToast(t.notEnoughCoins, "error");
      return;
    }
    sfx("success");
    const carId = activeCar.id;
    setPlayerState((p) => {
      const lv = levelsOf(p, carId);
      return {
        ...p,
        coins: p.coins - cost,
        upgrades: { ...p.upgrades, [carId]: { ...lv, [key]: Math.min(MAX_LEVEL, lv[key] + 1) } },
      };
    });
    bumpTask("upgrade");
    showToast(fmt(t.upgraded, { p: t[UPG_NAME[key]], l: level + 1 }), "success");
  };

  /* ---------------- garage: paint job ---------------- */
  const openPaint = () => {
    sfx("click");
    setPaintOpen(true);
  };

  /** Spray a paint on the driven car; every paint job costs coins. */
  const applyPaint = (paintId: string) => {
    const paint = paintById(paintId);
    if (paintOf(playerState, activeCar.id) === paint.id) return;
    if (coins < paint.price) {
      sfx("error");
      showToast(t.notEnoughCoins, "error");
      return;
    }
    sfx("coinJingle");
    setPlayerState((p) => ({
      ...p,
      coins: p.coins - paint.price,
      paints: { ...p.paints, [activeCar.id]: paint.id },
    }));
    showToast(fmt(t.painted, { c: paint.name[lang], p: paint.price.toLocaleString("en-US") }), "success");
  };

  const collectReward = (e?: MouseEvent<HTMLButtonElement>) => {
    if (playerState.runReward <= 0) return;
    sfx("coinJingle");
    const gained = playerState.runReward;

    // Trigger flying coins straight to the top coin counter
    triggerCoinFly({
      startEl: e?.currentTarget,
      startX: e?.clientX,
      startY: e?.clientY,
      amount: gained,
      targetId: isDesktop ? "desktop-top-coin-badge" : "mobile-top-coin-badge",
    });

    setPlayerState((p) => ({ ...p, coins: p.coins + gained, runReward: 0 }));
    bumpTask("collect");
    showToast(fmt(t.rewardCollected, { n: gained.toLocaleString("en-US") }), "success");
  };

  const claimTask = (id: string, e?: MouseEvent<HTMLButtonElement>) => {
    const def = TASKS.find((x) => x.id === id);
    const view = tasks.find((x) => x.id === id);
    if (!def || !view || view.claimed || view.progress < def.goal) {
      sfx("error");
      return;
    }
    sfx("coinJingle");

    // Trigger flying coins straight into the top Shop / Coins counter!
    triggerCoinFly({
      startEl: e?.currentTarget,
      startX: e?.clientX,
      startY: e?.clientY,
      amount: def.reward,
      targetId: isDesktop ? "desktop-top-coin-badge" : "panel-coin-badge",
    });

    setPlayerState((p) => ({
      ...p,
      coins: p.coins + def.reward,
      tasksClaimed: [...p.tasksClaimed, id],
    }));
    showToast(fmt(t.claimedToast, { n: def.reward.toLocaleString("en-US") }), "success");
  };

  /* ---------------- daily check-in ---------------- */
  const claimDailyReward = (e?: MouseEvent<HTMLButtonElement>) => {
    if (daily.claimedToday) {
      sfx("error");
      return;
    }
    sfx("coinJingle");

    // coins fly from the button into the top counter, same as missions
    triggerCoinFly({
      startEl: e?.currentTarget,
      startX: e?.clientX,
      startY: e?.clientY,
      amount: daily.reward,
      targetId: isDesktop ? "desktop-top-coin-badge" : "panel-coin-badge",
    });

    const nextStreak = daily.streak + 1;
    setPlayerState((p) => ({
      ...p,
      coins: p.coins + daily.reward,
      daily: claimDaily(p.daily ?? DEFAULT_DAILY, new Date()),
    }));
    setClock(Date.now());
    showToast(fmt(t.dailyClaimedToast, { n: daily.reward.toLocaleString("en-US") }), "success");
    if (nextStreak % 7 === 0) showToast(fmt(t.dailyStreakToast, { n: nextStreak }), "success");
  };

  /* ------------------- Solana Connect Actions ------------------- */
  const startSession = (address: string, providerName: string) => {
    sfx("success");
    const newPlayer: Player = {
      name: `Sol_${address.slice(0, 4)}`,
      id: String(100000 + Math.floor(Math.random() * 900000)),
      provider: providerName,
      walletAddress: address,
      solBalance: +(Math.random() * 14 + 1.25).toFixed(3),
    };
    try {
      localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(newPlayer));
    } catch {
      /* ignore */
    }
    setPlayer(newPlayer);
    setScreen("loading");
  };

  const handleConnectWallet = async (wallet: SolanaWalletInfo) => {
    sfx("click");
    setSelectedWallet(wallet.id);

    if (!wallet.installed || !wallet.adapter) {
      sfx("error");
      showToast(fmt(t.walletNotFound, { name: wallet.name }), "error");
      setWalletModalOpen(true);
      return;
    }

    try {
      setConnecting(true);
      const res = await wallet.adapter.connect();
      const pubkey = res.publicKey.toString?.() || res.publicKey.toBase58?.();
      setConnecting(false);
      setWalletModalOpen(false);
      if (pubkey) startSession(pubkey, wallet.name);
      else throw new Error("No public key returned");
    } catch (err) {
      setConnecting(false);
      sfx("error");
      console.warn("Wallet connection error:", err);
      showToast(t.walletFailed, "error");
    }
  };

  const handleDemoWallet = () => {
    sfx("click");
    setWalletModalOpen(false);
    startSession(generateDemoAddress(), "Demo Wallet");
  };

  const handleLoadingDone = useCallback(() => {
    setScreen("home");
    setTab("garage");
  }, []);

  useEffect(() => {
    if (screen === "home" && player) {
      showToast(
        fmt(t.loggedIn, { n: player.walletAddress.slice(0, 4) + "..." + player.walletAddress.slice(-4) }),
        "success",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  const logout = () => {
    sfx("click");
    setScreen("login");
    setPlayer(null);
    setSelectedWallet(null);
    try {
      localStorage.removeItem(WALLET_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    showToast(t.loggedOut, "info");
  };

  const openOptions = () => {
    sfx("click");
    setDraftSettings(settings);
  };

  /** left dock: copy the driver's referral link */
  const shareInvite = () => {
    const ref = String(player?.id ?? "GUEST");
    sfx("coinJingle");
    try {
      void navigator.clipboard?.writeText(`https://heatchase.game/join/${ref}`);
    } catch {
      /* clipboard blocked: the toast still shows the code */
    }
    showToast(fmt(t.inviteCopied, { n: ref }), "success");
  };

  const saveOptions = () => {
    if (draftSettings) {
      setSettings(draftSettings);
      saveSettings(draftSettings);
    }
    setDraftSettings(null);
    sfx("success");
    showToast(strings[(draftSettings ?? settings).lang].saved, "success");
  };

  /* ---------------- racing ---------------- */
  const startRace = (mode: RaceMode) => {
    if (raceMode) return;
    if (coins < mode.fee) {
      sfx("error");
      showToast(fmt(t.needMore, { n: (mode.fee - coins).toLocaleString("en-US") }), "error");
      return;
    }
    sfx("swoosh");
    // pay entry fee + count the race for missions
    setPlayerState((p) => ({
      ...p,
      coins: p.coins - mode.fee,
      raceCount: p.raceCount + 1,
      taskProgress: {
        ...p.taskProgress,
        race: (p.taskProgress.race ?? 0) + 1,
        chase: mode.id === "pursuit" ? (p.taskProgress.chase ?? 0) + 1 : p.taskProgress.chase ?? 0,
      },
    }));
    setRaceResult(null);
    setRaceBest(false);
    setRaceMode(mode);
    if (raceTimer.current) window.clearTimeout(raceTimer.current);
    raceTimer.current = window.setTimeout(() => {
      const res = simulateRace(mode, activeStats);
      setRaceResult(res);
      sfx(res.won ? "success" : "error");
      // leaderboard: bank the points and remember the best run of this mode
      const prevBest = scoreRef.current.best[mode.id] ?? 0;
      setRaceBest(res.points > prevBest);
      setPlayerState((p) => ({
        ...p,
        score: {
          total: p.score.total + res.points,
          runs: p.score.runs + 1,
          wins: p.score.wins + (res.won ? 1 : 0),
          best: { ...p.score.best, [mode.id]: Math.max(prevBest, res.points) },
        },
      }));
      if (res.won) {
        setPlayerState((p) => ({
          ...p,
          raceWins: { ...p.raceWins, [mode.id]: (p.raceWins[mode.id] ?? 0) + 1 },
          taskProgress: { ...p.taskProgress, raceWin: (p.taskProgress.raceWin ?? 0) + 1 },
        }));
      }
    }, 3600);
  };

  const collectRacePrize = (e: MouseEvent<HTMLButtonElement>) => {
    if (!raceMode || !raceResult) return;
    const reward = raceResult.reward;
    if (reward > 0) {
      sfx("coinJingle");
      triggerCoinFly({
        startEl: e.currentTarget,
        startX: e.clientX,
        startY: e.clientY,
        amount: reward,
        targetId: isDesktop ? "desktop-top-coin-badge" : "mobile-top-coin-badge",
      });
      setPlayerState((p) => ({ ...p, coins: p.coins + reward }));
    } else {
      sfx("click");
    }
    showToast(
      raceResult.won
        ? fmt(t.raceWon, { r: raceMode.title[lang], n: reward.toLocaleString("en-US") })
        : fmt(t.raceLost, { p: raceResult.place, n: reward.toLocaleString("en-US") }),
      raceResult.won ? "success" : "info",
    );
    setRaceMode(null);
    setRaceResult(null);
  };

  const startRaceRef = useRef<RaceMode | null>(null);
  useEffect(() => {
    if (!raceMode && startRaceRef.current) {
      const m = startRaceRef.current;
      startRaceRef.current = null;
      startRace(m);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raceMode]);

  const closeRace = () => {
    sfx("click");
    setRaceMode(null);
    setRaceResult(null);
  };

  const raceAgain = () => {
    const m = raceMode;
    if (!m) return;
    // restart immediately with the same mode (startRace guards on raceMode, so clear it first)
    setRaceMode(null);
    setRaceResult(null);
    startRaceRef.current = m;
  };

  const openRace = () => {
    sfx("click");
    if (isDesktop) setRightTab("race");
    else setTab("race");
  };

  /** START CHASE button -> jump to race modes (or straight into pursuit) */
  const startChase = () => {
    openRace();
  };

  const confirmExit = () => {
    sfx("click");
    setExitOpen(false);
    showToast(t.bye, "info");
    window.setTimeout(() => window.close(), 800);
  };

  /* desktop quick toggles */
  const persist = (next: Settings) => {
    setSettings(next);
    saveSettings(next);
  };
  const quickSound = () => persist({ ...settings, sound: !settings.sound });
  const quickLang = () => {
    sfx("toggle");
    persist({ ...settings, lang: settings.lang === "en" ? "fa" : "en" });
  };

  const connectDefault = () => {
    const phantom = wallets.find((w) => w.id === "phantom");
    if (phantom?.installed) void handleConnectWallet(phantom);
    else setWalletModalOpen(true);
  };

  /* ------------------------- keyboard shortcuts -------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (coinShopOpen) return setCoinShopOpen(false);
        if (sellTarget) return setSellTarget(null);
        if (buyTarget) return setBuyTarget(null);
        if (paintOpen) return setPaintOpen(false);
        if (nftOpen) return setNftOpen(false);
        if (stakingOpen) return setStakingOpen(false);
        if (dealerOpen) return setDealerOpen(false);
        if (exitOpen) return setExitOpen(false);
        if (walletModalOpen) return setWalletModalOpen(false);
        if (draftSettings) return setDraftSettings(null);
      }
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (buyTarget) {
        if (e.key === "Enter") {
          e.preventDefault();
          confirmBuy();
        }
        return;
      }
      if (
        exitOpen ||
        walletModalOpen ||
        draftSettings ||
        screen === "loading" ||
        raceMode ||
        nftOpen ||
        stakingOpen ||
        dealerOpen ||
        coinShopOpen ||
        sellTarget ||
        paintOpen
      )
        return;
      if (!isDesktop && tab !== "cars") return;
      if (e.key === "ArrowLeft") changeCar(-1);
      else if (e.key === "ArrowRight") changeCar(1);
      else if (e.key === "Enter" && screen === "login") connectDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* ----------------------------- shared props ---------------------- */
  const liveSettings = draftSettings ?? settings;
  const tLive = strings[liveSettings.lang];

  const walletById = (id: SolanaWalletInfo["id"]): SolanaWalletInfo =>
    wallets.find((w) => w.id === id) || { id, name: id, icon: id, installed: false };

  const garage: GarageData = {
    car: activeCar,
    lang,
    levels: activeLevels,
    coins,
    runReward: playerState.runReward,
    paintId: activePaint,
    onUpgrade: upgrade,
    onCollect: collectReward,
    onOpenPaint: openPaint,
    onOpenShop: openCoinShop,
  };

  /** the player's own row on the score board */
  const myBoard: BoardEntry = {
    id: ME_ID,
    name: player?.name || t.you,
    carId: activeCar.id,
    total: playerState.score.total,
    best: playerState.score.best,
    races: playerState.score.runs,
    wins: playerState.score.wins,
  };

  const race: RaceProps = {
    stats: activeStats,
    coins,
    wins: playerState.raceWins,
    racing: !!raceMode,
    onRace: startRace,
    board: myBoard,
  };

  const onTab = (v: TabKey) => {
    sfx("click");
    setTab(v);
  };

  /* ----------------------------- mobile login ---------------------- */
  const mobileLogin = (
    <div className="flex h-full flex-col">
      <TitleBanner
        small={activeCar.cls}
        big={activeCar.name}
        tag={activeCar.rarity}
        tagColor={activeCar.rarityColor}
        accent={activeCar.accent}
      />

      <main className="relative min-h-0 flex-1">
        {tab === "cars" && (
          <>
            <CarShowcase
              car={activeCar}
              onPrev={() => changeCar(-1)}
              onNext={() => changeCar(1)}
              hasMultiple={ownedCars.length > 1}
            />
            <div className="pointer-events-none absolute inset-0" dir="ltr">
              <SlotButton
                className="pointer-events-auto absolute left-[26px] top-[10px]"
                icon={<PhantomIcon width={40} height={40} />}
                label="PHANTOM"
                onClick={() => void handleConnectWallet(walletById("phantom"))}
              />
              <SlotButton
                className="pointer-events-auto absolute right-[26px] top-[10px]"
                icon={<SolflareIcon width={40} height={40} />}
                label="SOLFLARE"
                onClick={() => void handleConnectWallet(walletById("solflare"))}
              />
              <SlotButton
                className="pointer-events-auto absolute left-[26px] top-[130px]"
                icon={<BackpackIcon width={40} height={40} />}
                label="BACKPACK"
                onClick={() => void handleConnectWallet(walletById("backpack"))}
              />
              <SlotButton
                className="pointer-events-auto absolute right-[26px] top-[130px]"
                icon={<SolanaIcon width={36} height={36} />}
                label="DEMO"
                onClick={handleDemoWallet}
              />
            </div>
          </>
        )}
        {tab === "race" && <RaceView t={t} lang={lang} race={race} />}
        {tab === "garage" && <GarageView t={t} garage={garage} ownedCars={ownedCars} onEquip={equip} />}
        {tab === "tasks" && (
          <TasksView
            t={t}
            lang={lang}
            tasks={tasks}
            coins={coins}
            onClaim={claimTask}
            daily={daily}
            onClaimDaily={claimDailyReward}
          />
        )}
        {tab === "news" && <NewsPanel items={t.news} title={t.tabNews} />}
      </main>

      {/* power / tier + coins, top speed, body */}
      <section className="shrink-0 space-y-[8px] px-[24px] pt-[2px]">
        <StatPills stats={activeStats} tier={activeCar.tier} powerLabel={t.power} lvLabel={t.lv} />
        <StatsRow
          stats={activeStats}
          coins={coins}
          onCoinsClick={openCoinShop}
          labels={{ coins: t.coins, topSpeed: t.topSpeed, armor: t.armor, kmh: t.kmh }}
        />
        <div className="flex items-center justify-between rounded-full border-[3px] border-ink bg-navy-950/90 px-[16px] py-[5px] shadow-[inset_0_2px_0_rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-[8px]">
            <div className="flex h-[24px] w-[24px] items-center justify-center rounded-[7px] bg-gradient-to-tr from-[#9945FF] to-[#14F195] text-navy-950">
              <SolanaIcon width={16} height={16} />
            </div>
            <span className="font-display text-[14px] tracking-wide text-white t-stroke sw-2">SOLANA ARENA</span>
          </div>
          <span className="flex items-center gap-[6px] font-body text-[11px] font-black text-mint-400">
            <span className="h-[7px] w-[7px] rounded-full bg-mint-400 shadow-[0_0_6px_#46f0a0]" />
            SOLANA MAINNET
          </span>
        </div>
      </section>

      {/* actions: CONNECT on top, the three markets + options below */}
      <section className="shrink-0 space-y-[8px] px-[18px] pb-[12px] pt-[10px]">
        <GameButton variant="orange" className="h-[72px] w-full animate-glow" disabled={connecting} onClick={connectDefault}>
          <span className="flex items-center justify-center gap-[10px]">
            <span className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full border-[3px] border-ink bg-gradient-to-b from-[#9ef05a] to-[#3d9a1f] text-white shadow-[0_3px_0_#1f5a10]">
              <WalletIcon width={26} height={26} className="text-[#dfe6f3]" />
              <PlayIcon
                width={16}
                height={16}
                className="absolute -bottom-[5px] -right-[5px] rounded-full border-[2px] border-ink bg-mint-400 p-[2px] text-ink"
              />
            </span>
            <span className="font-display text-[24px] tracking-wide text-flame-500 t-stroke sw-5 sc-white">
              {connecting ? t.connectingWallet : t.connectWallet.split(" ")[0]}
            </span>
          </span>
        </GameButton>

        <div className="flex items-stretch justify-center gap-[8px]">
          <GameButton
            variant="green"
            className="h-[56px] flex-1"
            id="mobile-login-nft-btn"
            onClick={openNft}
            onPointerEnter={() => prefetch.nft()}
          >
            <span className="flex flex-col items-center gap-[1px] font-display text-[11px] leading-none tracking-wide text-white t-stroke sw-3">
              <StarBurstIcon width={18} height={18} />
              {t.nft}
            </span>
          </GameButton>

          <GameButton
            variant="blue"
            className="h-[56px] flex-1"
            onClick={openDealer}
            onPointerEnter={() => prefetch.dealership()}
          >
            <span className="flex flex-col items-center gap-[1px] whitespace-nowrap font-display text-[11px] leading-none tracking-wide text-[#04182c]">
              <StoreIcon width={18} height={18} />
              {t.dealership}
            </span>
          </GameButton>

          <GameButton
            variant="green"
            className="h-[56px] flex-1"
            id="mobile-login-staking-btn"
            onClick={openStaking}
            onPointerEnter={() => prefetch.staking()}
          >
            <span className="flex flex-col items-center gap-[1px] font-display text-[11px] leading-none tracking-wide text-[#04120c]">
              <BoltIcon width={18} height={18} />
              {t.staking}
            </span>
          </GameButton>

          <GameButton variant="grey" className="h-[56px] flex-1" onClick={openOptions}>
            <span className="flex flex-col items-center gap-[1px] font-display text-[11px] leading-none tracking-wide text-white t-stroke sw-3">
              <GearIcon width={18} height={18} className="text-white" />
              {t.options}
            </span>
          </GameButton>
        </div>
      </section>

      <BottomBar
        car={activeCar}
        tab={tab}
        onTab={onTab}
        onBack={() => {
          sfx("click");
          setExitOpen(true);
        }}
        labels={{ cars: t.tabCars, race: t.tabRace, garage: t.garage, tasks: t.tabTasks, news: t.tabNews }}
        taskBadge={taskBadge}
        status={
          <>
            <span className="h-[8px] w-[8px] shrink-0 rounded-full bg-mint-400 shadow-[0_0_8px_#46f0a0]" />
            <span className="truncate">{coins.toLocaleString("en-US")}</span>
          </>
        }
      />
    </div>
  );

  /* ----------------------------- render ---------------------------- */
  return (
    <GameCanvas lang={liveSettings.lang} viewport={viewport}>
      <PaintProvider paints={playerState.paints}>
      {isDesktop ? (
        <DesktopView
          t={t}
          lang={lang}
          settings={settings}
          viewCar={activeCar}
          viewStats={activeStats}
          viewIdx={activeIdx}
          garage={garage}
          ownedCars={ownedCars}
          tasks={tasks}
          taskBadge={taskBadge}
          onClaimTask={claimTask}
          daily={daily}
          onClaimDaily={claimDailyReward}
          race={race}
          onSelectCar={selectCar}
          onPrev={() => changeCar(-1)}
          onNext={() => changeCar(1)}
          onOpenDealer={openDealer}
          onOpenStaking={openStaking}
          onOpenNft={openNft}
          onOpenCoinShop={openCoinShop}
          onEquip={equip}
          screen={screen}
          player={player}
          wallets={wallets}
          connecting={connecting}
          selectedWallet={selectedWallet}
          onConnectWallet={(w) => void handleConnectWallet(w)}
          onDemoConnect={handleDemoWallet}
          onOpenWalletModal={() => setWalletModalOpen(true)}
          onOptions={openOptions}
          onInvite={shareInvite}
          onExit={() => {
            sfx("click");
            setExitOpen(true);
          }}
          onLogout={logout}
          onStartChase={startChase}
          onToggleSound={quickSound}
          onToggleLang={quickLang}
          onCopied={() => showToast(t.copied, "success")}
          rightTab={rightTab}
          onRightTab={(v) => {
            sfx("click");
            setRightTab(v);
          }}
        />
      ) : screen === "home" && player ? (
        <WelcomeScreen
          t={t}
          lang={lang}
          viewCar={activeCar}
          viewStats={activeStats}
          garage={garage}
          ownedCars={ownedCars}
          tasks={tasks}
          taskBadge={taskBadge}
          onClaimTask={claimTask}
          daily={daily}
          onClaimDaily={claimDailyReward}
          race={race}
          player={player}
          server={settings.server}
          tab={tab}
          onTab={onTab}
          onPrev={() => changeCar(-1)}
          onNext={() => changeCar(1)}
          onOpenDealer={openDealer}
          onOpenStaking={openStaking}
          onOpenNft={openNft}
          onOpenCoinShop={openCoinShop}
          onEquip={equip}
          onStartChase={startChase}
          onLogout={logout}
          onCopied={() => showToast(t.copied, "success")}
        />
      ) : (
        mobileLogin
      )}

      {/* race overlay */}
      {raceMode && (
        <LazyPanel
          id="raceOverlay"
          load={panels.raceOverlay}
          label={raceMode.title[lang]}
          props={{
            t,
            lang,
            mode: raceMode,
            car: activeCar,
            result: raceResult,
            best: raceBest,
            onCollect: collectRacePrize,
            onAgain: raceAgain,
            onClose: closeRace,
            onStageTick: () => sfx("swoosh"),
          }}
        />
      )}

      {/* dealership: buy & sell with search / sort / filter sidebar */}
      {dealerOpen && (
        <LazyPanel
          id="dealership"
          load={panels.dealership}
          label={t.dealership}
          props={{
            t,
            lang,
            layout: isDesktop ? "desktop" : "mobile",
            cars,
            owned,
            locked: collateralIds,
            activeId: activeCar.id,
            coins,
            sellValueOf,
            statsOf: (c: Car) => carStats(c, levelsOf(playerState, c.id)),
            onBuy: requestBuy,
            onSell: requestSell,
            onEquip: equip,
            onClose: closeDealer,
            onSfx: (n) => sfx(n),
          }}
        />
      )}

      {/* nft market: buy & sell car tokens */}
      {nftOpen && (
        <LazyPanel
          id="nft"
          load={panels.nft}
          label={t.nft}
          props={{
            t,
            lang,
            layout: isDesktop ? "desktop" : "mobile",
            coins,
            owned: playerState.nft.owned,
            staked: playerState.nft.stakes.map((x) => x.nftId),
            onBuy: buyNft,
            onSell: sellNft,
            onClose: closeNft,
            onSfx: (n) => sfx(n),
            onOpenVault: openNftVault,
          }}
        />
      )}

      {/* staking: pools, token staking and collateral loans */}
      {stakingOpen && (
        <LazyPanel
          id="staking"
          load={panels.staking}
          label={t.staking}
          props={{
            t,
            lang,
            layout: isDesktop ? "desktop" : "mobile",
            coins,
            ownedCars,
            sellValueOf,
            defi: playerState.defi,
            onAddLiquidity: addLiquidity,
            onCreatePool: createPool,
            onStake: stake,
            onClaim: claimPosition,
            onWithdraw: withdrawPosition,
            onBorrow: borrow,
            onRepay: repayLoan,
            onAddCollateral: addCollateral,
            onReleaseCollateral: releaseCollateral,
            nfts: ownedNfts,
            nftStakes: playerState.nft.stakes,
            onStakeNft: stakeNft,
            onClaimNft: claimNftStake,
            onUnstakeNft: unstakeNft,
            onOpenNft: openNftFromStaking,
            initialTab: stakingTab,
            onClose: closeStaking,
            onSfx: (n) => sfx(n),
          }}
        />
      )}

      {/* coin shop: packs + Solana checkout */}
      {coinShopOpen && (
        <LazyPanel
          id="coinShop"
          load={panels.coinShop}
          label={t.coinShop}
          props={{
            t,
            coins,
            walletAddress: player && player.provider !== "Demo Wallet" ? player.walletAddress : undefined,
            wide: isDesktop,
            onPurchase: purchasePack,
            onClose: closeCoinShop,
          }}
        />
      )}

      {/* purchase confirmation */}
      {buyTarget && (
        <BuyConfirmModal
          t={t}
          lang={lang}
          car={buyTarget}
          coins={coins}
          onConfirm={confirmBuy}
          onClose={() => {
            sfx("click");
            setBuyTarget(null);
          }}
        />
      )}

      {/* paint picker */}
      {paintOpen && (
        <PaintModal
          t={t}
          lang={lang}
          car={activeCar}
          paintId={activePaint}
          coins={coins}
          onApply={applyPaint}
          onClose={() => {
            sfx("click");
            setPaintOpen(false);
          }}
        />
      )}

      {/* sale confirmation */}
      {sellTarget && (
        <SellConfirmModal
          t={t}
          car={sellTarget}
          value={sellValueOf(sellTarget)}
          coins={coins}
          onConfirm={confirmSell}
          onClose={() => {
            sfx("click");
            setSellTarget(null);
          }}
        />
      )}

      {/* wallet modal */}
      {walletModalOpen && (
        <LazyPanel
          id="wallet"
          load={panels.wallet}
          label={t.selectWallet}
          props={{
            t,
            wallets,
            connecting,
            selectedWallet,
            onSelect: (w) => void handleConnectWallet(w),
            onDemoConnect: handleDemoWallet,
            onClose: () => setWalletModalOpen(false),
          }}
        />
      )}

      {/* overlays */}
      {screen === "loading" && <LoadingOverlay t={t} car={activeCar} onDone={handleLoadingDone} />}
      {draftSettings && (
        <OptionsModal
          t={tLive}
          settings={draftSettings}
          onChange={(s) => {
            sfx("toggle");
            setDraftSettings(s);
          }}
          onClose={() => setDraftSettings(null)}
          onSave={saveOptions}
        />
      )}
      {exitOpen && (
        <ExitDialog
          t={t}
          onYes={confirmExit}
          onNo={() => {
            sfx("click");
            setExitOpen(false);
          }}
        />
      )}
      <Toast toast={toast} className={isDesktop ? "bottom-[150px]" : undefined} />
      </PaintProvider>
    </GameCanvas>
  );
}
