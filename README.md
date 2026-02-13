# 🚀 Solution Factory: AI Monetization Suite

Welcome to the **Solution Factory**, a modular monorepo designed to build and scale high-value AI software solutions for professional industries. This project utilizes a shared infrastructure to rapidly deploy "Generator" and "Analyzer" tools powered by Next.js, Supabase, Google Gemini, and Stripe.

---

## 📂 Project Structure

The project is organized as a **pnpm workspace** to allow for shared packages and independent application deployments.

### 🏗️ Shared Packages (`/packages`)
- **`payments`**: A shared library handling Stripe Checkout sessions and subscription management. It ensures a single "Pro" subscription unlocks every tool in the factory.

### 📱 Applications (`/apps`)
1. **`generator-template` (Twitter Factory)**:
   - **Purpose**: Generates viral Twitter threads from topics or URLs.
   - **Key Features**: Single generation, Voice Lab integration, and Bulk Mode.
2. **`real-estate-generator` (Real Estate Factory)**:
   - **Purpose**: Creates high-converting property descriptions for realtors.
   - **Key Features**: CSV upload for inventory processing, multi-column field mapping.
3. **`cold-email-generator` (Email Factory)**:
   - **Purpose**: Writes hyper-personalized cold outreach emails.
   - **Key Features**: Prospect list processing, variable value-proposition mapping.

---

## 🛠️ Core Modules & Utilities

### 🎙️ The Voice Lab (Digital Ghostwriter)
Located at `/voice-lab` in every app, this is our "hardest to build" competitive feature.
- **How it works**: Users provide 3-5 writing samples.
- **Tech**: Uses **Few-Shot Prompting**. The Gemini API is fed these samples to mimic the user’s specific cadence, vocabulary, and rhythm.
- **Database**: Stores data in `user_styles` and `style_samples` tables.

### 🏭 The Factory (Bulk Mode)
Located in the "Bulk Mode" tab of each generator.
- **How it works**: Upload a CSV -> Map the columns -> Process sequentially.
- **Tech**: Uses `PapaParse` for browser-side CSV processing and a recursive loop to manage API rate limits.
- **Safety**: Automatically stops if a user hits their free-tier usage limit.

### 💳 Monetization & Gating
- **Free Tier**: Limited to 3 generations per day across all tools (tracked via `usage_logs`).
- **Pro Tier**: $29/mo for unlimited access, Bulk Mode, and Voice Lab training.
- **Webhooks**: Automated via `/api/webhooks/stripe`, using the `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for administrative updates.

---

## 🚀 Getting Started

### 1. Environment Setup
Every app in the `/apps` directory requires a `.env.local` file with the following:
```bash
# Supabase (Auth & DB)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# AI (Google Gemini)
GEMINI_API_KEY=...

# Payments (Stripe)
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_STRIPE_PRICE_ID=...
STRIPE_WEBHOOK_SECRET=...
```

### 2. Installation
From the root directory:
```bash
pnpm install
```

### 3. Running Locally
To start a specific app (e.g., Twitter Generator):
```bash
cd apps/generator-template
pnpm run dev
```

### 4. Testing Payments
To test the "Pro" upgrade flow locally, you must run the Stripe listener:
```bash
./stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## 🧠 Critical Technical Knowledge

- **Async APIs**: In Next.js 15+, `cookies()`, `headers()`, and `searchParams` are Promises. You **must** use `await` before accessing their properties.
- **Workspace Linking**: Apps use absolute relative paths (e.g., `../../../../packages/payments`) to import shared utilities to ensure compatibility with Turbopack.
- **Supabase RLS**: Users have `SELECT` and `INSERT` permissions on their own data. Subscription status is checked on the server side during every generation request.

---

## 🗺️ Roadmap
- [x] **Phase 1**: The Generator Template (Complete).
- [x] **Phase 1.5**: The Voice Lab & Bulk Mode (Complete).
- [ ] **Phase 2**: The Analyzer Template (RAG-based tools for Legal/Finance).
- [ ] **Phase 3**: Unified Hub & Landing Page.
