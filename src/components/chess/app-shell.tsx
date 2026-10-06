import { useEffect } from "react";
import { Toaster } from "sonner";
import { ChessBoard } from "@/components/chess/board";
import { EvalBar } from "@/components/chess/eval-bar";
import {
  CapturedRow,
  ClassificationKey,
  EnginePanel,
  GameToolbar,
  ImportDialog,
  MoveList,
  NewGameBar,
  StudiesPanel,
} from "@/components/chess/panels";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEngineBridge } from "@/lib/chess/use-engine";
import { resumeAudio } from "@/lib/chess/sound";
import { useGame } from "@/store/game";

export function AppShell() {
  const orientation = useGame((s) => s.orientation);
  const mode = useGame((s) => s.mode);
  const hydrate = useGame((s) => s.hydrate);

  useEngineBridge();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const s = useGame.getState();
        s.goto(s.cursor - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const s = useGame.getState();
        s.goto(s.cursor + 1);
      } else if (e.key === "f" || e.key === "F") {
        useGame.getState().flip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <TooltipProvider delayDuration={250}>
      <div
        className="min-h-dvh bg-bg text-fg"
        onPointerDown={() => resumeAudio()}
      >
        <header className="border-b border-border px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4">
            <div>
              <p className="font-display text-2xl leading-none tracking-tight">Brilliance</p>
              <p className="mt-1 text-xs text-muted">Play, analyze, hunt the sacrifice.</p>
            </div>
            <nav className="flex gap-1 rounded-[var(--radius-md)] bg-surface-2 p-1">
              <ModeBtn id="play" label="Play" active={mode === "play"} />
              <ModeBtn id="analyze" label="Analyze" active={mode === "analyze"} />
              <ModeBtn id="study" label="Studies" active={mode === "study"} />
            </nav>
          </div>
        </header>

        <main className="mx-auto grid max-w-[1180px] gap-5 px-4 py-4 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_20rem] lg:items-start lg:py-6">
          <div className="hidden h-[min(72vw,560px)] lg:block">
            <EvalBar orientation={orientation} />
          </div>

          <section className="flex min-w-0 flex-col gap-3">
            <div className="lg:hidden">
              <EvalBar orientation={orientation} horizontal />
            </div>
            <CapturedRow />
            <ChessBoard />
            <ClassificationKey />
            <GameToolbar />
            <NewGameBar />
          </section>

          <aside className="flex min-w-0 flex-col gap-4 pb-8">
            <div className="lg:hidden">
              <Tabs defaultValue={mode === "study" ? "studies" : "engine"}>
                <TabsList>
                  <TabsTrigger value="engine">Engine</TabsTrigger>
                  <TabsTrigger value="moves">Moves</TabsTrigger>
                  <TabsTrigger value="studies">Studies</TabsTrigger>
                </TabsList>
                <TabsContent value="engine" className="mt-3">
                  <EnginePanel />
                </TabsContent>
                <TabsContent value="moves" className="mt-3">
                  <MoveList />
                </TabsContent>
                <TabsContent value="studies" className="mt-3">
                  <StudiesPanel />
                </TabsContent>
              </Tabs>
            </div>
            <div className="hidden flex-col gap-4 lg:flex">
              <EnginePanel />
              <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
                <p className="mb-2 text-[11px] font-medium tracking-wide text-subtle uppercase">Moves</p>
                <MoveList />
              </div>
              <div>
                <p className="mb-2 text-[11px] font-medium tracking-wide text-subtle uppercase">Brilliancies</p>
                <StudiesPanel />
              </div>
            </div>
          </aside>
        </main>
        <ImportDialog />
        <Toaster theme="dark" position="bottom-center" richColors={false} />
      </div>
    </TooltipProvider>
  );
}

function ModeBtn({ id, label, active }: { id: "play" | "analyze" | "study"; label: string; active: boolean }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (id === "study") {
          useGame.getState().setMode("study");
          return;
        }
        if (id === "play") {
          const s = useGame.getState();
          if (s.mode !== "play") s.setMode("play");
          return;
        }
        useGame.getState().setMode("analyze");
      }}
      className={
        active
          ? "h-9 rounded-[var(--radius-sm)] bg-surface px-3 text-sm font-medium"
          : "h-9 rounded-[var(--radius-sm)] px-3 text-sm font-medium text-muted hover:text-fg"
      }
    >
      {label}
    </button>
  );
}
