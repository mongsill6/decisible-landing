import sharp from 'sharp';
import { readFileSync } from 'fs';

const svg = readFileSync('C:\\Users\\hdj\\clawd-neo\\work\\decisible\\thumbnail.svg');
await sharp(svg)
  .resize(240, 240)
  .png()
  .toFile('C:\\Users\\hdj\\clawd\\work\\projects\\decisible-landing\\public\\thumbnail.png');

console.log('Done!');
