from backend.schemas.document import (
    DocumentBase,
    DocumentUpdate,
    DocumentResponse,
    DocumentListResponse,
    DuplicateInfo,
    VALID_CATEGORIES,
    VALID_DOCUMENT_TYPES,
)
from backend.schemas.ai import AIStatusResponse, ExtractionSchema, OCRResult
from backend.schemas.analytics import (
    AnalyticsResponse,
    MonthlyExpenseItem,
    CategoryExpenseItem,
    CurrencyTotal,
)

__all__ = [
    "DocumentBase",
    "DocumentUpdate",
    "DocumentResponse",
    "DocumentListResponse",
    "DuplicateInfo",
    "VALID_CATEGORIES",
    "VALID_DOCUMENT_TYPES",
    "AIStatusResponse",
    "ExtractionSchema",
    "OCRResult",
    "AnalyticsResponse",
    "MonthlyExpenseItem",
    "CategoryExpenseItem",
    "CurrencyTotal",
]
