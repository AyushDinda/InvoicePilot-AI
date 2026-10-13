import os
import shutil
from pathlib import Path
from typing import Tuple
from PIL import Image
import fitz  # PyMuPDF
import pytesseract
from backend.schemas.ai import OCRResult

# Optional custom tesseract command path from environment
TESSERACT_CMD = os.getenv("TESSERACT_CMD", "")
if TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD


def is_tesseract_available() -> bool:
    try:
        if TESSERACT_CMD and Path(TESSERACT_CMD).exists():
            return True
        return shutil.which("tesseract") is not None
    except Exception:
        return False


def extract_text_from_pdf(pdf_path: Path) -> Tuple[str, bool]:
    """
    Attempts direct text extraction using PyMuPDF.
    Returns (extracted_text, has_sufficient_text).
    """
    text_content = []
    try:
        doc = fitz.open(pdf_path)
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            if text and text.strip():
                text_content.append(text.strip())
        doc.close()
    except Exception as e:
        return "", False

    full_text = "\n\n".join(text_content).strip()
    # If text is too short (e.g. under 20 chars), it may be a scanned PDF needing OCR
    has_sufficient_text = len(full_text) > 30
    return full_text, has_sufficient_text


def ocr_image(image_path: Path) -> OCRResult:
    """
    Performs OCR on an image file (PNG/JPG).
    """
    if not is_tesseract_available():
        return OCRResult(
            text="",
            source="tesseract_ocr",
            success=False,
            error="Tesseract OCR binary is not installed or not in PATH. Direct OCR unavailable.",
        )

    try:
        img = Image.open(image_path)
        # Convert RGBA/P to RGB for clean OCR
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        text = pytesseract.image_to_string(img)
        return OCRResult(
            text=text.strip(),
            source="tesseract_ocr",
            success=True,
            error=None,
        )
    except Exception as e:
        return OCRResult(
            text="",
            source="tesseract_ocr",
            success=False,
            error=f"OCR processing error: {str(e)}",
        )


def ocr_scanned_pdf(pdf_path: Path) -> OCRResult:
    """
    Renders pages of a scanned PDF as images and applies OCR.
    """
    if not is_tesseract_available():
        return OCRResult(
            text="",
            source="scanned_pdf_ocr",
            success=False,
            error="Tesseract OCR is not installed or configured on the system.",
        )

    try:
        doc = fitz.open(pdf_path)
        page_texts = []
        # Process up to first 5 pages to manage memory and performance
        max_pages = min(len(doc), 5)
        for page_num in range(max_pages):
            page = doc[page_num]
            pix = page.get_pixmap(dpi=150)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            text = pytesseract.image_to_string(img)
            if text and text.strip():
                page_texts.append(text.strip())
        doc.close()

        combined_text = "\n\n--- Page Break ---\n\n".join(page_texts).strip()
        return OCRResult(
            text=combined_text,
            source="scanned_pdf_ocr",
            success=True,
            error=None,
        )
    except Exception as e:
        return OCRResult(
            text="",
            source="scanned_pdf_ocr",
            success=False,
            error=f"Scanned PDF OCR failed: {str(e)}",
        )


def extract_document_text(file_path: Path, mime_type: str) -> OCRResult:
    """
    Main extraction pipeline:
    1. If PDF: Try direct PyMuPDF text extraction.
    2. If PDF direct text is empty/insufficient: Fallback to scanned PDF OCR.
    3. If Image (PNG/JPG): Perform image OCR.
    """
    ext = file_path.suffix.lower()

    if ext == ".pdf" or "pdf" in mime_type:
        text, sufficient = extract_text_from_pdf(file_path)
        if sufficient:
            return OCRResult(
                text=text,
                source="pdf_direct",
                success=True,
                error=None,
            )
        # Attempt OCR on scanned pages
        ocr_res = ocr_scanned_pdf(file_path)
        if ocr_res.success and ocr_res.text:
            return ocr_res
        # If OCR also returned empty or failed, return whatever direct text was found or error
        if text:
            return OCRResult(
                text=text,
                source="pdf_partial",
                success=True,
                error=None,
            )
        return ocr_res

    elif ext in {".png", ".jpg", ".jpeg"} or "image" in mime_type:
        return ocr_image(file_path)

    return OCRResult(
        text="",
        source="unknown",
        success=False,
        error=f"Unsupported document format: {ext}",
    )
