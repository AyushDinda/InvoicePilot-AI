import os
import re
import hashlib
import uuid
from pathlib import Path
from typing import Tuple, Optional

STORAGE_DIR = os.getenv("STORAGE_DIR", "./storage/documents")
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/octet-stream",  # often provided by certain browsers for binary files
}


def get_absolute_storage_dir() -> Path:
    storage_path = Path(STORAGE_DIR).resolve()
    storage_path.mkdir(parents=True, exist_ok=True)
    return storage_path


def validate_file(filename: str, content_type: Optional[str] = None, file_size: Optional[int] = None) -> Tuple[bool, str]:
    if not filename:
        return False, "Filename cannot be empty"

    # Reject null bytes and path traversal patterns in filename
    if "\x00" in filename or ".." in filename or "/" in filename or "\\" in filename:
        return False, "Invalid filename with potential path traversal characters"

    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Unsupported file extension '{ext}'. Allowed extensions: PDF, JPG, JPEG, PNG"

    if content_type and content_type.lower() not in ALLOWED_MIME_TYPES:
        return False, f"Unsupported content type '{content_type}'"

    if file_size is not None and file_size > MAX_FILE_SIZE:
        return False, f"File exceeds maximum size limit of {MAX_FILE_SIZE // (1024 * 1024)} MB"

    return True, ""


def compute_sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def save_upload_file(content: bytes, original_filename: str) -> Tuple[str, str, int]:
    """
    Saves file bytes securely into STORAGE_DIR using a generated UUID internal name.
    Returns (internal_filename, file_hash, file_size).
    """
    if len(content) > MAX_FILE_SIZE:
        raise ValueError(f"File exceeds maximum size limit of {MAX_FILE_SIZE // (1024 * 1024)} MB")

    ext = Path(original_filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".bin"

    internal_filename = f"{uuid.uuid4().hex}{ext}"
    storage_path = get_absolute_storage_dir()
    file_path = (storage_path / internal_filename).resolve()

    # Guard against path traversal
    if not str(file_path).startswith(str(storage_path)):
        raise ValueError("Invalid target path detected")

    with open(file_path, "wb") as f:
        f.write(content)

    file_hash = compute_sha256(content)
    return internal_filename, file_hash, len(content)


def get_file_path(internal_filename: str) -> Path:
    """
    Returns absolute Path for given internal filename, verifying it is within storage directory.
    """
    if "\x00" in internal_filename or ".." in internal_filename or "/" in internal_filename or "\\" in internal_filename:
        raise ValueError("Path traversal sequence detected")

    storage_path = get_absolute_storage_dir()
    file_path = (storage_path / internal_filename).resolve()

    if not str(file_path).startswith(str(storage_path)):
        raise ValueError("Path traversal outside storage directory detected")

    return file_path


def delete_stored_file(internal_filename: str) -> bool:
    """
    Deletes the file from disk safely. Returns True if deleted or did not exist.
    """
    try:
        file_path = get_file_path(internal_filename)
        if file_path.exists():
            file_path.unlink()
        return True
    except Exception:
        return False
