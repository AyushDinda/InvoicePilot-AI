from typing import List, Dict, Optional
from pydantic import BaseModel


class MonthlyExpenseItem(BaseModel):
    month: str  # YYYY-MM
    currency: str
    total: float
    count: int


class CategoryExpenseItem(BaseModel):
    category: str
    currency: str
    total: float
    count: int
    percentage: float


class CurrencyTotal(BaseModel):
    currency: str
    total: float
    count: int


class AnalyticsResponse(BaseModel):
    total_documents: int
    currency_totals: List[CurrencyTotal]
    monthly_expenses: List[MonthlyExpenseItem]
    category_breakdown: List[CategoryExpenseItem]
    status_counts: Dict[str, int]
    needs_review_count: int
    duplicate_count: int
