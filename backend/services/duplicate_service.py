from typing import Tuple, Optional
from sqlalchemy.orm import Session
from backend.models.document import Document


def check_for_duplicates(
    db: Session,
    document_id: str,
    file_hash: str,
    vendor: Optional[str],
    invoice_number: Optional[str],
    invoice_date: Optional[str],
    total: Optional[float],
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Checks for exact hash match or fuzzy metadata match among existing documents.
    Returns: (is_duplicate: bool, duplicate_reason: Optional[str], duplicate_of_id: Optional[str])
    """
    # 1. Exact file hash match (Identical binary file)
    exact_hash_match = (
        db.query(Document)
        .filter(Document.id != document_id, Document.file_hash == file_hash)
        .first()
    )
    if exact_hash_match:
        reason = f"Exact duplicate file hash matches '{exact_hash_match.original_filename}'"
        return True, reason, exact_hash_match.id

    # 2. Strong metadata match: Same Vendor AND Same Invoice Number
    if vendor and invoice_number and len(vendor.strip()) > 1 and len(invoice_number.strip()) > 1:
        inv_match = (
            db.query(Document)
            .filter(
                Document.id != document_id,
                Document.vendor.ilike(vendor.strip()),
                Document.invoice_number.ilike(invoice_number.strip()),
            )
            .first()
        )
        if inv_match:
            reason = f"Potential duplicate: Same vendor '{vendor}' and invoice #{invoice_number} matches '{inv_match.original_filename}'"
            return True, reason, inv_match.id

    # 3. Secondary metadata match: Same Vendor, Same Date, and Same Total Amount
    if vendor and invoice_date and total is not None and total > 0:
        meta_match = (
            db.query(Document)
            .filter(
                Document.id != document_id,
                Document.vendor.ilike(vendor.strip()),
                Document.invoice_date == invoice_date,
                Document.total == total,
            )
            .first()
        )
        if meta_match:
            reason = f"Potential duplicate: Matching vendor '{vendor}', date {invoice_date}, and amount {total:.2f}"
            return True, reason, meta_match.id

    return False, None, None
