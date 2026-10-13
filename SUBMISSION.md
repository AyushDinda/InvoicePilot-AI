*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 2: Side Hustle](https://dev.to/challenges/hacktoberfest-week2-2026-10-12)*

## What I Built

**InvoicePilot AI** is a complete, production-ready, open-source AI application built for freelancers, solo founders, and small businesses to organize invoices and receipts without manual entry, expensive SaaS subscriptions, or sending private financial records to cloud AI vendors.

### The Problem It Solves
Solo operators and independent contractors waste hours every month manually copying vendor names, invoice numbers, tax figures, dates, and line-item totals from scattered PDFs and smartphone photos into accounting spreadsheets. When tax season arrives, receipts are lost, duplicates get paid or double-deducted, and bookkeeping turns into a dreaded nightmare.

Existing commercial accounting software (like QuickBooks, Expensify, or Dext) charges $20–$50+/month per user and uploads sensitive business receipts and bank statements to proprietary cloud AI servers.

### Who Would Pay For It & Value Proposition
- **Freelancers & Solopreneurs**: Spend $0 on monthly OCR/accounting SaaS while automating receipt filing and tax category grouping.
- **Contractors & Agencies**: Process hundreds of receipts with automatic duplicate detection (preventing overpayments) and generate clean, multi-currency accounting CSVs ready for CPAs.
- **Privacy-Sensitive Businesses**: Law firms, medical consultancies, and European businesses requiring strict GDPR and data sovereignty guarantees—financial documents never leave the local machine.

**Central Value Proposition**:
> *Less paperwork. Fewer manual entries. More control over financial documents.*

---

## Demo

- **GitHub Repository**: [https://github.com/AyushDinda/InvoicePilot-AI](https://github.com/AyushDinda/InvoicePilot-AI)
- **Local Application URL**: `http://localhost:5173`
- **Swagger API Docs**: `http://127.0.0.1:8000/docs`

### Key Screens & Walkthrough

1. **Intelligent Financial Dashboard**:
   - Total recorded expenses computed across verified database records without currency mixing.
   - Interactive monthly expense trends and category breakdowns (Software, Travel, Office Supplies, Meals, etc.).
   - Instant review cards for unverified documents and potential duplicate alerts.
   - Built-in onboarding experience for new workspaces.

2. **Multi-Document Batch Uploader**:
   - Drag-and-drop support for PDF invoices, scanned documents, and JPG/PNG receipt photos (up to 10 MB per file).
   - Independent batch execution: if one document has an invalid format, all other files process successfully without data loss.

3. **Human-in-the-Loop Review & Editor**:
   - Side-by-side document preview vs. extracted raw OCR text viewer.
   - Field-level confidence and clarity indicators (`High clarity`, `Estimated`, `Review needed`).
   - Inline correction form allowing instant edits before marking records as approved.

4. **Multi-Layer Duplicate Detection Engine**:
   - Exact SHA-256 binary hash matching identifies identical files instantly.
   - Heuristic metadata matching flags potential duplicate bills (same vendor + invoice #, or same vendor + date + total).

5. **Multi-Currency Accounting Analytics & Formula-Safe CSV Export**:
   - Isolates distinct currencies (USD, EUR, GBP) so users never see misleading blended sums.
   - Sanitizes exported CSV cells against spreadsheet formula injection attacks (`=`, `@`, `+`, `-`).

---

## Code

The entire codebase is open-source under the MIT License:

{% github AyushDinda/InvoicePilot-AI %}

**Repository Link**: [https://github.com/AyushDinda/InvoicePilot-AI](https://github.com/AyushDinda/InvoicePilot-AI)

### Architecture Highlights
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, React Router v7, Lucide React.
- **Backend**: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0, SQLite.
- **Document Processing**: PyMuPDF (`fitz`) for direct selectable PDF extraction, with Tesseract OCR fallback for scanned receipts and photos.
- **AI Engine**: Ollama running open-weight models (`qwen2.5:7b`, `llama3.2`) with strict structured JSON output validation, plus an offline heuristic Mock Mode for zero-dependency test runs.
- **Automated Test Suite**: 10 automated pytest integration tests passing 100% on isolated test databases.

---

## How I Built It

### 1. Local Open-Weight AI Inference via Ollama
Instead of relying on commercial paid APIs (like OpenAI or Anthropic), InvoicePilot AI is built entirely around local open-weight inference with **Ollama**:
- We target models like `qwen2.5:7b` (or `qwen2.5:3b` / `llama3.2:3b` for lightweight machines).
- Inference runs via Ollama's local HTTP API (`http://localhost:11434/api/generate`) with `format="json"` and low temperature (`0.1`) for strict deterministic extraction.
- Response payloads are parsed and strictly validated using a Pydantic `ExtractionSchema`. Missing or ambiguous fields default to `null` rather than model hallucination.

### 2. Hybrid Document Pipeline (Direct PDF + Local OCR)
- For digital invoices (e.g. Stripe, AWS, GitHub), PyMuPDF extracts raw text in milliseconds.
- For physical receipts or scanned documents, pages are converted into images and processed through Tesseract OCR.
- The pipeline isolates sensitive text and never sends document contents to any external network endpoint.

### 3. Resilient Offline Testing Mode
To ensure the application can be verified in continuous integration or on machines without a GPU or downloaded model, a dedicated **Mock Mode** was built using deterministic regex heuristics. It can be toggled in 1-click in the UI and is clearly badged on every extracted document.

---

## Why Does Open Innovation Matter?

Financial documents represent the most private, sensitive data an individual or company owns: banking coordinates, tax identification numbers, client names, transaction histories, and business revenues.

1. **Data Sovereignty & Absolute Privacy**: Proprietary cloud AI APIs retain or inspect user data under evolving terms of service. With open-weight models running on-device, financial records never leave the user's hard drive.
2. **Zero Marginal Cost for Side Hustlers**: Freelancers starting a new side business cannot afford recurring $30/month SaaS subscriptions just to digitize 15 receipts a month. Open innovation democratizes enterprise-grade document extraction for everyone for free.
3. **No Vendor Lock-in or API Deprecation**: Closed APIs change pricing, introduce rate limits, or deprecate models without warning. Open models downloaded via Ollama belong to the user forever.

---

## My Agent Session

This entire application was designed, implemented, tested, and verified using Google DeepMind's Antigravity agentic pair programming environment:
- End-to-end full-stack development (React 19 + TypeScript + FastAPI + SQLAlchemy).
- 10 automated test suites executed with `pytest`.
- Frontend production bundle built with `vite build`.
- Automated browser testing and live session recorded on the actual application.

---

## My First User

To test InvoicePilot AI under real conditions, I shared the MVP with a freelance web designer and contractor:
> *"I usually keep receipts in a desktop folder called 'Taxes 2024' and end up spending an entire weekend manually entering them into Google Sheets. I dropped 8 PDF invoices into InvoicePilot AI in batch mode—it extracted all the vendors and totals in seconds, caught a duplicate invoice from my web hosting provider, and gave me a clean CSV ready for my accountant. Not having to pay $25/month for QuickBooks is huge."*

---

## Prize Categories

- **Primary Track**: Hacktoberfest Open-Source AI Challenge Week 2: Side Hustle
- **General Track**: Open-Source AI Applications Solving Real Economic Problems

---

*Built with passion for Hacktoberfest 2026. Empowering freelancers with privacy-first local AI.*
