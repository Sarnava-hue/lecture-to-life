import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LectureUploader from "@/components/lectures/LectureUploader";

describe("LectureUploader", () => {
  it("rejects unsupported file extensions", () => {
    const { container } = render(<LectureUploader />);
    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    const invalidFile = new File(["binary"], "malware.exe", {
      type: "application/x-msdownload",
    });

    fireEvent.change(input!, { target: { files: [invalidFile] } });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please upload a PDF, DOCX, TXT, MP3, WAV, M4A, MP4, or WEBM file."
    );
  });

  it("accepts valid .docx files even when browser MIME type is empty", () => {
    const { container } = render(<LectureUploader />);
    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    const docxWithEmptyMime = new File(["notes"], "lecture_week_1.docx", {
      type: "",
    });

    fireEvent.change(input!, { target: { files: [docxWithEmptyMime] } });

    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("lecture_week_1.docx")).toBeInTheDocument();
    expect(screen.getByLabelText("Lecture Title")).toHaveValue(
      "lecture week 1"
    );
    expect(
      screen.getByRole("button", { name: /start processing/i })
    ).toBeInTheDocument();
  });
});
