import LectureUploader from "@/components/lectures/LectureUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LecturesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Lectures</h1>

        <p className="mt-2 text-muted-foreground">
          Upload and manage your learning materials.
        </p>
      </div>

      <Card className="rounded-2xl py-6 shadow-sm">
        <CardHeader className="px-6">
          <CardTitle className="text-xl font-semibold">
            Upload New Lecture
          </CardTitle>
        </CardHeader>

        <CardContent className="px-6">
          <LectureUploader />
        </CardContent>
      </Card>
    </div>
  );
}
