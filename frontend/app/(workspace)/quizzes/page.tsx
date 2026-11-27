import QuizStudio from "@/components/quizzes/QuizStudio";

export default async function QuizzesPage({
  searchParams,
}: {
  searchParams: Promise<{ lectureId?: string }>;
}) {
  const { lectureId } = await searchParams;
  return <QuizStudio initialLectureId={lectureId} />;
}
