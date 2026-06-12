import { readFileSync } from "node:fs";
import sharp from "sharp";

// Rasterize the inline SVG from public/thumbnail.html into a crisp PNG.
const html = readFileSync(new URL("../public/thumbnail.html", import.meta.url), "utf8");
const match = html.match(/<svg[\s\S]*?<\/svg>/);
if (!match) throw new Error("no <svg> found in thumbnail.html");

// Give the SVG an explicit intrinsic size so librsvg sizes it deterministically.
const svg = match[0].replace("<svg ", '<svg width="1200" height="800" ');

await sharp(Buffer.from(svg), { density: 192 }) // 192dpi → 2400x1600 (2x, crisp)
  .png()
  .toFile(new URL("../public/thumbnail.png", import.meta.url).pathname);

console.log("✓ wrote public/thumbnail.png");
