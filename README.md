# 🎬 SRT Translator

A full-stack web app for translating SubRip (.srt) subtitle files using OpenAI, Claude, Gemini, and DeepSeek — with real-time progress, structure preservation, and per-user file isolation.

<div align="center">

[![Support Me](https://img.shields.io/badge/☕-Support%20Me-orange?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white)](https://ntamadakis.gr/support-me)
[![GitHub stars](https://img.shields.io/github/stars/ntamasM/srt-translator?style=for-the-badge&logo=github)](https://github.com/ntamasM/srt-translator/stargazers)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

---

## 📋 Table of Contents

- [🚀 Key Features](#-key-features)
- [🏗️ Architecture](#️-architecture)
- [⚙️ Installation & Setup](#️-installation--setup)
  - [Development](#development)
  - [Production (Docker)](#production-docker)
- [🔧 Configuration](#-configuration)
- [⚡ How It Works](#-how-it-works)
  - [🔄 Word Replacement System](#-word-replacement-system)
  - [🗑️ Word Removal](#️-word-removal)
  - [📝 Smart Credits Management](#-smart-credits-management)
  - [🔄 Processing Order](#-processing-order)
  - [🧹 Automatic File Cleanup](#-automatic-file-cleanup)
- [🌐 Deployment (Coolify)](#-deployment-coolify)
- [☕ Support the Project](#-support-the-project)
- [📄 License](#-license)

## 🚀 Key Features

- **Web UI**: Modern React interface with drag-and-drop file upload, real-time progress bars, and settings management
- **Per-User Isolation**: Each browser gets a unique session — uploaded files and translations are private via session cookies
- **Client-Side Settings**: All settings (API key, model, language, matching/removal words) stored in IndexedDB — nothing sensitive on the server
- **Real-Time Progress**: WebSocket-based live translation progress that persists across page navigation
- **Parallel Translation**: Subtitles are translated concurrently (configurable concurrency) for faster results
- **Structure Preservation**: Maintains exact SRT structure including cue indices, timestamps, and line counts
- **HTML Tag Protection**: Preserves inline HTML tags (`<i>`, `<b>`, `<font>`, etc.) and entities
- **Word Replacement System**: Post-translation term replacement using `source --> target` matching files
- **Word Removal**: Remove unwanted words/patterns from translations
- **Smart Credits Management**: Automatically detects, replaces, and inserts translator credits at optimal locations
- **Bulk Edit/Delete**: Batch operations for matching words and removal words management
- **Old Files Browser**: View previously uploaded and translated files with download/delete actions
- **Automatic Cleanup**: Files older than 7 days are automatically deleted; each file shows days remaining

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│  Frontend (React 19 + Vite + Tailwind CSS 4)        │
│                                                     │
│  IndexedDB ─── settings, matching words,            │
│                 removal words (per-browser)          │
│  Pages ──────── Home (translate), Old Files, Settings │
│  Context ────── TranslationContext (global state)    │
└──────────────────────┬──────────────────────────────┘
                       │  /api/*  REST + /ws/* WebSocket
┌──────────────────────▼──────────────────────────────┐
│  Backend (FastAPI + Uvicorn)                         │
│                                                     │
│  SessionCookieMiddleware ─── UUID cookie per browser │
│  File Storage ───────────── data/subtitles/{sid}/    │
│                              data/translated/{sid}/  │
│  Translation ────────────── OpenAI API (parallel)    │
│  WebSocket ──────────────── Real-time progress       │
└─────────────────────────────────────────────────────┘
```

### Project Structure

```
srt-translator/
├── backend/
│   ├── main.py                 # FastAPI app + session middleware
│   ├── config.py               # Directory constants
│   ├── core/
│   │   ├── translate.py        # SRTTranslator engine
│   │   ├── openai_client.py    # OpenAI API wrapper
│   │   ├── placeholders.py     # HTML/word protection & replacement
│   │   ├── credits.py          # Credits detection & replacement
│   │   └── word_removal.py     # Word removal logic
│   ├── routers/
│   │   ├── files.py            # Upload, list, download, delete
│   │   └── translation.py     # Translate + WebSocket progress
│   ├── schemas/
│   │   ├── files.py            # FileInfo, UploadResponse models
│   │   └── translation.py     # TranslationRequest, Settings models
│   └── services/
│       ├── file_service.py     # Session-scoped file operations
│       └── translation_service.py  # Job management + parallel translation
├── frontend/
│   └── src/
│       ├── App.tsx             # Routes + providers
│       ├── api/                # REST client, filesApi, translationApi
│       ├── components/         # Button, FileDropZone, ProgressBar, etc.
│       ├── contexts/
│       │   └── TranslationContext.tsx  # Global translation state
│       ├── hooks/              # useSettings, useFileUpload
│       ├── pages/
│       │   ├── HomePage.tsx    # Main translate page
│       │   ├── OldFilesPage.tsx # Browse uploaded/translated files
│       │   └── settings/       # General, MatchingWords, RemoveWords
│       ├── types/              # TypeScript type definitions
│       └── utils/
│           ├── constants.ts    # API URLs, AI platform options
│           ├── db.ts           # IndexedDB operations
│           └── helpers.ts      # Formatting utilities
├── Dockerfile                  # Multi-stage build (Node + Python)
├── .dockerignore
└── data/                       # Runtime file storage (ephemeral in Docker)
```

## ⚙️ Installation & Setup

### Development

#### Prerequisites

- Python 3.13+
- Node.js 22+
- npm

#### 1. Clone the repository

```bash
git clone https://github.com/ntamasM/srt-translator.git
cd srt-translator
```

#### 2. Start the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### 3. Start the frontend (separate terminal)

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server proxies `/api` and `/ws` requests to the backend at `localhost:8000`.

Open **http://localhost:5173** in your browser.

### Production (Docker)

Build and run with Docker:

```bash
docker build -t srt-translator .
docker run -p 8000:8000 srt-translator
```

The app serves both the API and the built frontend on port **8000**.

## 🔧 Configuration

All settings are configured through the web UI and stored in your browser's IndexedDB. Nothing is stored on the server.

| Setting                   | Default     | Description                                |
| ------------------------- | ----------- | ------------------------------------------ |
| AI Platform               | OpenAI      | AI provider (OpenAI, Gemini, Claude)       |
| API Key                   | —           | Your API key (stored only in your browser) |
| Model                     | gpt-4o-mini | Model to use for translation               |
| Temperature               | 0.2         | Sampling temperature (0–2)                 |
| Top P                     | 0.1         | Top-p sampling parameter (0–1)             |
| Source Language           | en          | Source language code                       |
| Target Language           | el          | Target language code                       |
| Translator Name           | Ntamas      | Name for translator credits                |
| Case-Insensitive Matching | false       | Match words regardless of case             |
| Replace Credits           | true        | Replace existing translator credits        |
| Add Credits               | true        | Add translator credits to output           |
| Append Credits at End     | false       | Force credits at end of file               |

### Matching Words

Manage word replacement pairs via **Settings → Matching Words**. Supports bulk edit and bulk delete. Format: `source → target`.

These are sent with each translation request and applied post-translation.

### Removal Words

Manage words to remove via **Settings → Remove Words**. Supports bulk edit and bulk delete.

## ⚡ How It Works

### 🔄 Word Replacement System

The matching system applies **post-translation word replacement**:

1. **Translation**: AI translates the subtitle
2. **Replacement**: Specified terms are replaced using your matching word pairs
3. **Boundaries**: Uses word boundaries to avoid partial replacements

### 🗑️ Word Removal

Remove unwanted words or patterns from subtitles:

- **Normal words**: Uses word boundaries (removes "word" from "word text" but not from "password")
- **Special patterns**: Removes pattern anywhere it appears (e.g., `{\an8}`)

### 📝 Smart Credits Management

- **Replace old credits**: Detects and replaces existing translator credits
- **Add new credits**: Analyzes timing gaps (≥5 seconds) to find optimal placement
- **Fallback**: If no suitable gap exists, credits are added at the end
- **Force end**: Option to always place credits at the end of the file

### 🔄 Processing Order

1. **Credit Replacement** — Replace existing translator credits (if enabled)
2. **Word Removal** — Remove specified words from original text
3. **Translation** — Translate text using OpenAI (parallel, 4 concurrent)
4. **Word Replacement** — Apply matching word pairs
5. **Structure Restoration** — Restore formatting and timing
6. **Credits Insertion** — Add translator credits at optimal location

### 🔐 Per-User Isolation

Each browser receives a unique session cookie (`session_id`, 30-day expiry). All file operations are scoped to this session:

- Uploads go to `data/subtitles/{session_id}/`
- Translations output to `data/translated/{session_id}/`
- One user cannot see another user's files

### 🔄 Persistent Translation State

Translation progress is managed by a global React Context (`TranslationContext`). This means:

- You can navigate to Settings while a translation is running
- Progress bars, completed files, and download links persist when you return
- The WebSocket connection stays alive across page changes

### 🧹 Automatic File Cleanup

To prevent unbounded disk usage, the server automatically cleans up old files:

- Files older than **7 days** (based on modification time) are deleted
- Cleanup runs on server startup and every hour thereafter
- Applies to both uploaded and translated files across all sessions
- Empty session directories are removed after cleanup
- The **Old Files** page shows a countdown badge on each file indicating days remaining before deletion

## 🌐 Deployment (Coolify)

To deploy on Coolify:

1. **Add Resource** → GitHub repository → select `srt-translator`
2. **Build Pack** → `Dockerfile`
3. **Ports Exposes** → `8000`
4. **Domains** → your domain (e.g., `https://srt-translator.example.com`)
5. **Deploy**

If using Cloudflare proxy, set SSL mode to **Full**.

The Dockerfile uses a multi-stage build:

- **Stage 1**: `node:22-alpine` builds the frontend (`npm ci && npm run build`)
- **Stage 2**: `python:3.13-slim` runs the backend + serves the built frontend
- Built-in health check at `/api/health`

## ☕ Support the Project

If this tool has been helpful, consider supporting its development!

<div align="center">

[![Support Me](https://img.shields.io/badge/☕-Support%20Me-orange?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white)](https://ntamadakis.gr/support-me)

</div>

- ⭐ **Star this repository** on GitHub
- 🐛 **Report bugs** or suggest features
- 💬 **Spread the word** to other subtitle translators

## 📄 License

MIT License — see [LICENSE](LICENSE) file for details.
