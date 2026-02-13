# Project Monetization & Solution Factory Brain

## 1. Core Vision
Build a suite of high-value AI solutions using a modular "Solution Factory" framework based on **TPS (Toyota Production System)** principles.
**Strategic Goal:** Generate a sustainable passive income stream via high-margin, agentic bulk processing.
**Edge:** Digital Ghostwriting (Style Cloning) + The Factory (Bulk Processing) + **Yokoten (Horizontal Intelligence Sharing)**.

## 2. Technical Stack
- **Orchestration:** **Firebase Genkit** (Centralized AI logic & Flow Management).
- **Framework:** Next.js 16+ (Frontend), FastAPI (Python Analytic Service).
- **Backend:** Node.js (Genkit Microservice) & Python Agentic Microservice.
- **Database:** Supabase (Auth, RLS, pgvector RAG) + **Shared Intelligence Vault**.
- **AI:** Google Gemini (`gemini-1.5-flash` for stability, `gemini-2.0-flash` for depth).
- **Robust Parsing:** Microsoft **MarkItDown** + **Playwright** (Python service) for high-fidelity Markdown extraction.
- **Automation:** Root-level `foundry.sh` master controller.

## 3. Application Portfolio
1. **FOUNDRY X:** Viral thread engine.
2. **FOUNDRY REALTY:** Inventory description engine.
3. **FOUNDRY OUTREACH:** Personalized email ghostwriter.
4. **SPECTRE INTEL:** Forensic Anatruth Engine & Analytic Microservice.
5. **FOUNDRY CONSOLE:** Central Command Console & Forensic Intelligence Console.

## 4. Roadmap & Progress
- [x] **Phase 1: Generator Suite & Voice Lab**
- [x] **Phase 2: SPECTRE INTEL (The Anatruth Engine)**
- [x] **Phase 2.5: TPS Integration & Efficiency Sweep**
- [x] **Phase 3: Unified Hub (Foundry Console)**
- [x] **Phase 4: Genkit Orchestration (The Central Brain)**
  - [x] **Genkit Server:** Centralized all AI logic into `apps/genkit-server`.
  - [x] **Decoupling:** Next.js apps refactored to call Genkit Flows instead of direct AI APIs.
  - [x] **Forensic Bridge:** Integrated Python Analytic Service into Genkit via `forensicTool`.
  - [x] **Robust Ingestion:** Migrated from basic PDF parsing to MarkItDown-powered Markdown extraction.
  - [x] **One-Switch Automation:** Launched `foundry.sh` with health checks and port cleanup.

## 5. Strategic Standings
- **THE FOUNDRY Overall Score:** 88.0 (Rank #3).
- **Value Rating:** 95/100 (Rank #1 in ROI).
- **Current Objective:** Standardize "Forensic Locker" UX across all specialized nodes.

## 6. Lessons & Hard-Learned Fixes (Forensic Post-Mortem)
- **Tagline:** I once was lost, but now; I'm Foundry.
- **UUID Strictness:** Database enforces UUID types; default "Nil UUID" (`00000000-0000-0000-0000-000000000000`) used for non-case context to prevent 22P02 syntax errors.
- **Robust Extraction:** Gemini performs better on high-fidelity Markdown (MarkItDown) than raw text (fitz); preserving table structures is critical for real estate forensic audits.
- **Poka-Yoke (Error Reporting):** Enhanced UI error alerts in Realty to show exact Supabase/Genkit error messages, eliminating the "hanging upload" diagnostic loop.
- **Genkit Singleton:** Ensure flows are bound to a shared `ai` instance to prevent "0 flows" discovery errors.
- **Database Hardening:** Optimized RLS via subquery wrappers `(select auth.uid())` to prevent row-level re-evaluation lag.
- **Port Discipline:** Hard-coded Genkit to Port 3101 and implemented pre-flight `fuser` cleanup in `foundry.sh` to prevent Port 3100/3101 "Fetch Failed" float.

## 7. Manually Added Notes
- **Local Identity:** Justin manually changed the name of the directory from ghostforce-suite to foundry-suite @10:43 MDT on 12/30/2025 - JL

