import type { BibleData, Selection } from '../types';

export const parseReference = (query: string, data: BibleData): Selection | null => {
  const m = query.trim().match(/^([1-3]?\s?[A-Za-z ]+)\s+(\d+)(?::(\d+))?$/);
  if (!m) return null;
  const name = m[1].replace(/\s+/g, ' ').trim().toLowerCase();
  const book = data.books.find((b) => b.name.toLowerCase() === name);
  if (!book) return null;
  const chapter = Number(m[2]);
  const verse = m[3] ? Number(m[3]) : undefined;
  if (chapter < 1 || chapter > book.chapters.length) return null;
  if (verse && (verse < 1 || verse > book.chapters[chapter - 1].verses.length)) return null;
  return { bookId: book.id, chapter, verse };
};

export const makeSnippet = (text: string, q: string): string => {
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text.slice(0, 110);
  const start = Math.max(0, idx - 30);
  return `${start > 0 ? '…' : ''}${text.slice(start, start + 120)}${text.length > start + 120 ? '…' : ''}`;
};
