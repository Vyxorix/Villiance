import { isBoardTheme, isRoom, type BoardThemeId, type RoomId } from "./appearance";

const KEY = "brilliance.v1";

export type Persisted = {
  version: 2;
  pgn: string;
  startFen: string;
  cursor: number;
  orientation: "w" | "b";
  playerColor: "w" | "b";
  mode: "play" | "analyze" | "study";
  engineOn: boolean;
  movetime: number;
  sound: boolean;
  showCoords: boolean;
  boardTheme: BoardThemeId;
  room: RoomId;
  customBg: string;
};

export const persistDefaults: Persisted = {
  version: 2,
  pgn: "",
  startFen: "",
  cursor: 0,
  orientation: "w",
  playerColor: "w",
  mode: "play",
  engineOn: true,
  movetime: 480,
  sound: true,
  showCoords: true,
  boardTheme: "sage",
  room: "ink",
  customBg: "#1a1c28",
};

export function loadPersist(): Persisted {
  if (typeof window === "undefined") return persistDefaults;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return persistDefaults;
    const parsed = JSON.parse(raw) as Partial<Omit<Persisted, "version">> & { version?: number };
    if (parsed.version !== 1 && parsed.version !== 2) return persistDefaults;
    const merged = { ...persistDefaults, ...parsed, version: 2 as const };
    if (!isBoardTheme(merged.boardTheme)) merged.boardTheme = "sage";
    if (!isRoom(merged.room)) merged.room = "ink";
    if (!/^#[0-9a-fA-F]{6}$/.test(merged.customBg)) merged.customBg = persistDefaults.customBg;
    return merged;
  } catch {
    return persistDefaults;
  }
}

export function savePersist(data: Persisted) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* private mode / quota */
  }
}
