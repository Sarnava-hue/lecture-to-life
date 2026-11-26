import io
from types import SimpleNamespace

import docx
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.models.lecture_chunk import LectureChunk
from app.services.gemini_service import (
    GeneratedConceptEdge,
    GeneratedConceptNode,
    GeneratedFlashcard,
    GeneratedQuiz,
    GeneratedQuizQuestion,
    GeneratedStudyBundle,
    GeneratedTranscript,
    GeneratedTranscriptSegment,
)


def _build_sample_docx() -> bytes:
    document = docx.Document()
    document.add_heading("Neural Networks Overview", level=1)
    document.add_paragraph(
        "Artificial neural networks compose layers of linear transformations "
        "followed by non-linear activation functions such as ReLU."
    )
    document.add_heading("Backpropagation", level=1)
    document.add_paragraph(
        "Backpropagation applies the chain rule of calculus to propagate loss "
        "gradients from the output layer backward to earlier weights."
    )
    buffer = io.BytesIO()
    document.save(buffer)
    return buffer.getvalue()


class _FakeFilesAPI:
    def upload(self, **_kwargs):
        return SimpleNamespace(uri="files/fake-audio")


class _FakeModelsAPI:
    def generate_content(self, *, contents, config=None, **_kwargs):
        schema = getattr(config, "response_schema", None)
        if schema is GeneratedTranscript:
            return SimpleNamespace(
                parsed=GeneratedTranscript(
                    duration="18 min",
                    segments=[
                        GeneratedTranscriptSegment(
                            label="Gradient Descent Intro",
                            reference="00:00 · 00:00–09:00",
                            text="Gradient descent updates parameters opposite the loss gradient.",
                        ),
                        GeneratedTranscriptSegment(
                            label="Learning Rate Schedules",
                            reference="09:00 · 09:00–18:00",
                            text="Cosine annealing smoothly decays the step size toward convergence.",
                        ),
                    ],
                )
            )
        if schema is GeneratedStudyBundle:
            return SimpleNamespace(
                parsed=GeneratedStudyBundle(
                    summary="Covers gradient descent and learning rate schedules.",
                    key_takeaways=[
                        "Update weights opposite to the gradient.",
                        "Cosine annealing reduces learning rate smoothly.",
                    ],
                    concept_nodes=[
                        GeneratedConceptNode(
                            id="gd", label="Gradient Descent", x=250, y=20, kind="root"
                        ),
                        GeneratedConceptNode(
                            id="lr", label="Learning Rate", x=250, y=140, kind="branch"
                        ),
                    ],
                    concept_edges=[
                        GeneratedConceptEdge(
                            id="e1", source="gd", target="lr", label="scaled by"
                        )
                    ],
                    flashcards=[
                        GeneratedFlashcard(
                            front="Which direction does gradient descent step?",
                            back="Opposite the gradient of the loss function.",
                            hint="Minimizing loss",
                        )
                    ],
                    quiz=GeneratedQuiz(
                        title="Optimization Check",
                        difficulty="Easy",
                        estimated_minutes=3,
                        questions=[
                            GeneratedQuizQuestion(
                                question="What does cosine annealing decay?",
                                options=["Learning rate", "Batch size", "Epochs", "Features"],
                                correct_index=0,
                                explanation="Cosine annealing schedules the learning rate.",
                                source_ref="09:00 · 09:00–18:00",
                            )
                        ],
                    ),
                )
            )
        # Grounded tutor response
        return SimpleNamespace(
            text="Cosine annealing smoothly decays the learning rate (09:00 · 09:00–18:00)."
        )

    def embed_content(self, *, contents, **_kwargs):
        vectors = []
        for item in contents:
            lower = str(item).lower()
            vectors.append(
                SimpleNamespace(
                    values=[
                        1.0 if "cosine" in lower or "learning rate" in lower else 0.2,
                        1.0 if "gradient" in lower else 0.1,
                    ]
                )
            )
        return SimpleNamespace(embeddings=vectors)


class _FakeGeminiClient:
    def __init__(self) -> None:
        self.files = _FakeFilesAPI()
        self.models = _FakeModelsAPI()


def test_docx_upload_generates_study_artifacts(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    docx_bytes = _build_sample_docx()
    res = client.post(
        "/api/v1/lectures/upload",
        headers=auth_headers,
        files={
            "file": (
                "neural_nets.docx",
                docx_bytes,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
        data={
            "title": "Neural Networks",
            "subject": "Deep Learning",
            "targets": '["summary","flashcards","quiz","conceptMap"]',
        },
    )
    assert res.status_code == 201
    lecture_id = res.json()["lecture_id"]

    lecture = client.get(
        f"/api/v1/lectures/{lecture_id}", headers=auth_headers
    ).json()
    assert lecture["status"] == "ready"
    assert lecture["sourceType"] == "docx"
    assert len(lecture["segments"]) == 2
    assert lecture["summary"]
    assert len(lecture["keyTakeaways"]) >= 1
    assert len(lecture["conceptNodes"]) >= 2
    assert len(lecture["conceptEdges"]) >= 1
    assert lecture["flashcardCount"] >= 1
    assert lecture["quizCount"] == 1


def test_mocked_gemini_audio_pipeline_and_vector_rag(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session_factory: sessionmaker,
) -> None:
    app.state.gemini_client = _FakeGeminiClient()

    upload = client.post(
        "/api/v1/lectures/upload",
        headers=auth_headers,
        files={"file": ("lecture.mp3", b"ID3fake-mp3-audio", "audio/mpeg")},
        data={
            "title": "Optimization Audio",
            "subject": "ML",
            "targets": '["summary","flashcards","quiz","conceptMap"]',
        },
    )
    assert upload.status_code == 201
    lecture_id = upload.json()["lecture_id"]

    lecture = client.get(
        f"/api/v1/lectures/{lecture_id}", headers=auth_headers
    ).json()
    assert lecture["sourceType"] == "audio"
    assert lecture["duration"] == "18 min"
    assert lecture["summary"] == "Covers gradient descent and learning rate schedules."
    assert lecture["flashcardCount"] == 1
    assert lecture["quizCount"] == 1

    with db_session_factory() as db:
        chunks = db.scalars(
            select(LectureChunk).where(LectureChunk.document_id == int(lecture_id))
        ).all()
        assert len(chunks) == 2
        assert all(isinstance(c.embedding, list) and len(c.embedding) == 2 for c in chunks)

    tutor_res = client.post(
        "/api/v1/tutor/ask",
        headers=auth_headers,
        json={
            "question": "How does cosine annealing affect the learning rate?",
            "lectureId": lecture_id,
        },
    )
    assert tutor_res.status_code == 200
    body = tutor_res.json()
    assert "Cosine annealing" in body["answer"]
    assert len(body["citations"]) >= 1
    assert body["citations"][0]["lectureId"] == lecture_id
