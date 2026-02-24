# SRT Translator — UI App Implementation Plan

## Overview

Build a full-stack UI application for the existing SRT CLI translator. The frontend uses **React + Vite + Tailwind CSS**. The backend uses **Python (FastAPI)** to expose the existing translation logic as an API with WebSocket support for real-time progress.

---

## Architecture

```
srt-translator/
├── src/                          # Existing Python CLI package (untouched)
│   └── srt_chatgpt_translator/
├── backend/                      # NEW — FastAPI server
│   ├── main.py                   # App entry, CORS, router mounting
│   ├── config.py                 # Settings/config management (JSON file-based)
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── settings.py           # /api/settings endpoints
│   │   ├── translation.py        # /api/translate endpoints + WebSocket
│   │   └── files.py              # /api/files endpoints (upload, list, download)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── translation_service.py  # Wraps SRTTranslator with progress callbacks
│   │   ├── settings_service.py     # CRUD for matching/removal words & AI config
│   │   └── file_service.py         # File upload/download handling
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── settings.py            # Pydantic models for settings
│   │   ├── translation.py         # Pydantic models for translation requests/progress
│   │   └── files.py               # Pydantic models for file operations
│   └── requirements.txt
├── frontend/                     # NEW — React + Vite + Tailwind
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── package.json
│   ├── postcss.config.js
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                # Root component with router
│       ├── api/                   # API client layer (DRY — single source for HTTP calls)
│       │   ├── client.ts          # Fetch wrapper with base URL & error handling
│       │   ├── settingsApi.ts     # Settings-related API calls
│       │   ├── translationApi.ts  # Translation-related API calls + WebSocket
│       │   └── filesApi.ts        # File upload/download API calls
│       ├── hooks/                 # Custom React hooks (reusable logic)
│       │   ├── useSettings.ts     # Hook for settings state management
│       │   ├── useTranslation.ts  # Hook for translation state + WebSocket progress
│       │   └── useFileUpload.ts   # Hook for drag-and-drop + file management
│       ├── components/            # Shared/reusable UI components
│       │   ├── Layout.tsx         # App shell: sidebar + content area
│       │   ├── Sidebar.tsx        # Navigation sidebar
│       │   ├── FileDropZone.tsx   # Drag-and-drop file upload component
│       │   ├── ProgressBar.tsx    # Reusable progress bar
│       │   ├── ProgressCard.tsx   # Per-file translation progress card
│       │   ├── StatusBadge.tsx    # Status indicator (pending, translating, done, error)
│       │   ├── Modal.tsx          # Reusable modal dialog
│       │   ├── Toast.tsx          # Toast notification component
│       │   ├── InputField.tsx     # Reusable form input
│       │   ├── SelectField.tsx    # Reusable select/dropdown
│       │   └── Button.tsx         # Reusable button with variants
│       ├── pages/
│       │   ├── HomePage.tsx       # Drag-and-drop + translation control + progress
│       │   └── settings/
│       │       ├── SettingsLayout.tsx    # Settings page with sub-navigation tabs
│       │       ├── GeneralSettings.tsx  # AI key, platform selection, model params
│       │       ├── MatchingWords.tsx    # Manage matching/replacement word pairs
│       │       └── RemoveWords.tsx      # Manage words to remove
│       ├── types/                # TypeScript type definitions
│       │   ├── settings.ts
│       │   ├── translation.ts
│       │   └── files.ts
│       └── utils/                # Utility functions
│           ├── constants.ts      # App-wide constants (API URLs, defaults)
│           └── helpers.ts        # Shared helper functions
├── data/                         # Existing data folder (used by backend)
└── .claude/
    └── plan.md                   # This file
```

---

## Step-by-Step Implementation Plan

### Phase 1: Backend API (Python/FastAPI)

#### Step 1.1 — Project setup & dependencies

- Create `backend/requirements.txt` with: `fastapi`, `uvicorn[standard]`, `python-multipart`, `websockets`, `pydantic`
- The backend imports from the existing `src/srt_chatgpt_translator` package

#### Step 1.2 — Config management (`backend/config.py`)

- JSON file-based config stored at `data/app_config.json`
- Stores:
  - `ai_platform`: `"openai"` | `"gemini"` | `"claude"` (default: `"openai"`)
  - `api_key`: encrypted or plain string
  - `model`: string (default depends on platform)
  - `temperature`: float (default: 0.2)
  - `top_p`: float (default: 0.1)
  - `src_lang`: string (default: `"en"`)
  - `tgt_lang`: string (default: `"el"`)
  - `translator_name`: string (default: `"Ntamas"`)
  - `matching_case_insensitive`: bool (default: false)
  - `replace_credits`: bool (default: true)
  - `add_credits`: bool (default: true)
  - `append_credits_at_end`: bool (default: false)

#### Step 1.3 — Pydantic schemas (`backend/schemas/`)

- `settings.py`: `SettingsRead`, `SettingsUpdate`, `MatchingWord` (source → target pair), `RemovalWord`
- `translation.py`: `TranslationRequest`, `TranslationProgress`, `TranslationResult`
- `files.py`: `FileInfo`, `UploadResponse`

#### Step 1.4 — Settings service & router

- **Service** (`backend/services/settings_service.py`):
  - `get_settings()` → read from JSON config
  - `update_settings(data)` → write to JSON config
  - `get_matching_words()` → parse matching file (format: `source --> target`)
  - `add_matching_word(source, target)` → append to matching file
  - `remove_matching_word(source)` → remove from matching file
  - `update_matching_word(old_source, new_source, new_target)` → edit in matching file
  - `get_removal_words()` → parse removal file
  - `add_removal_word(word)` → append to removal file
  - `remove_removal_word(word)` → remove from removal file
- **Router** (`backend/routers/settings.py`):
  - `GET /api/settings` — get all settings
  - `PUT /api/settings` — update settings
  - `GET /api/settings/matching` — list matching words
  - `POST /api/settings/matching` — add matching word
  - `DELETE /api/settings/matching/{source}` — remove matching word
  - `PUT /api/settings/matching/{source}` — update matching word
  - `GET /api/settings/removal` — list removal words
  - `POST /api/settings/removal` — add removal word
  - `DELETE /api/settings/removal/{word}` — remove removal word

#### Step 1.5 — File service & router

- **Service** (`backend/services/file_service.py`):
  - `save_uploaded_file(file)` → save to `data/subtitles/`, return file info
  - `list_uploaded_files()` → list files in `data/subtitles/`
  - `get_translated_file(filename)` → return file from `data/translated/`
  - `delete_file(filename)` → remove from `data/subtitles/`
- **Router** (`backend/routers/files.py`):
  - `POST /api/files/upload` — upload SRT file(s) (multipart)
  - `GET /api/files` — list uploaded files
  - `GET /api/files/download/{filename}` — download translated file
  - `DELETE /api/files/{filename}` — delete uploaded file

#### Step 1.6 — Translation service & router (with WebSocket progress)

- **Service** (`backend/services/translation_service.py`):
  - Wraps `SRTTranslator` from the existing package
  - Adds a progress callback mechanism:
    - Override/monkey-patch the tqdm loop in `translate_file` to emit progress
    - Or refactor `translate_file` to accept an optional `progress_callback(current, total, filename)` parameter
  - `start_translation(files, settings, progress_callback)` → run translation with progress
  - Supports multi-platform: based on `ai_platform` setting, use appropriate client
    - For Phase 1, OpenAI only (existing). Gemini/Claude stubs for future.
- **Router** (`backend/routers/translation.py`):
  - `POST /api/translate` — start translation job (returns job ID)
  - `WebSocket /ws/translate/{job_id}` — real-time progress updates
    - Messages sent: `{ type: "progress", file: "name.srt", current: 45, total: 120 }`
    - Messages sent: `{ type: "file_complete", file: "name.srt" }`
    - Messages sent: `{ type: "all_complete", files: [...] }`
    - Messages sent: `{ type: "error", file: "name.srt", message: "..." }`

#### Step 1.7 — Main app (`backend/main.py`)

- FastAPI app with CORS middleware (allow frontend origin)
- Mount all routers under `/api`
- Serve static files from `frontend/dist` for production
- WebSocket endpoint registration

---

### Phase 2: Frontend (React + Vite + Tailwind)

#### Step 2.1 — Project scaffolding

- `npm create vite@latest frontend -- --template react-ts`
- Install dependencies: `tailwindcss`, `@tailwindcss/vite`, `react-router-dom`, `lucide-react` (icons)
- No HTTP client library needed — uses the native `fetch` API
- Configure Tailwind (`tailwind.config.js`)
- Configure Vite proxy to forward `/api` and `/ws` to backend (dev mode)

#### Step 2.2 — Types & constants (`frontend/src/types/`, `frontend/src/utils/`)

- Define TypeScript interfaces matching backend schemas
- Define constants: `API_BASE_URL`, platform options, default settings

#### Step 2.3 — API client layer (`frontend/src/api/`)

- `client.ts`: Thin fetch wrapper with base URL, shared error handling, and typed JSON helpers (`get<T>()`, `post<T>()`, `put<T>()`, `del<T>()`)
- `settingsApi.ts`: `getSettings()`, `updateSettings()`, `getMatchingWords()`, `addMatchingWord()`, `removeMatchingWord()`, `getRemovalWords()`, `addRemovalWord()`, `removeRemovalWord()`
- `translationApi.ts`: `startTranslation()`, `createProgressWebSocket(jobId, callbacks)`
- `filesApi.ts`: `uploadFiles()`, `listFiles()`, `downloadFile()`, `deleteFile()`

#### Step 2.4 — Reusable components (`frontend/src/components/`)

- **`Layout.tsx`**: App shell with sidebar and main content area
- **`Sidebar.tsx`**: Navigation links (Home, Settings) with active state
- **`FileDropZone.tsx`**: Drag-and-drop zone for .srt files with visual feedback
  - Shows file list after upload
  - Supports multiple file selection
  - Only accepts `.srt` files
- **`ProgressBar.tsx`**: Animated progress bar with percentage
- **`ProgressCard.tsx`**: Card showing per-file translation progress (filename, progress bar, status)
- **`StatusBadge.tsx`**: Colored badge (pending → yellow, translating → blue pulse, done → green, error → red)
- **`InputField.tsx`**: Labeled text input with validation styling
- **`SelectField.tsx`**: Labeled dropdown select
- **`Button.tsx`**: Button with variants (primary, secondary, danger) and loading state
- **`Modal.tsx`**: Confirmation/input modal dialog
- **`Toast.tsx`**: Toast notification system (success, error, info)

#### Step 2.5 — Custom hooks (`frontend/src/hooks/`)

- **`useSettings.ts`**:
  - Fetches and caches settings from API
  - Provides `updateSettings`, `isLoading`, `error` state
- **`useTranslation.ts`**:
  - Manages translation state: `idle` | `uploading` | `translating` | `complete` | `error`
  - Opens WebSocket, tracks per-file progress
  - Provides: `startTranslation()`, `progress`, `status`, `results`
- **`useFileUpload.ts`**:
  - Handles drag-and-drop events
  - File validation (`.srt` extension)
  - Upload to backend
  - Provides: `files`, `addFiles()`, `removeFile()`, `isDragging`

#### Step 2.6 — Home page (`frontend/src/pages/HomePage.tsx`)

- **Top section**: Language selector (source → target) with swap button
- **Main section**: `FileDropZone` with uploaded file list
  - Each file shows name, size, remove button
- **Action section**: "Start Translation" button (disabled if no files or no API key set)
- **Progress section** (visible during translation):
  - Overall progress bar (total cues translated / total cues)
  - Per-file `ProgressCard` list showing:
    - Filename
    - Individual progress bar
    - Status badge (pending / translating / done / error)
    - Cues progress: "45 / 120 cues translated"
  - Animated translating indicator
- **Complete section** (visible after translation):
  - Success summary
  - Download buttons for each translated file
  - "Translate More" reset button

#### Step 2.7 — Settings page (`frontend/src/pages/settings/`)

- **`SettingsLayout.tsx`**: Tab navigation (General | Matching Words | Remove Words)
- **`GeneralSettings.tsx`**:
  - AI Platform: radio group or select (OpenAI / Gemini / Claude) with platform logos
  - API Key: password input with show/hide toggle + save button
  - Model: text input (default based on platform, e.g., `gpt-4o-mini` for OpenAI)
  - Temperature: number input with range slider (0–2)
  - Top-p: number input with range slider (0–1)
  - Source Language: input (default: `en`)
  - Target Language: input (default: `el`)
  - Translator Name: text input
  - Credits options: checkboxes (replace old credits, add new credits, append at end)
  - Save button with success feedback
- **`MatchingWords.tsx`**:
  - Description text explaining the matching file format (`source --> target`)
  - Add form: two inputs (source term, target term) + "Add" button
  - List of existing matching pairs in an editable table/card list
    - Each row: source, arrow, target, edit button, delete button
  - Import from file button (upload `.txt` file)
  - Search/filter input for large lists
- **`RemoveWords.tsx`**:
  - Description text explaining word removal feature
  - Add form: single input + "Add" button
  - List of existing removal words with delete buttons
  - Import from file button
  - Search/filter input for large lists

---

### Phase 3: Multi-Platform AI Support

#### Step 3.1 — Abstract AI client interface

- Refactor `openai_client.py` → extract a base `TranslationClient` protocol/ABC
- Create `gemini_client.py` implementing the same interface using Google's Generative AI SDK
- Create `claude_client.py` implementing the same interface using Anthropic SDK
- Factory function: `create_client(platform, api_key, model, temperature, top_p) → TranslationClient`

#### Step 3.2 — Update translate.py

- Use the factory function instead of directly instantiating `OpenAITranslationClient`
- Platform selection driven by the config/settings

#### Step 3.3 — Update backend dependencies

- Add `google-generativeai` and `anthropic` to `backend/requirements.txt`

---

### Phase 4: Polish & Production

#### Step 4.1 — Error handling

- Global error handler in FastAPI for consistent error responses
- Frontend error boundary component
- Toast notifications for API errors

#### Step 4.2 — Validation

- Frontend form validation (required fields, API key format, language codes)
- Backend Pydantic validation with clear error messages

#### Step 4.3 — Dark mode support

- Tailwind dark mode via `class` strategy
- Toggle in sidebar/header
- Persist preference in localStorage

#### Step 4.4 — Build & run scripts

- `run_app.ps1` / `run_app.sh`: start both backend and frontend
- Production build: `npm run build` → serve from FastAPI static files
- Docker support (optional)

---

## File-by-File Implementation Order

| #   | File                                              | Description                        |
| --- | ------------------------------------------------- | ---------------------------------- |
| 1   | `backend/requirements.txt`                        | Backend dependencies               |
| 2   | `backend/config.py`                               | JSON config management             |
| 3   | `backend/schemas/__init__.py`                     | Schema package init                |
| 4   | `backend/schemas/settings.py`                     | Settings Pydantic models           |
| 5   | `backend/schemas/translation.py`                  | Translation Pydantic models        |
| 6   | `backend/schemas/files.py`                        | File Pydantic models               |
| 7   | `backend/services/__init__.py`                    | Service package init               |
| 8   | `backend/services/settings_service.py`            | Settings CRUD service              |
| 9   | `backend/services/file_service.py`                | File management service            |
| 10  | `backend/services/translation_service.py`         | Translation wrapper with progress  |
| 11  | `backend/routers/__init__.py`                     | Router package init                |
| 12  | `backend/routers/settings.py`                     | Settings API endpoints             |
| 13  | `backend/routers/files.py`                        | File API endpoints                 |
| 14  | `backend/routers/translation.py`                  | Translation API + WebSocket        |
| 15  | `backend/main.py`                                 | FastAPI app entry point            |
| 16  | `frontend/` (scaffold)                            | Vite + React + Tailwind setup      |
| 17  | `frontend/src/utils/constants.ts`                 | Constants and config               |
| 18  | `frontend/src/utils/helpers.ts`                   | Helper functions                   |
| 19  | `frontend/src/types/settings.ts`                  | Settings type definitions          |
| 20  | `frontend/src/types/translation.ts`               | Translation type definitions       |
| 21  | `frontend/src/types/files.ts`                     | File type definitions              |
| 22  | `frontend/src/api/client.ts`                      | Axios/fetch wrapper                |
| 23  | `frontend/src/api/settingsApi.ts`                 | Settings API calls                 |
| 24  | `frontend/src/api/translationApi.ts`              | Translation API + WebSocket        |
| 25  | `frontend/src/api/filesApi.ts`                    | File upload/download API           |
| 26  | `frontend/src/components/Button.tsx`              | Button component                   |
| 27  | `frontend/src/components/InputField.tsx`          | Input component                    |
| 28  | `frontend/src/components/SelectField.tsx`         | Select component                   |
| 29  | `frontend/src/components/Modal.tsx`               | Modal component                    |
| 30  | `frontend/src/components/Toast.tsx`               | Toast notification                 |
| 31  | `frontend/src/components/StatusBadge.tsx`         | Status badge                       |
| 32  | `frontend/src/components/ProgressBar.tsx`         | Progress bar                       |
| 33  | `frontend/src/components/ProgressCard.tsx`        | Per-file progress card             |
| 34  | `frontend/src/components/FileDropZone.tsx`        | Drag-and-drop upload               |
| 35  | `frontend/src/components/Sidebar.tsx`             | Navigation sidebar                 |
| 36  | `frontend/src/components/Layout.tsx`              | App shell layout                   |
| 37  | `frontend/src/hooks/useSettings.ts`               | Settings hook                      |
| 38  | `frontend/src/hooks/useTranslation.ts`            | Translation + WS hook              |
| 39  | `frontend/src/hooks/useFileUpload.ts`             | File upload hook                   |
| 40  | `frontend/src/pages/HomePage.tsx`                 | Home page                          |
| 41  | `frontend/src/pages/settings/SettingsLayout.tsx`  | Settings layout                    |
| 42  | `frontend/src/pages/settings/GeneralSettings.tsx` | AI config settings                 |
| 43  | `frontend/src/pages/settings/MatchingWords.tsx`   | Matching words manager             |
| 44  | `frontend/src/pages/settings/RemoveWords.tsx`     | Removal words manager              |
| 45  | `frontend/src/App.tsx`                            | Root with routing                  |
| 46  | `frontend/src/main.tsx`                           | App entry point                    |
| 47  | Multi-platform AI clients                         | Abstract + Gemini + Claude clients |
| 48  | Run scripts                                       | `run_app.ps1`, `run_app.sh`        |

---

## Design Principles

1. **DRY (Don't Repeat Yourself)**:
   - Shared API client layer (single fetch wrapper with typed helpers)
   - Reusable UI components (Button, Input, Modal, etc.)
   - Custom hooks encapsulate business logic, pages only compose
   - Backend services separated from routers (thin controllers)
   - Pydantic schemas shared across routers

2. **Separation of Concerns**:
   - `api/` — HTTP communication only
   - `hooks/` — state management and business logic
   - `components/` — presentational, reusable UI
   - `pages/` — page-level composition
   - `types/` — type definitions
   - Backend: `routers/` (HTTP layer) → `services/` (business logic) → existing `srt_chatgpt_translator` (core)

3. **Single Responsibility**:
   - Each file has one clear purpose
   - Each component does one thing well
   - Each API function maps to one endpoint

4. **Progressive Enhancement**:
   - Phase 1 works with OpenAI only
   - Phase 3 adds Gemini/Claude without breaking existing code
   - Factory pattern makes adding new platforms trivial

---

## API Endpoints Summary

| Method | Endpoint                          | Description               |
| ------ | --------------------------------- | ------------------------- |
| GET    | `/api/settings`                   | Get all settings          |
| PUT    | `/api/settings`                   | Update settings           |
| GET    | `/api/settings/matching`          | List matching words       |
| POST   | `/api/settings/matching`          | Add matching word pair    |
| PUT    | `/api/settings/matching/{source}` | Update matching word      |
| DELETE | `/api/settings/matching/{source}` | Delete matching word      |
| GET    | `/api/settings/removal`           | List removal words        |
| POST   | `/api/settings/removal`           | Add removal word          |
| DELETE | `/api/settings/removal/{word}`    | Delete removal word       |
| POST   | `/api/files/upload`               | Upload SRT file(s)        |
| GET    | `/api/files`                      | List uploaded files       |
| GET    | `/api/files/download/{filename}`  | Download translated file  |
| DELETE | `/api/files/{filename}`           | Delete uploaded file      |
| POST   | `/api/translate`                  | Start translation job     |
| WS     | `/ws/translate/{job_id}`          | Real-time progress stream |

---

## WebSocket Progress Protocol

```jsonc
// Server → Client messages:

// Per-cue progress update
{ "type": "progress", "file": "episode1.srt", "current": 45, "total": 120 }

// Single file completed
{ "type": "file_complete", "file": "episode1.srt", "output": "episode1.srt" }

// All files completed
{ "type": "all_complete", "files": ["episode1.srt", "episode2.srt"] }

// Error occurred
{ "type": "error", "file": "episode1.srt", "message": "API rate limit exceeded" }
```

---

## UI Wireframe (Text-Based)

```
┌──────────────────────────────────────────────────────────┐
│  🎬 SRT Translator                          [⚙ Settings] │
├────────────┬─────────────────────────────────────────────┤
│            │                                             │
│  🏠 Home   │   Source: [en ▼]  →  Target: [el ▼]  [⇄]   │
│            │                                             │
│  ⚙ Settings│   ┌─────────────────────────────────────┐   │
│    General │   │                                     │   │
│    Matching│   │     📁 Drag & drop .srt files here   │   │
│    Remove  │   │        or click to browse            │   │
│            │   │                                     │   │
│            │   └─────────────────────────────────────┘   │
│            │                                             │
│            │   Files:                                    │
│            │   ┌─ episode1.srt (24 KB)      [✕] ──────┐ │
│            │   ├─ episode2.srt (18 KB)      [✕] ──────┤ │
│            │   └──────────────────────────────────────┘ │
│            │                                             │
│            │   [▶ Start Translation]                     │
│            │                                             │
│            │   ── Progress ──────────────────────────── │
│            │   Overall: ████████████░░░░░░░  62%          │
│            │                                             │
│            │   episode1.srt  ██████████████████ 100% ✅   │
│            │   episode2.srt  ████████░░░░░░░░░  25% 🔄   │
│            │                                             │
└────────────┴─────────────────────────────────────────────┘
```

---

## Tech Stack Summary

| Layer       | Technology             | Purpose                      |
| ----------- | ---------------------- | ---------------------------- |
| Frontend    | React 18+, TypeScript  | UI framework                 |
| Build tool  | Vite                   | Fast dev server & bundling   |
| Styling     | Tailwind CSS           | Utility-first CSS            |
| Icons       | Lucide React           | Consistent icon set          |
| Routing     | React Router v6        | Client-side routing          |
| HTTP client | Native fetch API       | API calls (no extra dep)     |
| Backend     | FastAPI                | Python REST API              |
| WebSocket   | FastAPI WebSocket      | Real-time progress           |
| Validation  | Pydantic v2            | Request/response validation  |
| AI - OpenAI | openai SDK             | GPT translation              |
| AI - Gemini | google-generativeai    | Gemini translation (Phase 3) |
| AI - Claude | anthropic              | Claude translation (Phase 3) |
| Core logic  | srt_chatgpt_translator | Existing translation engine  |
