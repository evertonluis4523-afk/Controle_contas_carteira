// Gera os ícones PNG do PWA (192, 512 e Apple touch) a partir do SVG base.
// Uso: npm run icons
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const iconsDir = resolve(here, '..', 'public', 'icons');
const svg = await readFile(resolve(iconsDir, 'icon.svg'));

const targets = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 }
];

for (const { name, size } of targets) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(resolve(iconsDir, name));
  console.log(`✓ ${name} (${size}x${size})`);
}
