import type { Lang } from "./i18n";

export type Server = "ASIA" | "EU" | "NA";
export type Graphics = "low" | "med" | "high";

export interface Settings {
  sound: boolean;
  music: boolean;
  vibration: boolean;
  lang: Lang;
  server: Server;
  graphics: Graphics;
}

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  music: true,
  vibration: true,
  lang: "en",
  server: "ASIA",
  graphics: "high",
};

const KEY = "bj_settings";
export const USER_KEY = "bj_remembered_user";

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
