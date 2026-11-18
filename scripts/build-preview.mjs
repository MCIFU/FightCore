/**
 * README preview (docs/brand/preview.jpg): the desktop home next to two phone
 * screens, composed from the store screenshots (run `npm run screenshots` first).
 */
import sharp from "sharp";

const W = 2400, H = 1240, BG = "#07080a";
const frame = async (file, width) => {
  const img = await sharp(`public/screenshots/${file}.webp`).resize(width).toBuffer();
  const { height } = await sharp(img).metadata();
  // 2px hairline frame around each screen.
  return { buf: await sharp(img).extend({ top: 2, bottom: 2, left: 2, right: 2, background: "#2b3038" }).toBuffer(), w: width + 4, h: height + 4 };
};
const desk = await frame("wide-1-inicio", 1520);
const ph1 = await frame("narrow-2-luchador", 330);
const ph2 = await frame("narrow-3-rankings", 330);
const top = Math.round((H - desk.h) / 2);
await sharp({ create: { width: W, height: H, channels: 3, background: BG } })
  .composite([
    { input: desk.buf, left: 60, top },
    { input: ph1.buf, left: 60 + desk.w + 40, top: top + 40 },
    { input: ph2.buf, left: 60 + desk.w + 40 + ph1.w + 28, top: top + 110 },
  ])
  .jpeg({ quality: 84, progressive: true, mozjpeg: true })
  .toFile("docs/brand/preview.jpg");
console.log("docs/brand/preview.jpg");
