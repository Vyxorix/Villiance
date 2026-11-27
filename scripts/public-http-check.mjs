import assert from "node:assert/strict";
import { allowLookup, chessComArchive, httpsUrl } from "../src/lib/chess/public-http.ts";

assert.equal(httpsUrl("http://api.chess.com/pub", "api.chess.com"), null);
assert.equal(httpsUrl("https://user:pass@api.chess.com/pub", "api.chess.com"), null);
assert.equal(httpsUrl("https://evil.example/api.chess.com", "api.chess.com"), null);
assert.equal(httpsUrl("https://api.chess.com.evil/pub", "api.chess.com"), null);
assert.equal(httpsUrl("https://api.chess.com:444/pub", "api.chess.com"), null);
assert.ok(httpsUrl("https://lichess.org/api/games/user/abc", "lichess.org"));

const archive = chessComArchive(
  "Hyphen-user",
  "https://api.chess.com/pub/player/Hyphen-user/games/2024/03?x=1#frag",
);
assert.equal(archive, "https://api.chess.com/pub/player/Hyphen-user/games/2024/03");
assert.equal(chessComArchive("ada", "https://api.chess.com/pub/player/bob/games/2024/03"), null);
assert.equal(chessComArchive("ada", "https://example.com/pub/player/ada/games/2024/03"), null);

assert.equal(allowLookup("t", 2, 1000, 0), true);
assert.equal(allowLookup("t", 2, 1000, 10), true);
assert.equal(allowLookup("t", 2, 1000, 20), false);
assert.equal(allowLookup("t", 2, 1000, 2000), true);

console.log("public http tests passed");
