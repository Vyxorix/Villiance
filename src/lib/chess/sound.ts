let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

export function resumeAudio() {
  void audio()?.resume();
}

function tone(freq: number, duration: number, gain = 0.04, type: OscillatorType = "sine") {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration);
}

export function playMoveSound(kind: "move" | "capture" | "check" | "gameover" | "brilliant") {
  resumeAudio();
  if (kind === "capture") {
    tone(220, 0.09, 0.05, "triangle");
    tone(140, 0.12, 0.03, "square");
    return;
  }
  if (kind === "check") {
    tone(520, 0.08, 0.04);
    tone(780, 0.12, 0.03);
    return;
  }
  if (kind === "brilliant") {
    tone(523, 0.1, 0.04);
    window.setTimeout(() => tone(659, 0.1, 0.04), 80);
    window.setTimeout(() => tone(784, 0.16, 0.035), 160);
    return;
  }
  if (kind === "gameover") {
    tone(392, 0.18, 0.045);
    window.setTimeout(() => tone(262, 0.28, 0.04), 140);
    return;
  }
  tone(410, 0.06, 0.035, "sine");
}
