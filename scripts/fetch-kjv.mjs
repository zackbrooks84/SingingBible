import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const SOURCE_URL = 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/KJV.json';
const targetDir = new URL('../data/raw/', import.meta.url);
const targetFile = new URL('../data/raw/kjv.raw.json', import.meta.url);

await mkdir(targetDir, { recursive: true });

let text = '';
try {
  const res = await fetch(SOURCE_URL);
  if (res.ok) text = await res.text();
} catch {
  text = '';
}

if (!text) {
  text = execFileSync('curl', ['-L', '--fail', SOURCE_URL], { encoding: 'utf8', maxBuffer: 15 * 1024 * 1024 });
}

await writeFile(targetFile, text, 'utf8');
console.log(`Fetched KJV source from ${SOURCE_URL}`);
