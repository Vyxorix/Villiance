import { i as __toESM } from "../_runtime.mjs";
import { c as require_react, r as Slot, s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as RotateCcw, c as ClipboardCopy, d as ChevronRight, f as ChevronLeft, l as ChevronsRight, n as VolumeX, o as Lightbulb, r as Volume2, s as FlipVertical2, t as X, u as ChevronsLeft } from "../_libs/lucide-react.mjs";
import { a as DialogOverlay$1, i as DialogDescription$1, n as DialogClose, o as DialogPortal$1, r as DialogContent$1, s as DialogTitle$1, t as Dialog$1 } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { n as DEFAULT_POSITION, t as Chess } from "../_libs/chess.js.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as create } from "../_libs/zustand.mjs";
import { i as Viewport, n as Scrollbar, r as Thumb, t as Root } from "../_libs/radix-ui__react-scroll-area.mjs";
import { i as SliderTrack, n as SliderRange, r as SliderThumb, t as Slider$1 } from "../_libs/@radix-ui/react-slider+[...].mjs";
import { i as Trigger, n as List, r as Root2, t as Content } from "../_libs/radix-ui__react-tabs.mjs";
import { t as Provider } from "../_libs/radix-ui__react-tooltip.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BG-M97DI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FILES = "abcdefgh";
var PIECE_VAL = {
	p: 1,
	n: 3,
	b: 3,
	r: 5,
	q: 9,
	k: 0
};
function opposite(color) {
	return color === "w" ? "b" : "w";
}
function uciParts(uci) {
	return {
		from: uci.slice(0, 2),
		to: uci.slice(2, 4),
		promotion: uci[4] || void 0
	};
}
function toUci(from, to, promotion) {
	return from + to + (promotion ?? "");
}
function capturedPieces(chess) {
	const start = {
		p: 8,
		n: 2,
		b: 2,
		r: 2,
		q: 1,
		k: 1
	};
	const have = {
		w: {
			p: 0,
			n: 0,
			b: 0,
			r: 0,
			q: 0,
			k: 0
		},
		b: {
			p: 0,
			n: 0,
			b: 0,
			r: 0,
			q: 0,
			k: 0
		}
	};
	for (const row of chess.board()) for (const p of row) if (p) have[p.color][p.type] += 1;
	const missing = (color) => {
		const order = [
			"q",
			"r",
			"b",
			"n",
			"p"
		];
		const out = [];
		for (const t of order) {
			const n = Math.max(0, start[t] - have[color][t]);
			for (let i = 0; i < n; i++) out.push(t);
		}
		return out;
	};
	return {
		w: missing("w"),
		b: missing("b")
	};
}
function formatScore(score) {
	if (!score) return "…";
	if (score.type === "mate") {
		if (score.value === 0) return "#";
		return score.value > 0 ? `#${score.value}` : `#-${Math.abs(score.value)}`;
	}
	const pawns = score.value / 100;
	const abs = Math.abs(pawns).toFixed(Math.abs(pawns) >= 10 ? 0 : 1);
	if (pawns > .04) return `+${abs}`;
	if (pawns < -.04) return `-${abs}`;
	return "0.0";
}
function evalToWhitePct(score) {
	if (!score) return .5;
	if (score.type === "mate") {
		if (score.value === 0) return .5;
		return score.value > 0 ? .97 : .03;
	}
	const p = 1 / (1 + Math.exp(-score.value / 280));
	return Math.min(.97, Math.max(.03, p));
}
function pvToSan(fen, pv) {
	const chess = new Chess(fen);
	const san = [];
	for (const u of pv) {
		const parts = uciParts(u);
		try {
			const mv = chess.move(parts);
			if (!mv) break;
			san.push(mv.san);
		} catch {
			break;
		}
	}
	return san;
}
function kingSquare(chess, color) {
	return chess.findPiece({
		type: "k",
		color
	})[0] ?? null;
}
function destAttacked(chess, square, by) {
	return chess.isAttacked(square, by);
}
function statusText(chess) {
	if (chess.isCheckmate()) return chess.turn() === "w" ? "Black wins by checkmate" : "White wins by checkmate";
	if (chess.isStalemate()) return "Draw by stalemate";
	if (chess.isThreefoldRepetition()) return "Draw by repetition";
	if (chess.isInsufficientMaterial()) return "Draw by insufficient material";
	if (chess.isDrawByFiftyMoves()) return "Draw by fifty-move rule";
	if (chess.isDraw()) return "Draw";
	if (chess.inCheck()) return chess.turn() === "w" ? "White is in check" : "Black is in check";
	return null;
}
function pieceSrc(color, type) {
	return `/pieces/${color}${type.toUpperCase()}.svg`;
}
function cpValue(score) {
	if (score.type === "mate") {
		if (score.value === 0) return 0;
		return score.value > 0 ? 1e5 - score.value * 100 : -1e5 - score.value * 100;
	}
	return score.value;
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function moverCp(score) {
	return cpValue(score);
}
function classifyMove(best, played, opts) {
	if (opts.book && !opts.sacrifice) return "book";
	if (!best || !played) return "good";
	const loss = moverCp(best) - moverCp(played);
	const playedWinning = played.type === "mate" && played.value > 0 || played.type === "cp" && played.value >= 80;
	if (opts.sacrifice && loss <= 30 && playedWinning) return "brilliant";
	if (opts.onlyMove && loss <= 25) return "great";
	if (loss <= 8) return "best";
	if (loss <= 25) return "excellent";
	if (loss <= 55) return "good";
	if (loss <= 110) return "inaccuracy";
	if (loss <= 280) return "mistake";
	return "blunder";
}
function detectSacrifice(fen, uci) {
	const chess = new Chess(fen);
	const { from, to, promotion } = uciParts(uci);
	const piece = chess.get(from);
	if (!piece) return {
		pawns: 0,
		hanging: false
	};
	const captured = chess.get(to);
	const give = PIECE_VAL[piece.type] - (captured ? PIECE_VAL[captured.type] : 0);
	try {
		chess.move({
			from,
			to,
			promotion
		});
	} catch {
		return {
			pawns: 0,
			hanging: false
		};
	}
	const hanging = destAttacked(chess, to, opposite(piece.color));
	return {
		pawns: give > 0 && hanging ? give : give >= 3 ? give : 0,
		hanging: hanging && give > 0
	};
}
function pickBrilliant(fen, lines) {
	if (lines.length === 0) return null;
	const best = lines[0];
	const bestCp = moverCp(best.score);
	let winner = null;
	for (const line of lines) {
		const uci = line.pv[0];
		if (!uci) continue;
		const gap = bestCp - moverCp(line.score);
		if (gap > 90 && !(line.score.type === "mate" && line.score.value > 0)) continue;
		const sac = detectSacrifice(fen, uci);
		const chess = new Chess(fen);
		let check = false;
		let replies = 30;
		try {
			const mv = chess.move(uciParts(uci));
			check = Boolean(mv?.san.includes("+") || mv?.san.includes("#"));
			replies = chess.moves().length;
		} catch {
			continue;
		}
		const mate = line.score.type === "mate" && line.score.value > 0;
		let pts = 0;
		let reason = "Best engine continuation";
		if (mate) {
			pts += 900 - line.score.value * 12;
			reason = line.score.value <= 2 ? "Forces checkmate" : `Mate in ${line.score.value}`;
		}
		if (sac.pawns >= 1) {
			pts += 70 + sac.pawns * 45;
			reason = mate ? "Sacrificial mate" : sac.pawns >= 5 ? "Queen sacrifice that holds" : "Material offer that keeps the attack";
		}
		if (check) pts += 28;
		if (replies <= 3) {
			pts += 40;
			if (!sac.pawns) reason = "Forcing — few legal replies";
		}
		if (gap <= 25) pts += 18;
		else pts -= gap * .4;
		if (!winner || pts > winner.score) winner = {
			line,
			score: pts,
			sac: sac.pawns,
			reason
		};
	}
	if (!winner) {
		const line = best;
		const uci = line.pv[0];
		if (!uci) return null;
		return {
			uci,
			san: line.san[0] ?? uci,
			reason: "Best engine continuation",
			pvSan: line.san,
			score: line.score,
			sacrifice: false,
			mate: line.score.type === "mate" && line.score.value > 0
		};
	}
	const line = winner.line;
	const uci = line.pv[0];
	const brilliantish = winner.sac >= 1 || line.score.type === "mate" && line.score.value > 0;
	return {
		uci,
		san: line.san[0] ?? uci,
		reason: winner.reason,
		pvSan: line.san,
		score: line.score,
		sacrifice: winner.sac >= 1,
		mate: line.score.type === "mate" && line.score.value > 0 && brilliantish ? true : line.score.type === "mate" && line.score.value > 0
	};
}
function classifyFromLines(fen, playedUci, lines, book) {
	if (lines.length === 0) return book ? "book" : "good";
	const best = lines[0];
	const match = lines.find((l) => l.pv[0] === playedUci);
	const sac = detectSacrifice(fen, playedUci).pawns >= 1;
	const onlyMove = lines.length > 1 && moverCp(best.score) - moverCp(lines[1].score) >= 140;
	const played = match?.score ?? null;
	return classifyMove(best.score, played, {
		sacrifice: sac,
		book,
		onlyMove
	});
}
var BOOK = [
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
	["Nc3", "Van Geet"]
];
function openingName(sans) {
	if (sans.length === 0) return "Starting position";
	const key = sans.join(" ");
	let best = null;
	let bestLen = 0;
	for (const [seq, name] of BOOK) if (key === seq || key.startsWith(seq + " ")) {
		if (seq.length >= bestLen) {
			best = name;
			bestLen = seq.length;
		}
	}
	return best;
}
function isBookMove(sans) {
	if (sans.length === 0 || sans.length > 10) return false;
	return openingName(sans) !== null;
}
var KEY = "brilliance.v1";
var persistDefaults = {
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
	showCoords: true
};
function loadPersist() {
	if (typeof window === "undefined") return persistDefaults;
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return persistDefaults;
		const parsed = JSON.parse(raw);
		if (parsed.version !== 1) return persistDefaults;
		return {
			...persistDefaults,
			...parsed,
			version: 1
		};
	} catch {
		return persistDefaults;
	}
}
function savePersist(data) {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(KEY, JSON.stringify(data));
	} catch {}
}
var ctx = null;
function audio() {
	if (typeof window === "undefined") return null;
	if (!ctx) {
		const Ctor = window.AudioContext || window.webkitAudioContext;
		if (!Ctor) return null;
		ctx = new Ctor();
	}
	return ctx;
}
function resumeAudio() {
	audio()?.resume();
}
function tone(freq, duration, gain = .04, type = "sine") {
	const ac = audio();
	if (!ac) return;
	const osc = ac.createOscillator();
	const g = ac.createGain();
	osc.type = type;
	osc.frequency.value = freq;
	g.gain.value = gain;
	g.gain.exponentialRampToValueAtTime(1e-4, ac.currentTime + duration);
	osc.connect(g);
	g.connect(ac.destination);
	osc.start();
	osc.stop(ac.currentTime + duration);
}
function playMoveSound(kind) {
	resumeAudio();
	if (kind === "capture") {
		tone(220, .09, .05, "triangle");
		tone(140, .12, .03, "square");
		return;
	}
	if (kind === "check") {
		tone(520, .08, .04);
		tone(780, .12, .03);
		return;
	}
	if (kind === "brilliant") {
		tone(523, .1, .04);
		window.setTimeout(() => tone(659, .1, .04), 80);
		window.setTimeout(() => tone(784, .16, .035), 160);
		return;
	}
	if (kind === "gameover") {
		tone(392, .18, .045);
		window.setTimeout(() => tone(262, .28, .04), 140);
		return;
	}
	tone(410, .06, .035, "sine");
}
var STUDIES = [
	{
		id: "opera",
		title: "The Opera Game",
		source: "Morphy vs. Duke of Brunswick, 1858",
		fen: "r3kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w kq - 1 16",
		solution: "b3b8",
		idea: "Queen to b8. The knight must recapture, then Rd8 is mate — a forced sacrificial finish."
	},
	{
		id: "legal",
		title: "Legal’s Mate",
		source: "Sire de Légal, 1750",
		fen: "r2qkbnr/ppp2ppp/2np4/4p3/2B1P1b1/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5",
		solution: "f3e5",
		idea: "Leave the queen hanging with Nxe5. If the bishop takes on d1, Bxf7+ and Nd5 mate."
	},
	{
		id: "greek",
		title: "Greek Gift",
		source: "Classic attacking pattern",
		fen: "rnbq1rk1/pppn1ppp/4p3/3pP3/1b1P4/2NB1N2/PPP2PPP/R1BQK2R w KQ - 5 7",
		solution: "d3h7",
		idea: "Bishop takes on h7. The king is dragged out, then Ng5 and the queen join a forcing hunt."
	},
	{
		id: "smother",
		title: "Smothered Mate",
		source: "Philidor pattern",
		fen: "r3r2k/6pp/3N4/8/8/8/5QPP/6K1 w - - 0 1",
		solution: "f2f8",
		idea: "Queen to f8. The rook is forced to recapture, then Nf7 is smothered mate."
	},
	{
		id: "fried",
		title: "Fried Liver",
		source: "Polerio / Greco, Two Knights",
		fen: "r1bqkb1r/ppp2ppp/2n5/3np1N1/2B5/8/PPPP1PPP/RNBQK2R w KQkq - 0 6",
		solution: "g5f7",
		idea: "Knight takes on f7. The king is forced into the center and a cascade of checks follows."
	},
	{
		id: "arabian",
		title: "Arabian Mate",
		source: "Ancient mating pattern",
		fen: "7k/6p1/5N2/7R/8/8/8/6K1 w - - 0 1",
		solution: "h5h7",
		idea: "Rook to h7. The knight covers the rook and g8; the pawn on g7 boxes the king in."
	}
];
function chessAt(startFen, plies, cursor) {
	const c = new Chess(startFen === "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" || !startFen ? void 0 : startFen);
	for (let i = 0; i < cursor; i++) {
		const p = plies[i];
		c.move({
			from: p.from,
			to: p.to,
			promotion: p.promotion
		});
	}
	return c;
}
function destsFor(chess, sq) {
	return chess.moves({
		square: sq,
		verbose: true
	}).map((m) => m.to);
}
function lastFromPlies(plies, cursor) {
	if (cursor <= 0) return null;
	const p = plies[cursor - 1];
	return {
		from: p.from,
		to: p.to
	};
}
var initial = {
	startFen: DEFAULT_POSITION,
	plies: [],
	cursor: 0,
	orientation: "w",
	mode: "play",
	playerColor: "w",
	selected: null,
	dests: [],
	pendingPromotion: null,
	engineOn: true,
	engineReady: false,
	thinking: false,
	lines: [],
	evalScore: null,
	brilliant: null,
	movetime: 350,
	showCoords: true,
	sound: true,
	lastMove: null,
	opening: "Starting position",
	studyId: null,
	studySolved: false,
	studyMiss: false,
	importOpen: false,
	hoverDest: null,
	dragging: null
};
var useGame = create((set, get) => ({
	...initial,
	hydrate: () => {
		const saved = loadPersist();
		if (!saved.pgn && !saved.startFen) {
			set({
				movetime: saved.movetime,
				sound: saved.sound,
				showCoords: saved.showCoords,
				engineOn: saved.engineOn
			});
			return;
		}
		try {
			const chess = new Chess(saved.startFen || void 0);
			if (saved.pgn) chess.loadPgn(saved.pgn);
			const verbose = chess.history({ verbose: true });
			const startFen = saved.startFen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
			const rebuilt = new Chess(startFen === "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" ? void 0 : startFen);
			const plies = verbose.map((m) => {
				rebuilt.move({
					from: m.from,
					to: m.to,
					promotion: m.promotion
				});
				return {
					san: m.san,
					from: m.from,
					to: m.to,
					promotion: m.promotion,
					uci: toUci(m.from, m.to, m.promotion),
					fenAfter: rebuilt.fen()
				};
			});
			const cursor = Math.min(saved.cursor, plies.length);
			set({
				startFen,
				plies,
				cursor,
				orientation: saved.orientation,
				playerColor: saved.playerColor,
				mode: saved.mode === "study" ? "analyze" : saved.mode,
				engineOn: saved.engineOn,
				movetime: saved.movetime,
				sound: saved.sound,
				showCoords: saved.showCoords,
				lastMove: lastFromPlies(plies, cursor),
				opening: openingName(plies.slice(0, cursor).map((p) => p.san)),
				selected: null,
				dests: []
			});
		} catch {
			set({
				movetime: saved.movetime,
				sound: saved.sound,
				showCoords: saved.showCoords
			});
		}
	},
	persistNow: () => {
		const s = get();
		savePersist({
			version: 1,
			pgn: s.pgn(),
			startFen: s.startFen === "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" ? "" : s.startFen,
			cursor: s.cursor,
			orientation: s.orientation,
			playerColor: s.playerColor,
			mode: s.mode,
			engineOn: s.engineOn,
			movetime: s.movetime,
			sound: s.sound,
			showCoords: s.showCoords
		});
	},
	chess: () => chessAt(get().startFen, get().plies, get().cursor),
	fen: () => get().chess().fen(),
	turn: () => get().chess().turn(),
	pgn: () => {
		const s = get();
		return chessAt(s.startFen, s.plies, s.plies.length).pgn();
	},
	canMove: (color) => {
		const s = get();
		const chess = s.chess();
		if (chess.isGameOver()) return false;
		if (chess.turn() !== color) return false;
		if (s.mode === "analyze" || s.mode === "study") return true;
		return color === s.playerColor;
	},
	newGame: (opts = {}) => {
		const color = opts.color ?? "w";
		const mode = opts.mode ?? "play";
		set({
			startFen: opts.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
			plies: [],
			cursor: 0,
			orientation: color,
			playerColor: color,
			mode,
			selected: null,
			dests: [],
			pendingPromotion: null,
			lines: [],
			evalScore: null,
			brilliant: null,
			lastMove: null,
			opening: "Starting position",
			studyId: null,
			studySolved: false,
			studyMiss: false,
			hoverDest: null,
			dragging: null
		});
		get().persistNow();
	},
	loadPgn: (pgn) => {
		try {
			const chess = new Chess();
			chess.loadPgn(pgn);
			const verbose = chess.history({ verbose: true });
			const rebuilt = new Chess();
			const plies = verbose.map((m) => {
				rebuilt.move({
					from: m.from,
					to: m.to,
					promotion: m.promotion
				});
				return {
					san: m.san,
					from: m.from,
					to: m.to,
					promotion: m.promotion,
					uci: toUci(m.from, m.to, m.promotion),
					fenAfter: rebuilt.fen()
				};
			});
			set({
				startFen: DEFAULT_POSITION,
				plies,
				cursor: plies.length,
				mode: "analyze",
				selected: null,
				dests: [],
				pendingPromotion: null,
				lastMove: lastFromPlies(plies, plies.length),
				opening: openingName(plies.map((p) => p.san)),
				studyId: null,
				importOpen: false
			});
			get().persistNow();
			return null;
		} catch (err) {
			return err instanceof Error ? err.message : "Could not parse PGN";
		}
	},
	loadFen: (fen) => {
		try {
			set({
				startFen: new Chess(fen).fen(),
				plies: [],
				cursor: 0,
				mode: "analyze",
				selected: null,
				dests: [],
				lastMove: null,
				opening: "Custom position",
				studyId: null,
				importOpen: false
			});
			get().persistNow();
			return null;
		} catch (err) {
			return err instanceof Error ? err.message : "Invalid FEN";
		}
	},
	loadStudy: (id) => {
		const study = STUDIES.find((s) => s.id === id);
		if (!study) return;
		const chess = new Chess(study.fen);
		set({
			startFen: chess.fen(),
			plies: [],
			cursor: 0,
			mode: "study",
			orientation: chess.turn(),
			playerColor: chess.turn(),
			selected: null,
			dests: [],
			lastMove: null,
			opening: study.title,
			studyId: id,
			studySolved: false,
			studyMiss: false,
			engineOn: true
		});
	},
	selectSquare: (sq) => {
		const s = get();
		const chess = s.chess();
		const piece = chess.get(sq);
		if (s.pendingPromotion) return;
		if (s.selected && s.dests.includes(sq)) {
			get().tryMove(s.selected, sq);
			return;
		}
		if (piece && get().canMove(piece.color) && piece.color === chess.turn()) {
			set({
				selected: sq,
				dests: destsFor(chess, sq)
			});
			return;
		}
		set({
			selected: null,
			dests: []
		});
	},
	tryMove: (from, to, promotion) => {
		const s = get();
		const chess = s.chess();
		const piece = chess.get(from);
		if (!piece || !get().canMove(piece.color)) return false;
		const legal = chess.moves({
			square: from,
			verbose: true
		}).find((m) => m.to === to);
		if (!legal) {
			set({
				selected: null,
				dests: []
			});
			return false;
		}
		if (legal.promotion && !promotion) {
			set({
				pendingPromotion: {
					from,
					to
				},
				selected: from,
				dests: [to]
			});
			return true;
		}
		const beforeFen = chess.fen();
		let moved;
		try {
			moved = chess.move({
				from,
				to,
				promotion
			});
		} catch {
			return false;
		}
		if (!moved) return false;
		const ply = {
			san: moved.san,
			from: moved.from,
			to: moved.to,
			promotion: moved.promotion,
			uci: toUci(moved.from, moved.to, moved.promotion),
			fenAfter: chess.fen()
		};
		const sans = [...s.plies.slice(0, s.cursor).map((p) => p.san), ply.san];
		if (s.lines.length) ply.classification = classifyFromLines(beforeFen, ply.uci, s.lines, isBookMove(sans));
		else if (isBookMove(sans)) ply.classification = "book";
		let studySolved = s.studySolved;
		let studyMiss = s.studyMiss;
		if (s.mode === "study" && s.studyId && s.cursor === 0 && s.plies.length === 0) {
			const study = STUDIES.find((st) => st.id === s.studyId);
			if (study) {
				if (ply.uci === study.solution || ply.uci.startsWith(study.solution)) {
					studySolved = true;
					ply.classification = "brilliant";
				} else studyMiss = true;
			}
		}
		if (s.sound) {
			resumeAudio();
			const over = chess.isGameOver();
			playMoveSound(ply.classification === "brilliant" ? "brilliant" : over ? "gameover" : chess.inCheck() ? "check" : moved.isCapture() ? "capture" : "move");
		}
		set({
			plies: [...s.plies.slice(0, s.cursor), ply],
			cursor: s.cursor + 1,
			selected: null,
			dests: [],
			pendingPromotion: null,
			lastMove: {
				from: moved.from,
				to: moved.to
			},
			opening: openingName(sans),
			studySolved,
			studyMiss,
			dragging: null,
			hoverDest: null
		});
		get().persistNow();
		return true;
	},
	choosePromotion: (piece) => {
		const pending = get().pendingPromotion;
		if (!pending) return;
		get().tryMove(pending.from, pending.to, piece);
	},
	cancelPromotion: () => set({
		pendingPromotion: null,
		selected: null,
		dests: []
	}),
	goto: (cursor) => {
		const s = get();
		const next = Math.max(0, Math.min(cursor, s.plies.length));
		set({
			cursor: next,
			selected: null,
			dests: [],
			lastMove: lastFromPlies(s.plies, next),
			pendingPromotion: null
		});
		get().persistNow();
	},
	flip: () => set({ orientation: get().orientation === "w" ? "b" : "w" }),
	takeback: () => {
		const s = get();
		const n = s.mode === "play" ? 2 : 1;
		get().goto(Math.max(0, s.cursor - n));
	},
	playHint: () => {
		const hint = get().brilliant;
		if (!hint) return;
		const { from, to, promotion } = uciParts(hint.uci);
		get().tryMove(from, to, promotion);
	},
	setMode: (mode) => set({ mode }),
	setEngineOn: (engineOn) => set({ engineOn }),
	setMovetime: (movetime) => set({ movetime }),
	setSound: (sound) => set({ sound }),
	setShowCoords: (showCoords) => set({ showCoords }),
	setEngineReady: (engineReady) => set({ engineReady }),
	setThinking: (thinking) => set({ thinking }),
	setImportOpen: (importOpen) => set({ importOpen }),
	setHoverDest: (hoverDest) => set({ hoverDest }),
	setDragging: (dragging) => set({ dragging }),
	applyAnalysis: (result, fen) => {
		if (get().fen() !== fen) return;
		const turn = get().chess().turn();
		const lines = result.lines;
		const best = lines[0];
		const evalScore = best ? turn === "w" ? best.score : {
			type: best.score.type,
			value: -best.score.value
		} : null;
		const brilliant = pickBrilliant(fen, lines);
		const plies = get().plies.slice();
		const idx = get().cursor - 1;
		if (idx >= 0 && plies[idx]) plies[idx] = {
			...plies[idx],
			evalAfter: evalScore ?? void 0
		};
		set({
			lines,
			evalScore,
			brilliant,
			thinking: false,
			plies
		});
	}
}));
function usePosition() {
	const startFen = useGame((s) => s.startFen);
	const cursor = useGame((s) => s.cursor);
	const key = useGame((s) => s.plies.map((p) => p.uci).join(" "));
	return (0, import_react.useMemo)(() => chessAt(startFen, useGame.getState().plies, cursor), [
		startFen,
		cursor,
		key
	]);
}
var PROMO = [
	"q",
	"n",
	"r",
	"b"
];
function displayGrid(orientation) {
	const squares = [];
	const ranks = orientation === "w" ? [
		8,
		7,
		6,
		5,
		4,
		3,
		2,
		1
	] : [
		1,
		2,
		3,
		4,
		5,
		6,
		7,
		8
	];
	const files = orientation === "w" ? FILES : [...FILES].reverse().join("");
	for (const r of ranks) for (const f of files) squares.push(`${f}${r}`);
	return squares;
}
function isLight(sq) {
	return (sq.charCodeAt(0) - 97 + (Number(sq[1]) - 1)) % 2 === 1;
}
function squareCenter(sq, orientation) {
	const file = sq.charCodeAt(0) - 97;
	const rank = Number(sq[1]) - 1;
	const x = orientation === "w" ? file : 7 - file;
	const y = orientation === "w" ? 7 - rank : rank;
	return {
		x: (x + .5) / 8,
		y: (y + .5) / 8
	};
}
function ChessBoard() {
	const orientation = useGame((s) => s.orientation);
	const selected = useGame((s) => s.selected);
	const dests = useGame((s) => s.dests);
	const lastMove = useGame((s) => s.lastMove);
	const brilliant = useGame((s) => s.brilliant);
	const lines = useGame((s) => s.lines);
	const showCoords = useGame((s) => s.showCoords);
	const pending = useGame((s) => s.pendingPromotion);
	const dragging = useGame((s) => s.dragging);
	const hoverDest = useGame((s) => s.hoverDest);
	const chess = usePosition();
	const boardRef = (0, import_react.useRef)(null);
	const [ghost, setGhost] = (0, import_react.useState)(null);
	const checkSq = chess.inCheck() ? kingSquare(chess, chess.turn()) : null;
	const squares = displayGrid(orientation);
	const turn = chess.turn();
	const sqFromPoint = (0, import_react.useCallback)((clientX, clientY) => {
		const el = boardRef.current;
		if (!el) return null;
		const rect = el.getBoundingClientRect();
		const px = (clientX - rect.left) / rect.width;
		const py = (clientY - rect.top) / rect.height;
		if (px < 0 || py < 0 || px >= 1 || py >= 1) return null;
		const col = Math.min(7, Math.floor(px * 8));
		const row = Math.min(7, Math.floor(py * 8));
		const file = orientation === "w" ? col : 7 - col;
		const rank = orientation === "w" ? 7 - row : row;
		return `${FILES[file]}${rank + 1}`;
	}, [orientation]);
	const onPointerDown = (e, sq) => {
		const piece = chess.get(sq);
		useGame.getState().selectSquare(sq);
		if (!piece) return;
		if (!useGame.getState().canMove(piece.color)) return;
		useGame.getState().setDragging(sq);
		setGhost({
			x: e.clientX,
			y: e.clientY,
			src: pieceSrc(piece.color, piece.type)
		});
	};
	(0, import_react.useEffect)(() => {
		if (!dragging) return;
		const onMove = (e) => {
			setGhost((g) => g ? {
				...g,
				x: e.clientX,
				y: e.clientY
			} : g);
			useGame.getState().setHoverDest(sqFromPoint(e.clientX, e.clientY));
		};
		const onUp = (e) => {
			const dest = sqFromPoint(e.clientX, e.clientY);
			const from = useGame.getState().dragging;
			useGame.getState().setDragging(null);
			setGhost(null);
			useGame.getState().setHoverDest(null);
			if (from && dest && dest !== from) useGame.getState().tryMove(from, dest);
		};
		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
		return () => {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
		};
	}, [dragging, sqFromPoint]);
	const arrowMoves = [];
	if (brilliant) {
		const p = uciParts(brilliant.uci);
		arrowMoves.push({
			from: p.from,
			to: p.to,
			kind: brilliant.sacrifice || brilliant.mate ? "brilliant" : "best"
		});
	} else if (lines[0]?.pv[0]) {
		const p = uciParts(lines[0].pv[0]);
		arrowMoves.push({
			from: p.from,
			to: p.to,
			kind: "best"
		});
	}
	const promoColor = pending ? chess.get(pending.from)?.color ?? turn : turn;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative w-full",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			ref: boardRef,
			role: "grid",
			"aria-label": "Chessboard",
			onPointerCancel: () => {
				useGame.getState().setDragging(null);
				setGhost(null);
			},
			className: "relative aspect-square w-full overflow-hidden rounded-[var(--radius-lg)] shadow-[0_0_0_1px_rgba(236,234,228,0.08)] select-none touch-none",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid h-full w-full grid-cols-8 grid-rows-8",
					children: squares.map((sq) => {
						const piece = chess.get(sq);
						const light = isLight(sq);
						const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq);
						const isSel = selected === sq;
						const isDest = dests.includes(sq);
						const isHover = hoverDest === sq && dragging;
						const file = sq[0];
						const rank = sq[1];
						const showFile = showCoords && (orientation === "w" ? rank === "1" : rank === "8");
						const showRank = showCoords && (orientation === "w" ? file === "a" : file === "h");
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "gridcell",
							"aria-label": sq,
							onPointerDown: (e) => onPointerDown(e, sq),
							className: cn("relative flex items-center justify-center", light ? "bg-board-light" : "bg-board-dark", isLast && "after:absolute after:inset-0 after:bg-board-last/45 after:content-['']", isSel && "after:absolute after:inset-0 after:bg-board-select/55 after:content-['']", isHover && "ring-inset ring-2 ring-brilliant", checkSq === sq && "after:absolute after:inset-0 after:bg-check/40 after:content-['']"),
							children: [
								showFile && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: cn("absolute right-1 bottom-0.5 text-[10px] font-medium", light ? "text-board-dark/70" : "text-board-light/80"),
									children: file
								}),
								showRank && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: cn("absolute top-0.5 left-1 text-[10px] font-medium", light ? "text-board-dark/70" : "text-board-light/80"),
									children: rank
								}),
								isDest && !piece && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "relative z-10 size-[22%] rounded-full bg-accent-fg/25" }),
								isDest && piece && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-[6%] z-10 rounded-full border-[3px] border-accent-fg/35" }),
								piece && dragging !== sq && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: pieceSrc(piece.color, piece.type),
									alt: "",
									draggable: false,
									className: "relative z-10 h-[86%] w-[86%] object-contain"
								})
							]
						}, sq);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
					className: "pointer-events-none absolute inset-0 z-20 h-full w-full",
					viewBox: "0 0 1 1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("defs", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("marker", {
						id: "arrow-best",
						markerWidth: "7",
						markerHeight: "7",
						refX: "5",
						refY: "3.5",
						orient: "auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
							points: "0 0, 7 3.5, 0 7",
							className: "fill-great"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("marker", {
						id: "arrow-brilliant",
						markerWidth: "7",
						markerHeight: "7",
						refX: "5",
						refY: "3.5",
						orient: "auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
							points: "0 0, 7 3.5, 0 7",
							className: "fill-brilliant"
						})
					})] }), arrowMoves.map((a) => {
						const s = squareCenter(a.from, orientation);
						const t = squareCenter(a.to, orientation);
						const dx = t.x - s.x;
						const dy = t.y - s.y;
						const len = Math.hypot(dx, dy) || 1;
						const shrink = .07;
						const x2 = t.x - dx / len * shrink;
						const y2 = t.y - dy / len * shrink;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
							x1: s.x,
							y1: s.y,
							x2,
							y2,
							strokeWidth: .028,
							strokeLinecap: "round",
							className: a.kind === "brilliant" ? "stroke-brilliant/85" : "stroke-great/70",
							markerEnd: a.kind === "brilliant" ? "url(#arrow-brilliant)" : "url(#arrow-best)"
						}, `${a.from}${a.to}${a.kind}`);
					})]
				}),
				pending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 z-30 flex items-center justify-center bg-bg/45",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-1 rounded-[var(--radius-md)] bg-surface p-1.5 shadow-lg",
						children: PROMO.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "size-14 rounded-[var(--radius-sm)] bg-surface-2 hover:bg-board-select/40",
							onClick: () => useGame.getState().choosePromotion(p),
							"aria-label": `Promote to ${p}`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: pieceSrc(promoColor, p),
								alt: "",
								className: "h-full w-full p-1"
							})
						}, p))
					})
				})
			]
		}), ghost && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: ghost.src,
			alt: "",
			className: "pointer-events-none fixed z-50 size-16 -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-lg",
			style: {
				left: ghost.x,
				top: ghost.y
			}
		})]
	});
}
function EvalBar({ orientation, horizontal }) {
	const score = useGame((s) => s.evalScore);
	const thinking = useGame((s) => s.thinking);
	const pct = evalToWhitePct(score);
	const whiteFrac = orientation === "w" ? pct : 1 - pct;
	const label = formatScore(score);
	if (horizontal) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative h-7 w-full overflow-hidden rounded-[var(--radius-sm)] bg-eval-b",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-y-0 left-0 bg-eval-w transition-[width] duration-300",
			style: { width: `${pct * 100}%` }
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cn("relative z-10 flex h-full items-center justify-center font-mono text-[11px] tabular-nums", pct > .5 ? "text-accent-fg" : "text-fg", thinking && "opacity-70"),
			children: label
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative h-full w-7 overflow-hidden rounded-[var(--radius-sm)] bg-eval-b",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-x-0 bottom-0 bg-eval-w transition-[height] duration-300",
			style: { height: `${whiteFrac * 100}%` }
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cn("relative z-10 flex h-full items-center justify-center font-mono text-[10px] tabular-nums", "rotate-180 [writing-mode:vertical-rl]", whiteFrac > .45 ? "text-accent-fg" : "text-fg"),
			children: label
		})]
	});
}
var badgeVariants = cva("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase", {
	variants: { tone: {
		brilliant: "bg-brilliant/15 text-brilliant",
		great: "bg-great/15 text-great",
		best: "bg-accent/12 text-accent",
		excellent: "bg-good/15 text-good",
		good: "bg-good/12 text-muted",
		book: "bg-surface-2 text-muted",
		inaccuracy: "bg-inacc/15 text-inacc",
		mistake: "bg-mistake/15 text-mistake",
		blunder: "bg-blunder/18 text-blunder",
		muted: "bg-surface-2 text-muted"
	} },
	defaultVariants: { tone: "muted" }
});
function Badge({ className, tone, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(badgeVariants({ tone }), className),
		...props
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] text-sm font-medium transition-[opacity,background-color,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]", {
	variants: {
		variant: {
			default: "bg-accent text-accent-fg hover:bg-accent/90",
			secondary: "bg-surface-2 text-fg hover:bg-surface-2/80",
			ghost: "text-fg hover:bg-surface-2",
			outline: "border border-border bg-transparent text-fg hover:bg-surface-2",
			brilliant: "bg-brilliant text-fg hover:bg-brilliant/90"
		},
		size: {
			default: "h-11 px-4",
			sm: "h-9 px-3 text-xs",
			lg: "h-12 px-5",
			icon: "size-11",
			"icon-sm": "size-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
var Dialog = Dialog$1;
var DialogPortal = DialogPortal$1;
function DialogOverlay({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
		className: cn("fixed inset-0 z-50 bg-bg/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
		...props
	});
}
function DialogContent({ className, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
		className: cn("fixed top-1/2 left-1/2 z-50 w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-xl focus:outline-none", className),
		...props,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
			className: "absolute top-3 right-3 rounded-[var(--radius-sm)] p-2 text-muted hover:bg-surface-2 hover:text-fg",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "sr-only",
				children: "Close"
			})]
		})]
	})] });
}
function DialogHeader({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("mb-4 pr-8", className),
		...props
	});
}
function DialogTitle({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
		className: cn("font-display text-xl font-medium tracking-tight", className),
		...props
	});
}
function DialogDescription({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
		className: cn("mt-1 text-sm text-muted", className),
		...props
	});
}
function ScrollArea({ className, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Root, {
		className: cn("overflow-hidden", className),
		...props,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Viewport, {
			className: "h-full w-full",
			children
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scrollbar, {
			orientation: "vertical",
			className: "flex w-2 touch-none bg-transparent p-0.5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Thumb, { className: "relative flex-1 rounded-full bg-border" })
		})]
	});
}
function Slider({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Slider$1, {
		className: cn("relative flex h-11 w-full touch-none items-center", className),
		...props,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderTrack, {
			className: "relative h-1.5 w-full grow rounded-full bg-surface-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRange, { className: "absolute h-full rounded-full bg-accent" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderThumb, { className: "block size-4 rounded-full bg-accent shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40" })]
	});
}
function Textarea({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("min-h-32 w-full rounded-[var(--radius-md)] border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-fg placeholder:text-subtle outline-none focus-visible:ring-2 focus-visible:ring-accent/40", className),
		...props
	});
}
var CLASS_LABEL = {
	brilliant: "Brilliant",
	great: "Great",
	best: "Best",
	excellent: "Excellent",
	good: "Good",
	book: "Book",
	inaccuracy: "Inaccuracy",
	mistake: "Mistake",
	blunder: "Blunder"
};
function GameToolbar() {
	const cursor = useGame((s) => s.cursor);
	const len = useGame((s) => s.plies.length);
	const sound = useGame((s) => s.sound);
	const engineOn = useGame((s) => s.engineOn);
	const thinking = useGame((s) => s.thinking);
	const brilliant = useGame((s) => s.brilliant);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-center gap-1.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon-sm",
				"aria-label": "Start",
				onClick: () => useGame.getState().goto(0),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronsLeft, { className: "size-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon-sm",
				"aria-label": "Back",
				disabled: cursor <= 0,
				onClick: () => useGame.getState().goto(cursor - 1),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon-sm",
				"aria-label": "Forward",
				disabled: cursor >= len,
				onClick: () => useGame.getState().goto(cursor + 1),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon-sm",
				"aria-label": "End",
				onClick: () => useGame.getState().goto(len),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronsRight, { className: "size-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon-sm",
				"aria-label": "Take back",
				onClick: () => useGame.getState().takeback(),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon-sm",
				"aria-label": "Flip board",
				onClick: () => useGame.getState().flip(),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlipVertical2, { className: "size-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon-sm",
				"aria-label": sound ? "Mute" : "Unmute",
				onClick: () => useGame.getState().setSound(!sound),
				children: sound ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ml-auto flex items-center gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					size: "sm",
					disabled: !brilliant || thinking,
					onClick: () => useGame.getState().playHint(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbulb, { className: "size-3.5" }), "Play line"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: engineOn ? "secondary" : "outline",
					size: "sm",
					onClick: () => useGame.getState().setEngineOn(!engineOn),
					children: engineOn ? "Engine on" : "Engine off"
				})]
			})
		]
	});
}
function CapturedRow() {
	const missing = capturedPieces(usePosition());
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between gap-3 text-xs text-muted",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex min-h-6 flex-wrap items-center gap-0.5",
			children: missing.b.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: pieceSrc("b", t),
				alt: "",
				className: "h-5 w-5 opacity-80"
			}, `b${t}${i}`))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex min-h-6 flex-wrap items-center justify-end gap-0.5",
			children: missing.w.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: pieceSrc("w", t),
				alt: "",
				className: "h-5 w-5 opacity-80"
			}, `w${t}${i}`))
		})]
	});
}
function MoveList() {
	const plies = useGame((s) => s.plies);
	const cursor = useGame((s) => s.cursor);
	const pairs = [];
	for (let i = 0; i < plies.length; i += 2) pairs.push({
		n: i / 2 + 1,
		w: plies[i],
		b: plies[i + 1],
		wi: i + 1,
		bi: plies[i + 1] ? i + 2 : void 0
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollArea, {
		className: "h-48 lg:h-56",
		children: plies.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "px-1 py-6 text-center text-sm text-muted",
			children: "No moves yet. Play, or load a study."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "flex flex-col gap-0.5 pr-2",
			children: pairs.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "grid grid-cols-[2rem_1fr_1fr] items-center gap-1 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-mono text-xs text-subtle tabular-nums",
						children: [row.n, "."]
					}),
					row.w && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoveBtn, {
						active: cursor === row.wi,
						san: row.w.san,
						cls: row.w.classification,
						onClick: () => useGame.getState().goto(row.wi)
					}),
					row.b && row.bi !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoveBtn, {
						active: cursor === row.bi,
						san: row.b.san,
						cls: row.b.classification,
						onClick: () => useGame.getState().goto(row.bi)
					})
				]
			}, row.n))
		})
	});
}
function MoveBtn({ san, cls, active, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: cn("flex h-8 items-center justify-between rounded-[var(--radius-xs)] px-2 text-left font-medium", active ? "bg-surface-2 text-fg" : "text-fg/90 hover:bg-surface-2/60"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: san }), cls && cls !== "good" && cls !== "book" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("ml-1 size-1.5 rounded-full", cls === "brilliant" && "bg-brilliant", cls === "great" && "bg-great", cls === "best" && "bg-accent", cls === "excellent" && "bg-good", cls === "inaccuracy" && "bg-inacc", cls === "mistake" && "bg-mistake", cls === "blunder" && "bg-blunder") })]
	});
}
function EnginePanel() {
	const ready = useGame((s) => s.engineReady);
	const thinking = useGame((s) => s.thinking);
	const lines = useGame((s) => s.lines);
	const brilliant = useGame((s) => s.brilliant);
	const evalScore = useGame((s) => s.evalScore);
	const movetime = useGame((s) => s.movetime);
	const opening = useGame((s) => s.opening);
	const chess = usePosition();
	const status = statusText(chess);
	const turn = chess.turn();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-[var(--radius-lg)] border border-border bg-surface p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] font-medium tracking-wide text-subtle uppercase",
							children: "Opening"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 font-display text-lg leading-snug",
							children: opening ?? "—"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] font-medium tracking-wide text-subtle uppercase",
								children: "Eval"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-0.5 font-mono text-lg tabular-nums",
								children: formatScore(evalScore)
							})]
						})]
					}),
					status && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-brilliant",
						children: status
					}),
					!ready && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "Waking Stockfish…"
					}),
					ready && thinking && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "Searching forcing lines…"
					})
				]
			}),
			brilliant && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-[var(--radius-lg)] border border-brilliant/30 bg-brilliant/10 p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: brilliant.sacrifice || brilliant.mate ? "brilliant" : "best",
							children: brilliant.sacrifice || brilliant.mate ? "Brilliant line" : "Best line"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-sm tabular-nums",
							children: brilliant.san
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-fg/90",
						children: brilliant.reason
					}),
					brilliant.pvSan.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 font-mono text-xs leading-relaxed text-muted",
						children: brilliant.pvSan.slice(0, 10).join(" ")
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-[var(--radius-lg)] border border-border bg-surface p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-2 text-[11px] font-medium tracking-wide text-subtle uppercase",
						children: "Engine lines"
					}),
					lines.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: ready ? "No lines yet." : "Engine loading."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "flex flex-col gap-2",
						children: lines.slice(0, 4).map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex gap-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "w-10 shrink-0 font-mono text-xs tabular-nums text-muted",
								children: formatScore(turn === "w" ? line.score : {
									type: line.score.type,
									value: -line.score.value
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "min-w-0 font-mono text-xs leading-relaxed text-fg/90",
								children: line.san.slice(0, 8).join(" ")
							})]
						}, line.multipv))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-1 flex items-center justify-between text-xs text-muted",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Think time" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono tabular-nums",
								children: [movetime, " ms"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
							min: 120,
							max: 1200,
							step: 20,
							value: [movetime],
							onValueChange: (v) => useGame.getState().setMovetime(v[0] ?? 350)
						})]
					})
				]
			})
		]
	});
}
function StudiesPanel() {
	const studyId = useGame((s) => s.studyId);
	const solved = useGame((s) => s.studySolved);
	const miss = useGame((s) => s.studyMiss);
	const active = STUDIES.find((s) => s.id === studyId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [active && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-[var(--radius-lg)] border border-border bg-surface p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-lg",
					children: active.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted",
					children: active.source
				}),
				solved ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-brilliant",
					children: active.idea
				}) : miss ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-mistake",
					children: "Not the sacrificial blow. Keep looking, or play the hinted line."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: "Find the forcing sacrifice. One move starts the combination."
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "flex flex-col gap-1.5",
			children: STUDIES.map((st) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => useGame.getState().loadStudy(st.id),
				className: cn("flex w-full flex-col items-start rounded-[var(--radius-md)] border border-border px-3 py-2.5 text-left hover:bg-surface-2", studyId === st.id && "border-brilliant/40 bg-brilliant/10"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm font-medium",
					children: st.title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-muted",
					children: st.source
				})]
			}) }, st.id))
		})]
	});
}
function NewGameBar() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap gap-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				onClick: () => useGame.getState().newGame({
					color: "w",
					mode: "play"
				}),
				children: "Play white"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "secondary",
				onClick: () => useGame.getState().newGame({
					color: "b",
					mode: "play"
				}),
				children: "Play black"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "outline",
				onClick: () => useGame.getState().newGame({
					color: "w",
					mode: "analyze"
				}),
				children: "Analyze"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "ghost",
				onClick: () => useGame.getState().setImportOpen(true),
				children: "Import"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "icon-sm",
				variant: "ghost",
				"aria-label": "Copy PGN",
				onClick: async () => {
					const pgn = useGame.getState().pgn();
					await navigator.clipboard.writeText(pgn || "(empty)");
					toast("PGN copied");
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardCopy, { className: "size-4" })
			})
		]
	});
}
function ImportDialog() {
	const open = useGame((s) => s.importOpen);
	const [text, setText] = (0, import_react.useState)("");
	const [err, setErr] = (0, import_react.useState)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: (v) => useGame.getState().setImportOpen(v),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Load a game" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Paste PGN or a FEN string. Analysis starts immediately." })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
				value: text,
				onChange: (e) => setText(e.target.value),
				placeholder: "1. e4 e5 …  or  rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
			}),
			err && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-blunder",
				children: err
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex justify-end gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					onClick: () => useGame.getState().setImportOpen(false),
					children: "Cancel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => {
						const raw = text.trim();
						if (!raw) return;
						const msg = raw.split("/").length >= 7 && !raw.includes(".") ? useGame.getState().loadFen(raw) : useGame.getState().loadPgn(raw);
						if (msg) setErr(msg);
						else {
							setErr(null);
							setText("");
						}
					},
					children: "Load"
				})]
			})
		] })
	});
}
function ClassificationKey() {
	const cursor = useGame((s) => s.cursor);
	const ply = useGame((s) => s.plies[s.cursor - 1]);
	if (!ply?.classification || cursor === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
			tone: ply.classification,
			children: CLASS_LABEL[ply.classification]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-sm text-muted",
			children: ply.san
		})]
	});
}
var Tabs = Root2;
function TabsList({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, {
		className: cn("flex h-11 items-center gap-1 rounded-[var(--radius-md)] bg-surface-2 p-1", className),
		...props
	});
}
function TabsTrigger({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
		className: cn("inline-flex h-9 flex-1 items-center justify-center rounded-[var(--radius-sm)] px-3 text-sm font-medium text-muted transition-colors data-[state=active]:bg-surface data-[state=active]:text-fg", className),
		...props
	});
}
function TabsContent({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content, {
		className: cn("outline-none", className),
		...props
	});
}
var TooltipProvider = Provider;
function wasmOk() {
	try {
		return typeof WebAssembly === "object" && WebAssembly.validate(Uint8Array.of(0, 97, 115, 109, 1, 0, 0, 0));
	} catch {
		return false;
	}
}
function parseInfo(line, fen) {
	if (!line.startsWith("info ") || !line.includes(" pv ")) return null;
	const mp = /multipv (\d+)/.exec(line);
	const depth = /depth (\d+)/.exec(line);
	const score = /score (cp|mate) (-?\d+)/.exec(line);
	const pvIdx = line.indexOf(" pv ");
	if (!depth || !score || pvIdx < 0) return null;
	const pv = line.slice(pvIdx + 4).trim().split(/\s+/).filter(Boolean);
	if (pv.length === 0) return null;
	const s = {
		type: score[1],
		value: Number(score[2])
	};
	return {
		multipv: mp ? Number(mp[1]) : 1,
		depth: Number(depth[1]),
		score: s,
		pv,
		san: pvToSan(fen, pv)
	};
}
var StockfishEngine = class {
	worker = null;
	ready = false;
	starting = null;
	pending = null;
	searchId = 0;
	listeners = /* @__PURE__ */ new Set();
	get isReady() {
		return this.ready;
	}
	async start() {
		if (this.ready) return;
		if (this.starting) return this.starting;
		this.starting = this.boot();
		try {
			await this.starting;
		} finally {
			this.starting = null;
		}
	}
	async boot() {
		const src = wasmOk() ? "/engine/stockfish.wasm.js" : "/engine/stockfish.js";
		this.worker = new Worker(src);
		this.worker.addEventListener("message", (ev) => {
			const data = typeof ev.data === "string" ? ev.data : String(ev.data ?? "");
			this.onLine(data);
		});
		this.worker.addEventListener("error", (ev) => {
			this.pending?.reject(new Error(ev.message || "Engine worker error"));
			this.pending = null;
		});
		await this.waitFor("uci", (l) => l === "uciok", 12e3);
		this.post("setoption name Hash value 32");
		this.post("setoption name MultiPV value 4");
		await this.waitFor("isready", (l) => l === "readyok", 8e3);
		this.ready = true;
	}
	stop() {
		this.post("stop");
	}
	destroy() {
		this.ready = false;
		this.pending?.reject(/* @__PURE__ */ new Error("Engine destroyed"));
		this.pending = null;
		this.worker?.terminate();
		this.worker = null;
	}
	async analyze(fen, opts = {}) {
		await this.start();
		this.searchId += 1;
		const id = this.searchId;
		this.post("stop");
		const multipv = opts.multipv ?? 4;
		this.post(`setoption name MultiPV value ${multipv}`);
		this.post("ucinewgame");
		this.post(`position fen ${fen}`);
		const go = opts.depth ? `go depth ${opts.depth}` : `go movetime ${opts.movetime ?? 350}`;
		return new Promise((resolve, reject) => {
			if (id !== this.searchId) {
				reject(/* @__PURE__ */ new Error("Superseded"));
				return;
			}
			this.pending = {
				resolve,
				reject,
				lines: /* @__PURE__ */ new Map(),
				fen
			};
			this.post(go);
			window.setTimeout(() => {
				if (this.pending && id === this.searchId) this.post("stop");
			}, (opts.movetime ?? 350) + 2500);
		});
	}
	post(cmd) {
		this.worker?.postMessage(cmd);
	}
	onLine(line) {
		for (const fn of this.listeners) fn(line);
		if (!this.pending) return;
		const info = parseInfo(line, this.pending.fen);
		if (info) this.pending.lines.set(info.multipv, info);
		if (line.startsWith("bestmove")) {
			const parts = line.split(/\s+/);
			const result = {
				bestmove: parts[1] && parts[1] !== "(none)" ? parts[1] : "",
				ponder: parts[2] === "ponder" ? parts[3] : void 0,
				lines: [...this.pending.lines.values()].sort((a, b) => a.multipv - b.multipv)
			};
			this.pending.resolve(result);
			this.pending = null;
		}
	}
	waitFor(cmd, pred, timeout) {
		return new Promise((resolve, reject) => {
			const t = window.setTimeout(() => {
				this.listeners.delete(onLine);
				reject(/* @__PURE__ */ new Error("Engine timeout"));
			}, timeout);
			const onLine = (l) => {
				if (!pred(l)) return;
				window.clearTimeout(t);
				this.listeners.delete(onLine);
				resolve();
			};
			this.listeners.add(onLine);
			this.post(cmd);
		});
	}
};
var singleton = null;
function getEngine() {
	if (!singleton) singleton = new StockfishEngine();
	return singleton;
}
function useEngineBridge() {
	const startFen = useGame((s) => s.startFen);
	const cursor = useGame((s) => s.cursor);
	const plyFen = useGame((s) => s.plies[s.cursor - 1]?.fenAfter);
	const engineOn = useGame((s) => s.engineOn);
	const movetime = useGame((s) => s.movetime);
	const mode = useGame((s) => s.mode);
	const playerColor = useGame((s) => s.playerColor);
	const plyCount = useGame((s) => s.plies.length);
	const fen = plyFen ?? startFen;
	const gen = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => {
		getEngine().start().then(() => useGame.getState().setEngineReady(true)).catch(() => useGame.getState().setEngineReady(false));
	}, []);
	(0, import_react.useEffect)(() => {
		if (!engineOn) {
			useGame.setState({
				thinking: false,
				lines: [],
				brilliant: null
			});
			return;
		}
		const id = ++gen.current;
		const engine = getEngine();
		useGame.getState().setThinking(true);
		let playTimer;
		(async () => {
			try {
				await engine.start();
				if (id !== gen.current) return;
				useGame.getState().setEngineReady(true);
				const result = await engine.analyze(fen, {
					movetime,
					multipv: 4
				});
				if (id !== gen.current) return;
				useGame.getState().applyAnalysis(result, fen);
				const s = useGame.getState();
				const chess = s.chess();
				if (s.mode === "play" && s.cursor === s.plies.length && !chess.isGameOver() && chess.turn() !== s.playerColor && Boolean(s.brilliant)) playTimer = window.setTimeout(() => {
					if (id !== gen.current) return;
					useGame.getState().playHint();
				}, 260);
			} catch {
				if (id === gen.current) useGame.getState().setThinking(false);
			}
		})();
		return () => {
			engine.stop();
			if (playTimer) window.clearTimeout(playTimer);
		};
	}, [
		fen,
		engineOn,
		movetime,
		mode,
		playerColor,
		plyCount,
		cursor
	]);
}
function AppShell() {
	const orientation = useGame((s) => s.orientation);
	const mode = useGame((s) => s.mode);
	const hydrate = useGame((s) => s.hydrate);
	useEngineBridge();
	(0, import_react.useEffect)(() => {
		hydrate();
	}, [hydrate]);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			const tag = e.target?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA") return;
			if (e.key === "ArrowLeft") {
				e.preventDefault();
				const s = useGame.getState();
				s.goto(s.cursor - 1);
			} else if (e.key === "ArrowRight") {
				e.preventDefault();
				const s = useGame.getState();
				s.goto(s.cursor + 1);
			} else if (e.key === "f" || e.key === "F") useGame.getState().flip();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipProvider, {
		delayDuration: 250,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-h-dvh bg-bg text-fg",
			onPointerDown: () => resumeAudio(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
					className: "border-b border-border px-4 py-3 sm:px-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mx-auto flex max-w-[1180px] items-center justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-2xl leading-none tracking-tight",
							children: "Brilliance"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted",
							children: "Play, analyze, hunt the sacrifice."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
							className: "flex gap-1 rounded-[var(--radius-md)] bg-surface-2 p-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeBtn, {
									id: "play",
									label: "Play",
									active: mode === "play"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeBtn, {
									id: "analyze",
									label: "Analyze",
									active: mode === "analyze"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeBtn, {
									id: "study",
									label: "Studies",
									active: mode === "study"
								})
							]
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					className: "mx-auto grid max-w-[1180px] gap-5 px-4 py-4 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_20rem] lg:items-start lg:py-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "hidden h-[min(72vw,560px)] lg:block",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EvalBar, { orientation })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "flex min-w-0 flex-col gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "lg:hidden",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EvalBar, {
										orientation,
										horizontal: true
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CapturedRow, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChessBoard, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClassificationKey, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameToolbar, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NewGameBar, {})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
							className: "flex min-w-0 flex-col gap-4 pb-8",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "lg:hidden",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
									defaultValue: mode === "study" ? "studies" : "engine",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
												value: "engine",
												children: "Engine"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
												value: "moves",
												children: "Moves"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
												value: "studies",
												children: "Studies"
											})
										] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
											value: "engine",
											className: "mt-3",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EnginePanel, {})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
											value: "moves",
											className: "mt-3",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoveList, {})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
											value: "studies",
											className: "mt-3",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StudiesPanel, {})
										})
									]
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "hidden flex-col gap-4 lg:flex",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EnginePanel, {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-[var(--radius-lg)] border border-border bg-surface p-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mb-2 text-[11px] font-medium tracking-wide text-subtle uppercase",
											children: "Moves"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoveList, {})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mb-2 text-[11px] font-medium tracking-wide text-subtle uppercase",
										children: "Brilliancies"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StudiesPanel, {})] })
								]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImportDialog, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
					theme: "dark",
					position: "bottom-center",
					richColors: false
				})
			]
		})
	});
}
function ModeBtn({ id, label, active }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick: () => {
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
		},
		className: active ? "h-9 rounded-[var(--radius-sm)] bg-surface px-3 text-sm font-medium" : "h-9 rounded-[var(--radius-sm)] px-3 text-sm font-medium text-muted hover:text-fg",
		children: label
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {});
}
//#endregion
export { Home as component };
