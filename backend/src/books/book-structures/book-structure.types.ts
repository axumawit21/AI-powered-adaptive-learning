export interface SubChapter {
  id: string;
  subunitNumber: string;  // e.g., "1.1", "1.2", "2.1"
  title: string;
  pageStart: number;
  pageEnd: number;
  subChapters?: SubChapter[]; // Recursive support for 1.1.1, 1.1.2
}

export interface Unit {
  id: string;
  unitNumber: number;     // e.g., 1, 2, 3
  title: string;
  pageStart: number;
  pageEnd: number;
  subChapters: SubChapter[];
}
