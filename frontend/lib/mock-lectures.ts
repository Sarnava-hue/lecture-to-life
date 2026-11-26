import { lecturesData } from "@/lib/mock-data";
import type { Lecture, LecturePreview } from "@/types/study";

export type { LecturePreview } from "@/types/study";

export const recentLectures: LecturePreview[] = lecturesData.map((lecture) => ({
  id: lecture.id,
  title: lecture.title,
  subject: lecture.subject,
  duration: lecture.duration,
}));

export function getLectureById(id: string): Lecture | undefined {
  return lecturesData.find((lecture) => lecture.id === id);
}
