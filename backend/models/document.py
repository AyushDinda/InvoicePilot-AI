from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    DateTime,
    Text,
    Index,
)
from backend.database.session import Base


def utcnow():
    return datetime.now(timezone.utc)


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, index=True)
    internal_filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_hash = Column(String(64), nullable=False, index=True)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)

    # Financial extracted fields
    vendor = Column(String(255), nullable=True, index=True)
    invoice_number = Column(String(100), nullable=True, index=True)
    invoice_date = Column(String(50), nullable=True, index=True)
    due_date = Column(String(50), nullable=True)
    currency = Column(String(10), default="USD", nullable=False)
    subtotal = Column(Float, nullable=True)
    tax = Column(Float, nullable=True)
    total = Column(Float, nullable=True, index=True)

    # Categorization and type
    category = Column(String(100), default="Other", nullable=False, index=True)
    document_type = Column(String(50), default="Invoice", nullable=False)
    description = Column(Text, nullable=True)

    # Workflow statuses
    processing_status = Column(String(50), default="pending", nullable=False, index=True)  # pending, processing, completed, failed
    error_message = Column(Text, nullable=True)
    review_status = Column(String(50), default="needs_review", nullable=False, index=True)  # needs_review, reviewed

    # Duplicate detection fields
    is_duplicate = Column(Boolean, default=False, nullable=False, index=True)
    duplicate_reason = Column(String(255), nullable=True)
    duplicate_of_id = Column(String(36), nullable=True)

    # AI & extraction audit data
    confidence_scores = Column(Text, nullable=True)  # JSON-encoded field confidence indicators
    raw_text = Column(Text, nullable=True)  # OCR / Extracted direct text
    extracted_data = Column(Text, nullable=True)  # JSON-encoded AI extraction
    ai_model_used = Column(String(100), nullable=True)
    is_mock_extraction = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)


# Compound indexes for fast query filtering
Index("ix_doc_vendor_invnum", Document.vendor, Document.invoice_number)
Index("ix_doc_vendor_total", Document.vendor, Document.total)
Index("ix_doc_status_created", Document.processing_status, Document.created_at)
