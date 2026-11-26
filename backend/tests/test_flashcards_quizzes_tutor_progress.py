from fastapi.testclient import TestClient

from app.services.spaced_repetition import compute_sm2_schedule


def _upload_sample_lecture(
    client: TestClient,
    headers: dict[str, str],
    title: str = "Database Systems",
    subject: str = "Databases",
) -> str:
    content = (
        b"First Normal Form requires every column to store atomic values without repeating groups.\n\n"
        b"Second Normal Form removes partial functional dependencies on composite candidate keys.\n\n"
        b"Third Normal Form eliminates transitive dependencies between non-key attributes."
    )
    res = client.post(
        "/api/v1/lectures/upload",
        headers=headers,
        files={"file": ("db_norm.txt", content, "text/plain")},
        data={
            "title": title,
            "subject": subject,
            "targets": '["summary","flashcards","quiz","conceptMap"]',
        },
    )
    assert res.status_code == 201
    return res.json()["lecture_id"]


def test_sm2_schedule_progression() -> None:
    again = compute_sm2_schedule("again", current_ease_factor=2.5, current_interval_days=4, current_repetitions=2)
    assert again.mastery == "learning"
    assert again.interval_days == 0
    assert again.next_review_label == "In 10 min"

    first_good = compute_sm2_schedule("good")
    assert first_good.mastery == "learning"
    assert first_good.interval_days == 1
    assert first_good.next_review_label == "In 1 day"

    second_good = compute_sm2_schedule(
        "good",
        current_ease_factor=first_good.ease_factor,
        current_interval_days=first_good.interval_days,
        current_repetitions=first_good.repetitions,
    )
    assert second_good.mastery == "mastered"
    assert second_good.interval_days == 4
    assert second_good.next_review_label == "In 4 days"


def test_flashcards_crud_review_and_isolation(
    client: TestClient,
    auth_headers: dict[str, str],
    second_user_headers: dict[str, str],
) -> None:
    lecture_id = _upload_sample_lecture(client, auth_headers)

    cards_res = client.get(
        "/api/v1/flashcards",
        headers=auth_headers,
        params={"lecture_id": lecture_id},
    )
    assert cards_res.status_code == 200
    assert len(cards_res.json()) >= 1

    # User 2 cannot create a flashcard on User 1's lecture.
    forbidden = client.post(
        "/api/v1/flashcards",
        headers=second_user_headers,
        json={"lectureId": lecture_id, "front": "Q", "back": "A"},
    )
    assert forbidden.status_code == 404

    custom_res = client.post(
        "/api/v1/flashcards",
        headers=auth_headers,
        json={
            "lectureId": lecture_id,
            "front": "What does 2NF remove?",
            "back": "Partial functional dependencies.",
            "hint": "Composite keys",
        },
    )
    assert custom_res.status_code == 201
    card = custom_res.json()
    assert card["mastery"] == "new"
    assert card["lectureTitle"] == "Database Systems"

    rev1 = client.post(
        f"/api/v1/flashcards/{card['id']}/review",
        headers=auth_headers,
        json={"flashcardId": card["id"], "rating": "good"},
    )
    assert rev1.status_code == 200
    assert rev1.json()["mastery"] == "learning"
    assert rev1.json()["nextReviewLabel"] == "In 1 day"

    rev2 = client.post(
        f"/api/v1/flashcards/{card['id']}/review",
        headers=auth_headers,
        json={"flashcardId": card["id"], "rating": "good"},
    )
    assert rev2.status_code == 200
    assert rev2.json()["mastery"] == "mastered"
    assert rev2.json()["nextReviewLabel"] == "In 4 days"

    del_res = client.delete(
        f"/api/v1/flashcards/{card['id']}", headers=auth_headers
    )
    assert del_res.status_code == 204


def test_quizzes_tutor_and_progress_analytics(
    client: TestClient,
    auth_headers: dict[str, str],
    second_user_headers: dict[str, str],
) -> None:
    lecture_id = _upload_sample_lecture(client, auth_headers)

    quizzes_res = client.get(
        "/api/v1/quizzes",
        headers=auth_headers,
        params={"lecture_id": lecture_id},
    )
    assert quizzes_res.status_code == 200
    quizzes = quizzes_res.json()
    assert len(quizzes) == 1
    quiz = quizzes[0]
    assert len(quiz["questions"]) >= 1

    answers = {q["id"]: q["correctIndex"] for q in quiz["questions"]}
    attempt_res = client.post(
        f"/api/v1/quizzes/{quiz['id']}/attempt",
        headers=auth_headers,
        json={
            "quizId": quiz["id"],
            "answers": answers,
            "elapsedSeconds": 75,
        },
    )
    assert attempt_res.status_code == 200
    attempt_data = attempt_res.json()
    assert attempt_data["scorePercent"] == 100
    assert attempt_data["correctCount"] == len(quiz["questions"])

    # Ask Tutor across all user lectures.
    tutor_res = client.post(
        "/api/v1/tutor/ask",
        headers=auth_headers,
        json={"question": "What does Second Normal Form remove?", "lectureId": "all"},
    )
    assert tutor_res.status_code == 200
    assert "partial" in tutor_res.json()["answer"].lower()
    assert len(tutor_res.json()["citations"]) >= 1

    # User 2 cannot scope tutor to User 1's lecture or see User 1's chunks.
    u2_scoped = client.post(
        "/api/v1/tutor/ask",
        headers=second_user_headers,
        json={"question": "What does 2NF remove?", "lectureId": lecture_id},
    )
    assert u2_scoped.status_code == 404

    u2_all = client.post(
        "/api/v1/tutor/ask",
        headers=second_user_headers,
        json={"question": "What does 2NF remove?"},
    )
    assert u2_all.status_code == 200
    assert u2_all.json()["citations"] == []

    history_res = client.get("/api/v1/tutor/history", headers=auth_headers)
    assert history_res.status_code == 200
    assert len(history_res.json()) == 2

    progress_res = client.get("/api/v1/progress", headers=auth_headers)
    assert progress_res.status_code == 200
    progress = progress_res.json()
    assert len(progress["weeklyStudy"]) == 7
    assert progress["quizTrend"] == [{"attempt": "Attempt 1", "score": 100}]
    assert progress["subjectMastery"][0]["subject"] == "Databases"
    assert progress["totalFlashcards"] >= 1
    assert progress["totalQuizzes"] == 1
    assert len(progress["recentLectures"]) == 1
