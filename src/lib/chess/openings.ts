const BOOK: [string, string][] = [
  ["e4", "King’s Pawn"],
  ["e4 e5", "Open Game"],
  ["e4 e5 Nf3", "King’s Knight Opening"],
  ["e4 e5 Nf3 Nc6", "King’s Knight Opening"],
  ["e4 e5 Nf3 Nc6 Bb5", "Ruy Lopez"],
  ["e4 e5 Nf3 Nc6 Bb5 a6", "Ruy Lopez: Morphy Defense"],
  ["e4 e5 Nf3 Nc6 Bc4", "Italian Game"],
  ["e4 e5 Nf3 Nc6 Bc4 Bc5", "Giuoco Piano"],
  ["e4 e5 Nf3 Nc6 Bc4 Nf6", "Two Knights Defense"],
  ["e4 e5 Nf3 Nc6 d4", "Scotch Game"],
  ["e4 e5 Nf3 Nf6", "Petrov’s Defense"],
  ["e4 e5 Nf3 d6", "Philidor Defense"],
  ["e4 e5 f4", "King’s Gambit"],
  ["e4 e5 Nc3", "Vienna Game"],
  ["e4 c5", "Sicilian Defense"],
  ["e4 c5 Nf3", "Sicilian Defense"],
  ["e4 c5 Nf3 d6", "Sicilian: Open"],
  ["e4 c5 Nf3 d6 d4", "Sicilian: Open"],
  ["e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6", "Sicilian Najdorf"],
  ["e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6", "Sicilian Dragon"],
  ["e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 Nc6", "Sicilian Classical"],
  ["e4 c5 Nf3 Nc6", "Sicilian: Old"],
  ["e4 c5 Nf3 e6", "Sicilian Kan / Taimanov"],
  ["e4 c5 c3", "Sicilian: Alapin"],
  ["e4 e6", "French Defense"],
  ["e4 e6 d4 d5", "French Defense"],
  ["e4 e6 d4 d5 Nc3", "French: Winawer / Classical"],
  ["e4 e6 d4 d5 Nd2", "French Tarrasch"],
  ["e4 e6 d4 d5 e5", "French Advance"],
  ["e4 c6", "Caro-Kann"],
  ["e4 c6 d4 d5", "Caro-Kann"],
  ["e4 c6 d4 d5 Nc3", "Caro-Kann: Two Knights / Classical"],
  ["e4 c6 d4 d5 e5", "Caro-Kann Advance"],
  ["e4 d5", "Scandinavian Defense"],
  ["e4 Nf6", "Alekhine’s Defense"],
  ["e4 d6", "Pirc Defense"],
  ["e4 g6", "Modern Defense"],
  ["e4 Nc6", "Nimzowitsch Defense"],
  ["d4", "Queen’s Pawn"],
  ["d4 d5", "Closed Game"],
  ["d4 d5 c4", "Queen’s Gambit"],
  ["d4 d5 c4 e6", "Queen’s Gambit Declined"],
  ["d4 d5 c4 c6", "Slav Defense"],
  ["d4 d5 c4 dxc4", "Queen’s Gambit Accepted"],
  ["d4 d5 Nf3", "Queen’s Pawn: Quiet"],
  ["d4 Nf6", "Indian Defense"],
  ["d4 Nf6 c4", "Indian Defense"],
  ["d4 Nf6 c4 e6", "Nimzo / Queen’s Indian"],
  ["d4 Nf6 c4 e6 Nc3 Bb4", "Nimzo-Indian"],
  ["d4 Nf6 c4 e6 Nf3", "Queen’s Indian / Bogo"],
  ["d4 Nf6 c4 e6 Nf3 b6", "Queen’s Indian"],
  ["d4 Nf6 c4 g6", "King’s Indian / Grünfeld"],
  ["d4 Nf6 c4 g6 Nc3 Bg7", "King’s Indian"],
  ["d4 Nf6 c4 g6 Nc3 d5", "Grünfeld Defense"],
  ["d4 Nf6 c4 c5", "Benoni"],
  ["d4 f5", "Dutch Defense"],
  ["d4 e6", "Horwitz / French transpose"],
  ["c4", "English Opening"],
  ["c4 e5", "English: Reversed Sicilian"],
  ["c4 c5", "English: Symmetrical"],
  ["c4 Nf6", "English: Anglo-Indian"],
  ["Nf3", "Réti / Zukertort"],
  ["Nf3 d5", "Réti"],
  ["Nf3 Nf6", "Réti"],
  ["g3", "Benko Opening"],
  ["b3", "Nimzo-Larsen"],
  ["f4", "Bird’s Opening"],
  ["Nc3", "Van Geet"],
];

export function openingName(sans: string[]): string | null {
  if (sans.length === 0) return "Starting position";
  const key = sans.join(" ");
  let best: string | null = null;
  let bestLen = 0;
  for (const [seq, name] of BOOK) {
    if (key === seq || key.startsWith(seq + " ")) {
      if (seq.length >= bestLen) {
        best = name;
        bestLen = seq.length;
      }
    }
  }
  return best;
}

export function isBookMove(sans: string[]): boolean {
  if (sans.length === 0 || sans.length > 10) return false;
  return openingName(sans) !== null;
}
