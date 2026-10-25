# GovExam Tracker — Autonomous Exam Intelligence & Alert Agent

[![CI Status](https://github.com/josh070305/Exam-Tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/josh070305/Exam-Tracker/actions)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg)](https://mongoosejs.com)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC.svg)](https://tailwindcss.com)

An autonomous agentic system that continuously monitors official Indian government recruitment boards (**SSC, RRB, TNPSC, UPSC, IBPS, SBI**), extracts notice PDFs and announcements, compares newly detected content against a versioned historical knowledge base, and surfaces real-time alerts through an **interactive Telegram bot**, **real-time SSE dashboard**, **WhatsApp**, and **Email**.

---

## 🚀 Architecture & Agentic Workflow

```mermaid
flowchart TD
    Scheduler[Cron Scheduler / Manual Trigger / Webhook] --> Pipeline[Agent Orchestrator]
    
    subgraph Scraping & Ingestion
        Pipeline --> Scraper[Cheerio Notice Board Scrapers]
        Scraper --> Hash[SHA-256 Content Hash Comparison]
        Hash -- No Change Detected --> Skip[Update lastCheckedAt & Terminate Cycle]
        Hash -- Content Changed --> PDF[PDF Notice Link Extractor]
        PDF --> PDFParser[pdf-parse Engine: Extract Text & Corrigendums]
    end
    
    subgraph Agentic Intelligence & Context Management
        PDFParser --> ContextQuery[Fetch Historical Exam Records from MongoDB]
        ContextQuery --> AIAgent[LLM Extraction Agent (Claude / Groq Llama 3.3)]
        AIAgent --> SchemaValidation[JSON Schema Validation & Type Classification]
    end
    
    subgraph Storage & Versioning
        SchemaValidation --> MongoChanges[(ExamChange Collection)]
        SchemaValidation --> MongoKB[(Versioned Exam Knowledge Base)]
    end
    
    subgraph Real-Time Distribution
        MongoChanges --> SSE[Server-Sent Events: /api/stream]
        SSE --> ReactUI[React + TS Live Dashboard]
        MongoChanges --> TelegramBot[Interactive Telegram Bot: Long Polling]
        MongoChanges --> MultiChannel[Twilio WhatsApp & SMTP Email]
    end
```

---

## ✨ Key Capabilities

1. **Context-Managed AI Extraction**: Unlike naive one-shot summarizers, our agent pulls prior recorded exam states from MongoDB, comparing previous dates or rules against new notices to calculate accurate transitions (`oldValue` $\rightarrow$ `newValue`).
2. **Official Notice PDF Ingestion**: Government portals frequently publish revisions solely inside attached PDFs. The built-in PDF ingestion engine (`pdf-parse`) downloads and processes the text of linked notices on the fly.
3. **Interactive Telegram Bot**:
   - `/start` — Registers aspirant account and preferences.
   - `/myexams` — Shows active boards and keywords.
   - `/subscribe <board/exam>` — Subscribes to specific boards (e.g. `/subscribe SSC`) or keywords (e.g. `/subscribe CGL`).
   - `/unsubscribe <board/exam>` — Removes subscriptions.
   - `/latest <board>` — Queries recent updates for a board on-demand.
   - `/check` — Triggers an immediate monitor scan and reports results to chat.
   - `/help` — Full command guide.
4. **Hybrid Database Layer**: Automatically connects to production MongoDB via **Mongoose**; gracefully falls back to an in-memory JSON disk store for zero-setup local development.
5. **Real-Time Live Feed**: Dashboard streams live events over **Server-Sent Events (SSE)** (`GET /api/stream`), dynamically inserting new notices without manual refreshes.
6. **Automated CI & Testing**: Complete Jest test suite covering API endpoints, preference matching, snapshot change detection, and knowledge base versioning.

---

## 📦 Tech Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), Cheerio, pdf-parse, node-cron
- **AI Providers:** Anthropic Claude (`claude-sonnet-4-5`) or Groq (`llama-3.3-70b-versatile`)
- **Interactive Bot:** Telegram Bot API (`node-telegram-bot-api` with polling & command router)
- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite, Server-Sent Events (SSE)
- **DevOps:** Docker, Docker Compose, GitHub Actions CI

---

## 🛠️ Quick Start

### Option A: Using Docker Compose (Recommended)

Run the entire stack (MongoDB, Backend, Frontend) with a single command:

```bash
docker compose up --build
```

- Dashboard: `http://localhost`
- Backend API: `http://localhost:5000`

---

### Option B: Local Setup

#### 1. Configure Environment

Copy the example environment file in `backend/`:

```bash
cp backend/.env.example backend/.env
```

Key environment variables:

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend service port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/exam-tracker` |
| `AI_PROVIDER` | `anthropic` (default) or `groq` | `anthropic` |
| `GROQ_API_KEY` | Free Groq API Key | Obtain from console.groq.com |
| `TELEGRAM_BOT_TOKEN` | Token from @BotFather for interactive bot | — |
| `TELEGRAM_CHAT_ID` | Fallback chat ID for direct alerts | — |

#### 2. Start Backend

```bash
cd backend
npm install
npm test          # Run automated test suite
npm run dev       # Start backend server with nodemon
```

#### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev       # Starts Vite dev server at http://localhost:5173
```

---

## 📡 REST & Streaming API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status check |
| `GET` | `/api/stream` | Server-Sent Events (SSE) live feed connection |
| `GET` | `/api/stats` or `/api/changes/stats` | Aggregated metrics (by type, board, and last checked) |
| `GET` | `/api/sources` or `/api/changes/sources` | Status and content hashes of monitored portals |
| `GET` | `/api/changes?page=1` | Paginated chronological update feed |
| `GET` | `/api/changes/:source` | Updates filtered by board (e.g. `SSC`, `UPSC`) |
| `POST` | `/api/check-now` | Manually triggers an immediate scan of all sources |
| `GET` | `/api/exams` | Versioned Knowledge Base — master list of exams |
| `GET` | `/api/exams/:id` | Full versioned change history timeline for an exam |
| `GET` | `/api/users` | List registered aspirants and preferences |
| `POST` | `/api/users` | Register a new aspirant |
| `PUT` | `/api/users/:id/preferences` | Update boards, exam keywords, and notification channels |

---

## 🧪 Testing

Run unit and integration tests:

```bash
cd backend
npm test
```

Verifies:
- Health check and REST endpoint contracts
- Preference matching and notification channel filters
- Snapshot diffing and change detection (preventing false positives)
- LLM context management prompt synthesis
- Knowledge base versioning persistence

---

## 📄 License

MIT License. Designed and developed for public recruitment examination tracking.
