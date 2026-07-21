# Exam Update Tracker

An AI agent that monitors Indian government recruitment exam websites for
changes and sends alerts. It periodically scrapes **6 recruitment-board**
notification pages (SSC, RRB, TNPSC, UPSC, IBPS, SBI), detects content changes,
uses an LLM to extract structured exam updates (new exams, date changes, admit
cards, results, eligibility revisions, corrigendums), stores them in a
versioned MongoDB knowledge base, and pushes alerts via **Telegram**, **WhatsApp**
(Twilio), and **email** (SMTP) based on each user's exam preferences.

## Stack

- **Backend:** Node.js + Express, MongoDB (Mongoose), axios + cheerio (scraping), node-cron (scheduling)
- **AI extraction:** Anthropic Claude **or** Groq (free, default) — same system prompt & JSON schema for both
- **Alerting:** Telegram (node-telegram-bot-api), WhatsApp (Twilio), Email (nodemailer)
- **Frontend:** React + TypeScript + Tailwind CSS + Vite dashboard

## Project Structure

```
exam-tracker/
  backend/
    src/
      config/      db connection + env
      models/      ExamChange, SourceSnapshot, Exam (versioned KB), User
      scrapers/    one file per source (ssc.js, rrb.js, tnpsc.js, upsc.js, ibps.js, sbi.js, util.js, index.js)
      services/    changeDetection, aiExtraction, telegram, whatsapp, email, pipeline, alerting
      jobs/        node-cron scheduler
      routes/      Express API (changes, exams, users, health)
      storage.js   disk persistence for dev
      server.js
    .env.example
    package.json
  frontend/        Vite + React + TS + Tailwind dashboard
  README.md
```

## Setup

### 1. Environment variables
Copy `backend/.env.example` to `backend/.env` and fill in values:

```bash
cp backend/.env.example backend/.env
```

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection string (local `mongodb://127.0.0.1:27017/exam-tracker` or Atlas) |
| `AI_PROVIDER` | `groq` (free, default) or `anthropic` |
| `GROQ_API_KEY` | Free key from https://console.groq.com/keys (used when `AI_PROVIDER=groq`) |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` (default) |
| `ANTHROPIC_API_KEY` | Only needed when `AI_PROVIDER=anthropic` |
| `TELEGRAM_BOT_TOKEN` | From @BotFather |
| `TELEGRAM_CHAT_ID` | Your chat id (from @RawDataBot) |
| `TWILIO_ACCOUNT_SID` | Twilio account SID (for WhatsApp) |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_WHATSAPP_FROM` | Twilio WhatsApp sandbox number |
| `SMTP_HOST` | SMTP host (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP port (default 587) |
| `SMTP_USER` | SMTP username / email |
| `SMTP_PASS` | SMTP password / app password |
| `EMAIL_FROM` | Sender email address |
| `PORT` | Backend port (default 5000) |

> **Why Groq by default?** It's a free, OpenAI-compatible API so the whole
> pipeline runs at zero cost. To use Claude instead, set `AI_PROVIDER=anthropic`
> and provide `ANTHROPIC_API_KEY` — the extraction prompt and output parsing are
> identical.

### 2. Install & run backend
```bash
cd backend
npm install
npm run dev      # or: npm start
```

### 3. Install & run frontend
```bash
cd frontend
npm install
npm run dev      # Vite dev server on http://localhost:5173
```
The frontend talks to the backend at `http://localhost:5000/api` (see
`src/App.tsx` → `API_BASE`).

### 4. Trigger a check
Open `POST http://localhost:5000/api/check-now` (e.g. via curl or the
"Check Now" button in the dashboard) to run the pipeline immediately without
waiting for the 2-hour schedule.

## How the pipeline works

```
scrape ──▶ hash-compare ──▶ extract ──▶ classify ──▶ store ──▶ KB ──▶ alert
```
1. **Scrape** — axios fetches each of the 6 sources' pages (realistic User-Agent), cheerio
   extracts *only* the notifications/announcements section (nav/footer stripped
   to avoid false positives).
2. **Hash-compare** — a SHA-256 hash of the extracted text is compared to the
   last stored `SourceSnapshot.lastContentHash`. If unchanged, update
   `lastCheckedAt` and skip. If changed, continue.
3. **Extract + classify** — the changed section is sent to the LLM with a fixed
   system prompt; the model returns a JSON array of structured changes. Invalid
   JSON or a rate-limit (429) is caught — we log it and skip the cycle instead
   of crashing.
4. **Store** — each extracted item is saved as an `ExamChange` document and
   appended to the versioned `Exam` knowledge base.
5. **Alert** — a Telegram / WhatsApp / email message is sent for every new change,
   filtered by each user's preferences (sources, exam names, change types, channels).

The full job runs via node-cron every 2 hours (`0 */2 * * *`), and is also
exposed via `POST /api/check-now`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/changes?page=1` | All changes, newest first, 20 per page |
| GET | `/api/changes/:source` | Filter by source (e.g. `SSC`, `RRB`) |
| GET | `/api/changes/stats` | Aggregate counts (total, by type, by source, last checked) |
| GET | `/api/changes/sources` | Source snapshot status |
| POST | `/api/check-now` | Manually trigger the full pipeline |
| GET | `/api/exams` | Versioned knowledge base — one entry per exam |
| GET | `/api/exams/:id` | Full change history for one exam |
| GET | `/api/users` | List aspirants |
| GET | `/api/users/:id` | Get aspirant by ID |
| POST | `/api/users` | Create an aspirant |
| PUT | `/api/users/:id` | Update profile fields |
| PUT | `/api/users/:id/preferences` | Update exam preferences + alert channels |

## Error Handling

- Every external call (axios, LLM, Telegram, MongoDB) is wrapped in try/catch
  with contextual logging (which source / which step failed).
- One source failing never stops the others from being checked.
- LLM rate limits (429) are logged and the cycle is skipped — no retry loop
  that could cause a crash.
- Scraper failures (site down / structure changed) are logged and the next
  source proceeds.

## Known Limitations

- Scraper selectors are best-effort; if a site radically changes its HTML, the
  notification section may need re-tuning.
- No authentication on user APIs (v2).
- Scrapers target homepage notification sections; deeper pagination / PDF notices
  are not followed.
- LLM extraction quality depends on the scraped text clarity and the model used.

## What v2 Would Add

- Authentication (JWT) and proper multi-user account management.
- Real-time WebSocket feed for the dashboard.
- Field-level diff storage at the `ExamChange` level (beyond LLM-inferred old/new).
- Pluggable scraper registry with per-source configuration UI.
- Retry/backoff for failed scrapes and smarter rate-limit handling.
