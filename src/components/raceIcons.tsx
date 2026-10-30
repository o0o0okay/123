import type { ReactNode } from "react";
import type { RaceId } from "@/data/races";
import { DriftIcon, FlagIcon, PoliceLightIcon, SkullIcon, StarBurstIcon, TimerIcon } from "@/icons";

/**
 * Icon for each race mode.
 *
 * Lives in its own module so the leaderboard (which is imported by the race
 * panel) can reuse the icons without importing the panel back.
 */
export const RACE_ICONS: Record<RaceId, ReactNode> = {
  street: <FlagIcon width={26} height={26} />,
  score: <StarBurstIcon width={26} height={26} />,
  demolition: <SkullIcon width={26} height={26} />,
  pursuit: <PoliceLightIcon width={26} height={26} />,
  drift: <DriftIcon width={26} height={26} />,
  timeattack: <TimerIcon width={26} height={26} />,
};
