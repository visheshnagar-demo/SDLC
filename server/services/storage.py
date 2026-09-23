import os
import uuid
from typing import Tuple
from fastapi import UploadFile, HTTPException, status
from server.config import settings


def ensure_upload_dir() -> str:
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)
    return upload_dir


def validate_file(file: UploadFile, content_length: int = 0) -> None:
    # Validate mime type
    mime_type = file.content_type
    if mime_type not in settings.ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: '{mime_type}'. Supported formats are: PDF, PNG, JPEG.",
        )

    # Validate file size if content_length is provided
    if content_length > settings.MAX_FILE_SIZE:
        max_mb = settings.MAX_FILE_SIZE // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum allowed limit of {max_mb}MB.",
        )


async def save_uploaded_file(
    file: UploadFile, product_id: str
) -> Tuple[str, str, int, str]:
    upload_dir = ensure_upload_dir()
    product_dir = os.path.join(upload_dir, product_id)
    os.makedirs(product_dir, exist_ok=True)

    filename_str = file.filename or "uploaded_file.bin"
    file_extension = os.path.splitext(filename_str)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    target_path = os.path.join(product_dir, unique_filename)

    # Read and validate actual file size
    file_bytes = await file.read()
    file_size = len(file_bytes)

    if file_size > settings.MAX_FILE_SIZE:
        max_mb = settings.MAX_FILE_SIZE // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size ({file_size} bytes) exceeds maximum limit of {max_mb}MB.",
        )

    if file.content_type not in settings.ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format: {file.content_type}. Allowed: PDF, PNG, JPEG.",
        )

    with open(target_path, "wb") as f:
        f.write(file_bytes)

    relative_path = os.path.relpath(target_path, upload_dir)
    return unique_filename, target_path, file_size, relative_path


def delete_file(file_path: str) -> bool:
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
    except Exception:
        pass
    return False
