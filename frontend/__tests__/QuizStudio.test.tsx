import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import QuizStudio from "@/components/quizzes/QuizStudio";

describe("QuizStudio", () => {
  it("runs through a quiz and displays the final score", async () => {
    render(<QuizStudio initialLectureId="2" />);

    expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Waiting (Blocked)"));
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));

    expect(screen.getByText("Correct!")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /next question/i }));
    expect(screen.getByText("Question 2 of 2")).toBeInTheDocument();

    fireEvent.click(
      screen.getByText("It behaves like First-Come, First-Served (FCFS)")
    );
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    fireEvent.click(screen.getByRole("button", { name: /finish quiz/i }));

    await waitFor(() => {
      expect(screen.getByText("You scored 100%")).toBeInTheDocument();
    });
  });
});
