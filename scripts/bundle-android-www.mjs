#!/usr/bin/env node
/**
 * Copy the production static build plus the rendered home page into the
 * Android asset folder. The APK serves that folder on loopback, so the board
 * does not need villiance.vercel.app.
 *
 * Requires `npm run build` and `node scripts/preview.mjs restart` first.
 */
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, ".vercel/output/static");
const dest = join(root, "android/app/src/main/assets/www");
const preview = process.env.PREVIEW_URL || "http://127.0.0.1:8081/";

const response = await fetch(preview);
if (!response.ok) {
  console.error(`[bundle-android] preview ${preview} returned ${response.status}`);
  process.exit(1);
}
const html = await response.text();
if (!html.includes("<title>Villiance</title>") || !html.includes('src="/assets/index-')) {
  console.error("[bundle-android] preview HTML is not the Villiance shell");
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(source, dest, { recursive: true });
writeFileSync(join(dest, "index.html"), html);
console.log(`[bundle-android] wrote ${dest} (${html.length} byte shell)`);
