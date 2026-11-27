from pathlib import Path
from typing import Any

from sqlalchemy import delete
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.document import Document
from app.models.flashcard import Flashcard
from app.models.lecture_chunk import LectureChunk
from app.models.quiz import Quiz, QuizQuestion
from app.models.tutor import StudyActivityLog
from app.services.chunking_service import chunk_segments
from app.services.extraction_service import extract_lecture_content
from app.services.gemini_service import embed_texts, generate_study_bundle
from app.utils.file_utils import resolve_safe_stored_path


def process_lecture_background(
    lecture_id: int,
    session_factory: sessionmaker = SessionLocal,
    upload_dir: Path | None = None,
    gemini_client: Any = None,
) -> None:
    """Extract lecture text, index RAG chunks, and generate AI study artifacts."""
    base_upload_dir = (upload_dir or settings.upload_dir_path).resolve()

    with session_factory() as db:
        document = db.get(Document, lecture_id)
        if document is None:
            return

        try:
            file_path = resolve_safe_stored_path(
                document.storage_path, upload_dir=base_upload_dir
            )
            if file_path is None:
                raise FileNotFoundError("Lecture file path could not be resolved.")

            extracted_text, segments, duration = extract_lecture_content(
                file_path=file_path,
                source_type=document.source_type,
                lecture_id=document.id,
                content_type=document.content_type,
                gemini_client=gemini_client,
            )

            document.extracted_text = extracted_text or None
            document.segments = segments
            document.duration = duration
            document.progress = 40
            db.commit()

            # Replace existing chunks cleanly so reprocessing never duplicates RAG index rows.
            db.execute(
                delete(LectureChunk).where(LectureChunk.document_id == document.id)
            )
            raw_chunks = chunk_segments(segments)
            embeddings = embed_texts(
                [c["text"] for c in raw_chunks], client=gemini_client
            )
            for chunk_data, vector in zip(raw_chunks, embeddings):
                db.add(
                    LectureChunk(
                        document_id=document.id,
                        user_id=document.user_id,
                        chunk_index=chunk_data["chunk_index"],
                        segment_id=chunk_data["segment_id"],
                        label=chunk_data["label"],
                        reference=chunk_data["reference"],
                        text=chunk_data["text"],
                        embedding=vector,
                    )
                )

            document.progress = 70
            db.commit()

            targets = list(document.targets or ["summary"])
            bundle = generate_study_bundle(
                title=document.title or document.filename,
                subject=document.subject or "General",
                extracted_text=extracted_text,
                segments=segments,
                targets=targets,
                client=gemini_client,
            )

            document.summary = (
                bundle.summary
                or (extracted_text[:400].strip() if extracted_text else "")
                or f"Uploaded {document.source_type.upper()} file ready for study."
            )
            document.key_takeaways = list(bundle.key_takeaways)
            document.concept_nodes = [n.model_dump() for n in bundle.concept_nodes]
            document.concept_edges = [e.model_dump() for e in bundle.concept_edges]

            if "flashcards" in targets:
                db.execute(
                    delete(Flashcard).where(Flashcard.document_id == document.id)
                )
                for card in bundle.flashcards:
                    db.add(
                        Flashcard(
                            user_id=document.user_id,
                            document_id=document.id,
                            front=card.front,
                            back=card.back,
                            hint=card.hint,
                            mastery="new",
                            next_review_label="New card",
                        )
                    )

            if "quiz" in targets and bundle.quiz and bundle.quiz.questions:
                existing_quizzes = db.query(Quiz).filter(
                    Quiz.document_id == document.id
                ).all()
                for existing_quiz in existing_quizzes:
                    db.delete(existing_quiz)
                db.flush()

                quiz = Quiz(
                    user_id=document.user_id,
                    document_id=document.id,
                    title=bundle.quiz.title[:255],
                    difficulty=bundle.quiz.difficulty,
                    estimated_minutes=bundle.quiz.estimated_minutes,
                )
                db.add(quiz)
                db.flush()
                for q_index, q in enumerate(bundle.quiz.questions):
                    safe_correct = min(max(0, q.correct_index), len(q.options) - 1)
                    db.add(
                        QuizQuestion(
                            quiz_id=quiz.id,
                            question_index=q_index,
                            question=q.question,
                            options=list(q.options),
                            correct_index=safe_correct,
                            explanation=q.explanation,
                            source_ref=q.source_ref[:255],
                        )
                    )

            db.add(
                StudyActivityLog(
                    user_id=document.user_id,
                    document_id=document.id,
                    activity_type="lecture_processed",
                    duration_seconds=120,
                    cards_count=0,
                )
            )

            document.status = "ready"
            document.progress = 100
            document.error_message = None
            db.commit()
        except Exception as exc:
            db.rollback()
            document = db.get(Document, lecture_id)
            if document is not None:
                document.status = "failed"
                document.progress = 0
                document.error_message = str(exc)
                db.commit()
