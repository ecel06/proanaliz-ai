// scripts/generateIcons.js
// Generates valid PNG and ICO icons for ProAnaliz AI PWA & Desktop Shortcut

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

function createPng(width, height) {
  // 8-byte PNG signature
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR: width(4), height(4), bitDepth(1)=8, colorType(1)=6 (RGBA), comp(1)=0, filter(1)=0, interlace(1)=0
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Generate image data with an emerald gradient background and futuristic badge
  const stride = 1 + width * 4; // 1 filter byte (0) + RGBA per pixel
  const rawData = Buffer.alloc(height * stride);

  const cx = width / 2;
  const cy = height / 2;
  const maxR = width * 0.46;
  const innerR = width * 0.38;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * stride;
    rawData[rowOffset] = 0; // Filter type: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rounded squircle / circular badge
      // Corner distance for squircle
      const nx = Math.abs(dx) / (width * 0.45);
      const ny = Math.abs(dy) / (height * 0.45);
      const squircle = Math.pow(nx, 4) + Math.pow(ny, 4);

      if (squircle <= 1.0) {
        // Inside icon background: dark slate gradient
        const gradY = y / height;
        let r = Math.round(15 - gradY * 10);
        let g = Math.round(23 - gradY * 15);
        let b = Math.round(42 - gradY * 25);
        let a = 255;

        // Glowing border: squircle between 0.85 and 1.0
        if (squircle >= 0.82) {
          r = 16;  // #10b981
          g = 185;
          b = 129;
          a = 255;
        }

        // Inner glowing ring
        if (Math.abs(dist - innerR * 0.8) < width * 0.04) {
          r = 52;  // #34d399
          g = 211;
          b = 153;
        }

        // Center stylized soccer/AI motif: crosshairs / shield
        const inCrossV = Math.abs(dx) < width * 0.05 && Math.abs(dy) < height * 0.28;
        const inCrossH = Math.abs(dy) < height * 0.05 && Math.abs(dx) < width * 0.28;
        const inCenterCore = dist < width * 0.12;

        if (inCenterCore) {
          r = 251; // Gold core: #f59e0b
          g = 191;
          b = 36;
        } else if (inCrossV || inCrossH) {
          r = 16;  // Emerald lines
          g = 185;
          b = 129;
        }

        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
        rawData[pxOffset + 3] = a;
      } else {
        // Outside squircle: transparent
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Convert a PNG buffer to a single-image Windows .ico buffer
function createIco(pngBuffer, width, height) {
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // 1 = ICO
  icoHeader.writeUInt16LE(1, 4); // Count of images = 1

  const entry = Buffer.alloc(16);
  entry[0] = width >= 256 ? 0 : width;   // Width (0 = 256)
  entry[1] = height >= 256 ? 0 : height; // Height (0 = 256)
  entry[2] = 0; // Palette colors (0 = no palette)
  entry[3] = 0; // Reserved
  entry.writeUInt16LE(1, 4);             // Color planes (1)
  entry.writeUInt16LE(32, 6);            // Bits per pixel (32)
  entry.writeUInt32LE(pngBuffer.length, 8); // Size of image data
  entry.writeUInt32LE(22, 12);           // Offset of image data (6 + 16 = 22)

  return Buffer.concat([icoHeader, entry, pngBuffer]);
}

// Ensure public/icons directory
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Generating PWA and desktop icons...');
const png192 = createPng(192, 192);
const png512 = createPng(512, 512);
const png64 = createPng(64, 64);
const png256 = createPng(256, 256);

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), png192);
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), png512);
fs.writeFileSync(path.join(iconsDir, 'icon-maskable.png'), png512);

// Write .ico files (for browser tab favicon & Windows desktop shortcut)
const ico = createIco(png256, 256, 256);
fs.writeFileSync(path.join(__dirname, '../public/favicon.ico'), ico);
fs.writeFileSync(path.join(__dirname, '../proanaliz.ico'), ico);

console.log('✅ Icons successfully created:');
console.log(' - public/icons/icon-192.png');
console.log(' - public/icons/icon-512.png');
console.log(' - public/icons/icon-maskable.png');
console.log(' - public/favicon.ico');
console.log(' - proanaliz.ico (Windows Desktop Icon)');

