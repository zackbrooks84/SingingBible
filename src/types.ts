export type Verse = { n: number; t: string };
export type Chapter = { verses: Verse[] };
export type Book = { id: string; name: string; chapters: Chapter[] };
export type BibleData = { books: Book[]; order: string[] };

export type Selection = {
  bookId: string;
  chapter: number;
  verse?: number;
};
