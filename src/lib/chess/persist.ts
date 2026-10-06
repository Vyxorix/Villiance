const KEY = "brilliance.v1";

export type Persisted = {
  version: 1;
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
};

export const persistDefaults: Persisted = {
  version: 1,
  pgn: "",
  startFen: "",
  cursor: 0,
  orientation: "w",
  playerColor: "w",
  mode: "play",
  engineOn: true,
  movetime: 350,
  sound: true,
  showCoords: true,
};

export function loadPersist(): Persisted {
  if (typeof window === "undefined") return persistDefaults;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return persistDefaults;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    if (parsed.version !== 1) return persistDefaults;
    return { ...persistDefaults, ...parsed, version: 1 };
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
