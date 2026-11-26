from typing import Any


def chunk_segments(
    segments: list[dict[str, Any]],
    max_words: int = 220,
    overlap_words: int = 40,
) -> list[dict[str, Any]]:
    """Split extracted lecture segments into overlapping word-bounded RAG chunks."""
    chunks: list[dict[str, Any]] = []
    chunk_index = 0
    step = max(1, max_words - overlap_words)

    for segment in segments:
        text = (segment.get("text") or "").strip()
        if not text:
            continue

        words = text.split()
        if len(words) <= max_words:
            chunks.append(
                {
                    "chunk_index": chunk_index,
                    "segment_id": str(segment.get("id", "")),
                    "label": str(segment.get("label", ""))[:255],
                    "reference": str(segment.get("reference", ""))[:255],
                    "text": text,
                }
            )
            chunk_index += 1
            continue

        for start in range(0, len(words), step):
            window = words[start : start + max_words]
            if not window:
                break
            chunks.append(
                {
                    "chunk_index": chunk_index,
                    "segment_id": str(segment.get("id", "")),
                    "label": str(segment.get("label", ""))[:255],
                    "reference": str(segment.get("reference", ""))[:255],
                    "text": " ".join(window),
                }
            )
            chunk_index += 1
            if start + max_words >= len(words):
                break

    return chunks
