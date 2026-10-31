import { Compass, Library, Settings2, Swords } from "lucide-react";
import { BOARD_THEMES, ROOMS, inkOf, thinkLabel } from "@/lib/chess/appearance";
import { ReviewHome } from "@/components/chess/review-home";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useGame } from "@/store/game";

export function HomeScreen() {
  const screen = useGame((s) => s.screen);
  const plies = useGame((s) => s.plies.length);
  const mode = useGame((s) => s.mode);
  if (screen === "settings") return <SettingsScreen />;

  const continueLabel = mode === "play" ? "Vs engine" : mode === "analyze" ? "Suggest only" : "Study";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-4xl leading-none tracking-tight sm:text-5xl">Villiance</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
            Play the engine, copy a game for suggestions, or review a score you paste.
          </p>
        </div>
        <Button variant="outline" size="icon" aria-label="Settings" onClick={() => useGame.getState().openSettings()}>
          <Settings2 className="size-4" />
        </Button>
      </header>

      {plies > 0 && (
        <button
          type="button"
          onClick={() => useGame.getState().setScreen("board")}
          className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-border bg-surface px-4 py-3 text-left"
        >
          <span>
            <span className="block text-sm font-medium">Continue</span>
            <span className="mt-0.5 block text-xs text-muted">
              {continueLabel} · {plies} {plies === 1 ? "move" : "moves"}
            </span>
          </span>
          <span className="text-sm text-muted">Resume</span>
        </button>
      )}

      <div className="grid gap-3">
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-surface-2">
              <Swords className="size-4" />
            </span>
            <div>
              <h2 className="font-display text-2xl leading-none">Vs engine</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                You play. Villiance answers with its own moves. Arrows and suggested moves stay off.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Button onClick={() => useGame.getState().startVs("w")}>White</Button>
            <Button variant="secondary" onClick={() => useGame.getState().startVs("b")}>
              Black
            </Button>
            <Button variant="outline" onClick={() => useGame.getState().startVs("random")}>
              Random
            </Button>
          </div>
        </section>

        <button
          type="button"
          onClick={() => useGame.getState().startSuggest()}
          className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 text-left sm:p-5"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-surface-2">
              <Compass className="size-4" />
            </span>
            <div>
              <h2 className="font-display text-2xl leading-none">Suggest only</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Playing someone in another app? Copy the moves here. Villiance recommends the reply and never moves a piece.
              </p>
            </div>
          </div>
        </button>

        <ReviewHome />

        <button
          type="button"
          onClick={() => useGame.getState().startStudies()}
          className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 text-left sm:p-5"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-surface-2">
              <Library className="size-4" />
            </span>
            <div>
              <h2 className="font-display text-2xl leading-none">Studies</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Short forcing positions. Find the sacrifice yourself — the arrow appears only after a miss.
              </p>
            </div>
          </div>
        </button>
      </div>

      {plies > 0 && (
        <p className="text-xs leading-relaxed text-subtle">
          Starting a mode replaces the game on the board. Continue keeps it.
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => useGame.getState().setImportOpen(true)}>
          Import PGN or FEN
        </Button>
      </div>
    </div>
  );
}

function SettingsScreen() {
  const movetime = useGame((s) => s.movetime);
  const boardTheme = useGame((s) => s.boardTheme);
  const room = useGame((s) => s.room);
  const customBg = useGame((s) => s.customBg);
  const sound = useGame((s) => s.sound);
  const showCoords = useGame((s) => s.showCoords);
  const back = useGame((s) => s.settingsBack);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => useGame.getState().setScreen(back)}>
          Back
        </Button>
        <h1 className="font-display text-3xl leading-none">Settings</h1>
      </header>

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 sm:p-5">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-xl leading-none">Think time</h2>
          <p className="font-mono text-xs text-muted tabular-nums">
            {thinkLabel(movetime)} · {movetime} ms
          </p>
        </div>
        <p className="mb-3 text-sm text-muted">How long Villiance searches before it moves or suggests.</p>
        <Slider
          min={160}
          max={2200}
          step={20}
          value={[movetime]}
          onValueChange={(v) => useGame.getState().setMovetime(v[0] ?? 480)}
          aria-label="Think time"
        />
      </section>

      <section>
        <h2 className="font-display text-xl leading-none">Board</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BOARD_THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              data-board={theme.id}
              onClick={() => useGame.getState().setBoardTheme(theme.id)}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-md)] border bg-surface px-3 py-2.5 text-left",
                boardTheme === theme.id ? "border-fg" : "border-border",
              )}
            >
              <span className="grid size-10 shrink-0 grid-cols-2 overflow-hidden rounded-[var(--radius-xs)]" aria-hidden>
                <span className="bg-board-light" />
                <span className="bg-board-dark" />
                <span className="bg-board-dark" />
                <span className="bg-board-light" />
              </span>
              <span className="text-sm font-medium">{theme.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl leading-none">Background</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ROOMS.filter((item) => item.id !== "custom").map((item) => (
            <button
              key={item.id}
              type="button"
              data-room={item.id}
              onClick={() => useGame.getState().setRoom(item.id)}
              className={cn(
                "h-11 rounded-[var(--radius-md)] border px-3 text-left text-sm font-medium",
                room === item.id ? "border-fg" : "border-border",
              )}
              style={{ background: "var(--color-bg)", color: "var(--color-fg)" }}
            >
              {item.name}
            </button>
          ))}
          <label
            className={cn(
              "flex h-11 items-center gap-2 rounded-[var(--radius-md)] border bg-surface px-3 text-sm font-medium",
              room === "custom" ? "border-fg" : "border-border",
            )}
          >
            <input
              type="color"
              aria-label="Custom background"
              value={customBg}
              onChange={(e) => useGame.getState().setCustomBg(e.target.value)}
              className="size-6 shrink-0 cursor-pointer border-0 bg-transparent p-0"
            />
            Custom
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <ToggleRow
          label="Sound"
          on={sound}
          onClick={() => useGame.getState().setSound(!sound)}
        />
        <ToggleRow
          label="Coordinates"
          on={showCoords}
          onClick={() => useGame.getState().setShowCoords(!showCoords)}
        />
      </section>
    </div>
  );
}

function ToggleRow({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 items-center justify-between rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm"
    >
      <span>{label}</span>
      <span className={cn("font-medium", on ? "text-fg" : "text-muted")}>{on ? "On" : "Off"}</span>
    </button>
  );
}

export function roomInk(room: string, customBg: string) {
  if (room === "paper") return "light";
  if (room === "custom") return inkOf(customBg);
  return "dark";
}
