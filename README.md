# DocuAsk UI

The React frontend for [DocuAsk](https://github.com/clairekimani123/DUCOASK) — an AI document assistant that lets users upload files and have streaming, context-aware conversations about their content.

**Live app:** [ducoask.vercel.app](https://ducoask.vercel.app)
**Backend repo:** [RAG-chatbot](https://github.com/clairekimani123/RAG-chatbot)

---

## Overview

A dark-themed, single-page chat application built with React, TypeScript, and Vite. It handles authentication, file uploads, real-time streaming responses, and persistent conversation history — all communicating with a FastAPI backend over REST and Server-Sent Events.

---

## Features

- **JWT authentication** — sign up, log in, session persisted in localStorage
- **Drag-and-drop file upload** — PDF, PNG/JPEG, TXT, DOCX
- **Streaming chat** — answers render token by token as they arrive from the backend
- **Conversation history** — past conversations are listed in a sidebar tab and can be resumed with full message history restored
- **Three theme presets** — black, lavender, and purple, switched instantly via CSS variables, no reload required
- **Responsive layout** — desktop shows a fixed sidebar; mobile uses a slide-out drawer with a hamburger toggle
- **Source citations** — each AI answer shows which document chunks it was generated from, expandable per message

---

## Tech stack

| Tool | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool and dev server |
| Axios | HTTP requests, with an interceptor that auto-attaches the JWT |
| Fetch + ReadableStream | Used specifically for streaming chat responses (axios cannot stream) |
| CSS variables | Theme system — no CSS framework, custom design tokens |

---

## Project structure

```
src/
├── main.tsx              # React entry point
├── App.tsx               # auth gate, global state, responsive shell
├── AuthContext.tsx        # login/register/logout, token persistence, axios interceptor
├── AuthPage.tsx           # sign in / sign up screen
├── index.css              # design tokens, theme variants, animations
├── vite-env.d.ts          # Vite environment variable typing
├── api/
│   └── client.ts          # all backend calls, including the SSE stream parser
├── types/
│   └── index.ts           # Message, Theme, and other shared interfaces
└── components/
    ├── Sidebar.tsx         # upload zone, document list, history tab, theme switcher
    ├── ChatArea.tsx        # message state, sends questions, handles streaming
    ├── MessageBubble.tsx   # renders one message, source citations, streaming cursor
    └── ChatInput.tsx       # auto-resizing textarea, Enter-to-send
```

---

## How streaming works

Axios can't handle streamed responses, so `client.ts` uses the native `fetch` API directly for the `/api/chat/stream` endpoint:

```ts
const response = await fetch(`${BASE}/api/chat/stream`, { ... })
const reader = response.body!.getReader()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  // parse each Server-Sent Event chunk, call onToken() per word
}
```

`ChatArea.tsx` keeps a single mutable string (`fullContent`) that grows with each token, and calls `setMessages` on every token to re-render the bubble live. This is what creates the word-by-word typing effect.

---

## Theme system

All colors, spacing, and fonts are defined as CSS variables in `index.css` under `:root`. Switching themes works by setting a `data-theme` attribute on the `<html>` element:

```ts
document.documentElement.setAttribute('data-theme', 'lavender')
```

CSS selectors like `[data-theme="lavender"] { --bg-base: ... }` override the root variables instantly — every component re-renders with new colors without a page reload, because they all reference `var(--bg-base)` rather than hardcoded hex values.

---

## Local setup

### Prerequisites

- Node.js 18+
- The DocuAsk backend running locally or deployed (see [backend README](https://github.com/clairekimani123/RAG-chatbot))

### Install and run

```bash
git clone https://github.com/clairekimani123/docuask-ui
cd docuask-ui
npm install

echo "VITE_API_URL=http://localhost:8000" > .env.development

npm run dev
```

App runs at `http://localhost:5173`.

### Build for production

```bash
npm run build
```

Output goes to `dist/`.

---

## Environment variables

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API. Set per environment via `.env.development` and `.env.production`, and configured in the Vercel dashboard for deployed builds. |

**Note on Vite env variables:** they are baked into the build at build time, not read at runtime. Changing `VITE_API_URL` in Vercel's dashboard requires triggering a new deployment for the change to take effect.

---

## Deployment

Deployed on Vercel, connected directly to this GitHub repo. Every push to `main` triggers an automatic redeploy.

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variable | `VITE_API_URL` set to the Render backend URL |

---

## Known limitations

- File uploads are capped at 20MB (enforced by the backend)
- Only one document can be queried per conversation — no cross-document chat yet
- Embeddings in production use a lightweight fallback method rather than a full sentence-transformer model, due to memory constraints on the backend's free hosting tier (see backend README for details)