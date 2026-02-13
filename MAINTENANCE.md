# FOUNDRY SUITE | MAINTENANCE & LEAN SOP v1.0
Dedicated to the 'Win and Keep Winning' Philosophy.

## 1. THE PRODUCTION LINE (Architecture)
The Foundry is organized into a three-tier system to minimize complexity and maximize output quality.

1.  **THE ENGINE (Python):** Deep Forensic Analysis, RAG, and Vector Search.
2.  **THE ORCHESTRATOR (Genkit):** Centralized AI Logic, Prompt Versioning, and Debugging.
3.  **THE SCREENS (Next.js):** Lightweight User Interfaces (Console, Realty, Outreach).

## 2. STANDARD OPERATING PROCEDURES (SOPs)

### A. The "One-Switch" Startup
**Goal:** Eliminate terminal sprawl.
- **Action:** Run `./foundry.sh` from the project root.
- **Output:** Starts Python (Port 8000), Genkit (Port 3101), and the main Console (Port 3010).

### B. The "Loading Dock" Ingestion
**Goal:** Prevent redundant uploads and database clutter.
- **Rule:** **All forensic documents MUST be uploaded via the Foundry Console.**
- **Process:**
    1. Open `localhost:3010`.
    2. Create or select a "Case."
    3. Upload PDFs/Reports here.
    4. These documents are now globally available to Foundry Realty and Foundry Outreach.

### C. The "Jidoka" (Self-Healing) Debugging
**Goal:** Fix AI logic once, apply everywhere.
- **Problem:** AI is plagiarizing, hallucinating, or using the wrong tone.
- **Action:**
    1. Open the Genkit UI (`localhost:4000`).
    2. Find the offending Flow (e.g., `realEstateFlow`).
    3. Run a manual test and inspect the **Trace**.
    4. Modify the flow logic in `apps/genkit-server/src/flows/`.
    5. Save. All apps are now fixed.

## 3. EXERCISE PLAN: THE 5-S METHOD
To keep the codebase from becoming bloated ("spaghetti"), follow these weekly checks:

1.  **Sort:** Delete any prototype apps in `apps/` that haven't been touched in 30 days.
2.  **Set in Order:** Ensure every AI call in a Next.js app is routed through `src/lib/genkit.ts`. No direct API calls to Google/OpenAI.
3.  **Shine:** Run `pnpm install` in the root to ensure all apps share the same dependency versions.
4.  **Standardize:** New prompts must live in `genkit-server`, NOT in the UI components.
5.  **Sustain:** Update `GEMINI.md` after every successful architectural change.

## 4. CURRENT WORKFLOW: THE REAL ESTATE AUDIT
To test a Coldwell Banker listing:
1. Start the factory: `./foundry.sh`.
2. Upload the listing PDF via the **Console** (`localhost:3010`).
3. Open **Foundry Realty** (`localhost:3005`*) and the document will be waiting in the "Forensic Locker."
4. Generate the listing.

---
*Note: We are eventually moving the Realty UI into the Main Console to eliminate port 3005 entirely.*
