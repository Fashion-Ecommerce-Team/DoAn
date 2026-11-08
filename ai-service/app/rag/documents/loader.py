
from pathlib import Path

from pypdf import PdfReader
from docx import Document


def load_pdf(file_path: str) -> list[dict]:
    """
    Đọc tài liệu PDF và lưu nội dung theo từng trang.
    """
    reader = PdfReader(file_path)
    pages = []

    for page_number, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""

        if text.strip():
            pages.append({
                "source": Path(file_path).name,
                "page": page_number,
                "text": text.strip()
            })

    return pages


def load_docx(file_path: str) -> list[dict]:
    """
    Đọc nội dung các đoạn văn trong file DOCX.
    """
    document = Document(file_path)

    paragraphs = [
        paragraph.text.strip()
        for paragraph in document.paragraphs
        if paragraph.text.strip()
    ]

    return [{
        "source": Path(file_path).name,
        "page": None,
        "text": "\n".join(paragraphs)
    }]


def load_policy_document(file_path: str) -> list[dict]:
    """
    Tự động nhận diện PDF hoặc DOCX.
    """
    extension = Path(file_path).suffix.lower()

    if extension == ".pdf":
        return load_pdf(file_path)

    if extension == ".docx":
        return load_docx(file_path)

    raise ValueError(
        f"Định dạng tài liệu không được hỗ trợ: {extension}"
    )
