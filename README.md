# AuditFlow AI

A web application that helps SMEs prepare for ISO 27001 and GDPR audits by scanning uploaded documents against frameworks and generating gap reports.

## Prerequisites
- Node.js 18+ (Node 20+ strongly recommended)
- PostgreSQL database
- Supabase Project (Auth & Storage)

## Detailed Setup Guide

Follow these steps carefully to configure your database and environment variables.

### 1. Create a Supabase Project
1. Go to [database.new](https://database.new) and sign in or create a Supabase account.
2. Create a new project. Name it "AuditFlow" (or similar), generate a strong database password, and choose a region close to your users.
3. Wait a minute or two for the project database to be fully provisioned.

### 2. Configure Environment Variables
In the root directory of this project (AuditAI), create a file named `.env` and open it.

You will need to collect 5 values from your Supabase project dashboard to put in this file:

**Database Connection Strings (Prisma):**
1. Go to **Project Settings** (gear icon) -> **Database**.
2. Scroll to the "Connection string" section, select "URI" (and check "Use connection pooling" if applicable in recent UI, generally Supabase uses port 6543 for pooling and 5432 for direct).
3. Copy the Transaction pooler string and the Session/Direct connection string. Replace `[YOUR-PASSWORD]` with the password you generated in step 1.

**API Keys:**
4. Go to **Project Settings** -> **API**.
5. Copy the **Project URL**, the **Publishable key** (`sb_publishable_...`), and the **Secret key** (`sb_secret_...`).

*(Note: Supabase recently renamed these. The "Publishable key" is the Anon key, and the "Secret key" is the Service Role key).*

Your `.env` file should look exactly like this format:
```env
DATABASE_URL="postgres://..."
DIRECT_URL="postgres://..."
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## Setup
1. **Install dependencies**: `npm install`
2. **Setup Database**: `npx prisma db push`
3. **Generate Client**: `npx prisma generate`
4. **Seed Frameworks**: `npx tsx prisma/seed.ts`
5. **Create Storage Bucket**: Create a private storage bucket named `documents` in your Supabase project. Ensure policies allow the backend to read/write/delete (Service Role overrides policies, so this works out of the box).
6. **Start Dev Server**: `npm run dev`

## Background Jobs (Inngest)
To run the background document extraction pipeline locally:
`npx inngest-cli@latest dev`

## Export functionality (Playwright)
To successfully export the physical PDF gap report, ensure Playwright browsers are installed:
`npx playwright install chromium`

## Cost / LLM Note (MVP constraints)
- Document OCR/LLM API calls are kept out of this MVP version directly to save costs, favoring rule-based extraction text heuristics on the uploaded files.
- You can extend `src/inngest/functions.ts` to connect an LLM for classification if needed.
