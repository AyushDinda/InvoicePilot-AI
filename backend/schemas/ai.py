from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class AIStatusResponse(BaseModel):
    available: bool
    base_url: str
    configured_model: str
    model_available: bool
    mock_mode: bool
    available_models: List[str] = Field(default_factory=list)
    message: str


class ExtractionSchema(BaseModel):
    vendor: Optional[str] = Field(None, description="Vendor or merchant name")
    invoice_number: Optional[str] = Field(None, description="Invoice or receipt reference number")
    invoice_date: Optional[str] = Field(None, description="Document issue date in YYYY-MM-DD or readable format")
    due_date: Optional[str] = Field(None, description="Payment due date if specified")
    currency: Optional[str] = Field("USD", description="Three-letter currency code or symbol, e.g. USD, EUR, GBP")
    subtotal: Optional[float] = Field(None, description="Pre-tax subtotal amount as float")
    tax: Optional[float] = Field(None, description="Tax or VAT amount as float")
    total: Optional[float] = Field(None, description="Total payable amount as float")
    category: Optional[str] = Field("Other", description="Expense category from standard list")
    document_type: Optional[str] = Field("Invoice", description="Invoice, Receipt, Bill, Estimate, or Other")
    description: Optional[str] = Field(None, description="Short summary description of purchased items or service")
    confidence_notes: Optional[Dict[str, str]] = Field(default_factory=dict, description="Field-level clarity or confidence notes")


class OCRResult(BaseModel):
    text: str
    source: str  # "pdf_direct", "tesseract_ocr", "fallback_reader"
    success: bool
    error: Optional[str] = None
