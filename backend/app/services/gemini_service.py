import logging
import math
import re
from pathlib import Path
from typing import Any, Literal

from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from app.core.config import settings

logger = logging.getLogger(__name__)


class GeneratedConceptNode(BaseModel):
    id: str
    label: str
    x: float
    y: float
    kind: Literal["root", "branch", "leaf"] = "branch"


class GeneratedConceptEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str | None = None


class GeneratedFlashcard(BaseModel):
    front: str
    back: str
    hint: str | None = None


class GeneratedQuizQuestion(BaseModel):
    question: str
    options: list[str] = Field(min_length=2, max_length=6)
    correct_index: int = Field(ge=0)
    explanation: str
    source_ref: str = ""


class GeneratedQuiz(BaseModel):
    title: str
    difficulty: Literal["Easy", "Medium", "Hard"] = "Medium"
    estimated_minutes: int = Field(default=5, ge=1, le=60)
    questions: list[GeneratedQuizQuestion] = Field(default_factory=list)


class GeneratedStudyBundle(BaseModel):
    summary: str = ""
    key_takeaways: list[str] = Field(default_factory=list)
    concept_nodes: list[GeneratedConceptNode] = Field(default_factory=list)
    concept_edges: list[GeneratedConceptEdge] = Field(default_factory=list)
    flashcards: list[GeneratedFlashcard] = Field(default_factory=list)
    quiz: GeneratedQuiz | None = None


class GeneratedTranscriptSegment(BaseModel):
    label: str
    reference: str
    text: str


class GeneratedTranscript(BaseModel):
    duration: str
    segments: list[GeneratedTranscriptSegment]


def _get_client(client: genai.Client | None = None) -> genai.Client | None:
    if client is not None:
        return client
    api_key = settings.GEMINI_API_KEY.strip()
    if not api_key:
        return None
    return genai.Client(api_key=api_key)


def transcribe_audio_with_gemini(
    file_path: Path,
    lecture_id: int,
    content_type: str = "",
    client: genai.Client | None = None,
) -> tuple[str, list[dict[str, Any]], str]:
    """Transcribe an audio/video recording into timestamped segments via Gemini."""
    active_client = _get_client(client)
    if active_client is None:
        return "", [], "Audio uploaded"

    uploaded_file = active_client.files.upload(
        file=str(file_path),
        config=types.UploadFileConfig(mime_type=content_type) if content_type else None,
    )
    prompt = (
        "Transcribe this educational lecture recording accurately. "
        "Group the transcript into coherent topic segments with clear labels and "
        "timestamp references like '00:00 · 00:00–05:15', plus an overall duration "
        "estimate like '35 min'."
    )
    response = active_client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=[uploaded_file, prompt],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=GeneratedTranscript,
        ),
    )

    parsed = getattr(response, "parsed", None)
    if parsed is None and getattr(response, "text", None):
        parsed = GeneratedTranscript.model_validate_json(response.text)

    if parsed is None:
        return "", [], "Audio processed"

    segments: list[dict[str, Any]] = []
    full_text_parts: list[str] = []
    for idx, seg in enumerate(parsed.segments, start=1):
        full_text_parts.append(f"{seg.label}: {seg.text}")
        segments.append(
            {
                "id": f"{lecture_id}-a{idx}",
                "label": seg.label,
                "reference": seg.reference,
                "text": seg.text,
            }
        )

    return "\n\n".join(full_text_parts), segments, parsed.duration or "Audio"


def ocr_image_bytes_with_gemini(
    image_bytes: bytes,
    mime_type: str = "image/png",
    client: genai.Client | None = None,
) -> str:
    """Extract readable lecture text from a scanned slide or note image via Gemini."""
    active_client = _get_client(client)
    if active_client is None or not image_bytes:
        return ""

    part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
    response = active_client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=[
            part,
            "Transcribe all readable text, headings, equations, and bullet points from this lecture slide or page accurately.",
        ],
        config=types.GenerateContentConfig(temperature=0.1),
    )
    return (getattr(response, "text", None) or "").strip()


def _build_extractive_fallback_bundle(
    title: str,
    subject: str,
    extracted_text: str,
    segments: list[dict[str, Any]],
    targets: list[str],
) -> GeneratedStudyBundle:
    """Deterministic fallback generator when GEMINI_API_KEY is unset or unavailable."""
    sentences = [
        s.strip()
        for s in re.split(r"(?<=[.!?])\s+", extracted_text.strip())
        if len(s.strip()) > 20
    ]

    summary = ""
    takeaways: list[str] = []
    if "summary" in targets:
        if sentences:
            summary = " ".join(sentences[:3])
            takeaways = sentences[:4]
        elif extracted_text.strip():
            summary = extracted_text.strip()[:400]
            takeaways = [summary]
        else:
            summary = f"{title} ({subject}) is uploaded and ready for study."

    nodes: list[GeneratedConceptNode] = []
    edges: list[GeneratedConceptEdge] = []
    if "conceptMap" in targets:
        nodes.append(
            GeneratedConceptNode(id="root", label=title[:48], x=250, y=20, kind="root")
        )
        branch_segments = segments[:4]
        count = max(1, len(branch_segments))
        spacing = 460 / count
        for idx, seg in enumerate(branch_segments, start=1):
            node_id = f"node-{idx}"
            x_pos = round(40 + (idx - 0.5) * spacing)
            nodes.append(
                GeneratedConceptNode(
                    id=node_id,
                    label=str(seg.get("label") or f"Section {idx}")[:42],
                    x=x_pos,
                    y=150,
                    kind="branch",
                )
            )
            edges.append(
                GeneratedConceptEdge(
                    id=f"edge-{idx}",
                    source="root",
                    target=node_id,
                    label=str(seg.get("reference") or "")[:24] or None,
                )
            )

    flashcards: list[GeneratedFlashcard] = []
    if "flashcards" in targets and segments:
        for seg in segments[:5]:
            seg_text = (seg.get("text") or "").strip()
            if not seg_text:
                continue
            label = str(seg.get("label") or "Concept")
            ref = str(seg.get("reference") or "")
            flashcards.append(
                GeneratedFlashcard(
                    front=f"What are the main ideas covered in '{label}' ({title})?",
                    back=seg_text[:450],
                    hint=f"Review {ref}" if ref else None,
                )
            )

    quiz: GeneratedQuiz | None = None
    if "quiz" in targets and len(segments) >= 1:
        questions: list[GeneratedQuizQuestion] = []
        for idx, seg in enumerate(segments[:3], start=1):
            seg_text = (seg.get("text") or "").strip()
            if not seg_text:
                continue
            ref = str(seg.get("reference") or f"Section {idx}")
            snippet = seg_text[:140].rstrip(".")
            questions.append(
                GeneratedQuizQuestion(
                    question=f"Which statement best reflects '{seg.get('label', f'Section {idx}')}' in {title}?",
                    options=[
                        f"{snippet}.",
                        f"It rejects all concepts discussed in {subject}.",
                        "It states no foundational concepts are covered.",
                        "It focuses exclusively on unrelated historical trivia.",
                    ],
                    correct_index=0,
                    explanation=f"Directly supported by {ref}: {snippet}.",
                    source_ref=ref,
                )
            )
        if questions:
            quiz = GeneratedQuiz(
                title=f"{title} — Comprehension Check",
                difficulty="Medium",
                estimated_minutes=max(2, len(questions) * 2),
                questions=questions,
            )

    return GeneratedStudyBundle(
        summary=summary,
        key_takeaways=takeaways,
        concept_nodes=nodes,
        concept_edges=edges,
        flashcards=flashcards,
        quiz=quiz,
    )


def generate_study_bundle(
    title: str,
    subject: str,
    extracted_text: str,
    segments: list[dict[str, Any]],
    targets: list[str],
    client: genai.Client | None = None,
) -> GeneratedStudyBundle:
    """Generate structured study materials with Gemini or extractive fallback."""
    active_client = _get_client(client)
    if active_client is None or not extracted_text.strip():
        return _build_extractive_fallback_bundle(
            title=title,
            subject=subject,
            extracted_text=extracted_text,
            segments=segments,
            targets=targets,
        )

    trimmed_context = "\n\n".join(
        f"[{seg.get('reference', '')} | {seg.get('label', '')}]\n{seg.get('text', '')}"
        for seg in segments[:40]
    )[:30_000]
    if not trimmed_context:
        trimmed_context = extracted_text[:30_000]

    requested = ", ".join(targets) if targets else "summary"
    prompt = (
        f"You are an expert educational AI tutor. Analyze the lecture '{title}' "
        f"(subject: '{subject}') and produce ONLY the requested artifacts: [{requested}].\n"
        "- If 'summary' is requested: write a concise executive summary and 3-5 key_takeaways.\n"
        "- If 'conceptMap' is requested: create 5-9 hierarchical concept_nodes with root at "
        "(x=250, y=20, kind='root'), branches around y=140, leaves around y=260 spread across "
        "x in [40..460], plus descriptive concept_edges.\n"
        "- If 'flashcards' is requested: create 4-6 active-recall flashcards with helpful hints.\n"
        "- If 'quiz' is requested: create a quiz with 3-5 multiple-choice questions, 4 options each, "
        "valid 0-based correct_index, concise explanation, and source_ref matching the lecture references.\n"
        "Leave unrequested artifact lists empty (and quiz=null).\n\n"
        f"LECTURE CONTENT:\n{trimmed_context}"
    )

    try:
        response = active_client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GeneratedStudyBundle,
                temperature=0.3,
            ),
        )
        parsed = getattr(response, "parsed", None)
        if parsed is None and getattr(response, "text", None):
            parsed = GeneratedStudyBundle.model_validate_json(response.text)
        if parsed is not None:
            return parsed
    except Exception as exc:
        logger.warning("Gemini generation failed; using fallback bundle: %s", exc)

    return _build_extractive_fallback_bundle(
        title=title,
        subject=subject,
        extracted_text=extracted_text,
        segments=segments,
        targets=targets,
    )


def embed_texts(
    texts: list[str],
    client: genai.Client | None = None,
) -> list[list[float] | None]:
    """Generate embedding vectors via Gemini, returning None entries when unavailable."""
    if not texts:
        return []
    active_client = _get_client(client)
    if active_client is None:
        return [None for _ in texts]

    results: list[list[float] | None] = []
    batch_size = 32
    for start in range(0, len(texts), batch_size):
        batch = [t[:8000] for t in texts[start : start + batch_size]]
        try:
            response = active_client.models.embed_content(
                model=settings.GEMINI_EMBEDDING_MODEL,
                contents=batch,
            )
            embeddings = getattr(response, "embeddings", None) or []
            for item in embeddings:
                values = getattr(item, "values", None)
                results.append(list(values) if values else None)
            while len(results) < start + len(batch):
                results.append(None)
        except Exception as exc:
            logger.warning("Gemini embedding batch failed: %s", exc)
            results.extend([None for _ in batch])

    return results


def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Compute cosine similarity safely between two equal-length float vectors."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


def answer_grounded_question(
    question: str,
    context_chunks: list[dict[str, Any]],
    client: genai.Client | None = None,
) -> str:
    """Synthesize a source-grounded tutor answer from retrieved lecture chunks."""
    if not context_chunks:
        return (
            "I could not find relevant material in your uploaded lectures for that question. "
            "Try uploading or selecting a lecture covering this topic."
        )

    active_client = _get_client(client)
    if active_client is not None:
        context_block = "\n\n".join(
            f"[Source {i}: {c['lectureTitle']} | {c['reference']}]\n{c['text']}"
            for i, c in enumerate(context_chunks, start=1)
        )
        prompt = (
            "You are Lecture-to-Life's AI Study Tutor. Answer the student's question using ONLY "
            "the lecture excerpts below. Cite references inline (e.g., Page 2 or Section 1). "
            "If the excerpts do not contain the answer, state that clearly.\n\n"
            f"EXCERPTS:\n{context_block}\n\nQUESTION: {question}"
        )
        try:
            response = active_client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.2),
            )
            text = (getattr(response, "text", None) or "").strip()
            if text:
                return text
        except Exception as exc:
            logger.warning("Gemini tutor generation failed; using extractive reply: %s", exc)

    top = context_chunks[0]
    supporting = "\n".join(
        f"- ({c['lectureTitle']} — {c['reference']}): {c['text'][:240].strip()}"
        for c in context_chunks[:3]
    )
    return (
        f"Based on \"{top['lectureTitle']}\" ({top['reference']}):\n\n"
        f"{top['text'][:500].strip()}\n\n"
        f"Supporting excerpts:\n{supporting}"
    )
