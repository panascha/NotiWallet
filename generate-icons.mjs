// Run once: node generate-icons.mjs
import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';

function crc32(data) {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  let crc = 0xFFFFFFFF;
  for (const b of data) crc = t[(crc ^ b) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createIcon(size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB

  const cx = size / 2, cy = size / 2;
  const outerR = size * 0.42;
  const innerR = size * 0.24;
  const rows = [];

  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3);
    row[0] = 0;
    for (let x = 0; x < size; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      let R, G, B;
      if (dist < innerR) {
        // Inner: dark (wallet hole)
        R = 0x08; G = 0x08; B = 0x12;
      } else if (dist < outerR) {
        // Amber ring
        R = 0xF5; G = 0x9E; B = 0x0B;
      } else {
        // Background: dark navy
        R = 0x08; G = 0x08; B = 0x12;
      }
      row[1 + x * 3] = R;
      row[2 + x * 3] = G;
      row[3 + x * 3] = B;
    }
    rows.push(row);
  }

  const compressed = deflateSync(Buffer.concat(rows), { level: 6 });

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon-192.png', createIcon(192));
writeFileSync('public/icons/icon-512.png', createIcon(512));
console.log('Icons generated: public/icons/icon-192.png, public/icons/icon-512.png');
