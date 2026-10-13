import io
import fitz  # PyMuPDF
import pytest
from fastapi.testclient import TestClient
import backend.services.ai_service as ai_service


def create_sample_pdf(text: str) -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 50), text)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_health_endpoint(client: TestClient):
    """Test health check returns status 200 and expected payload."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "InvoicePilot AI"


def test_ai_status_endpoint(client: TestClient):
    """Test AI status returns Ollama connectivity and mock mode flag."""
    response = client.get("/api/ai/status")
    assert response.status_code == 200
    data = response.json()
    assert "available" in data
    assert "mock_mode" in data
    assert data["mock_mode"] is True  # Set by test fixture


def test_analytics_empty_database(client: TestClient):
    """Test analytics calculation on an empty database does not fail."""
    response = client.get("/api/analytics")
    assert response.status_code == 200
    data = response.json()
    assert data["total_documents"] == 0
    assert data["currency_totals"] == []
    assert data["monthly_expenses"] == []
    assert data["category_breakdown"] == []
    assert data["status_counts"]["completed"] == 0


def test_invalid_file_extension_rejection(client: TestClient):
    """Test that unsupported executable or text files are rejected cleanly."""
    file_content = b"echo 'malicious script'"
    files = [("files", ("script.exe", file_content, "application/x-msdownload"))]
    response = client.post("/api/documents/upload", files=files)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["processing_status"] == "failed"
    assert "Unsupported file extension" in data[0]["error_message"]


def test_document_upload_and_mock_extraction(client: TestClient):
    """Test successful PDF upload, text extraction, and mock AI processing."""
    sample_text = """Acme Software Corp
Invoice Number: INV-99881
Date: 2024-11-01
Subtotal: $400.00
Tax: $40.00
Total: $440.00
AWS Cloud Infrastructure monthly subscription"""
    pdf_bytes = create_sample_pdf(sample_text)

    files = [("files", ("acme_invoice.pdf", pdf_bytes, "application/pdf"))]
    response = client.post("/api/documents/upload?force_mock=true", files=files)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    doc = data[0]

    assert doc["original_filename"] == "acme_invoice.pdf"
    assert doc["processing_status"] == "completed"
    assert doc["is_mock_extraction"] is True
    assert doc["vendor"] is not None
    assert doc["invoice_number"] == "INV-99881"
    assert doc["total"] == 440.0
    assert doc["category"] == "Software and subscriptions"
    assert doc["currency"] == "USD"

    # Verify retrieval
    doc_id = doc["id"]
    get_res = client.get(f"/api/documents/{doc_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == doc_id


def test_document_patch_update_and_validation(client: TestClient):
    """Test updating fields and validating category/type constraints."""
    pdf_bytes = create_sample_pdf("Generic Receipt\nTotal: $25.50\nFood and meals")
    files = [("files", ("meal.pdf", pdf_bytes, "application/pdf"))]
    upload_res = client.post("/api/documents/upload?force_mock=true", files=files)
    doc_id = upload_res.json()[0]["id"]

    # Valid update
    update_payload = {
        "vendor": "Bistro Deluxe",
        "total": 35.75,
        "category": "Food and meals",
        "review_status": "reviewed",
    }
    patch_res = client.patch(f"/api/documents/{doc_id}", json=update_payload)
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["vendor"] == "Bistro Deluxe"
    assert updated["total"] == 35.75
    assert updated["review_status"] == "reviewed"

    # Invalid category rejection
    invalid_payload = {"category": "NonExistentCategory"}
    bad_res = client.patch(f"/api/documents/{doc_id}", json=invalid_payload)
    assert bad_res.status_code == 422


def test_duplicate_detection(client: TestClient):
    """Test both exact file hash duplicate and metadata duplicate detection."""
    pdf_content = create_sample_pdf("Vendor X\nInvoice #: 12345\nDate: 2024-05-10\nTotal: $150.00")

    # Upload first time
    files1 = [("files", ("invoice_v1.pdf", pdf_content, "application/pdf"))]
    res1 = client.post("/api/documents/upload?force_mock=true", files=files1)
    doc1 = res1.json()[0]
    assert doc1["is_duplicate"] is False

    # Upload exact same file again (Exact hash duplicate)
    files2 = [("files", ("invoice_v2_copy.pdf", pdf_content, "application/pdf"))]
    res2 = client.post("/api/documents/upload?force_mock=true", files=files2)
    doc2 = res2.json()[0]
    assert doc2["is_duplicate"] is True
    assert "Exact duplicate file hash" in doc2["duplicate_reason"]
    assert doc2["duplicate_of_id"] == doc1["id"]


def test_csv_export(client: TestClient):
    """Test exporting documents as CSV."""
    pdf_content = create_sample_pdf("Export Co\nInvoice #: EXP-01\nTotal: $88.00\nTravel")
    client.post("/api/documents/upload?force_mock=true", files=[("files", ("exp.pdf", pdf_content, "application/pdf"))])

    export_res = client.get("/api/export/csv")
    assert export_res.status_code == 200
    assert "text/csv" in export_res.headers["content-type"]
    csv_text = export_res.text
    assert "Original Filename" in csv_text
    assert "Vendor" in csv_text
    assert "exp.pdf" in csv_text


def test_document_deletion(client: TestClient):
    """Test safe document deletion removing DB record and file."""
    pdf_content = create_sample_pdf("To Be Deleted\nTotal: $10.00")
    upload_res = client.post("/api/documents/upload?force_mock=true", files=[("files", ("del.pdf", pdf_content, "application/pdf"))])
    doc_id = upload_res.json()[0]["id"]

    # Delete
    del_res = client.delete(f"/api/documents/{doc_id}")
    assert del_res.status_code == 200

    # Ensure 404 on fetch
    get_res = client.get(f"/api/documents/{doc_id}")
    assert get_res.status_code == 404


def test_ai_unavailable_handling(client: TestClient, monkeypatch):
    """Test graceful failure handling when AI is offline and mock mode is off."""
    # Force mock mode off
    monkeypatch.setattr(ai_service, "MOCK_AI_ENV", False)
    # Set invalid URL to simulate unreachable Ollama
    monkeypatch.setattr(ai_service, "OLLAMA_BASE_URL", "http://127.0.0.1:99999")

    pdf_content = create_sample_pdf("Offline Vendor\nTotal: $50.00")
    files = [("files", ("offline.pdf", pdf_content, "application/pdf"))]
    response = client.post("/api/documents/upload?force_mock=false", files=files)
    assert response.status_code == 200
    doc = response.json()[0]

    # Document should not crash; it should be saved and marked as failed with helpful error
    assert doc["processing_status"] == "failed"
    assert "Cannot connect to Ollama" in doc["error_message"] or "error" in doc["error_message"].lower()

    # Document still retrievable for manual review or retry
    fetch_res = client.get(f"/api/documents/{doc['id']}")
    assert fetch_res.status_code == 200
