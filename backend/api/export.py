import io
import csv
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.database.session import get_db
from backend.models.document import Document

router = APIRouter(prefix="/api/export", tags=["export"])


def sanitize_csv_cell(value) -> str:
    """
    Prevents CSV injection attacks (Excel formula injection starting with =, +, -, @, \t, \r).
    """
    if value is None:
        return ""
    val_str = str(value).strip()
    if val_str and val_str[0] in ("=", "+", "-", "@", "\t", "\r"):
        return f"'{val_str}"
    return val_str


@router.get("/csv")
def export_csv(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    document_type: Optional[str] = Query(None),
    review_status: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Document)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Document.vendor.ilike(term),
                Document.invoice_number.ilike(term),
                Document.original_filename.ilike(term),
            )
        )
    if category and category != "All":
        query = query.filter(Document.category == category)
    if document_type and document_type != "All":
        query = query.filter(Document.document_type == document_type)
    if review_status and review_status != "All":
        query = query.filter(Document.review_status == review_status)
    if start_date:
        query = query.filter(Document.invoice_date >= start_date)
    if end_date:
        query = query.filter(Document.invoice_date <= end_date)

    documents = query.order_by(Document.invoice_date.desc(), Document.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    # Header
    writer.writerow([
        "ID",
        "Original Filename",
        "Vendor",
        "Invoice Number",
        "Invoice Date",
        "Due Date",
        "Currency",
        "Subtotal",
        "Tax",
        "Total",
        "Category",
        "Document Type",
        "Processing Status",
        "Review Status",
        "Is Duplicate",
        "Duplicate Reason",
        "AI Model Used",
        "Is Mock",
        "Created At",
    ])

    for doc in documents:
        writer.writerow([
            sanitize_csv_cell(doc.id),
            sanitize_csv_cell(doc.original_filename),
            sanitize_csv_cell(doc.vendor),
            sanitize_csv_cell(doc.invoice_number),
            sanitize_csv_cell(doc.invoice_date),
            sanitize_csv_cell(doc.due_date),
            sanitize_csv_cell(doc.currency),
            sanitize_csv_cell(f"{doc.subtotal:.2f}" if doc.subtotal is not None else ""),
            sanitize_csv_cell(f"{doc.tax:.2f}" if doc.tax is not None else ""),
            sanitize_csv_cell(f"{doc.total:.2f}" if doc.total is not None else ""),
            sanitize_csv_cell(doc.category),
            sanitize_csv_cell(doc.document_type),
            sanitize_csv_cell(doc.processing_status),
            sanitize_csv_cell(doc.review_status),
            sanitize_csv_cell("Yes" if doc.is_duplicate else "No"),
            sanitize_csv_cell(doc.duplicate_reason),
            sanitize_csv_cell(doc.ai_model_used),
            sanitize_csv_cell("Yes" if doc.is_mock_extraction else "No"),
            sanitize_csv_cell(doc.created_at.isoformat() if doc.created_at else ""),
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=invoicepilot_export.csv"},
    )
