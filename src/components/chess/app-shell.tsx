import { useEffect } from "react";
import { Settings2 } from "lucide-react";
import { Toaster } from "sonner";
import { ChessBoard } from "@/components/chess/board";
import { EvalBar } from "@/components/chess/eval-bar";
import { HomeScreen, roomInk } from "@/components/chess/home";
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
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEngineBridge } from "@/lib/chess/use-engine";
import { resumeAudio } from "@/lib/chess/sound";
import { useGame } from "@/store/game";

export function AppShell() {
  const orientation = useGame((s) => s.orientation);
  const mode = useGame((s) => s.mode);
  const screen = useGame((s) => s.screen);
  const boardTheme = useGame((s) => s.boardTheme);
  const room = useGame((s) => s.room);
  const customBg = useGame((s) => s.customBg);
  const hydrate = useGame((s) => s.hydrate);

  useEngineBridge();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (useGame.getState().screen !== "board") return;
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

  const modeLabel = mode === "play" ? "Vs engine" : mode === "analyze" ? "Suggest only" : "Studies";

  return (
    <TooltipProvider delayDuration={250}>
      <div
        data-board={boardTheme}
        data-room={room}
        data-ink={roomInk(room, customBg)}
        style={{ ["--room-custom" as string]: customBg }}
        className="min-h-dvh bg-bg text-fg"
        onPointerDown={() => resumeAudio()}
      >
        {screen === "board" ? (
          <>
            <header className="border-b border-border px-4 py-3 sm:px-6">
              <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => useGame.getState().setScreen("home")}>
                    Menu
                  </Button>
                  <div>
                    <p className="font-display text-2xl leading-none tracking-tight">Villiance</p>
                    <p className="mt-1 text-xs text-muted">{modeLabel}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Settings"
                  onClick={() => useGame.getState().openSettings()}
                >
                  <Settings2 className="size-4" />
                </Button>
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
                      {mode === "study" && <TabsTrigger value="studies">Studies</TabsTrigger>}
                    </TabsList>
                    <TabsContent value="engine" className="mt-3">
                      <EnginePanel />
                    </TabsContent>
                    <TabsContent value="moves" className="mt-3">
                      <MoveList />
                    </TabsContent>
                    {mode === "study" && (
                      <TabsContent value="studies" className="mt-3">
                        <StudiesPanel />
                      </TabsContent>
                    )}
                  </Tabs>
                </div>
                <div className="hidden flex-col gap-4 lg:flex">
                  <EnginePanel />
                  <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
                    <p className="mb-2 text-xs font-medium tracking-wide text-subtle uppercase">Moves</p>
                    <MoveList />
                  </div>
                  {mode === "study" && (
                    <div>
                      <p className="mb-2 text-xs font-medium tracking-wide text-subtle uppercase">Studies</p>
                      <StudiesPanel />
                    </div>
                  )}
                </div>
              </aside>
            </main>
          </>
        ) : (
          <HomeScreen />
        )}
        <ImportDialog />
        <Toaster theme={roomInk(room, customBg) === "light" ? "light" : "dark"} position="bottom-center" richColors={false} />
      </div>
    </TooltipProvider>
  );
}
