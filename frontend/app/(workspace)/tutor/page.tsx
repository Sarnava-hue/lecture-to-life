import TutorWorkspace from "@/components/tutor/TutorWorkspace";

export default async function TutorPage({
  searchParams,
}: {
  searchParams: Promise<{ lectureId?: string }>;
}) {
  const { lectureId } = await searchParams;
  return <TutorWorkspace initialLectureId={lectureId} />;
}
