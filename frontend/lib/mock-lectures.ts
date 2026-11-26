export interface LecturePreview {
  id: string;
  title: string;
  subject: string;
  duration: string;
}

export const recentLectures: LecturePreview[] = [
  {
    id: "1",
    title: "Introduction to Machine Learning",
    subject: "Artificial Intelligence",
    duration: "42 min",
  },
  {
    id: "2",
    title: "Operating Systems — Processes",
    subject: "Computer Science",
    duration: "36 min",
  },
  {
    id: "3",
    title: "Database Normalization",
    subject: "Database Systems",
    duration: "28 min",
  },
];

export function getLectureById(id: string): LecturePreview | undefined {
  return recentLectures.find((lecture) => lecture.id === id);
}
