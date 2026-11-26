import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FlashcardStudio from "@/components/flashcards/FlashcardStudio";

describe("FlashcardStudio", () => {
  it("reveals the answer and advances on rating", () => {
    render(<FlashcardStudio initialLectureId="1" />);

    expect(screen.getByText("Card 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("Question")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^reveal answer$/i }));

    expect(screen.getByText("Answer")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /3\. Good/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /3\. Good/i }));

    expect(screen.getByText("Card 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("Question")).toBeInTheDocument();
  });
});
