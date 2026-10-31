import { ClipboardPaste } from "lucide-react";
import { useState } from "react";
import { loadChessComGames, type ChessComGame } from "@/lib/chess/chesscom";
import { runReview } from "@/lib/chess/run-review";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useGame } from "@/store/game";

function openPgn(pgn: string, accuracy: { w: number; b: number } | null) {
  const message = useGame.getState().loadPgn(pgn);
  if (message) return message;
  useGame.setState({ reportedAccuracy: accuracy, reviewOpen: true });
  void runReview(true);
  return null;
}

export function ReviewHome() {
  const [text, setText] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [games, setGames] = useState<ChessComGame[]>([]);
  const [found, setFound] = useState<string | null>(null);

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-surface-2">
          <ClipboardPaste className="size-4" />
        </span>
        <div>
          <h2 className="font-display text-2xl leading-none">Review</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Paste a game, or look up a public Chess.com account. Villiance grades every move by the winning chance it gave away.
          </p>
        </div>
      </div>

      <Textarea
        className="mt-4 min-h-24"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="1. e4 e5 2. Nf3 Nc6 …  or a full PGN"
        aria-label="Moves to review"
      />
      {pasteError && <p className="mt-2 text-sm text-blunder">{pasteError}</p>}
      <Button
        className="mt-3"
        disabled={!text.trim()}
        onClick={() => {
          const message = openPgn(text.trim(), null);
          setPasteError(message);
        }}
      >
        Analyze moves
      </Button>

      <div className="mt-5 border-t border-border pt-4">
        <p className="text-xs font-medium tracking-wide text-subtle uppercase">Chess.com</p>
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const name = username.trim();
            if (!name || pending) return;
            setPending(true);
            setLookupError(null);
            void loadChessComGames({ data: { username: name } })
              .then((result) => {
                if (!result.ok) {
                  setGames([]);
                  setFound(null);
                  setLookupError(result.error);
                  return;
                }
                setFound(result.username);
                setGames(result.games);
                if (result.games.length === 0) setLookupError("No standard games in the latest months.");
              })
              .catch(() => setLookupError("Could not reach Chess.com."))
              .finally(() => setPending(false));
          }}
        >
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            aria-label="Chess.com username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <Button type="submit" variant="secondary" disabled={pending || username.trim().length < 2}>
            {pending ? "Looking…" : "Find"}
          </Button>
        </form>
        {lookupError && <p className="mt-2 text-sm text-blunder">{lookupError}</p>}
        {found && games.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1.5">
            {games.map((game) => (
              <li key={game.id}>
                <button
                  type="button"
                  onClick={() => {
                    const message = openPgn(game.pgn, game.accuracy);
                    setPasteError(message);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border px-3 py-2.5 text-left hover:bg-surface-2"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {game.white} – {game.black}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {game.timeClass} · {game.whiteRating}–{game.blackRating}
                      {game.accuracy ? ` · Chess.com ${game.accuracy.w.toFixed(0)} / ${game.accuracy.b.toFixed(0)}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted">{game.result}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
