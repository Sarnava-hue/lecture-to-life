import FlashcardStudio from "@/components/flashcards/FlashcardStudio";

export default async function FlashcardsPage({
  searchParams,
}: {
  searchParams: Promise<{ lectureId?: string }>;
}) {
  const { lectureId } = await searchParams;
  return <FlashcardStudio initialLectureId={lectureId} />;
}
