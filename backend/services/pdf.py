import base64
import io

import fitz  # PyMuPDF
import pdfplumber


def extract_text(pdf_bytes: bytes) -> str:
    """Extract plain text from a PDF byte string.

    Tries pdfplumber first (fast, no API cost). Falls back to PyMuPDF.
    If both return nothing, returns empty string — caller should use OCR fallback.
    """
    # Strategy 1: pdfplumber
    text_parts: list[str] = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or page.extract_text(layout=True)
            if not text:
                words = page.extract_words()
                if words:
                    text = " ".join(w["text"] for w in words)
            if text and text.strip():
                text_parts.append(text.strip())

    if text_parts:
        return "\n\n".join(text_parts)

    # Strategy 2: PyMuPDF (handles more PDF types)
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    for page in doc:
        text = page.get_text()
        if text and text.strip():
            text_parts.append(text.strip())
    doc.close()

    return "\n\n".join(text_parts)


def pdf_pages_as_base64_images(pdf_bytes: bytes, dpi: int = 150) -> list[str]:
    """Render each PDF page to a PNG and return as base64 strings."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    images: list[str] = []
    matrix = fitz.Matrix(dpi / 72, dpi / 72)
    for page in doc:
        pix = page.get_pixmap(matrix=matrix)
        png_bytes = pix.tobytes("png")
        images.append(base64.b64encode(png_bytes).decode())
    doc.close()
    return images
