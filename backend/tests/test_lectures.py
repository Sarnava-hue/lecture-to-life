from pathlib import Path

from fastapi.testclient import TestClient

from app.core.config import settings


def _minimal_pdf_bytes() -> bytes:
    """Build a minimal valid single-page PDF 1.4 document with extractable text."""
    objects = [
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        (
            b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] "
            b"/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
        ),
        (
            b"4 0 obj\n<< /Length 48 >>\nstream\n"
            b"BT /F1 12 Tf 20 100 Td (Gradient Descent Lecture) Tj ET\n"
            b"endstream\nendobj\n"
        ),
        b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    ]
    buffer = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for obj in objects:
        offsets.append(len(buffer))
        buffer.extend(obj)
    xref_start = len(buffer)
    buffer.extend(f"xref\n0 {len(offsets)}\n".encode("ascii"))
    buffer.extend(b"0000000000 65535 f \n")
    for off in offsets[1:]:
        buffer.extend(f"{off:010d} 00000 n \n".encode("ascii"))
    buffer.extend(
        f"trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF\n".encode(
            "ascii"
        )
    )
    return bytes(buffer)


def test_upload_txt_lecture_and_poll_status(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    content = (
        b"Supervised learning maps inputs to labels.\n\n"
        b"Gradient descent minimizes the loss function."
    )
    upload_res = client.post(
        "/api/v1/lectures/upload",
        headers=auth_headers,
        files={"file": ("ml_intro.txt", content, "text/plain")},
        data={
            "title": "Intro to ML",
            "subject": "Artificial Intelligence",
            "targets": '["summary","flashcards","quiz"]',
        },
    )
    assert upload_res.status_code == 201
    upload_data = upload_res.json()
    lecture_id = upload_data["lecture_id"]
    assert isinstance(lecture_id, str)
    assert upload_data["status"] == "processing"

    status_res = client.get(
        f"/api/v1/lectures/{lecture_id}/status",
        headers=auth_headers,
    )
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "ready"
    assert status_res.json()["progress"] == 100

    detail_res = client.get(
        f"/api/v1/lectures/{lecture_id}",
        headers=auth_headers,
    )
    assert detail_res.status_code == 200
    lecture = detail_res.json()
    assert lecture["title"] == "Intro to ML"
    assert lecture["subject"] == "Artificial Intelligence"
    assert lecture["sourceType"] == "txt"
    assert lecture["status"] == "ready"
    assert len(lecture["segments"]) == 2
    assert "Supervised learning" in lecture["summary"]
    assert "keyTakeaways" in lecture
    assert "conceptNodes" in lecture
    assert "conceptEdges" in lecture
    assert lecture["flashcardCount"] == 2
    assert lecture["quizCount"] == 1


def test_upload_pdf_lecture_extracts_pages(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    pdf_bytes = _minimal_pdf_bytes()
    upload_res = client.post(
        "/api/v1/lectures/upload",
        headers=auth_headers,
        files={"file": ("slides.pdf", pdf_bytes, "application/pdf")},
        data={"title": "Optimization Slides", "subject": "ML"},
    )
    assert upload_res.status_code == 201
    lecture_id = upload_res.json()["lecture_id"]

    detail = client.get(f"/api/v1/lectures/{lecture_id}", headers=auth_headers).json()
    assert detail["sourceType"] == "pdf"
    assert detail["duration"] == "1 page"
    assert len(detail["segments"]) == 1
    assert "Gradient Descent Lecture" in detail["segments"][0]["text"]


def test_rejects_spoofed_magic_bytes_and_invalid_inputs(
    client: TestClient,
    auth_headers: dict[str, str],
    upload_dir: Path,
) -> None:
    spoofed = client.post(
        "/api/v1/lectures/upload",
        headers=auth_headers,
        files={"file": ("fake.pdf", b"<html>not pdf</html>", "application/pdf")},
    )
    assert spoofed.status_code == 400
    assert list(upload_dir.iterdir()) == []

    bad_ext = client.post(
        "/api/v1/lectures/upload",
        headers=auth_headers,
        files={"file": ("malware.exe", b"MZ...", "application/octet-stream")},
    )
    assert bad_ext.status_code == 400

    bad_targets = client.post(
        "/api/v1/lectures/upload",
        headers=auth_headers,
        files={"file": ("notes.txt", b"hello", "text/plain")},
        data={"targets": '["unknownTarget"]'},
    )
    assert bad_targets.status_code == 400

    empty = client.post(
        "/api/v1/lectures/upload",
        headers=auth_headers,
        files={"file": ("empty.txt", b"", "text/plain")},
    )
    assert empty.status_code == 400


def test_rejects_oversized_upload_and_cleans_up(
    client: TestClient,
    auth_headers: dict[str, str],
    upload_dir: Path,
    monkeypatch,
) -> None:
    monkeypatch.setattr(settings, "MAX_UPLOAD_SIZE_MB", 0)
    res = client.post(
        "/api/v1/lectures/upload",
        headers=auth_headers,
        files={"file": ("notes.txt", b"some content", "text/plain")},
    )
    assert res.status_code == 413
    assert list(upload_dir.iterdir()) == []


def test_user_isolation_and_delete_cleans_file(
    client: TestClient,
    auth_headers: dict[str, str],
    second_user_headers: dict[str, str],
    upload_dir: Path,
) -> None:
    upload_res = client.post(
        "/api/v1/lectures/upload",
        headers=auth_headers,
        files={"file": ("private.txt", b"Private lecture content", "text/plain")},
        data={"title": "Private Lecture"},
    )
    assert upload_res.status_code == 201
    lecture_id = upload_res.json()["lecture_id"]
    assert len(list(upload_dir.iterdir())) == 1

    # User 2 cannot list, inspect, poll, or delete User 1's lecture.
    list_u2 = client.get("/api/v1/lectures", headers=second_user_headers)
    assert list_u2.status_code == 200
    assert list_u2.json() == []

    assert (
        client.get(
            f"/api/v1/lectures/{lecture_id}", headers=second_user_headers
        ).status_code
        == 404
    )
    assert (
        client.get(
            f"/api/v1/lectures/{lecture_id}/status", headers=second_user_headers
        ).status_code
        == 404
    )
    assert (
        client.delete(
            f"/api/v1/lectures/{lecture_id}", headers=second_user_headers
        ).status_code
        == 404
    )

    # User 1 can delete it and remove the file on disk.
    del_res = client.delete(f"/api/v1/lectures/{lecture_id}", headers=auth_headers)
    assert del_res.status_code == 204
    assert list(upload_dir.iterdir()) == []
    assert (
        client.get(f"/api/v1/lectures/{lecture_id}", headers=auth_headers).status_code
        == 404
    )
