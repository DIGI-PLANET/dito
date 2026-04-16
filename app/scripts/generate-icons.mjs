import sharp from 'sharp';
import { writeFileSync } from 'fs';

// SVG icon: orange rounded square + white flame/D hybrid
function createIconSvg(size) {
  const r = Math.round(size * 0.18); // corner radius
  const flame = size === 512 ? `
    <path d="
      M256 80
      C256 80 310 160 310 220
      C310 260 340 280 340 320
      C340 400 300 432 256 432
      C212 432 172 400 172 320
      C172 260 200 240 200 200
      C200 180 210 160 230 180
      C240 190 240 210 240 210
      C240 210 250 170 256 80Z
    " fill="white" opacity="0.95"/>
    <path d="
      M256 200
      C256 200 285 250 285 290
      C285 330 272 360 256 360
      C240 360 227 330 227 290
      C227 250 256 200 256 200Z
    " fill="#ff6b35" opacity="0.8"/>
  ` : `
    <path d="
      M96 30
      C96 30 116 60 116 83
      C116 98 128 106 128 121
      C128 151 113 163 96 163
      C79 163 64 151 64 121
      C64 98 75 91 75 75
      C75 68 79 60 86 68
      C90 72 90 79 90 79
      C90 79 94 64 96 30Z
    " fill="white" opacity="0.95"/>
    <path d="
      M96 75
      C96 75 107 94 107 109
      C107 124 102 135 96 135
      C90 135 85 124 85 109
      C85 94 96 75 96 75Z
    " fill="#ff6b35" opacity="0.8"/>
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#ff6b35"/>
  ${flame}
</svg>`;
}

const sizes = [
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-192.png', size: 192 },
  { name: 'apple-touch-icon.png', size: 180 },
];

for (const { name, size } of sizes) {
  const svg = createIconSvg(size <= 192 ? 192 : 512);
  const buf = await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toBuffer();
  writeFileSync(`public/${name}`, buf);
  console.log(`✅ public/${name} (${buf.length} bytes)`);
}
