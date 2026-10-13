import os
import json
import re
from typing import Optional, Dict, Any, Tuple, List
import httpx
from backend.schemas.ai import AIStatusResponse, ExtractionSchema
from backend.schemas.document import VALID_CATEGORIES, VALID_DOCUMENT_TYPES

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")
MOCK_AI_ENV = os.getenv("MOCK_AI", "false").lower() in ("true", "1", "yes")

EXTRACTION_SYSTEM_PROMPT = """You are an accurate financial document parser for InvoicePilot AI.
Your role is to extract structured financial data from the document text.
Extract ONLY what is explicitly stated in the document. Do not invent numbers, dates, or vendor names.
If any field is missing, ambiguous, or unclear, set it to null.

Output must be a single valid JSON object adhering strictly to this schema:
{
  "vendor": string or null,
  "invoice_number": string or null,
  "invoice_date": string (format YYYY-MM-DD if recognizable) or null,
  "due_date": string or null,
  "currency": string (e.g. USD, EUR, GBP, CAD, AUD),
  "subtotal": float or null,
  "tax": float or null,
  "total": float or null,
  "category": one of ["Travel", "Food and meals", "Software and subscriptions", "Office supplies", "Equipment", "Utilities", "Professional services", "Other"],
  "document_type": one of ["Invoice", "Receipt", "Bill", "Estimate", "Other"],
  "description": string (short 1-line summary) or null,
  "confidence_notes": {
    "vendor": "high" | "medium" | "low",
    "total": "high" | "medium" | "low",
    "invoice_date": "high" | "medium" | "low",
    "category": "high" | "medium" | "low"
  }
}
Do NOT return prose, markdown wrappers, or explanations outside the JSON object.
"""


async def check_ollama_status() -> AIStatusResponse:
    """
    Checks if Ollama is running and whether the configured model is available.
    """
    is_mock = MOCK_AI_ENV
    client = httpx.AsyncClient(timeout=3.0)

    try:
        response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
        if response.status_code == 200:
            data = response.json()
            models = [m.get("name", "") for m in data.get("models", [])]
            # Match model name either exactly or with / without tag
            model_found = any(
                m == OLLAMA_MODEL or m.startswith(f"{OLLAMA_MODEL}:") or OLLAMA_MODEL.startswith(m.split(":")[0])
                for m in models
            )
            msg = f"Ollama is running. Model '{OLLAMA_MODEL}' is {'ready' if model_found else 'not downloaded'}."
            return AIStatusResponse(
                available=True,
                base_url=OLLAMA_BASE_URL,
                configured_model=OLLAMA_MODEL,
                model_available=model_found,
                mock_mode=is_mock,
                available_models=models,
                message=msg,
            )
        else:
            return AIStatusResponse(
                available=False,
                base_url=OLLAMA_BASE_URL,
                configured_model=OLLAMA_MODEL,
                model_available=False,
                mock_mode=is_mock,
                available_models=[],
                message=f"Ollama returned status {response.status_code}",
            )
    except Exception as e:
        msg = f"Cannot reach Ollama at {OLLAMA_BASE_URL}. Run 'ollama serve' or start Ollama Desktop."
        return AIStatusResponse(
            available=False,
            base_url=OLLAMA_BASE_URL,
            configured_model=OLLAMA_MODEL,
            model_available=False,
            mock_mode=is_mock,
            available_models=[],
            message=msg,
        )
    finally:
        await client.aclose()


def sanitize_extracted_dict(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates and cleans fields to ensure safe types and allowable categories.
    """
    # Validate category
    cat = data.get("category")
    if cat not in VALID_CATEGORIES:
        data["category"] = "Other"

    # Validate doc type
    dtype = data.get("document_type")
    if dtype not in VALID_DOCUMENT_TYPES:
        data["document_type"] = "Invoice"

    # Validate numeric amounts
    for field in ("total", "subtotal", "tax"):
        val = data.get(field)
        if val is not None:
            try:
                # Remove currency symbols or commas if string leaked
                if isinstance(val, str):
                    clean_str = re.sub(r"[^\d.-]", "", val)
                    data[field] = float(clean_str) if clean_str else None
                else:
                    data[field] = float(val)
            except (ValueError, TypeError):
                data[field] = None

    # Currency format
    curr = data.get("currency")
    if curr:
        curr_clean = re.sub(r"[^A-Za-z]", "", str(curr)).upper()
        data["currency"] = curr_clean[:3] if curr_clean else "USD"
    else:
        data["currency"] = "USD"

    return data


def extract_with_mock(text: str, filename: str) -> Tuple[ExtractionSchema, Dict[str, str]]:
    """
    Deterministic rule-based extractor for mock / offline testing mode.
    Never fabricates unknown data if not indicated in text or filename.
    """
    data: Dict[str, Any] = {
        "vendor": None,
        "invoice_number": None,
        "invoice_date": None,
        "due_date": None,
        "currency": "USD",
        "subtotal": None,
        "tax": None,
        "total": None,
        "category": "Other",
        "document_type": "Invoice",
        "description": "Mock extracted financial document",
        "confidence_notes": {
            "vendor": "medium",
            "total": "medium",
            "invoice_date": "medium",
            "category": "medium",
            "mode": "mock_mode_active",
        },
    }

    # Extract vendor heuristic from text header or filename
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if lines:
        first_line = lines[0]
        if len(first_line) < 50 and not re.search(r"invoice|receipt|statement|bill|date", first_line, re.I):
            data["vendor"] = first_line

    # Regex for invoice number
    inv_match = re.search(
        r"(?:invoice|receipt|bill)\s*(?:number|num|no|\#)?\s*[:\s#\-]\s*([A-Za-z0-9\-_]{3,30})",
        text,
        re.I,
    )
    if not inv_match:
        inv_match = re.search(r"(?:inv|ref)[\s#:]+([A-Za-z0-9\-_]{3,30})", text, re.I)
    if inv_match:
        data["invoice_number"] = inv_match.group(1).strip()

    # Regex for date YYYY-MM-DD or MM/DD/YYYY or DD-MM-YYYY
    date_match = re.search(r"\b(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b", text)
    if date_match:
        data["invoice_date"] = date_match.group(1)

    # Regex for amounts
    # Currency symbol
    if "€" in text or "EUR" in text.upper():
        data["currency"] = "EUR"
    elif "£" in text or "GBP" in text.upper():
        data["currency"] = "GBP"
    elif "₹" in text or "INR" in text.upper():
        data["currency"] = "INR"
    elif "$" in text or "USD" in text.upper():
        data["currency"] = "USD"

    # Search for subtotal
    subtotal_match = re.search(r"\b(?:subtotal|sub-total|net\s+amount)[:\s]*[$€£₹]?\s*([\d,]+\.\d{2})", text, re.I)
    if subtotal_match:
        try:
            data["subtotal"] = float(subtotal_match.group(1).replace(",", ""))
        except ValueError:
            pass

    # Search for tax
    tax_match = re.search(r"\b(?:tax|vat|gst)[:\s]*[$€£₹]?\s*([\d,]+\.\d{2})", text, re.I)
    if tax_match:
        try:
            data["tax"] = float(tax_match.group(1).replace(",", ""))
        except ValueError:
            pass

    # Search for total with word boundary (so 'subtotal' is not matched as 'total')
    total_match = re.search(r"\b(?:grand\s+total|total\s+amount|amount\s+due|balance\s+due|total)[:\s]*[$€£₹]?\s*([\d,]+\.\d{2})", text, re.I)
    if total_match:
        try:
            data["total"] = float(total_match.group(1).replace(",", ""))
        except ValueError:
            pass

    # Categorization heuristic
    t_lower = text.lower()
    if any(k in t_lower for k in ["uber", "lyft", "airline", "flight", "hotel", "airbnb", "train", "taxi", "travel"]):
        data["category"] = "Travel"
    elif any(k in t_lower for k in ["restaurant", "cafe", "coffee", "lunch", "dinner", "doordash", "ubereats", "meal", "food"]):
        data["category"] = "Food and meals"
    elif any(k in t_lower for k in ["github", "aws", "google cloud", "azure", "openai", "software", "saas", "subscription", "figma", "notion"]):
        data["category"] = "Software and subscriptions"
    elif any(k in t_lower for k in ["staples", "paper", "pen", "office depot", "stationery"]):
        data["category"] = "Office supplies"
    elif any(k in t_lower for k in ["apple", "dell", "monitor", "laptop", "hardware", "keyboard", "mouse", "equipment"]):
        data["category"] = "Equipment"
    elif any(k in t_lower for k in ["electric", "water", "internet", "comcast", "verizon", "utility", "phone"]):
        data["category"] = "Utilities"
    elif any(k in t_lower for k in ["legal", "consulting", "accounting", "advisory", "attorney", "cpa"]):
        data["category"] = "Professional services"

    # Fallback vendor if not found
    if not data["vendor"]:
        base_name = re.sub(r"[-_]", " ", filename.rsplit(".", 1)[0]).strip().title()
        data["vendor"] = base_name if len(base_name) > 2 else "Unknown Vendor"

    data = sanitize_extracted_dict(data)
    validated = ExtractionSchema.model_validate(data)
    confidence = data.get("confidence_notes", {})
    return validated, confidence


async def extract_with_ollama(
    text: str,
    filename: str,
    force_mock: bool = False
) -> Tuple[ExtractionSchema, Dict[str, Any], bool, str]:
    """
    Extracts structured fields from document text using Ollama or Mock mode.
    Returns: (ExtractionSchema, confidence_dict, is_mock, model_used)
    Raises Exception with user-friendly message if processing fails.
    """
    use_mock = force_mock or MOCK_AI_ENV

    if use_mock:
        res, conf = extract_with_mock(text, filename)
        return res, conf, True, "mock-heuristic"

    # Truncate text if excessively long to avoid token overflows
    clean_text = text.strip()
    if len(clean_text) > 8000:
        clean_text = clean_text[:8000] + "\n...[truncated for length]"

    user_prompt = f"Filename: {filename}\nDocument Content:\n```\n{clean_text}\n```"

    async with httpx.AsyncClient(timeout=45.0) as client:
        try:
            payload = {
                "model": OLLAMA_MODEL,
                "system": EXTRACTION_SYSTEM_PROMPT,
                "prompt": user_prompt,
                "stream": False,
                "format": "json",
                "options": {
                    "temperature": 0.1,  # Low temperature for deterministic structured extraction
                },
            }
            response = await client.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)

            if response.status_code != 200:
                raise RuntimeError(
                    f"Ollama server responded with error status {response.status_code}: {response.text}"
                )

            res_json = response.json()
            raw_response_text = res_json.get("response", "").strip()

            # Parse JSON safely
            try:
                parsed_dict = json.loads(raw_response_text)
            except json.JSONDecodeError:
                # Attempt regex capture for embedded json block
                json_match = re.search(r"\{.*\}", raw_response_text, re.DOTALL)
                if json_match:
                    parsed_dict = json.loads(json_match.group(0))
                else:
                    raise ValueError("Model response could not be parsed as valid JSON.")

            sanitized = sanitize_extracted_dict(parsed_dict)
            validated = ExtractionSchema.model_validate(sanitized)
            confidence = sanitized.get("confidence_notes", {})
            return validated, confidence, False, OLLAMA_MODEL

        except httpx.ConnectError:
            raise RuntimeError(
                f"Cannot connect to Ollama at {OLLAMA_BASE_URL}. Ensure Ollama is running, or enable Mock Mode for offline testing."
            )
        except httpx.TimeoutException:
            raise RuntimeError(
                f"Ollama inference timed out after 45 seconds for model '{OLLAMA_MODEL}'."
            )
