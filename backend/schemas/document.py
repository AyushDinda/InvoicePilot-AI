from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

VALID_CATEGORIES = [
    "Travel",
    "Food and meals",
    "Software and subscriptions",
    "Office supplies",
    "Equipment",
    "Utilities",
    "Professional services",
    "Other",
]

VALID_DOCUMENT_TYPES = [
    "Invoice",
    "Receipt",
    "Bill",
    "Estimate",
    "Other",
]


class DocumentBase(BaseModel):
    vendor: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    currency: str = "USD"
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    total: Optional[float] = None
    category: str = "Other"
    document_type: str = "Invoice"
    description: Optional[str] = None


class DocumentUpdate(BaseModel):
    vendor: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    currency: Optional[str] = None
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    total: Optional[float] = None
    category: Optional[str] = None
    document_type: Optional[str] = None
    description: Optional[str] = None
    review_status: Optional[str] = None  # "needs_review", "reviewed"


class ConfidenceField(BaseModel):
    value: Any = None
    confidence: str = "medium"  # "high", "medium", "low", "unverified"
    notes: Optional[str] = None


class DocumentResponse(DocumentBase):
    id: str
    internal_filename: str
    original_filename: str
    file_hash: str
    file_size: int
    mime_type: str
    processing_status: str
    error_message: Optional[str] = None
    review_status: str
    is_duplicate: bool
    duplicate_reason: Optional[str] = None
    duplicate_of_id: Optional[str] = None
    confidence_scores: Optional[Dict[str, Any]] = None
    raw_text: Optional[str] = None
    extracted_data: Optional[Dict[str, Any]] = None
    ai_model_used: Optional[str] = None
    is_mock_extraction: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentListResponse(BaseModel):
    items: List[DocumentResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class DuplicateInfo(BaseModel):
    id: str
    original_filename: str
    vendor: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    total: Optional[float] = None
    match_type: str  # "exact_hash", "metadata_match"
    reason: str
