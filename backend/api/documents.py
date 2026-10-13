import os
import json
import uuid
from typing import List, Optional
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from backend.database.session import get_db
from backend.models.document import Document
from backend.schemas.document import (
    DocumentResponse,
    DocumentListResponse,
    DocumentUpdate,
    DuplicateInfo,
    VALID_CATEGORIES,
    VALID_DOCUMENT_TYPES,
)
from backend.services.storage_service import (
    validate_file,
    save_upload_file,
    delete_stored_file,
    get_file_path,
)
from backend.services.extractor_service import extract_document_text
from backend.services.ai_service import extract_with_ollama
from backend.services.duplicate_service import check_for_duplicates

router = APIRouter(prefix="/api/documents", tags=["documents"])


def parse_doc_response(doc: Document) -> DocumentResponse:
    confidence_data = None
    if doc.confidence_scores:
        try:
            confidence_data = json.loads(doc.confidence_scores)
        except Exception:
            pass

    extracted_data = None
    if doc.extracted_data:
        try:
            extracted_data = json.loads(doc.extracted_data)
        except Exception:
            pass

    return DocumentResponse(
        id=doc.id,
        internal_filename=doc.internal_filename,
        original_filename=doc.original_filename,
        file_hash=doc.file_hash,
        file_size=doc.file_size,
        mime_type=doc.mime_type,
        vendor=doc.vendor,
        invoice_number=doc.invoice_number,
        invoice_date=doc.invoice_date,
        due_date=doc.due_date,
        currency=doc.currency or "USD",
        subtotal=doc.subtotal,
        tax=doc.tax,
        total=doc.total,
        category=doc.category or "Other",
        document_type=doc.document_type or "Invoice",
        description=doc.description,
        processing_status=doc.processing_status,
        error_message=doc.error_message,
        review_status=doc.review_status,
        is_duplicate=doc.is_duplicate,
        duplicate_reason=doc.duplicate_reason,
        duplicate_of_id=doc.duplicate_of_id,
        confidence_scores=confidence_data,
        raw_text=doc.raw_text,
        extracted_data=extracted_data,
        ai_model_used=doc.ai_model_used,
        is_mock_extraction=doc.is_mock_extraction,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


async def process_document_pipeline(
    doc: Document,
    db: Session,
    force_mock: bool = False
) -> Document:
    """
    Executes extraction pipeline: OCR -> AI Extraction -> Duplicate Check -> DB update.
    Does not throw; catches errors and updates processing_status="failed".
    """
    doc.processing_status = "processing"
    doc.error_message = None
    db.commit()
    db.refresh(doc)

    try:
        file_path = get_file_path(doc.internal_filename)
        # Step 1: Extract text (Direct PDF or OCR)
        ocr_res = extract_document_text(file_path, doc.mime_type)
        doc.raw_text = ocr_res.text

        if not ocr_res.text or not ocr_res.text.strip():
            # If no text could be obtained from direct extraction or OCR
            err_msg = ocr_res.error or "No readable text could be extracted from document."
            doc.processing_status = "failed"
            doc.error_message = f"Text extraction failed: {err_msg}"
            db.commit()
            return doc

        # Step 2: AI extraction (Ollama or Mock Mode)
        extracted, conf, is_mock, model_used = await extract_with_ollama(
            text=ocr_res.text,
            filename=doc.original_filename,
            force_mock=force_mock,
        )

        doc.vendor = extracted.vendor
        doc.invoice_number = extracted.invoice_number
        doc.invoice_date = extracted.invoice_date
        doc.due_date = extracted.due_date
        doc.currency = extracted.currency or "USD"
        doc.subtotal = extracted.subtotal
        doc.tax = extracted.tax
        doc.total = extracted.total
        doc.category = extracted.category or "Other"
        doc.document_type = extracted.document_type or "Invoice"
        doc.description = extracted.description

        doc.confidence_scores = json.dumps(conf)
        doc.extracted_data = json.dumps(extracted.model_dump())
        doc.ai_model_used = model_used
        doc.is_mock_extraction = is_mock
        doc.processing_status = "completed"
        doc.review_status = "needs_review"

        # Step 3: Duplicate check
        is_dup, dup_reason, dup_id = check_for_duplicates(
            db=db,
            document_id=doc.id,
            file_hash=doc.file_hash,
            vendor=doc.vendor,
            invoice_number=doc.invoice_number,
            invoice_date=doc.invoice_date,
            total=doc.total,
        )
        doc.is_duplicate = is_dup
        doc.duplicate_reason = dup_reason
        doc.duplicate_of_id = dup_id

        db.commit()
        db.refresh(doc)
        return doc

    except Exception as e:
        doc.processing_status = "failed"
        doc.error_message = str(e)
        db.commit()
        db.refresh(doc)
        return doc


@router.post("/upload", response_model=List[DocumentResponse])
async def upload_documents(
    files: List[UploadFile] = File(...),
    force_mock: bool = Query(False, description="Force mock extraction for testing"),
    db: Session = Depends(get_db),
):
    """
    Handles single and batch document uploads.
    Validates MIME type, extension, size, and saves securely.
    Processes each document without losing successful files if one fails.
    """
    results: List[DocumentResponse] = []

    for file in files:
        original_name = file.filename or "unknown_document"
        content_type = file.content_type or ""

        # Read file bytes
        content = await file.read()
        file_size = len(content)

        # Validate
        valid, reason = validate_file(original_name, content_type, file_size)
        if not valid:
            # Create a failed record or raise 400 if single file
            doc_id = str(uuid.uuid4())
            new_doc = Document(
                id=doc_id,
                internal_filename=f"invalid_{doc_id}",
                original_filename=original_name,
                file_hash="",
                file_size=file_size,
                mime_type=content_type,
                processing_status="failed",
                error_message=f"Validation failed: {reason}",
                review_status="needs_review",
            )
            db.add(new_doc)
            db.commit()
            db.refresh(new_doc)
            results.append(parse_doc_response(new_doc))
            continue

        try:
            internal_filename, file_hash, saved_size = save_upload_file(content, original_name)
        except Exception as e:
            doc_id = str(uuid.uuid4())
            new_doc = Document(
                id=doc_id,
                internal_filename=f"failed_{doc_id}",
                original_filename=original_name,
                file_hash="",
                file_size=file_size,
                mime_type=content_type,
                processing_status="failed",
                error_message=f"Storage error: {str(e)}",
                review_status="needs_review",
            )
            db.add(new_doc)
            db.commit()
            db.refresh(new_doc)
            results.append(parse_doc_response(new_doc))
            continue

        # Save document row
        doc_id = str(uuid.uuid4())
        doc = Document(
            id=doc_id,
            internal_filename=internal_filename,
            original_filename=original_name,
            file_hash=file_hash,
            file_size=saved_size,
            mime_type=content_type or "application/octet-stream",
            processing_status="pending",
            review_status="needs_review",
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        # Run extraction pipeline
        processed_doc = await process_document_pipeline(doc, db, force_mock=force_mock)
        results.append(parse_doc_response(processed_doc))

    return results


@router.get("", response_model=DocumentListResponse)
def list_documents(
    search: Optional[str] = Query(None, description="Search by vendor, invoice number, or description"),
    category: Optional[str] = Query(None, description="Filter by category"),
    document_type: Optional[str] = Query(None, description="Filter by document type"),
    review_status: Optional[str] = Query(None, description="Filter by review status"),
    processing_status: Optional[str] = Query(None, description="Filter by processing status"),
    is_duplicate: Optional[bool] = Query(None, description="Filter by duplicate status"),
    start_date: Optional[str] = Query(None, description="Filter start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Filter end date YYYY-MM-DD"),
    sort_by: str = Query("created_at", description="Field to sort by: created_at, invoice_date, total, vendor"),
    sort_order: str = Query("desc", description="Sort order: asc, desc"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    query = db.query(Document)

    # Search filter
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Document.vendor.ilike(term),
                Document.invoice_number.ilike(term),
                Document.original_filename.ilike(term),
                Document.description.ilike(term),
            )
        )

    # Category filter
    if category and category.strip() and category != "All":
        query = query.filter(Document.category == category)

    # Document type filter
    if document_type and document_type.strip() and document_type != "All":
        query = query.filter(Document.document_type == document_type)

    # Review status filter
    if review_status and review_status.strip() and review_status != "All":
        query = query.filter(Document.review_status == review_status)

    # Processing status filter
    if processing_status and processing_status.strip() and processing_status != "All":
        query = query.filter(Document.processing_status == processing_status)

    # Duplicate filter
    if is_duplicate is not None:
        query = query.filter(Document.is_duplicate == is_duplicate)

    # Date range filters
    if start_date:
        query = query.filter(
            (Document.invoice_date >= start_date) |
            ((Document.invoice_date.is_(None)) & (Document.created_at >= start_date))
        )
    if end_date:
        query = query.filter(
            (Document.invoice_date <= end_date) |
            ((Document.invoice_date.is_(None)) & (Document.created_at <= end_date))
        )

    # Total count before pagination
    total_count = query.count()

    # Sorting
    sort_col = getattr(Document, sort_by, Document.created_at)
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    # Pagination
    offset = (page - 1) * limit
    items = query.offset(offset).limit(limit).all()
    total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1

    return DocumentListResponse(
        items=[parse_doc_response(doc) for doc in items],
        total=total_count,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return parse_doc_response(doc)


@router.get("/{document_id}/file")
def get_document_file(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        path = get_file_path(doc.internal_filename)
        if not path.exists():
            raise HTTPException(status_code=404, detail="Stored file does not exist on disk")
        return FileResponse(
            path=str(path),
            media_type=doc.mime_type,
            filename=doc.original_filename,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{document_id}", response_model=DocumentResponse)
def update_document(
    document_id: str,
    payload: DocumentUpdate,
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    update_data = payload.model_dump(exclude_unset=True)

    # Validate categories if changing
    if "category" in update_data and update_data["category"]:
        if update_data["category"] not in VALID_CATEGORIES:
            raise HTTPException(status_code=422, detail=f"Invalid category '{update_data['category']}'")

    if "document_type" in update_data and update_data["document_type"]:
        if update_data["document_type"] not in VALID_DOCUMENT_TYPES:
            raise HTTPException(status_code=422, detail=f"Invalid document type '{update_data['document_type']}'")

    for key, val in update_data.items():
        setattr(doc, key, val)

    # Re-evaluate duplicates if vendor/total/date/invoice_number modified
    is_dup, dup_reason, dup_id = check_for_duplicates(
        db=db,
        document_id=doc.id,
        file_hash=doc.file_hash,
        vendor=doc.vendor,
        invoice_number=doc.invoice_number,
        invoice_date=doc.invoice_date,
        total=doc.total,
    )
    doc.is_duplicate = is_dup
    doc.duplicate_reason = dup_reason
    doc.duplicate_of_id = dup_id

    db.commit()
    db.refresh(doc)
    return parse_doc_response(doc)


@router.post("/{document_id}/process", response_model=DocumentResponse)
async def reprocess_document(
    document_id: str,
    force_mock: bool = Query(False, description="Force mock extraction"),
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    processed = await process_document_pipeline(doc, db, force_mock=force_mock)
    return parse_doc_response(processed)


@router.delete("/{document_id}")
def delete_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Safely delete disk file
    delete_stored_file(doc.internal_filename)

    # Delete database record
    db.delete(doc)
    db.commit()

    return {"message": "Document deleted successfully", "id": document_id}
