export const BOARD_THEMES = [
  { id: "sage", name: "Sage" },
  { id: "walnut", name: "Walnut" },
  { id: "ocean", name: "Ocean" },
  { id: "meadow", name: "Meadow" },
  { id: "midnight", name: "Midnight" },
  { id: "sand", name: "Sand" },
] as const;

export const ROOMS = [
  { id: "ink", name: "Ink" },
  { id: "paper", name: "Paper" },
  { id: "dusk", name: "Dusk" },
  { id: "grove", name: "Grove" },
  { id: "custom", name: "Custom" },
] as const;

export type BoardThemeId = (typeof BOARD_THEMES)[number]["id"];
export type RoomId = (typeof ROOMS)[number]["id"];

export function isBoardTheme(value: string): value is BoardThemeId {
  return BOARD_THEMES.some((theme) => theme.id === value);
}

export function isRoom(value: string): value is RoomId {
  return ROOMS.some((room) => room.id === value);
}

export function inkOf(hex: string): "light" | "dark" {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return "dark";
  const n = Number.parseInt(raw, 16);
  if (Number.isNaN(n)) return "dark";
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return l > 0.62 ? "light" : "dark";
}

export function thinkLabel(ms: number): string {
  if (ms < 280) return "Snap";
  if (ms < 500) return "Fast";
  if (ms < 900) return "Normal";
  if (ms < 1500) return "Deep";
  return "Serious";
}
