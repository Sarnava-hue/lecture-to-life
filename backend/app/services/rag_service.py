import re
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.lecture_chunk import LectureChunk
from app.services.gemini_service import (
    answer_grounded_question,
    cosine_similarity,
    embed_texts,
)

_STOPWORDS = frozenset(
    {
        "what",
        "when",
        "where",
        "which",
        "while",
        "with",
        "from",
        "that",
        "this",
        "these",
        "those",
        "about",
        "into",
        "your",
        "have",
        "does",
        "explain",
        "compare",
        "summarize",
        "between",
    }
)


def _tokenize(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-z0-9]{3,}", text.lower())
        if token not in _STOPWORDS
    }


def retrieve_relevant_chunks(
    db: Session,
    user_id: int,
    question: str,
    document_id: int | None = None,
    top_k: int = 5,
    gemini_client: Any = None,
) -> list[dict[str, Any]]:
    """Rank user-owned lecture chunks with hybrid semantic + lexical similarity."""
    stmt = (
        select(LectureChunk, Document.title)
        .join(Document, LectureChunk.document_id == Document.id)
        .where(LectureChunk.user_id == user_id)
    )
    if document_id is not None:
        stmt = stmt.where(LectureChunk.document_id == document_id)

    rows = db.execute(stmt).all()
    if not rows:
        return []

    query_tokens = _tokenize(question)
    has_embeddings = any(chunk.embedding for chunk, _ in rows)
    query_embedding: list[float] | None = None
    if has_embeddings:
        query_embedding = embed_texts([question], client=gemini_client)[0]

    scored: list[tuple[float, LectureChunk, str]] = []
    for chunk, lecture_title in rows:
        chunk_tokens = _tokenize(f"{chunk.label} {chunk.text}")
        if query_tokens and chunk_tokens:
            overlap = len(query_tokens & chunk_tokens) / len(query_tokens)
        else:
            overlap = 0.0

        semantic = (
            max(0.0, cosine_similarity(query_embedding, chunk.embedding))
            if query_embedding and chunk.embedding
            else 0.0
        )

        score = (0.7 * semantic + 0.3 * overlap) if query_embedding else overlap
        scored.append((score, chunk, lecture_title))

    scored.sort(key=lambda item: (item[0], -item[1].chunk_index), reverse=True)
    selected = scored[:top_k]

    return [
        {
            "chunkId": chunk.id,
            "lectureId": str(chunk.document_id),
            "lectureTitle": lecture_title or "Lecture",
            "reference": chunk.reference or chunk.label or f"Chunk {chunk.chunk_index + 1}",
            "text": chunk.text,
            "score": round(score, 4),
        }
        for score, chunk, lecture_title in selected
    ]


def ask_tutor_with_rag(
    db: Session,
    user_id: int,
    question: str,
    document_id: int | None = None,
    gemini_client: Any = None,
) -> tuple[str, list[dict[str, str]]]:
    """Retrieve grounded lecture chunks and synthesize a cited tutor answer."""
    chunks = retrieve_relevant_chunks(
        db=db,
        user_id=user_id,
        question=question,
        document_id=document_id,
        top_k=4,
        gemini_client=gemini_client,
    )
    answer = answer_grounded_question(
        question=question,
        context_chunks=chunks,
        client=gemini_client,
    )

    seen_citations: set[tuple[str, str]] = set()
    citations: list[dict[str, str]] = []
    for chunk in chunks:
        key = (chunk["lectureId"], chunk["reference"])
        if key not in seen_citations:
            seen_citations.add(key)
            citations.append(
                {
                    "lectureId": chunk["lectureId"],
                    "lectureTitle": chunk["lectureTitle"],
                    "reference": chunk["reference"],
                }
            )

    return answer, citations
