import { useEffect, useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import type { Car } from "@/data/cars";
import { fmt, type Lang, type Strings } from "@/i18n";
import {
  FEE_TIERS,
  LOAN_APR,
  LTV,
  POOL_PAIRS,
  SINGLE_POOL_NAME,
  STAKE_TIERS,
  TOKENS,
  allPools,
  aprForFee,
  compact,
  debtOf,
  earnedOf,
  fmtYield,
  healthOf,
  healthTone,
  interestOf,
  lockLeft,
  pct,
  poolName,
  shareOf,
  type DefiState,
  type Loan,
  type PoolInfo,
  type StakePosition,
  type StakeTier,
  type TokenId,
} from "@/data/staking";
import {
  ArrowRightIcon,
  BoltIcon,
  CheckIcon,
  CloseIcon,
  CoinIcon,
  HeartIcon,
  LockIcon,
  PlusIcon,
  ShieldIcon,
  UndoIcon,
} from "@/icons";
import { PaintedImg } from "./PaintContext";
import { NFT_RARITY_COLOR, nftCar, nftDayYield, nftStakeEarned, type NftItem, type NftStake } from "@/data/nft";

/* ------------------------------------------------------------------ */
/* props                                                               */
/* ------------------------------------------------------------------ */

export interface StakingProps {
  t: Strings;
  lang: Lang;
  layout: "desktop" | "mobile";
  coins: number;
  ownedCars: Car[];
  sellValueOf: (car: Car) => number;
  defi: DefiState;
  onAddLiquidity: (poolId: string, amount: number) => boolean;
  onCreatePool: (a: TokenId, b: TokenId, fee: number, amount: number) => boolean;
  onStake: (amount: number, tier: StakeTier) => boolean;
  onClaim: (positionId: string) => boolean;
  onWithdraw: (positionId: string) => boolean;
  onBorrow: (amount: number, collateral: string[]) => boolean;
  onRepay: (loanId: string) => boolean;
  /** pledge extra cars on an existing loan */
  onAddCollateral: (loanId: string, carIds: string[]) => boolean;
  /** free one pledged car; the caller refuses when the loan would go uncovered */
  onReleaseCollateral: (loanId: string, carId: string) => boolean;
  /** car tokens the player owns (already resolved from ids) */
  nfts: NftItem[];
  /** tokens currently locked in the vault */
  nftStakes: NftStake[];
  onStakeNft: (nftId: string) => boolean;
  onClaimNft: (stakeId: string) => boolean;
  onUnstakeNft: (stakeId: string) => boolean;
  /** opens the NFT marketplace from the vault tab */
  onOpenNft: () => void;
  /** board shown on open (the market jumps straight to the vault) */
  initialTab?: Tab;
  onClose: () => void;
  onSfx?: (name: "click" | "toggle" | "swoosh") => void;
}

type Tab = "pools" | "stake" | "nft" | "loans";

/* ------------------------------------------------------------------ */
/* small pieces                                                        */
/* ------------------------------------------------------------------ */

function TokenBadge({ id, size = 26 }: { id: TokenId; size?: number }) {
  const tok = TOKENS[id];
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-[2px] border-[#05080a] bg-gradient-to-br font-display leading-none",
        tok.color,
      )}
      style={{ width: size, height: size, fontSize: size * 0.34, color: tok.ink }}
    >
      {tok.label.slice(0, id === "usdc" ? 3 : 3)}
    </span>
  );
}

function PairBadge({ a, b, size = 28 }: { a: TokenId; b: TokenId; size?: number }) {
  return (
    <span className="relative flex shrink-0 items-center" style={{ width: size * 1.6, height: size }}>
      <TokenBadge id={a} size={size} />
      <span className="absolute" style={{ left: size * 0.6 }}>
        <TokenBadge id={b} size={size} />
      </span>
    </span>
  );
}

function Coin({ size = 14 }: { size?: number }) {
  return <CoinIcon width={size} height={size} className="shrink-0 text-amber-400" />;
}

/** a labelled number, the unit of every row in this panel */
function Stat({
  label,
  children,
  align,
  tone,
  className,
}: {
  label: string;
  children: React.ReactNode;
  align?: "start" | "end";
  tone?: "default" | "green" | "amber" | "red";
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", align === "end" && "text-end", className)}>
      <div className="truncate font-body text-[9px] font-black uppercase tracking-[0.12em] text-white/40">{label}</div>
      <div
        dir="ltr"
        className={cn(
          "mt-[2px] truncate font-display text-[15px] leading-none tabular-nums",
          align === "end" && "text-end",
          tone === "green" && "text-[#2fe98a]",
          tone === "amber" && "text-amber-400",
          tone === "red" && "text-[#ff6b6b]",
          (!tone || tone === "default") && "text-white",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** money input: raw digits while typing, grouped on blur */
function AmountInput({
  t,
  value,
  onChange,
  max,
  label,
  presets = true,
}: {
  t: Strings;
  value: number;
  onChange: (n: number) => void;
  max: number;
  label: string;
  presets?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown =
    draft === null ? (value ? value.toLocaleString("en-US") : "") : Number(draft || 0) === value ? draft : value.toLocaleString("en-US");

  const set = (n: number) => onChange(Math.max(0, Math.min(max, Math.round(n))));

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-[6px]">
        <span className="font-body text-[9px] font-black uppercase tracking-[0.12em] text-white/40">{label}</span>
        <button
          type="button"
          onClick={() => {
            setDraft(null);
            set(max);
          }}
          className="rounded-full border-[2px] border-[#2a333c] px-[7px] font-body text-[9px] font-black tracking-wider text-[#2fe98a] transition-colors hover:border-[#2fe98a]"
        >
          {t.max}
        </button>
      </div>
      <div className="mt-[4px] flex items-center gap-[6px] rounded-[12px] border-[2px] border-[#2a333c] bg-[#0b0f12] px-[10px] py-[7px] transition-colors focus-within:border-[#2fe98a]/70">
        <Coin size={15} />
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          dir="ltr"
          data-amount=""
          aria-label={label}
          value={shown}
          placeholder="0"
          onChange={(e) => {
            const digits = e.target.value
              .replace(/[^\d]/g, "")
              .replace(/^0+(?=\d)/, "")
              .slice(0, 9);
            setDraft(digits);
            set(Number(digits || 0));
          }}
          onBlur={() => setDraft(null)}
          className="min-w-0 flex-1 bg-transparent font-display text-[17px] leading-none tabular-nums text-white outline-none placeholder:text-white/25"
        />
      </div>
      {presets && (
        <div className="mt-[5px] flex gap-[4px]">
          {[0.25, 0.5, 0.75].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setDraft(null);
                set(max * f);
              }}
              className="flex-1 rounded-full border-[2px] border-[#232a31] bg-[#10151a] py-[2px] font-body text-[9px] font-black text-white/55 transition-colors hover:border-[#2fe98a]/50 hover:text-white"
            >
              {f * 100}%
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** dark sheet used for the deposit / new-pool dialogs */
function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/70 px-[14px] backdrop-blur-[3px]" onClick={onClose}>
      <div
        className="relative w-[380px] max-w-full animate-slide-up rounded-[24px] border-[2px] border-[#2a333c] bg-[#0d1116] px-[18px] pb-[18px] pt-[16px] shadow-[0_24px_60px_rgba(0,0,0,0.7)]"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-[12px] flex items-center justify-between gap-[10px]">
          <h3 className="truncate font-display text-[19px] leading-none text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border-[2px] border-[#2a333c] text-white/60 transition-colors hover:border-[#ff6b6b] hover:text-white"
          >
            <CloseIcon width={13} height={13} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  kind = "ghost",
  disabled,
  className,
  ...rest
}: {
  children: React.ReactNode;
  onClick?: () => void;
  kind?: "ghost" | "primary" | "plain";
  disabled?: boolean;
  className?: string;
} & Record<string, unknown>) {
  return (
    <button
      type="button"
      onClick={(e) => {
        // row headers are clickable too: an action never means "toggle the row"
        e.stopPropagation();
        onClick?.();
      }}
      disabled={disabled}
      {...rest}
      className={cn(
        "flex shrink-0 items-center justify-center gap-[5px] whitespace-nowrap rounded-full px-[12px] py-[6px] font-display text-[12px] leading-none tracking-wide transition-all",
        kind === "primary" &&
          "bg-gradient-to-b from-[#4bf5a0] to-[#16a86a] text-[#04120c] shadow-[0_3px_0_#0b6a44] hover:brightness-110 active:translate-y-[2px] active:shadow-none",
        kind === "ghost" &&
          "border-[2px] border-[#2f3a44] bg-[#141a20] text-white hover:border-[#2fe98a]/60 active:translate-y-[1px]",
        kind === "plain" && "border-[2px] border-[#2f3a44] text-white/80 hover:text-white",
        disabled && "cursor-not-allowed opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* pools tab                                                           */
/* ------------------------------------------------------------------ */

function PoolRow({
  t,
  pool,
  position,
  now,
  coins,
  onAdd,
  onClaim,
  onWithdraw,
  open,
  onToggle,
  desk,
}: {
  t: Strings;
  pool: PoolInfo;
  position?: StakePosition;
  now: number;
  coins: number;
  onAdd: (pool: PoolInfo) => void;
  onClaim: (id: string) => void;
  onWithdraw: (id: string) => void;
  open: boolean;
  onToggle: () => void;
  desk: boolean;
}) {
  const earned = position ? earnedOf(position, now) : 0;
  const share = position ? shareOf(position, pool) : 0;

  return (
    <div
      data-pool={pool.id}
      data-open={open ? "1" : undefined}
      className={cn(
        "overflow-hidden rounded-[18px] border-[2px] transition-colors",
        position ? "border-[#1f7a5a]" : "border-[#232a31]",
        open ? "bg-gradient-to-b from-[#0f3a30] to-[#0b2a24]" : "bg-[#14181c] hover:border-[#2f3a44]",
      )}
    >
      <div
        role="presentation"
        onClick={onToggle}
        className="flex w-full cursor-pointer select-none items-center gap-[10px] px-[12px] py-[10px] text-start"
      >
        <PairBadge a={pool.a} b={pool.b} size={desk ? 28 : 24} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-[6px]">
            <span className="truncate font-display text-[15px] leading-none text-white">{poolName(pool)}</span>
            {pool.custom && (
              <span className="shrink-0 rounded-full bg-[#2fe98a]/15 px-[6px] font-body text-[8px] font-black tracking-wider text-[#2fe98a]">
                {t.yourPool}
              </span>
            )}
          </div>
          <div className="mt-[3px] truncate font-body text-[9px] font-black tracking-wide text-white/35" dir="ltr">
            {(pool.fee * 100).toFixed(2)}% · {pool.reward > 0 ? `${compact(pool.reward)} ${t.reward}` : t.emptyPool}
          </div>
        </div>

        <div className="hidden items-center gap-[18px] md:flex">
          <Stat label={t.liquidity} align="end" className="w-[74px]">
            {compact(pool.liquidity)}
          </Stat>
          <Stat label={t.apr} align="end" tone="green" className="w-[62px]">
            {pct(pool.apr)}
          </Stat>
          <Stat label={t.yourEarnings} align="end" tone={position ? "amber" : "default"} className="w-[80px]">
            {position ? fmtYield(earned) : "—"}
          </Stat>
        </div>

        {position && (
          <span className="hidden shrink-0 md:block">
            <ActionButton kind="primary" onClick={() => onClaim(position.id)} data-claim={position.id}>
              <Coin size={12} />
              {t.claim}
            </ActionButton>
          </span>
        )}
        {!position && (
          <span className="hidden shrink-0 md:block">
            <ActionButton kind="ghost" onClick={() => onAdd(pool)}>
              <PlusIcon width={12} height={12} />
              {t.addLiquidity}
            </ActionButton>
          </span>
        )}

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={t.details}
          className={cn("shrink-0 text-white/40 transition-transform hover:text-white", open && "rotate-180")}
        >
          <ArrowRightIcon width={14} height={14} className="rotate-90" />
        </button>
      </div>

      {/* compact numbers for phones */}
      <div className="flex items-center justify-between gap-[8px] px-[12px] pb-[9px] md:hidden">
        <Stat label={t.liquidity}>
          {compact(pool.liquidity)}
        </Stat>
        <Stat label={t.apr} align="end" tone="green">
          {pct(pool.apr)}
        </Stat>
        <Stat label={t.yourEarnings} align="end" tone={position ? "amber" : "default"}>
          {position ? fmtYield(earned) : "—"}
        </Stat>
      </div>

      {open && (
        <div className="border-t-[2px] border-[#1b5f49] px-[12px] pb-[12px] pt-[10px]">
          <div className="grid grid-cols-3 gap-[8px]">
            <Stat label={t.yourDeposit} tone="default">
              <span className="flex items-center gap-[4px]">
                <Coin size={13} />
                {position ? position.amount.toLocaleString("en-US") : "0"}
              </span>
            </Stat>
            <Stat label={t.yourShare} tone="default">
              {position ? `${share.toFixed(4)}%` : "0%"}
            </Stat>
            <Stat label={t.yourEarnings} tone="green" align="end">
              {position ? fmtYield(earned) : "0"}
            </Stat>
          </div>

          <div className="mt-[10px] flex flex-wrap items-center gap-[6px]">
            <ActionButton kind="ghost" disabled={coins <= 0} onClick={() => onAdd(pool)}>
              <PlusIcon width={12} height={12} />
              {t.addLiquidity}
            </ActionButton>
            {position && (
              <>
                <ActionButton kind="primary" onClick={() => onClaim(position.id)} data-claim={position.id}>
                  <Coin size={12} />
                  {t.claim}
                </ActionButton>
                <ActionButton kind="plain" onClick={() => onWithdraw(position.id)} data-withdraw={position.id}>
                  <UndoIcon width={12} height={12} />
                  {t.withdraw}
                </ActionButton>
              </>
            )}
            {!position && (
              <span className="font-body text-[9px] font-black tracking-wide text-white/35">{t.emptyPool}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* loans tab                                                           */
/* ------------------------------------------------------------------ */

function CollateralPicker({
  t,
  lang,
  cars,
  valueOf,
  used,
  picked,
  onToggle,
  desk,
}: {
  t: Strings;
  lang: Lang;
  cars: Car[];
  valueOf: (c: Car) => number;
  used: Set<string>;
  picked: string[];
  onToggle: (id: string) => void;
  desk: boolean;
}) {
  if (!cars.length) return <div className="font-body text-[10px] font-black text-white/35">{t.noCars}</div>;
  return (
    <div className={cn("grid gap-[6px]", desk ? "grid-cols-2" : "grid-cols-1")}>
      {cars.map((car) => {
        const locked = used.has(car.id);
        const active = picked.includes(car.id);
        return (
          <button
            key={car.id}
            type="button"
            disabled={locked}
            onClick={() => onToggle(car.id)}
            data-collateral-car={car.id}
            aria-pressed={active}
            className={cn(
              "flex items-center gap-[8px] rounded-[12px] border-[2px] px-[8px] py-[6px] text-start transition-colors",
              locked
                ? "cursor-not-allowed border-[#232a31] bg-[#0d1116] opacity-50"
                : active
                  ? "border-[#2fe98a] bg-[#123a2e]"
                  : "border-[#232a31] bg-[#14181c] hover:border-[#2f3a44]",
            )}
          >
            <span className="relative flex h-[30px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-[#0b0f12]">
              <PaintedImg carId={car.id} src={car.image} alt="" className="max-h-[92%] max-w-[94%] object-contain" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-[12px] leading-none text-white">
                {car.name}
              </span>
              <span className="mt-[2px] flex items-center gap-[3px] font-display text-[11px] leading-none text-amber-400" dir="ltr">
                <Coin size={10} />
                {valueOf(car).toLocaleString("en-US")}
              </span>
            </span>
            {locked ? (
              <span className="shrink-0 font-body text-[8px] font-black tracking-wider text-white/40">{t.collateralUsed}</span>
            ) : (
              <span
                className={cn(
                  "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[2px]",
                  active ? "border-[#2fe98a] bg-[#2fe98a] text-[#04120c]" : "border-[#2f3a44] text-transparent",
                )}
              >
                <CheckIcon width={10} height={10} />
              </span>
            )}
            <span className="sr-only">{lang}</span>
          </button>
        );
      })}
    </div>
  );
}

function LoanCard({
  t,
  loan,
  cars,
  valueOf,
  now,
  coins,
  onRepay,
  onRelease,
  onPledge,
}: {
  t: Strings;
  loan: Loan;
  cars: Car[];
  valueOf: (c: Car) => number;
  now: number;
  coins: number;
  onRepay: (id: string) => void;
  /** free one pledged car (blocked while it would under-collateralise the loan) */
  onRelease: (loanId: string, carId: string) => void;
  /** open the "pledge another car" sheet for this loan */
  onPledge: (loanId: string) => void;
}) {
  const debt = debtOf(loan, now);
  const interest = interestOf(loan, now);
  const collateralValue = cars.reduce((sum, c) => sum + valueOf(c), 0);
  const health = healthOf(collateralValue, debt);
  const tone = healthTone(health);
  const ratio = health === Infinity ? 1 : Math.min(1, health / 2);
  const toneColor = tone === "safe" ? "#2fe98a" : tone === "warn" ? "#ffd23a" : "#ff6b6b";

  return (
    <div data-loan={loan.id} className="rounded-[18px] border-[2px] border-[#232a31] bg-[#14181c] px-[12px] py-[10px]">
      <div className="flex items-center justify-between gap-[8px]">
        <Stat label={t.debt} tone="amber">
          <span className="flex items-center gap-[4px]">
            <Coin size={14} />
            {Math.round(debt).toLocaleString("en-US")}
          </span>
        </Stat>
        <Stat label={t.interest} align="end" tone="red">
          +{fmtYield(interest)}
        </Stat>
      </div>

      <div className="mt-[8px] flex items-center gap-[6px]">
        <span className="font-body text-[9px] font-black uppercase tracking-[0.12em] text-white/40">{t.health}</span>
        <span className="relative h-[6px] flex-1 overflow-hidden rounded-full bg-[#0b0f12]">
          <span
            className="absolute inset-y-0 start-0 rounded-full transition-[width]"
            style={{ width: `${ratio * 100}%`, background: toneColor }}
          />
        </span>
        <span className="font-display text-[11px] leading-none tabular-nums" style={{ color: toneColor }}>
          {health === Infinity ? "∞" : health.toFixed(2)}
        </span>
      </div>

      {/* pledged cars, one row each: every car can leave on its own */}
      <div className="mt-[9px] flex items-center justify-between gap-[6px]">
        <span className="font-body text-[9px] font-black uppercase tracking-[0.12em] text-white/35">{t.collateralCars}</span>
        <span className="flex items-center gap-[3px] font-display text-[11px] leading-none text-amber-400/90" dir="ltr">
          <Coin size={10} />
          {collateralValue.toLocaleString("en-US")}
        </span>
      </div>

      <div data-collateral-list={loan.id} className="mt-[5px] space-y-[5px]">
        {cars.map((car) => {
          const value = valueOf(car);
          const after = collateralValue - value;
          // the loan must stay covered by what is left once this car leaves
          const need = Math.ceil(Math.max(0, debt - after * LTV));
          const blocked = need > 0;
          return (
            <div
              key={car.id}
              data-collateral-row={car.id}
              data-blocked={blocked ? "1" : undefined}
              className="flex items-center gap-[7px] rounded-[11px] border-[2px] border-[#232a31] bg-[#0f1418] px-[7px] py-[5px]"
            >
              <span className="relative flex h-[26px] w-[36px] shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-[#0b0f12]">
                <PaintedImg carId={car.id} src={car.image} alt="" className="max-h-[92%] max-w-[94%] object-contain" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[11px] leading-none text-white">{car.name}</span>
                <span className="mt-[2px] flex items-center gap-[3px] font-display text-[10px] leading-none text-amber-400/85" dir="ltr">
                  <Coin size={9} />
                  {value.toLocaleString("en-US")}
                </span>
              </span>
              <ActionButton
                kind={blocked ? "plain" : "ghost"}
                disabled={blocked}
                onClick={() => onRelease(loan.id, car.id)}
                data-release={car.id}
                title={blocked ? fmt(t.releaseBlocked, { n: need.toLocaleString("en-US") }) : t.releaseCollateral}
              >
                <UndoIcon width={10} height={10} />
                {t.releaseCollateral}
              </ActionButton>
            </div>
          );
        })}
      </div>

      <div className="mt-[8px] flex items-center justify-between gap-[8px]">
        <ActionButton kind="ghost" onClick={() => onPledge(loan.id)} data-pledge-more={loan.id}>
          <PlusIcon width={12} height={12} />
          {t.pledgeMore}
        </ActionButton>
        <ActionButton
          kind={coins >= debt ? "primary" : "ghost"}
          disabled={coins < debt}
          onClick={() => onRepay(loan.id)}
          data-repay={loan.id}
        >
          {t.repay}
        </ActionButton>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* panel                                                               */
/* ------------------------------------------------------------------ */

/** newest first: a top-up bumps the row, and the array order breaks ties */
function newestFirst(list: StakePosition[]) {
  return list
    .map((p, i) => ({ p, i }))
    .sort((a, b) => (b.p.updatedAt ?? b.p.startedAt) - (a.p.updatedAt ?? a.p.startedAt) || b.i - a.i)
    .map((x) => x.p);
}

function EmptyPositions({ title, hint }: { title: string; hint: string }) {
  return (
    <div data-empty-positions="" className="rounded-[16px] border-[2px] border-dashed border-[#232a31] px-[14px] py-[18px] text-center">
      <div className="font-display text-[14px] text-white/60">{title}</div>
      <div className="mt-[3px] font-body text-[9px] font-black text-white/30">{hint}</div>
    </div>
  );
}

function PositionCard({
  t,
  position,
  pool,
  now,
  onClaim,
  onWithdraw,
}: {
  t: Strings;
  position: StakePosition;
  pool?: PoolInfo;
  now: number;
  onClaim: (id: string) => void;
  onWithdraw: (id: string) => void;
}) {
  const left = lockLeft(position.unlockAt, now);
  return (
    <div data-position={position.id} data-kind={position.kind} className="rounded-[16px] border-[2px] border-[#232a31] bg-[#14181c] px-[11px] py-[9px]">
      <div className="flex items-center gap-[8px]">
        <PairBadge a={pool?.a ?? "hct"} b={pool?.b ?? "sol"} size={20} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[13px] leading-none text-white">{position.name}</div>
          <div className="mt-[3px] font-body text-[9px] font-black tracking-wide text-white/35" dir="ltr">
            {position.apr ? pct(position.apr) : ""} ·{" "}
            {left.locked ? `${t.unlocksIn} ${left.days}d ${left.hours}h` : t.unlocked}
          </div>
        </div>
        <Stat label={t.yourDeposit} align="end">
          <span className="flex items-center justify-end gap-[3px]">
            <Coin size={11} />
            {position.amount.toLocaleString("en-US")}
          </span>
        </Stat>
      </div>
      <div className="mt-[8px] flex items-center justify-between gap-[8px]">
        <Stat label={t.yourEarnings} tone="green">
          {fmtYield(earnedOf(position, now))}
        </Stat>
        <div className="flex gap-[5px]">
          <ActionButton kind="primary" onClick={() => onClaim(position.id)} data-claim={position.id}>
            <Coin size={11} />
            {t.claim}
          </ActionButton>
          <ActionButton kind="plain" disabled={left.locked} onClick={() => onWithdraw(position.id)} data-withdraw={position.id}>
            {left.locked ? <LockIcon width={11} height={11} /> : <UndoIcon width={11} height={11} />}
            {t.withdraw}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

export function Staking({
  t,
  lang,
  layout,
  coins,
  ownedCars,
  sellValueOf,
  defi,
  onAddLiquidity,
  onCreatePool,
  onStake,
  onClaim,
  onWithdraw,
  onBorrow,
  onRepay,
  onAddCollateral,
  onReleaseCollateral,
  nfts,
  nftStakes,
  onStakeNft,
  onClaimNft,
  onUnstakeNft,
  onOpenNft,
  initialTab = "pools",
  onClose,
  onSfx,
}: StakingProps) {
  const desk = layout === "desktop";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [now, setNow] = useState(() => Date.now());
  const [openPool, setOpenPool] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // deposit dialogs
  const [depositPool, setDepositPool] = useState<PoolInfo | null>(null);
  const [depositAmount, setDepositAmount] = useState(0);
  const [newPoolOpen, setNewPoolOpen] = useState(false);
  const [newPair, setNewPair] = useState(0);
  const [newFee, setNewFee] = useState(1);
  const [newAmount, setNewAmount] = useState(0);

  // stake form
  const [tier, setTier] = useState<StakeTier>(STAKE_TIERS[2]);
  const [stakeAmount, setStakeAmount] = useState(0);

  // loan form
  const [borrowAmount, setBorrowAmount] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  /** the loan that is getting another car pledged right now */
  const [pledgeTo, setPledgeTo] = useState<string | null>(null);

  const click = () => onSfx?.("click");
  /** the tick drives re-renders, but lock/earnings maths must not lag behind the clock */
  const liveNow = Math.max(now, Date.now());

  // earnings tick every second so the numbers visibly grow
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const pools = useMemo(() => allPools(defi), [defi]);
  const positions = defi.positions ?? [];
  const loans = defi.loans ?? [];
  /** what was opened in the STAKE tab, newest first */
  const stakes = newestFirst(positions.filter((p) => p.kind === "single"));
  /** what was opened in the POOLS tab, newest first */
  const poolPositions = newestFirst(positions.filter((p) => p.kind === "lp"));

  const staked = positions.reduce((s, p) => s + p.amount, 0);
  const earnings = positions.reduce((s, p) => s + earnedOf(p, liveNow), 0);
  const debt = loans.reduce((s, l) => s + debtOf(l, liveNow), 0);
  const usedCollateral = useMemo(() => new Set(loans.flatMap((l) => l.collateral)), [loans]);
  const lockedCars = ownedCars.filter((c) => usedCollateral.has(c.id));
  /** owned cars that no loan is holding: the only ones that can be pledged */
  const freeCars = ownedCars.filter((c) => !usedCollateral.has(c.id));
  const lockedValue = lockedCars.reduce((s, c) => s + sellValueOf(c), 0);
  const pickedValue = ownedCars
    .filter((c) => picked.includes(c.id) && !usedCollateral.has(c.id))
    .reduce((s, c) => s + sellValueOf(c), 0);
  const borrowCapacity = Math.max(0, Math.round(pickedValue * LTV) - Math.round(debt));

  const fail = (msg: string) => {
    setError(msg);
    onSfx?.("toggle");
  };

  /* ------------------------------- actions ------------------------------- */

  const claim = (id: string) => {
    const p = positions.find((x) => x.id === id);
    if (!p) return;
    if (earnedOf(p, liveNow) < 1) {
      fail(fmt(t.tooSmall, { n: "1" }));
      return;
    }
    if (onClaim(id)) {
      setError(null);
      click();
    }
  };

  const submitDeposit = () => {
    if (!depositPool) return;
    if (depositAmount <= 0) return fail(t.enterAmount);
    if (depositAmount > coins) return fail(t.notEnoughCoins);
    if (onAddLiquidity(depositPool.id, depositAmount)) {
      setDepositPool(null);
      setDepositAmount(0);
      setError(null);
      setOpenPool(depositPool.id);
    }
  };

  const submitNewPool = () => {
    if (newAmount <= 0) return fail(t.enterAmount);
    if (newAmount > coins) return fail(t.notEnoughCoins);
    const pair = POOL_PAIRS[newPair];
    if (onCreatePool(pair.a, pair.b, FEE_TIERS[newFee], newAmount)) {
      setNewPoolOpen(false);
      setNewAmount(0);
      setError(null);
    }
  };

  const submitStake = () => {
    if (stakeAmount <= 0) return fail(t.enterAmount);
    if (stakeAmount > coins) return fail(t.notEnoughCoins);
    if (onStake(stakeAmount, tier)) {
      setStakeAmount(0);
      setError(null);
      click();
    }
  };

  const submitBorrow = () => {
    if (!picked.length) return fail(t.selectCollateral);
    if (borrowAmount <= 0) return fail(t.enterAmount);
    if (borrowAmount > borrowCapacity) return fail(t.maxBorrow);
    if (onBorrow(borrowAmount, picked)) {
      setBorrowAmount(0);
      setPicked([]);
      setError(null);
      click();
    }
  };

  /* -------------------------------- chrome ------------------------------- */

  const coinBadge = (
    <span
      dir="ltr"
      className="flex shrink-0 items-center gap-[6px] rounded-full border-[2px] border-[#2a333c] bg-[#0b0f12] px-[11px] py-[5px] font-display text-[15px] leading-none text-amber-400"
    >
      <Coin size={17} />
      {coins.toLocaleString("en-US")}
    </span>
  );

  const tabs: [Tab, string][] = [
    ["pools", t.tabPools],
    ["stake", t.tabStake],
    ["nft", t.tabNft],
    ["loans", t.tabLoans],
  ];

  const tabBar = (
    <div className="flex shrink-0 items-center gap-[2px] rounded-full border-[2px] border-[#232a31] bg-[#0f1418] p-[3px]">
      {tabs.map(([key, label]) => (
        <button
          key={key}
          type="button"
          data-staking-tab={key}
          aria-pressed={tab === key}
          onClick={() => {
            click();
            setTab(key);
            setError(null);
          }}
          className={cn(
            "rounded-full px-[14px] py-[5px] font-body text-[11px] font-black uppercase tracking-[0.08em] transition-colors",
            tab === key ? "bg-white text-[#0a0d10]" : "text-white/50 hover:text-white",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );

  /* --------------------------------- body -------------------------------- */

  const summary = (
    <div className="grid grid-cols-2 gap-[8px] md:grid-cols-4">
      {[
        { label: t.statsStaked, value: staked, tone: "text-white" },
        { label: t.totalEarned, value: earnings, tone: "text-[#2fe98a]", live: true },
        { label: t.statsLocked, value: lockedValue, tone: "text-amber-400" },
        { label: t.statsDebt, value: debt, tone: debt > 0 ? "text-[#ff6b6b]" : "text-white/50" },
      ].map((s) => (
        <div key={s.label} className="rounded-[14px] border-[2px] border-[#232a31] bg-[#10151a] px-[11px] py-[8px]">
          <div className="truncate font-body text-[8px] font-black uppercase tracking-[0.14em] text-white/35">{s.label}</div>
          <div className={cn("mt-[3px] flex items-center gap-[4px] font-display text-[16px] leading-none tabular-nums", s.tone)} dir="ltr">
            <Coin size={12} />
            {s.live ? fmtYield(s.value) : Math.round(s.value).toLocaleString("en-US")}
          </div>
        </div>
      ))}
    </div>
  );

  const poolsBody = (
    <div className="space-y-[8px]">
      <div className="flex items-center justify-between gap-[8px]">
        <div className="font-body text-[10px] font-black uppercase tracking-[0.12em] text-white/35">{t.liquidity}</div>
        <ActionButton
          kind="ghost"
          onClick={() => {
            click();
            setNewPoolOpen(true);
            setError(null);
          }}
          data-new-pool=""
        >
          <PlusIcon width={12} height={12} />
          {t.newPool}
        </ActionButton>
      </div>
      {pools.map((pool) => (
        <PoolRow
          key={pool.id}
          t={t}
          pool={pool}
          position={positions.find((p) => p.poolId === pool.id && p.kind === "lp")}
          now={liveNow}
          coins={coins}
          open={openPool === pool.id}
          onToggle={() => {
            click();
            setOpenPool((id) => (id === pool.id ? null : pool.id));
          }}
          onAdd={(p) => {
            click();
            setDepositPool(p);
            setDepositAmount(0);
            setError(null);
          }}
          onClaim={claim}
          onWithdraw={(id) => {
            if (onWithdraw(id)) setError(null);
          }}
          desk={desk}
        />
      ))}

      {/* everything opened from this tab, newest first */}
      <div className="pt-[4px] font-body text-[10px] font-black uppercase tracking-[0.12em] text-white/35">{t.yourPools}</div>
      {poolPositions.length === 0 ? (
        <EmptyPositions title={t.noPools} hint={t.noPoolsHint} />
      ) : (
        <div data-positions="lp" className="space-y-[7px]">
          {poolPositions.map((p) => (
            <PositionCard key={p.id} t={t} position={p} pool={pools.find((x) => x.id === p.poolId)} now={liveNow} onClaim={claim} onWithdraw={onWithdraw} />
          ))}
        </div>
      )}
    </div>
  );

  const stakeBody = (
    <div className="space-y-[10px]">
      {/* stake card */}
      <div className="rounded-[20px] border-[2px] border-[#1f7a5a] bg-gradient-to-b from-[#0f3a30] to-[#0b1d19] px-[13px] py-[12px]">
        <div className="flex items-center gap-[9px]">
          <TokenBadge id="hct" size={34} />
          <div className="min-w-0">
            <div className="font-display text-[17px] leading-none text-white">{SINGLE_POOL_NAME}</div>
            <div className="mt-[3px] font-body text-[9px] font-black tracking-wide text-white/45">{t.stakeDesc}</div>
          </div>
          <div className="ms-auto shrink-0 text-end">
            <div className="font-body text-[8px] font-black uppercase tracking-[0.12em] text-white/35">{t.apr}</div>
            <div className="font-display text-[20px] leading-none text-[#2fe98a]" dir="ltr">
              {pct(tier.apr)}
            </div>
          </div>
        </div>

        {/* lock tiers */}
        <div className="mt-[11px] grid grid-cols-4 gap-[5px]">
          {STAKE_TIERS.map((x) => (
            <button
              key={x.id}
              type="button"
              data-tier={x.id}
              aria-pressed={tier.id === x.id}
              onClick={() => {
                onSfx?.("toggle");
                setTier(x);
              }}
              className={cn(
                "rounded-[11px] border-[2px] px-[4px] py-[6px] text-center transition-colors",
                tier.id === x.id
                  ? "border-[#2fe98a] bg-[#2fe98a]/12"
                  : "border-[#25574a] bg-[#0b1d19]/60 hover:border-[#2fe98a]/50",
              )}
            >
              <div className="truncate font-body text-[9px] font-black tracking-wide text-white/70">
                {x.days === 0 ? t.lockFlex : fmt(t.lockDays, { n: x.days })}
              </div>
              <div className="mt-[2px] font-display text-[13px] leading-none text-[#2fe98a]" dir="ltr">
                {pct(x.apr)}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-[10px] flex items-end gap-[8px]">
          <div className="min-w-0 flex-1">
            <AmountInput t={t} label={t.amount} value={stakeAmount} onChange={setStakeAmount} max={coins} />
          </div>
          <ActionButton kind="primary" onClick={submitStake} data-stake-action="" className="mb-[1px] h-[34px] px-[16px]">
            <LockIcon width={13} height={13} />
            {t.stakeAction}
          </ActionButton>
        </div>
        <div className="mt-[7px] flex items-center justify-between font-body text-[9px] font-black tracking-wide text-white/40">
          <span>{fmt(t.lockLabel, { n: tier.days === 0 ? t.lockFlex : fmt(t.lockDays, { n: tier.days }) })}</span>
          <span dir="ltr" className="text-[#2fe98a]">
            ≈ +{fmtYield((stakeAmount * tier.apr) / 365)} / {t.lockDays.replace("{n}", "1")}
          </span>
        </div>
      </div>

      {/* everything opened from this tab, newest first */}
      <div className="font-body text-[10px] font-black uppercase tracking-[0.12em] text-white/35">{t.yourStakes}</div>
      {stakes.length === 0 ? (
        <EmptyPositions title={t.noStakes} hint={t.noStakesHint} />
      ) : (
        <div data-positions="single" className="space-y-[7px]">
          {stakes.map((p) => (
            <PositionCard key={p.id} t={t} position={p} pool={pools.find((x) => x.id === p.poolId)} now={liveNow} onClaim={claim} onWithdraw={onWithdraw} />
          ))}
        </div>
      )}
    </div>
  );

  const loansBody = (
    <div className="space-y-[10px]">
      {/* borrow */}
      <div className="rounded-[20px] border-[2px] border-[#2a333c] bg-[#10151a] px-[13px] py-[12px]">
        <div className="flex items-start gap-[8px]">
          <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[10px] bg-[#2fe98a]/12 text-[#2fe98a]">
            <ShieldIcon width={17} height={17} />
          </span>
          <div className="min-w-0">
            <div className="font-display text-[16px] leading-none text-white">{t.borrowTitle}</div>
            <div className="mt-[3px] font-body text-[9px] font-black leading-snug tracking-wide text-white/40">
              {fmt(t.borrowDesc, { n: Math.round(LTV * 100) })}
            </div>
          </div>
        </div>

        <div className="mt-[10px] font-body text-[9px] font-black uppercase tracking-[0.12em] text-white/35">{t.collateral}</div>
        <div className="mt-[5px]">
          <CollateralPicker
            t={t}
            lang={lang}
            cars={ownedCars}
            valueOf={sellValueOf}
            used={usedCollateral}
            picked={picked}
            onToggle={(id) => {
              onSfx?.("toggle");
              setPicked((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
            }}
            desk={desk}
          />
          <div data-pledge-hint="" className="mt-[5px] font-body text-[8.5px] font-black leading-snug tracking-wide text-white/30">
            {t.pledgeHint}
          </div>
        </div>

        <div className="mt-[10px] grid grid-cols-3 gap-[6px]">
          <Stat label={t.collateralValue} tone="amber">
            <span className="flex items-center gap-[3px]">
              <Coin size={11} />
              {pickedValue.toLocaleString("en-US")}
            </span>
          </Stat>
          <Stat label={t.ltv} align="end">
            {Math.round(LTV * 100)}%
          </Stat>
          <Stat label={t.maxBorrow} align="end" tone="green">
            <span className="flex items-center justify-end gap-[3px]">
              <Coin size={11} />
              {borrowCapacity.toLocaleString("en-US")}
            </span>
          </Stat>
        </div>

        <div className="mt-[9px] flex items-end gap-[8px]">
          <div className="min-w-0 flex-1">
            <AmountInput
              t={t}
              label={t.borrowAction}
              value={borrowAmount}
              onChange={setBorrowAmount}
              max={borrowCapacity}
            />
          </div>
          <ActionButton
            kind="primary"
            className="mb-[1px] h-[34px] px-[16px]"
            disabled={!picked.length || borrowCapacity <= 0}
            onClick={submitBorrow}
            data-borrow=""
          >
            <BoltIcon width={13} height={13} />
            {t.borrowAction}
          </ActionButton>
        </div>
        <div className="mt-[7px] flex items-center gap-[4px] font-body text-[9px] font-black tracking-wide text-white/35">
          <HeartIcon width={10} height={10} />
          {t.interest} {pct(LOAN_APR)} / {t.lockLabel}
        </div>
      </div>

      {/* active loans */}
      <div className="font-body text-[10px] font-black uppercase tracking-[0.12em] text-white/35">{t.loansActive}</div>
      {loans.length === 0 ? (
        <div className="rounded-[16px] border-[2px] border-dashed border-[#232a31] px-[14px] py-[18px] text-center">
          <div className="font-display text-[14px] text-white/60">{t.noLoans}</div>
          <div className="mt-[3px] font-body text-[9px] font-black text-white/30">{t.noLoansHint}</div>
        </div>
      ) : (
        <div className="space-y-[7px]">
          {loans.map((loan) => (
            <LoanCard
              key={loan.id}
              t={t}
              loan={loan}
              cars={ownedCars.filter((c) => loan.collateral.includes(c.id))}
              valueOf={sellValueOf}
              now={liveNow}
              coins={coins}
              onRepay={(id) => {
                if (onRepay(id)) setError(null);
              }}
              onRelease={(loanId, carId) => {
                if (onReleaseCollateral(loanId, carId)) setError(null);
              }}
              onPledge={(loanId) => {
                click();
                setError(null);
                setPledgeTo(loanId);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );

  /* ------------------------------- nft vault ------------------------------ */

  const stakeOf = new Map(nftStakes.map((s) => [s.nftId, s]));
  const itemOf = new Map(nfts.map((n) => [n.id, n]));
  const dailyYield = nfts.filter((n) => stakeOf.has(n.id)).reduce((sum, n) => sum + nftDayYield(n), 0);
  const nftEarned = nftStakes.reduce((sum, s) => sum + nftStakeEarned(s, itemOf.get(s.nftId), liveNow), 0);
  /** staked tokens first, then the rest of the wallet */
  const vaultList = [...nfts].sort((a, b) => {
    const sa = stakeOf.get(a.id)?.startedAt ?? -1;
    const sb = stakeOf.get(b.id)?.startedAt ?? -1;
    return sb - sa;
  });

  const nftBody = (
    <div className="space-y-[10px]">
      <div
        data-nft-vault-panel=""
        className="rounded-[20px] border-[2px] border-[#6b46ff]/60 bg-gradient-to-b from-[#241b45] to-[#120e22] px-[13px] py-[12px]"
      >
        <div className="flex items-center gap-[9px]">
          <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#9a7cff] to-[#5b2bd6] font-display text-[17px] text-white shadow-[0_3px_0_#2b1466]">
            N
          </span>
          <div className="min-w-0">
            <div className="font-display text-[17px] leading-none text-white">{t.nftVault}</div>
            <div className="mt-[3px] font-body text-[9px] font-black leading-snug tracking-wide text-white/45">{t.nftVaultDesc}</div>
          </div>
          <div className="ms-auto shrink-0 text-end">
            <div className="font-body text-[8px] font-black uppercase tracking-[0.12em] text-white/35">{t.nftDailyYield}</div>
            <div className="flex items-center justify-end gap-[4px] font-display text-[18px] leading-none text-[#c9a8ff]" dir="ltr">
              <Coin size={12} />
              {dailyYield.toLocaleString("en-US")}
            </div>
          </div>
        </div>

        <div className="mt-[10px] grid grid-cols-3 gap-[6px]">
          <Stat label={t.nftStakedCount} tone="default">
            {nftStakes.length}
          </Stat>
          <Stat label={t.nftDailyYield} align="end" tone="green">
            <span className="flex items-center justify-end gap-[3px]">
              <Coin size={10} />
              {dailyYield}
            </span>
          </Stat>
          <Stat label={t.yourEarnings} align="end" tone="green">
            {fmtYield(nftEarned)}
          </Stat>
        </div>

        <div className="mt-[9px] flex items-center gap-[7px]">
          <ActionButton kind="ghost" className="flex-1" onClick={onOpenNft} data-nft-market-btn="">
            <PlusIcon width={12} height={12} />
            {t.nftGetNfts}
          </ActionButton>
        </div>
      </div>

      <div className="font-body text-[10px] font-black uppercase tracking-[0.12em] text-white/35">{t.yourNfts}</div>
      {vaultList.length === 0 ? (
        <div data-nft-vault-empty="" className="rounded-[16px] border-[2px] border-dashed border-[#232a31] px-[14px] py-[18px] text-center">
          <div className="font-display text-[14px] text-white/60">{t.nftNoNfts}</div>
          <div className="mt-[3px] font-body text-[9px] font-black text-white/30">{t.nftNoNftsHint}</div>
        </div>
      ) : (
        <div data-nft-vault-list="" className="space-y-[7px]">
          {vaultList.map((n) => {
            const stake = stakeOf.get(n.id);
            const car = nftCar(n);
            const earned = stake ? nftStakeEarned(stake, n, liveNow) : 0;
            return (
              <div
                key={n.id}
                data-nft-vault-item={n.id}
                data-staked={stake ? "1" : undefined}
                className={cn(
                  "rounded-[16px] border-[2px] bg-[#14181c] px-[11px] py-[9px]",
                  stake ? "border-[#6b46ff]/70" : "border-[#232a31]",
                )}
              >
                <div className="flex items-center gap-[8px]">
                  <div
                    className="relative h-[36px] w-[36px] shrink-0 overflow-hidden rounded-[9px]"
                    style={{ backgroundImage: `linear-gradient(150deg, ${n.palette[0]}, ${n.palette[1]})` }}
                  >
                    {car && (
                      <PaintedImg
                        carId={n.carId}
                        src={car.image}
                        alt=""
                        draggable={false}
                        className="absolute inset-0 h-full w-full object-contain"
                        style={{ padding: "4%" }}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-[13px] leading-none text-white">{n.name}</div>
                    <div className="mt-[3px] flex items-center gap-[5px] font-body text-[9px] font-black tracking-wide">
                      <span style={{ color: NFT_RARITY_COLOR[n.rarity] }}>{n.rarity}</span>
                      <span className="text-white/20">·</span>
                      <span className="text-white/40" dir="ltr">
                        +{nftDayYield(n).toLocaleString("en-US")} / {t.dayShort.replace("{n}", "1")}
                      </span>
                    </div>
                  </div>
                  {stake ? (
                    <Stat label={t.yourEarnings} align="end" tone="green">
                      {fmtYield(earned)}
                    </Stat>
                  ) : (
                    <ActionButton
                      kind="primary"
                      onClick={() => {
                        if (onStakeNft(n.id)) setError(null);
                      }}
                      data-nft-stake={n.id}
                    >
                      <LockIcon width={11} height={11} />
                      {t.nftStakeAction}
                    </ActionButton>
                  )}
                </div>

                {stake && (
                  <div className="mt-[8px] flex items-center justify-between gap-[8px]">
                    <span className="truncate font-body text-[9px] font-black tracking-wide text-white/35">
                      {t.nftInVault}
                    </span>
                    <div className="flex gap-[5px]">
                      <ActionButton
                        kind="primary"
                        onClick={() => {
                          if (onClaimNft(stake.id)) setError(null);
                        }}
                        data-nft-claim={stake.id}
                      >
                        <Coin size={11} />
                        {t.claim}
                      </ActionButton>
                      <ActionButton
                        kind="plain"
                        onClick={() => {
                          if (onUnstakeNft(stake.id)) setError(null);
                        }}
                        data-nft-unstake={stake.id}
                      >
                        <UndoIcon width={11} height={11} />
                        {t.nftUnstake}
                      </ActionButton>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex animate-fade-in flex-col overflow-hidden bg-[#070a0c]"
      role="dialog"
      aria-label={t.staking}
    >
      {/* backdrop glows */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_-10%,rgba(47,233,138,0.16),transparent_55%),radial-gradient(ellipse_at_85%_10%,rgba(176,108,255,0.14),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:44px_44px]" />

      {/* header */}
      <header className={cn("relative flex shrink-0 items-center gap-[10px]", desk ? "px-[26px] py-[14px]" : "px-[14px] py-[10px]")}>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.menu}
          data-staking-close=""
          className="flex h-[34px] w-[36px] shrink-0 items-center justify-center rounded-[10px] border-[2px] border-[#2a333c] bg-[#0f1418] text-white/70 transition-colors hover:border-[#2fe98a]/60 hover:text-white"
        >
          <UndoIcon width={16} height={16} />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-[6px]">
            <span className="font-display text-[19px] leading-none tracking-wide text-white">{t.staking}</span>
            <span className="hidden rounded-full bg-[#2fe98a]/12 px-[7px] py-[2px] font-body text-[8px] font-black tracking-[0.12em] text-[#2fe98a] sm:block">
              SOLANA
            </span>
          </div>
          <div className="mt-[2px] truncate font-body text-[9px] font-black tracking-wide text-white/35">{t.stakingSub}</div>
        </div>

        {desk && <div className="mx-auto">{tabBar}</div>}

        <div className="ms-auto flex items-center gap-[8px]">
          {coinBadge}
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border-[2px] border-[#2a333c] text-white/50 transition-colors hover:border-[#ff6b6b] hover:text-white"
          >
            <CloseIcon width={14} height={14} />
          </button>
        </div>
      </header>

      {!desk && <div className="relative flex shrink-0 justify-center px-[14px] pb-[8px]">{tabBar}</div>}

      {/* body */}
      <div className={cn("thin-scroll relative min-h-0 flex-1 overflow-y-auto", desk ? "px-[26px] pb-[20px]" : "px-[14px] pb-[16px]")}>
        <div className={cn("mx-auto w-full", desk ? "max-w-[980px]" : "max-w-[560px]")}>
          <div className="mb-[10px]">{summary}</div>

          {error && (
            <div
              role="alert"
              className="mb-[9px] flex items-center gap-[6px] rounded-[10px] border-[2px] border-[#ff6b6b]/50 bg-[#ff6b6b]/10 px-[10px] py-[6px] font-body text-[10px] font-black tracking-wide text-[#ff8f8f]"
            >
              <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-[#ff6b6b]" />
              {error}
            </div>
          )}

          {tab === "pools" && poolsBody}
          {tab === "stake" && stakeBody}
          {tab === "nft" && nftBody}
          {tab === "loans" && loansBody}
        </div>
      </div>

      {/* pledge one more car on an existing loan */}
      {pledgeTo && (() => {
        return (
          <Sheet title={t.pledgeMore} onClose={() => setPledgeTo(null)}>
            <div className="font-body text-[9px] font-black uppercase tracking-[0.12em] text-white/35">{t.collateral}</div>
            <div className="mt-[5px] space-y-[5px]" data-pledge-list="">
              {freeCars.length === 0 ? (
                <div data-pledge-empty="" className="rounded-[12px] border-[2px] border-dashed border-[#232a31] px-[12px] py-[16px] text-center font-body text-[10px] font-black text-white/35">
                  {t.noFreeCars}
                </div>
              ) : (
                freeCars.map((car) => (
                  <div key={car.id} className="flex items-center gap-[7px] rounded-[12px] border-[2px] border-[#232a31] bg-[#10151a] px-[8px] py-[6px]">
                    <span className="relative flex h-[26px] w-[36px] shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-[#0b0f12]">
                      <PaintedImg carId={car.id} src={car.image} alt="" className="max-h-[92%] max-w-[94%] object-contain" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-[12px] leading-none text-white">{car.name}</span>
                      <span className="mt-[2px] flex items-center gap-[3px] font-display text-[10px] leading-none text-amber-400" dir="ltr">
                        <Coin size={9} />
                        {sellValueOf(car).toLocaleString("en-US")}
                      </span>
                    </span>
                    <ActionButton
                      kind="primary"
                      onClick={() => {
                        if (onAddCollateral(pledgeTo, [car.id])) setError(null);
                        setPledgeTo(null);
                      }}
                      data-pledge={car.id}
                    >
                      <PlusIcon width={11} height={11} />
                      {t.pledgeCollateral}
                    </ActionButton>
                  </div>
                ))
              )}
            </div>
            <div className="mt-[12px] flex gap-[7px]">
              <ActionButton kind="plain" className="flex-1 py-[9px]" onClick={() => setPledgeTo(null)}>
                {t.cancel}
              </ActionButton>
            </div>
          </Sheet>
        );
      })()}

      {/* add liquidity dialog */}
      {depositPool && (
        <Sheet title={`${t.addLiquidity} · ${poolName(depositPool)}`} onClose={() => setDepositPool(null)}>
          <div className="flex items-center gap-[8px] rounded-[12px] border-[2px] border-[#232a31] bg-[#10151a] px-[10px] py-[8px]">
            <PairBadge a={depositPool.a} b={depositPool.b} size={24} />
            <div className="min-w-0 flex-1">
              <div className="font-display text-[14px] leading-none text-white">{poolName(depositPool)}</div>
              <div className="mt-[2px] font-body text-[9px] font-black tracking-wide text-white/40" dir="ltr">
                {t.apr} {pct(depositPool.apr)} · {t.liquidity} {compact(depositPool.liquidity)}
              </div>
            </div>
          </div>
          <div className="mt-[10px]">
            <AmountInput t={t} label={t.amount} value={depositAmount} onChange={setDepositAmount} max={coins} />
          </div>
          <div className="mt-[12px] flex gap-[7px]">
            <ActionButton kind="plain" className="flex-1 py-[9px]" onClick={() => setDepositPool(null)}>
              {t.cancel}
            </ActionButton>
            <ActionButton kind="primary" className="flex-1 py-[9px]" onClick={submitDeposit} data-confirm-deposit="">
              <PlusIcon width={13} height={13} />
              {t.confirm}
            </ActionButton>
          </div>
        </Sheet>
      )}

      {/* new pool dialog */}
      {newPoolOpen && (
        <Sheet title={t.createPool} onClose={() => setNewPoolOpen(false)}>
          <div className="font-body text-[9px] font-black uppercase tracking-[0.12em] text-white/35">{t.poolPair}</div>
          <div className="mt-[5px] grid grid-cols-2 gap-[5px]">
            {POOL_PAIRS.map((pair, i) => (
              <button
                key={`${pair.a}-${pair.b}`}
                type="button"
                data-pair={i}
                aria-pressed={newPair === i}
                onClick={() => setNewPair(i)}
                className={cn(
                  "flex items-center gap-[7px] rounded-[11px] border-[2px] px-[8px] py-[6px] transition-colors",
                  newPair === i ? "border-[#2fe98a] bg-[#123a2e]" : "border-[#232a31] bg-[#14181c] hover:border-[#2f3a44]",
                )}
              >
                <PairBadge a={pair.a} b={pair.b} size={20} />
                <span className="truncate font-display text-[12px] text-white">
                  {TOKENS[pair.a].label}–{TOKENS[pair.b].label}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-[10px] font-body text-[9px] font-black uppercase tracking-[0.12em] text-white/35">{t.feeTier}</div>
          <div className="mt-[5px] flex gap-[5px]">
            {FEE_TIERS.map((fee, i) => (
              <button
                key={fee}
                type="button"
                data-fee={i}
                aria-pressed={newFee === i}
                onClick={() => setNewFee(i)}
                className={cn(
                  "flex-1 rounded-[11px] border-[2px] py-[6px] text-center transition-colors",
                  newFee === i ? "border-[#2fe98a] bg-[#123a2e]" : "border-[#232a31] bg-[#14181c] hover:border-[#2f3a44]",
                )}
              >
                <div className="font-display text-[12px] leading-none text-white" dir="ltr">
                  {(fee * 100).toFixed(2)}%
                </div>
                <div className="mt-[2px] font-display text-[10px] leading-none text-[#2fe98a]" dir="ltr">
                  {pct(aprForFee(fee))}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-[10px]">
            <AmountInput t={t} label={t.amount} value={newAmount} onChange={setNewAmount} max={coins} />
          </div>

          <div className="mt-[12px] flex gap-[7px]">
            <ActionButton kind="plain" className="flex-1 py-[9px]" onClick={() => setNewPoolOpen(false)}>
              {t.cancel}
            </ActionButton>
            <ActionButton kind="primary" className="flex-1 py-[9px]" onClick={submitNewPool} data-confirm-pool="">
              <PlusIcon width={13} height={13} />
              {t.createPool}
            </ActionButton>
          </div>
        </Sheet>
      )}

      {/* quick claim-all for the pool deposits listed in this tab */}
      {tab === "pools" && poolPositions.some((p) => earnedOf(p, liveNow) >= 1) && (
        <button
          type="button"
          onClick={() => {
            poolPositions.filter((p) => earnedOf(p, liveNow) >= 1).forEach((p) => onClaim(p.id));
          }}
          data-claim-all=""
          className="absolute bottom-[14px] end-[16px] flex items-center gap-[6px] rounded-full bg-gradient-to-b from-[#4bf5a0] to-[#16a86a] px-[16px] py-[8px] font-display text-[13px] text-[#04120c] shadow-[0_4px_0_#0b6a44]"
        >
          <Coin size={14} />
          {t.claimAll}
        </button>
      )}

    </div>
  );
}
