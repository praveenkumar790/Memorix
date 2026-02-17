# Memorix Client

A modern, AI-powered knowledge management interface built with React, Vite, and Supabase.

## 🚀 Teck Stack

- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Auth**: [Supabase Auth](https://supabase.com/docs/guides/auth)
- **State**: React Context (`AuthContext`, `ThemeContext`)
- **Routing**: `react-router-dom`

## 🛠️ Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env` file in the root directory:
    ```env
    VITE_API_URL=http://localhost:3002/api
    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-key
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## 📦 Scripts

- `npm run dev`: Start dev server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint
- `npm run preview`: Preview production build
