import { mkdir, readFile, writeFile } from 'node:fs/promises';

const input = new URL('../data/raw/kjv.raw.json', import.meta.url);
const outDir = new URL('../public/data/', import.meta.url);
const output = new URL('../public/data/kjv.json', import.meta.url);

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const raw = JSON.parse(await readFile(input, 'utf8'));
const books = raw.books.map((book) => ({
  id: slug(book.name),
  name: book.name,
  chapters: book.chapters.map((chapter) => ({
    verses: chapter.verses.map((verse) => ({ n: verse.verse, t: verse.text }))
  }))
}));

const normalized = { books, order: books.map((b) => b.id) };
await mkdir(outDir, { recursive: true });
await writeFile(output, JSON.stringify(normalized), 'utf8');
console.log(`Wrote normalized KJV JSON with ${books.length} books to public/data/kjv.json`);
