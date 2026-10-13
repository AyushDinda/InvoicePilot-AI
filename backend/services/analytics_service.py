from typing import List, Dict, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models.document import Document
from backend.schemas.analytics import (
    AnalyticsResponse,
    MonthlyExpenseItem,
    CategoryExpenseItem,
    CurrencyTotal,
)


def get_analytics_data(
    db: Session,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    currency_filter: Optional[str] = None,
) -> AnalyticsResponse:
    """
    Computes accurate analytics grouped by currency, category, and month.
    Never combines distinct currencies into a single aggregate total.
    """
    query = db.query(Document)

    if start_date:
        query = query.filter(
            (Document.invoice_date >= start_date) |
            ((Document.invoice_date.is_(None)) & (Document.created_at >= datetime.fromisoformat(start_date)))
        )
    if end_date:
        query = query.filter(
            (Document.invoice_date <= end_date) |
            ((Document.invoice_date.is_(None)) & (Document.created_at <= datetime.fromisoformat(end_date)))
        )
    if currency_filter:
        query = query.filter(Document.currency == currency_filter)

    documents: List[Document] = query.all()
    total_docs = len(documents)

    # Status counts
    status_counts = {"pending": 0, "processing": 0, "completed": 0, "failed": 0}
    needs_review_count = 0
    duplicate_count = 0

    # Currency aggregations: currency -> total sum, count
    curr_map: Dict[str, Dict[str, float]] = {}
    # Monthly aggregation: (month YYYY-MM, currency) -> total, count
    month_map: Dict[str, Dict[str, float]] = {}
    # Category aggregation: (category, currency) -> total, count
    cat_map: Dict[str, Dict[str, float]] = {}

    for doc in documents:
        # Status counts
        status = doc.processing_status or "pending"
        status_counts[status] = status_counts.get(status, 0) + 1

        if doc.review_status == "needs_review":
            needs_review_count += 1
        if doc.is_duplicate:
            duplicate_count += 1

        # Only add to financial analytics if amount is valid
        if doc.total is not None and doc.total > 0:
            c = doc.currency or "USD"
            amt = float(doc.total)

            # Currency totals
            if c not in curr_map:
                curr_map[c] = {"total": 0.0, "count": 0}
            curr_map[c]["total"] += amt
            curr_map[c]["count"] += 1

            # Month extraction
            month_key = "Unknown"
            if doc.invoice_date and len(doc.invoice_date) >= 7:
                month_key = doc.invoice_date[:7]
            elif doc.created_at:
                month_key = doc.created_at.strftime("%Y-%m")

            m_key = f"{month_key}_{c}"
            if m_key not in month_map:
                month_map[m_key] = {"month": month_key, "currency": c, "total": 0.0, "count": 0}
            month_map[m_key]["total"] += amt
            month_map[m_key]["count"] += 1

            # Category
            cat_name = doc.category or "Other"
            cat_key = f"{cat_name}_{c}"
            if cat_key not in cat_map:
                cat_map[cat_key] = {"category": cat_name, "currency": c, "total": 0.0, "count": 0}
            cat_map[cat_key]["total"] += amt
            cat_map[cat_key]["count"] += 1

    # Format currency totals
    currency_totals = [
        CurrencyTotal(currency=c, total=round(data["total"], 2), count=int(data["count"]))
        for c, data in sorted(curr_map.items())
    ]

    # Format monthly expenses sorted by month
    monthly_expenses = [
        MonthlyExpenseItem(
            month=data["month"],
            currency=data["currency"],
            total=round(data["total"], 2),
            count=int(data["count"]),
        )
        for data in sorted(month_map.values(), key=lambda x: (x["month"], x["currency"]))
    ]

    # Format category breakdown with percentages within that currency
    category_breakdown = []
    for cat_k, data in cat_map.items():
        c = data["currency"]
        c_total = curr_map.get(c, {}).get("total", 0.0)
        pct = (data["total"] / c_total * 100.0) if c_total > 0 else 0.0
        category_breakdown.append(
            CategoryExpenseItem(
                category=data["category"],
                currency=c,
                total=round(data["total"], 2),
                count=int(data["count"]),
                percentage=round(pct, 1),
            )
        )

    category_breakdown.sort(key=lambda x: (x.currency, -x.total))

    return AnalyticsResponse(
        total_documents=total_docs,
        currency_totals=currency_totals,
        monthly_expenses=monthly_expenses,
        category_breakdown=category_breakdown,
        status_counts=status_counts,
        needs_review_count=needs_review_count,
        duplicate_count=duplicate_count,
    )
