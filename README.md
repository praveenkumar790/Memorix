> **The organizational brain that remembers everything — and always knows what's current.**

Memorix is an AI-powered knowledge base and decision engine for companies. Upload internal documents, ask questions in natural language, and record important decisions — all scoped by company and role. When decisions evolve, Memorix knows. Your AI answers always reflect *the latest thinking*, not just the latest PDF.

---

## ✨ What Makes Memorix Different

**Decision Supremacy** — Memorix's core insight: when a saved *Decision* contradicts an older *Document*, the AI follows the decision. Your knowledge base evolves in real time.

| Feature | Description |
|---|---|
| 📄 **Document Ingestion** | Upload PDFs, DOC, DOCX, and TXT files — they're chunked, embedded, and semantically indexed |
| 💬 **AI Chat** | Ask questions in plain English and get answers grounded in *your* company's documents |
| ✅ **Decision Log** | Save any AI response as an official Decision — it becomes searchable memory |
| 🏢 **Company + Role Isolation** | Engineers see engineering docs; HR sees HR docs. Zero crossover |
| ⚡ **Streaming Responses** | AI answers stream in real-time via Server-Sent Events |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────┐
│             FRONTEND  (Vite + React)              │
│                  Deployed on Vercel               │
└──────────────────┬───────────────────────────────┘
                   │  HTTPS + Bearer Token
                   ▼
┌──────────────────────────────────────────────────┐
│              BACKEND  (Express.js)                │
│                  Deployed on Render               │
└───────┬──────────────┬──────────────┬────────────┘
        │              │              │
        ▼              ▼              ▼
   ┌─────────┐   ┌──────────┐   ┌──────────┐
   │Supabase │   │ Pinecone │   │  Gemini  │
   │Postgres │   │  Vector  │   │   LLM    │
   │+ Auth   │   │  Search  │   │          │
   │+ Storage│   │          │   │          │
   └─────────┘   └──────────┘   └──────────┘
```

The **frontend** handles UI and auth. The **backend** orchestrates everything: it talks to Supabase (database + file storage), Pinecone (semantic search), and Google Gemini (AI responses).

---

## 🛠️ Tech Stack

### Frontend
| | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS + Framer Motion |
| Routing | React Router v6 |
| Data Fetching | TanStack Query + Axios |
| Auth | Supabase JS |
| UI Primitives | Radix UI + Lucide React |

### Backend
| | Technology |
|---|---|
| Runtime | Node.js + Express.js |
| LLM | Google Gemini (via `@google/generative-ai`) |
| Vector DB | Pinecone SDK |
| Database | Supabase JS (Postgres + Service Role) |
| File Uploads | Multer + pdf-parse |
| Text Chunking | LangChain `RecursiveCharacterTextSplitter` |
| Validation | Zod |
| Security | Helmet + express-rate-limit |

---

## 📁 Project Structure

```
Memorix/
├── client/                    # React + Vite frontend
│   └── src/
│       ├── api/               # Axios API service layer
│       ├── components/        # Reusable UI + layout components
│       ├── contexts/          # Auth + Theme context providers
│       ├── pages/             # Route-level page components
│       └── lib/               # Supabase client, auth helpers, utils
│
└── server/                    # Express.js backend
    ├── config/                # Gemini, Pinecone, Supabase clients
    ├── middleware/            # Auth (JWT), file upload, Zod validation
    ├── routes/                # API route handlers
    ├── services/              # Core business logic
    │   ├── ingestionService.js   # Upload → chunk → embed pipeline
    │   ├── ragService.js         # RAG chat engine
    │   └── decisionService.js    # Decision CRUD + Pinecone sync
    └── utils/                 # Namespace generator, validation schemas
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- A **Supabase** project (Postgres + Auth + Storage)
- A **Pinecone** account with an index named `memorix`
- A **Google Gemini** API key

### 1. Clone & Install

```bash
git clone <repo-url>
cd Memorix

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install
```

### 2. Configure Environment Variables

**Backend** — create `server/.env`:

```env
PORT=3002
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
PINECONE_API_KEY=pcsk_...
PINECONE_INDEX_NAME=memorix
GOOGLE_GEMINI_API_KEY=AIzaSy...
```

**Frontend** — create `client/.env`:

```env
VITE_API_URL=http://localhost:3002
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

> ⚠️ **Never expose** `SUPABASE_SERVICE_ROLE_KEY` or `GOOGLE_GEMINI_API_KEY` to the frontend.

### 3. Run Locally

```bash
# Terminal 1 — Backend (http://localhost:3002)
cd server && npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd client && npm run dev
```

---

## 🔄 Core Flows

### How a Question Gets Answered (RAG Pipeline)

```
User asks: "What is our refund policy?"
    │
    ├─ 1. Fetch recent Decisions for this company + role
    ├─ 2. Semantic search Pinecone for relevant document chunks
    ├─ 3. Build system prompt: decisions + docs + "DECISIONS ARE SUPREME"
    ├─ 4. Stream Gemini response back via SSE
    └─ 5. Save user message + AI response to database
```

### Document Ingestion Pipeline

```
User uploads a PDF
    │
    ├─ 1. Upload file to Supabase Storage
    ├─ 2. Create documents record (status: processing)
    ├─ 3. Extract text (pdf-parse or raw read)
    ├─ 4. Chunk into 1000-char pieces (200-char overlap)
    ├─ 5. Batch upsert to Pinecone (namespace: ns-{companyId}-{roleName})
    └─ 6. Update document status → indexed
```

If any step fails, the service automatically cleans up the DB record, Storage file, and temp file.

---

## 🔐 Authentication & RBAC

**Auth** is handled by Supabase (JWT). Every API request requires a `Bearer` token — the server's `auth.js` middleware verifies it and loads the user's company + role before any route handler runs.

**RBAC** enforces two levels of isolation:

- **Company** — Users only see their company's data. Acme Corp cannot see Beta LLC's documents.
- **Role** — Within a company, data is scoped by role. Engineers see engineering docs, HR sees HR docs.

Pinecone namespacing (`ns-{companyId}-{roleName}`) makes vector search automatically scoped. All Supabase queries include `WHERE company_id = X AND role_id = Y`.

---

## 🌐 API Reference

All endpoints require `Authorization: Bearer <supabase-jwt-token>`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ingest` | Upload and process a document |
| `POST` | `/api/chat` | Send a message, receive streamed AI response (SSE) |
| `GET` | `/api/chat` | List all chat sessions for the current user |
| `GET` | `/api/chat/:id/messages` | Get messages for a specific chat |
| `POST` | `/api/decisions` | Create a new decision |
| `GET` | `/api/decisions` | List decisions (scoped to company + role) |
| `GET` | `/api/dashboard/stats` | Document and decision counts |
| `GET` | `/api/dashboard/activity` | Recent activity feed |
| `GET` | `/api/documents` | List recent documents |
| `GET` | `/api/roles?companyId=xxx` | List roles for a company |
| `POST` | `/api/roles` | Create a new role |

---

## ☁️ Deployment

### Frontend → Vercel

1. Connect the `client/` directory.
2. Set env vars in the Vercel dashboard (`VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
3. Build command: `npm run build` — Output: `dist`

### Backend → Render

1. Connect the `server/` directory.
2. Set all backend env vars in the Render dashboard.
3. Start command: `npm start`

---

## 🗄️ Database Schema (Supabase / Postgres)

| Table | Key Columns |
|---|---|
| `companies` | `id`, `name` |
| `roles` | `id`, `company_id`, `name` — unique per company |
| `profiles` | `id` (= auth user), `company_id`, `role_id`, `full_name` |
| `documents` | `id`, `company_id`, `role_id`, `filename`, `status` |
| `decisions` | `id`, `company_id`, `role_id`, `author_id`, `title`, `content`, `tags` |
| `chats` | `id`, `company_id`, `user_id`, `title` |
| `messages` | `id`, `chat_id`, `role` (user/assistant), `content` |

