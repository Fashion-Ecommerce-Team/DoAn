
import re


ARTICLE_PATTERN = re.compile(
    r"(?m)^[ \t]*(Điều[ \t]+\d+[ \t]*[.:][^\n]*)",
    flags=re.IGNORECASE
)


def split_text(
    text: str,
    chunk_size: int = 700,
    chunk_overlap: int = 100
) -> list[str]:
    """
    Chia điều khoản dài thành các chunk nhỏ.
    Ưu tiên ngắt tại khoảng trắng.
    """
    if chunk_size <= 0:
        raise ValueError("chunk_size phải lớn hơn 0")

    if not 0 <= chunk_overlap < chunk_size:
        raise ValueError("chunk_overlap không hợp lệ")

    text = re.sub(r"\s+", " ", text).strip()

    if not text:
        return []

    chunks = []
    start = 0

    while start < len(text):
        end = min(start + chunk_size, len(text))

        if end < len(text):
            split_at = text.rfind(" ", start, end)

            if split_at > start:
                end = split_at

        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        if end >= len(text):
            break

        start = max(start + 1, end - chunk_overlap)

    return chunks


def prepare_document(documents: list[dict]):
    """
    Ghép các trang của cùng tài liệu thành một văn bản.

    Trả về:
    - full_text
    - danh sách vị trí ký tự và số trang
    """
    parts = []
    page_ranges = []
    current_position = 0

    for document in documents:
        text = document.get("text", "").strip()

        if not text:
            continue

        if parts:
            parts.append("\n")
            current_position += 1

        start = current_position

        parts.append(text)
        current_position += len(text)

        page_ranges.append({
            "start": start,
            "end": current_position,
            "page": document.get("page")
        })

    return "".join(parts), page_ranges


def get_pages(start: int, end: int, page_ranges: list[dict]):
    """
    Xác định các trang giao với khoảng ký tự.
    """
    pages = [
        item["page"]
        for item in page_ranges
        if item["page"] is not None
        and item["start"] < end
        and item["end"] > start
    ]

    if not pages:
        return None, None

    return min(pages), max(pages)


def chunk_documents(
    documents: list[dict],
    chunk_size: int = 700,
    chunk_overlap: int = 100
) -> list[dict]:
    """
    Chia tài liệu theo điều khoản.

    - Ghép các trang PDF trước khi chia.
    - Bỏ phần tiêu đề đứng trước Điều 1.
    - Giữ metadata trang bắt đầu/kết thúc.
    - Chia nhỏ điều khoản quá dài.
    """
    if not documents:
        return []

    if chunk_size <= 0 or not 0 <= chunk_overlap < chunk_size:
        raise ValueError("Cấu hình chunk không hợp lệ")

    # Gom theo tài liệu, giữ nguyên thứ tự xuất hiện.
    grouped = {}

    for document in documents:
        source = document.get("source", "unknown")
        grouped.setdefault(source, []).append(document)

    results = []

    for source, source_documents in grouped.items():
        full_text, page_ranges = prepare_document(
            source_documents
        )

        matches = list(
            ARTICLE_PATTERN.finditer(full_text)
        )

        if not matches:
            # Không có điều khoản: chia văn bản thông thường.
            for index, piece in enumerate(
                split_text(
                    full_text,
                    chunk_size,
                    chunk_overlap
                )
            ):
                results.append({
                    "source": source,
                    "page": None,
                    "page_end": None,
                    "article": None,
                    "chunk_index": index,
                    "text": piece,
                    "char_count": len(piece)
                })
            continue

        chunk_index = 0

        for index, match in enumerate(matches):
            article_start = match.start()

            article_end = (
                matches[index + 1].start()
                if index + 1 < len(matches)
                else len(full_text)
            )

            article_text = full_text[
                article_start:article_end
            ].strip()

            article_number_match = re.search(
                r"Điều\s+(\d+)",
                match.group(1),
                flags=re.IGNORECASE
            )

            article_number = (
                int(article_number_match.group(1))
                if article_number_match
                else None
            )

            pieces = (
                [article_text]
                if len(article_text) <= chunk_size
                else split_text(
                    article_text,
                    chunk_size,
                    chunk_overlap
                )
            )

            page_start, page_end = get_pages(
                article_start,
                article_end,
                page_ranges
            )

            for piece in pieces:
                results.append({
                    "source": source,
                    "page": page_start,
                    "page_end": page_end,
                    "article": article_number,
                    "chunk_index": chunk_index,
                    "text": piece,
                    "char_count": len(piece)
                })

                chunk_index += 1

    return results
