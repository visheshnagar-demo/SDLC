import os
from typing import Optional
from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import User, Product, Document
from server.schemas import (
    DocumentResponse,
    DocumentListResponse,
)
from server.auth import get_current_active_user
from server.services.storage import (
    validate_file,
    save_uploaded_file,
    delete_file,
)
from server.config import settings

router = APIRouter(prefix="/documents", tags=["Documents"])


def build_document_response(doc: Document) -> DocumentResponse:
    download_url = f"{settings.API_V1_STR}/documents/{doc.id}/download"
    return DocumentResponse(
        id=doc.id,
        product_id=doc.product_id,
        filename=doc.filename,
        file_size=doc.file_size,
        mime_type=doc.mime_type,
        document_type=doc.document_type,
        download_url=download_url,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


@router.post(
    "/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED
)
async def upload_document(
    product_id: str = Form(...),
    document_type: str = Form("receipt"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    # Verify product ownership
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.user_id == current_user.id)
        .first()
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID '{product_id}' not found.",
        )

    # Initial file metadata validation
    validate_file(file)

    # Save file and get verified size & path
    unique_filename, file_path, file_size, relative_path = await save_uploaded_file(
        file, product.id
    )

    doc = Document(
        product_id=product.id,
        filename=file.filename or unique_filename,
        file_size=file_size,
        mime_type=file.content_type or "application/octet-stream",
        document_type=document_type,
        file_path=file_path,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return build_document_response(doc)


@router.get("", response_model=DocumentListResponse)
def list_documents(
    product_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Document)
        .join(Product, Document.product_id == Product.id)
        .filter(Product.user_id == current_user.id)
    )

    if product_id:
        query = query.filter(Document.product_id == product_id)

    items = query.order_by(Document.created_at.desc()).all()
    return DocumentListResponse(
        items=[build_document_response(doc) for doc in items],
        total=len(items),
    )


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document_metadata(
    document_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    doc = (
        db.query(Document)
        .join(Product, Document.product_id == Product.id)
        .filter(Document.id == document_id, Product.user_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' not found.",
        )

    return build_document_response(doc)


@router.get("/{document_id}/download")
def download_document(
    document_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    doc = (
        db.query(Document)
        .join(Product, Document.product_id == Product.id)
        .filter(Document.id == document_id, Product.user_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' not found.",
        )

    if not os.path.exists(doc.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested file was not found on the server filesystem.",
        )

    return FileResponse(
        path=doc.file_path,
        media_type=doc.mime_type,
        filename=doc.filename,
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    doc = (
        db.query(Document)
        .join(Product, Document.product_id == Product.id)
        .filter(Document.id == document_id, Product.user_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' not found.",
        )

    # Delete physical file
    delete_file(doc.file_path)

    db.delete(doc)
    db.commit()
    return None
