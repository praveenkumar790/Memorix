# Memorix Server

The backend API for Memorix, handling file ingestion, RAG (Retrieval-Augmented Generation), and RBAC management.

## 🛠️ Tech Stack

- **Runtime**: Node.js + Express
- **Database**: Supabase (PostgreSQL) + Pinecone (Vector DB)
- **AI/LLM**: LangChain + Google Gemini
- **Security**: Helmet, Express Rate Limit, Zod Validation

## 🚀 Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env` file in the root directory:
    ```env
    PORT=3002
    DATABASE_URL=postgresql://...
    PINECONE_API_KEY=...
    PINECONE_INDEX_NAME=memorix
    GOOGLE_GEMINI_API_KEY=...
    SUPABASE_URL=...
    SUPABASE_KEY=...
    SUPABASE_SERVICE_ROLE_KEY=...
    ```

3.  **Run Server**:
    ```bash
    npm start
    # or for development with auto-restart
    npm run dev
    ```

## 🔒 Security

- **Authentication**: JWT verification via Supabase Auth middleware.
- **RBAC**: Role-based access control for Multi-Tenancy (Company isolation).
- **Protection**:
    - `Helmet`: Secure HTTP headers.
    - `Rate Limit`: 100 requests / 15 mins per IP.
    - `Zod`: Strict input validation on API routes.
