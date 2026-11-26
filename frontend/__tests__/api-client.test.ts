import { AxiosError, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { ApiError, extractApiErrorMessage } from "@/lib/api-client";
import { fetchLectures, submitQuizAttempt } from "@/lib/services/study-service";

describe("api-client error normalization", () => {
  it("extracts FastAPI string detail errors", () => {
    const axiosErr = new AxiosError(
      "Request failed",
      "ERR_BAD_REQUEST",
      undefined,
      undefined,
      {
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: {} as AxiosResponse["config"],
        data: { detail: "Unsupported lecture format" },
      }
    );

    const normalized = extractApiErrorMessage(axiosErr);
    expect(normalized).toBeInstanceOf(ApiError);
    expect(normalized.status).toBe(400);
    expect(normalized.message).toBe("Unsupported lecture format");
  });

  it("joins Pydantic validation error arrays", () => {
    const axiosErr = new AxiosError(
      "Validation error",
      "ERR_BAD_REQUEST",
      undefined,
      undefined,
      {
        status: 422,
        statusText: "Unprocessable Entity",
        headers: {},
        config: {} as AxiosResponse["config"],
        data: {
          detail: [
            { loc: ["body", "email"], msg: "value is not a valid email" },
            { loc: ["body", "password"], msg: "field required" },
          ],
        },
      }
    );

    const normalized = extractApiErrorMessage(axiosErr);
    expect(normalized.status).toBe(422);
    expect(normalized.message).toBe(
      "value is not a valid email; field required"
    );
  });
});

describe("study-service preview mode", () => {
  it("returns mock lectures list", async () => {
    const lectures = await fetchLectures();
    expect(lectures.length).toBeGreaterThanOrEqual(3);
  });

  it("calculates quiz attempt score in mock mode", async () => {
    const result = await submitQuizAttempt({
      quizId: "quiz-2",
      answers: {
        "q2-1": 1,
        "q2-2": 0,
      },
      elapsedSeconds: 45,
    });
    expect(result.correctCount).toBe(2);
    expect(result.totalQuestions).toBe(2);
    expect(result.scorePercent).toBe(100);
  });
});
