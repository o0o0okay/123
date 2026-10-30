import { useEffect, useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import { RACES, type RaceId } from "@/data/races";
import {
  boardRows,
  carOf,
  fmtPoints,
  rivalsFor,
  seasonInfo,
  timeLeft,
  type BoardEntry,
  type BoardMode,
  type BoardRow,
} from "@/data/leaderboard";
import { fmt, type Lang, type Strings } from "@/i18n";
import { TimerIcon } from "@/icons";
import { RACE_ICONS } from "./raceIcons";

/* ------------------------------------------------------------------ */
/* bits                                                                */
/* ------------------------------------------------------------------ */

/** Circular crop of a car sprite (no paint overlay: rivals drive stock cars). */
function Face({ entry, size }: { entry: BoardEntry; size: number }) {
  const car = carOf(entry.carId);
  const w = size * car.face.zoom;
  const h = w * (car.imgH / car.imgW);
  return (
    <span
      data-face=""
      className="relative block shrink-0 overflow-hidden rounded-full border-[2.5px] border-ink bg-navy-700"
      style={{ width: size, height: size }}
    >
      <img
        src={car.image}
        alt=""
        draggable={false}
        className="absolute max-w-none"
        style={{ width: w, height: h, left: size / 2 - car.face.x * w, top: size / 2 - car.face.y * h }}
      />
    </span>
  );
}

/**
 * The whole car, fitted inside its box (`object-contain`): used on the podium,
 * where a cropped avatar would cut the car in half.
 */
function CarArt({ entry }: { entry: BoardEntry }) {
  const car = carOf(entry.carId);
  return (
    <img
      data-car-art={entry.carId}
      src={car.image}
      alt=""
      draggable={false}
      className="h-full w-full object-contain object-bottom drop-shadow-[0_3px_3px_rgba(6,10,40,0.55)]"
    />
  );
}

const MEDAL: Record<number, string> = {
  1: "from-[#ffe86a] to-[#ff9a1f] text-[#4a2a00] shadow-[0_3px_0_#a8610a]",
  2: "from-[#f2f7ff] to-[#9fb2cc] text-[#22304a] shadow-[0_3px_0_#5d6f8c]",
  3: "from-[#ffc08a] to-[#d9713a] text-[#3d1c07] shadow-[0_3px_0_#8e421a]",
};

function RankBadge({ rank, size = 30 }: { rank: number; size?: number }) {
  const medal = MEDAL[rank];
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[9px] border-[2.5px] border-ink font-display leading-none tabular-nums",
        medal ? cn("bg-gradient-to-b", medal) : "bg-navy-950 text-white/70",
      )}
      style={{ width: size, height: size, fontSize: medal ? size * 0.52 : size * 0.42 }}
    >
      {rank}
    </span>
  );
}

/** One ladder row. */
function Row({
  row,
  t,
  dense,
  pinned,
}: {
  row: BoardRow;
  t: Strings;
  dense?: boolean;
  pinned?: boolean;
}) {
  const top = row.rank <= 3;
  return (
    <div
      data-board-row={row.rank}
      data-me={row.me ? "1" : undefined}
      className={cn(
        "flex items-center gap-[7px] rounded-[12px] border-[2.5px] border-ink transition-colors",
        dense ? "px-[6px] py-[4px]" : "px-[7px] py-[5px]",
        pinned && "shadow-[0_-4px_12px_rgba(6,10,40,0.9)]",
        row.me
          ? "bg-gradient-to-r from-[#2fd47a] to-[#128a4b]"
          : top
            ? cn(
                "bg-gradient-to-r",
                row.rank === 1 && "from-[#ffd23a] to-[#ff9a1f]",
                row.rank === 2 && "from-[#e9f0fa] to-[#a9b8cc]",
                row.rank === 3 && "from-[#ffc493] to-[#d9713a]",
              )
            : "bg-gradient-to-r from-navy-700/95 to-navy-800/95",
      )}
    >
      <RankBadge rank={row.rank} size={dense ? 24 : 27} />
      <Face entry={row} size={dense ? 24 : 28} />

      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "flex items-center gap-[4px] truncate font-display leading-none",
            dense ? "text-[12px]" : "text-[13px]",
            top || row.me ? "text-white t-stroke sw-2" : "text-white/90",
          )}
          dir="auto"
        >
          <span className="truncate">{row.name}</span>
          {row.me && (
            <span className="shrink-0 rounded-full border-[2px] border-ink bg-white px-[4px] font-body text-[7px] font-black leading-[12px] text-[#0d5a33]">
              {t.you}
            </span>
          )}
        </div>
        <div
          className={cn(
            "truncate font-body text-[8px] font-black tracking-wide",
            top || row.me ? "text-white/80" : "text-white/45",
          )}
        >
          {row.races} {t.racesLbl} · {Math.round((row.wins / Math.max(1, row.races)) * 100)}% {t.winRate}
        </div>
      </div>

      <div className="shrink-0 text-end">
        <div
          className={cn(
            "font-display leading-none tabular-nums",
            dense ? "text-[13px]" : "text-[15px]",
            row.me ? "text-white" : top ? "text-ink" : "text-amber-400",
          )}
        >
          {row.value > 0 ? fmtPoints(row.value) : "—"}
        </div>
        <div className={cn("font-body text-[7px] font-black tracking-wider", top || row.me ? "text-white/70" : "text-white/35")}>
          {t.pointsShort}
        </div>
      </div>
    </div>
  );
}

/** Top-3 podium: 2nd · 1st · 3rd, like the arcade boards. */
function Podium({ rows, t, dense }: { rows: BoardRow[]; t: Strings; dense?: boolean }) {
  const order = [1, 0, 2];
  return (
    <div className="grid shrink-0 grid-cols-3 items-end gap-[5px]">
      {order.map((idx) => {
        const row = rows[idx];
        if (!row) return <div key={idx} />;
        const first = row.rank === 1;
        return (
          <div
            key={row.id}
            data-podium={row.rank}
            className={cn(
              "relative flex flex-col items-center rounded-[12px] border-[2.5px] border-ink bg-gradient-to-b px-[3px] pb-[5px] pt-[6px]",
              first && "from-[#ffd23a] to-[#ff9a1f] shadow-[0_3px_0_#a8610a]",
              row.rank === 2 && "from-[#e9f0fa] to-[#a9b8cc] shadow-[0_3px_0_#5d6f8c]",
              row.rank === 3 && "from-[#ffc493] to-[#d9713a] shadow-[0_3px_0_#8e421a]",
              row.me && "ring-[3px] ring-[#2fd47a]",
            )}
            style={{ minHeight: dense ? (first ? 88 : 74) : first ? 100 : 84 }}
          >
            <span className="absolute -top-[7px] start-[2px]">
              <RankBadge rank={row.rank} size={dense ? 19 : 22} />
            </span>
            <div className="w-full shrink-0" style={{ height: dense ? (first ? 40 : 32) : first ? 50 : 40 }}>
              <CarArt entry={row} />
            </div>
            <div className="mt-auto w-full truncate text-center font-display leading-tight text-ink" dir="auto" style={{ fontSize: dense ? 10 : 11 }}>
              {row.name}
            </div>
            <div className="font-display leading-none text-ink tabular-nums" style={{ fontSize: dense ? 12 : 14 }}>
              {fmtPoints(row.value)}
            </div>
            <div className="font-body text-[6px] font-black tracking-wider text-ink/60">{t.pointsShort}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* board                                                               */
/* ------------------------------------------------------------------ */

export function Leaderboard({
  t,
  lang,
  me,
  dense,
}: {
  t: Strings;
  lang: Lang;
  /** the player's own score card (null before the first race) */
  me: BoardEntry | null;
  dense?: boolean;
}) {
  const [mode, setMode] = useState<BoardMode>("all");
  const [now, setNow] = useState(() => Date.now());
  const season = useMemo(() => seasonInfo(), []);
  const rivals = useMemo(() => rivalsFor(season.index), [season.index]);
  const rows = useMemo(() => boardRows(rivals, me, mode), [rivals, me, mode]);

  // the countdown is the only thing that has to tick
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const left = timeLeft(season.endsAt, now);
  const myRow = rows.find((r) => r.me) ?? null;
  const top = rows.slice(0, 3);
  const rest = rows.slice(3);
  /* a fixed "your standing" row, but only once you have scrolled past yourself */
  const pinned = myRow && myRow.rank > 10 ? myRow : null;
  const modeTitle = mode === "all" ? t.allModes : RACES.find((r) => r.id === mode)!.title[lang];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[7px]">
      {/* season + countdown */}
      <div className="flex shrink-0 items-center justify-between gap-[6px] rounded-[14px] border-[3px] border-ink bg-gradient-to-r from-[#6a3bd8] to-[#2b1a6b] px-[9px] py-[5px] shadow-[0_3px_0_#060a28]">
        <div className="min-w-0">
          <div className="truncate font-display text-[13px] leading-none text-white t-stroke sw-2">
            {fmt(t.seasonNo, { n: season.label })}
          </div>
          <div className="mt-[2px] truncate font-body text-[8px] font-black tracking-wider text-white/60">{t.boardSub}</div>
        </div>
        <span className="flex shrink-0 items-center gap-[3px] rounded-full border-[2px] border-ink bg-navy-950 px-[6px] py-[2px] font-display text-[11px] text-skyg-300 tabular-nums">
          <TimerIcon width={11} height={11} />
          {left.days > 0 ? fmt(t.dayShort, { n: left.days }) : fmt(t.hourShort, { n: left.hours })}{" "}
          {left.days > 0 ? fmt(t.hourShort, { n: left.hours }) : ""}
        </span>
      </div>

      {/* board selector */}
      <div className="no-scrollbar flex shrink-0 items-center gap-[4px] overflow-x-auto pb-[1px]">
        <button
          type="button"
          onClick={() => setMode("all")}
          aria-pressed={mode === "all"}
          className={cn(
            "shrink-0 rounded-full border-[2.5px] border-ink px-[9px] py-[3px] font-display text-[11px] tracking-wide transition-colors",
            mode === "all" ? "bg-gradient-to-b from-[#ffd23a] to-[#ff9a1f] text-ink" : "bg-navy-900 text-white/55",
          )}
        >
          {t.globalRank}
        </button>
        {RACES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setMode(r.id as RaceId)}
            aria-label={r.title[lang]}
            aria-pressed={mode === r.id}
            className={cn(
              "flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-[2.5px] border-ink transition-colors [&>svg]:h-[14px] [&>svg]:w-[14px]",
              mode === r.id ? cn("bg-gradient-to-b text-white", r.color) : "bg-navy-900 text-white/45",
            )}
          >
            {RACE_ICONS[r.id]}
          </button>
        ))}
      </div>

      {/* title of the selected board + your standing */}
      <div className="flex shrink-0 items-center justify-between gap-[6px] px-[2px]">
        <span className="truncate font-display text-[12px] text-white t-stroke sw-2">{modeTitle}</span>
        <span
          data-my-rank={myRow ? myRow.rank : ""}
          className="flex shrink-0 items-center gap-[4px] font-body text-[9px] font-black tracking-wider text-mint-400"
        >
          {t.yourRank} #{myRow ? myRow.rank : "—"}
        </span>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 space-y-[5px] overflow-y-auto pe-[1px] pt-[9px]">
        <Podium rows={top} t={t} dense={dense} />

        <div className="space-y-[4px] pt-[6px]">
          {rest.map((row) => (
            <Row key={row.id} row={row} t={t} dense={dense} />
          ))}
        </div>

        {myRow && myRow.value === 0 && (
          <div className="py-[8px] text-center font-body text-[9px] font-black tracking-wider text-white/40">
            {t.boardEmpty}
          </div>
        )}
      </div>

      {/* your row stays on screen even when you are far down the ladder */}
      {pinned && (
        <div className="shrink-0">
          <Row row={pinned} t={t} dense={dense} pinned />
        </div>
      )}
    </div>
  );
}
