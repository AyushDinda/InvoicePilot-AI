from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.schemas.analytics import AnalyticsResponse
from backend.services.analytics_service import get_analytics_data

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("", response_model=AnalyticsResponse)
def get_analytics(
    start_date: Optional[str] = Query(None, description="Start date filter YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date filter YYYY-MM-DD"),
    currency: Optional[str] = Query(None, description="Filter by currency code"),
    db: Session = Depends(get_db),
):
    """
    Returns verified expense analytics derived from database records.
    Never invents data or combines disparate currencies.
    """
    return get_analytics_data(
        db=db,
        start_date=start_date,
        end_date=end_date,
        currency_filter=currency,
    )
