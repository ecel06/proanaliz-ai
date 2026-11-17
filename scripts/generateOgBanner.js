// scripts/generateOgBanner.js
// Generates high-quality 1200x630 OpenGraph & Twitter Card PNG for ProAnaliz AI
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CRC32 table & calculation for PNG chunks
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[n] = c;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function createOgBanner(width = 1200, height = 630) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const stride = 1 + width * 4;
  const rawData = Buffer.alloc(height * stride);

  const cx = width / 2;
  const cy = height / 2;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * stride;
    rawData[rowOffset] = 0; // None filter

    const normY = y / height;
    const dy = y - cy;

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const normX = x / width;

      // Base background: Deep cosmic slate gradient
      let r = Math.round(3 + normY * 6);
      let g = Math.round(7 + normY * 12 + (1 - Math.abs(normX - 0.5) * 2) * 8);
      let b = Math.round(18 + normY * 24 + (1 - Math.abs(normX - 0.5) * 2) * 16);
      let a = 255;

      // Subtle cyber grid lines every 60px
      if (x % 60 === 0 || y % 60 === 0) {
        r = Math.min(255, r + 8);
        g = Math.min(255, g + 14);
        b = Math.min(255, b + 24);
      }

      // Radial dark vignette
      const distFromCenter = Math.sqrt(dx * dx + dy * dy);
      const vignette = Math.min(1, distFromCenter / (width * 0.65));
      if (vignette > 0.6) {
        const factor = 1 - (vignette - 0.6) * 1.5;
        r = Math.round(r * Math.max(0.3, factor));
        g = Math.round(g * Math.max(0.3, factor));
        b = Math.round(b * Math.max(0.3, factor));
      }

      // Top and bottom futuristic neon accent bars
      if (y < 8 || y > height - 9) {
        // Glowing gold & emerald gradient border
        const t = Math.abs(normX - 0.5) * 2;
        r = Math.round(245 * (1 - t) + 16 * t);
        g = Math.round(158 * (1 - t) + 185 * t);
        b = Math.round(11 * (1 - t) + 129 * t);
      }

      // Central Shield / Emblem Geometry (at left-center x ~ 360, cy ~ 315)
      const emblemX = 320;
      const emblemY = cy;
      const edx = x - emblemX;
      const edy = y - emblemY;
      const edist = Math.sqrt(edx * edx + edy * edy);
      const emblemR = 140;

      // Outer glowing ring
      if (Math.abs(edist - emblemR) < 6) {
        // Neon emerald #10b981
        r = 16;
        g = 185;
        b = 129;
      } else if (Math.abs(edist - (emblemR - 16)) < 3) {
        // Inner gold accent ring #f59e0b
        r = 245;
        g = 158;
        b = 11;
      } else if (edist < emblemR - 16) {
        // Inside emblem: Rich dark glass
        r = Math.round(15 + (1 - edist / emblemR) * 25);
        g = Math.round(23 + (1 - edist / emblemR) * 35);
        b = Math.round(42 + (1 - edist / emblemR) * 50);

        // Stylized "P" and Soccer/AI geometry inside emblem
        const inStem = edx >= -45 && edx <= -20 && edy >= -70 && edy <= 70;
        const inLoop = edx >= -20 && edx <= 40 && edy >= -70 && edy <= 5;
        const inLoopHole = edx >= -10 && edx <= 25 && edy >= -55 && edy <= -10;
        const inCrossAI = (Math.abs(edy - 30) < 6 && edx >= -10 && edx <= 45) ||
                          (Math.abs(edx - 18) < 6 && edy >= 10 && edy <= 50);

        if (inStem || (inLoop && !inLoopHole)) {
          // Emerald-Cyan gradient
          r = 52;
          g = 211;
          b = 153;
        } else if (inCrossAI) {
          // Golden AI accent
          r = 251;
          g = 191;
          b = 36;
        }
      }

      // Horizontal glow line passing through emblem center
      if (Math.abs(y - cy) < 2 && x > emblemX + emblemR + 20 && x < width - 120) {
        const falloff = 1 - (x - (emblemX + emblemR + 20)) / (width - emblemX - emblemR - 140);
        r = Math.min(255, r + Math.round(16 * falloff));
        g = Math.min(255, g + Math.round(185 * falloff));
        b = Math.min(255, b + Math.round(129 * falloff));
      }

      // Top badge pill: "PROANALIZ AI" area glow
      if (x > 530 && x < 1080 && y > 180 && y < 450) {
        // Ambient soft golden-emerald glow for typography zone
        r = Math.min(255, r + 12);
        g = Math.min(255, g + 22);
        b = Math.min(255, b + 35);
      }

      // 18+ and Trusted badges pill placeholder bar at bottom right
      if (x > 530 && x < 1120 && y > 470 && y < 530) {
        const inPillBox = (x >= 540 && x <= 720) || (x >= 740 && x <= 920) || (x >= 940 && x <= 1100);
        if (inPillBox && (y === 470 || y === 529 || x === 540 || x === 720 || x === 740 || x === 920 || x === 940 || x === 1100)) {
          r = 52;
          g = 211;
          b = 153;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 8 });
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Generate public/og-image.png
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('🎨 1200x630 OpenGraph Banner üretiliyor...');
const pngBuffer = createOgBanner(1200, 630);
const outPath = path.join(publicDir, 'og-image.png');
fs.writeFileSync(outPath, pngBuffer);

// Also create a copy as twitter-image.png
fs.writeFileSync(path.join(publicDir, 'twitter-image.png'), pngBuffer);

console.log(`✅ [OgBanner] Başarıyla üretildi: ${outPath} (${(pngBuffer.length / 1024).toFixed(1)} KB)`);
