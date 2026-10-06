import type { Study } from "./types";

export const STUDIES: Study[] = [
  {
    id: "opera",
    title: "The Opera Game",
    source: "Morphy vs. Duke of Brunswick, 1858",
    fen: "r3kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w kq - 1 16",
    solution: "b3b8",
    idea: "Queen to b8. The knight must recapture, then Rd8 is mate — a forced sacrificial finish.",
  },
  {
    id: "legal",
    title: "Legal’s Mate",
    source: "Sire de Légal, 1750",
    fen: "r2qkbnr/ppp2ppp/2np4/4p3/2B1P1b1/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5",
    solution: "f3e5",
    idea: "Leave the queen hanging with Nxe5. If the bishop takes on d1, Bxf7+ and Nd5 mate.",
  },
  {
    id: "greek",
    title: "Greek Gift",
    source: "Classic attacking pattern",
    fen: "rnbq1rk1/pppn1ppp/4p3/3pP3/1b1P4/2NB1N2/PPP2PPP/R1BQK2R w KQ - 5 7",
    solution: "d3h7",
    idea: "Bishop takes on h7. The king is dragged out, then Ng5 and the queen join a forcing hunt.",
  },
  {
    id: "smother",
    title: "Smothered Mate",
    source: "Philidor pattern",
    fen: "r3r2k/6pp/3N4/8/8/8/5QPP/6K1 w - - 0 1",
    solution: "f2f8",
    idea: "Queen to f8. The rook is forced to recapture, then Nf7 is smothered mate.",
  },
  {
    id: "fried",
    title: "Fried Liver",
    source: "Polerio / Greco, Two Knights",
    fen: "r1bqkb1r/ppp2ppp/2n5/3np1N1/2B5/8/PPPP1PPP/RNBQK2R w KQkq - 0 6",
    solution: "g5f7",
    idea: "Knight takes on f7. The king is forced into the center and a cascade of checks follows.",
  },
  {
    id: "arabian",
    title: "Arabian Mate",
    source: "Ancient mating pattern",
    fen: "7k/6p1/5N2/7R/8/8/8/6K1 w - - 0 1",
    solution: "h5h7",
    idea: "Rook to h7. The knight covers the rook and g8; the pawn on g7 boxes the king in.",
  },
];
