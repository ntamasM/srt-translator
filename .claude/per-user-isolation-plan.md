# Per-User Data Isolation Plan

## Problem

Currently every user who accesses the deployed app shares:

| Data                                               | Storage               | Location                    |
| -------------------------------------------------- | --------------------- | --------------------------- |
| General settings (API key, model, languages, etc.) | Server JSON file      | `data/app_config.json`      |
| Uploaded subtitle files                            | Server filesystem     | `data/subtitles/`           |
| Translated subtitle files                          | Server filesystem     | `data/translated/`          |
| Matching words                                     | Browser IndexedDB     | `srt-translator` DB         |
| Removal words                                      | Browser IndexedDB     | `srt-translator` DB         |
| Translation jobs                                   | Server in-memory dict | `translation_service._jobs` |

**Matching words & removal words are already per-browser** (IndexedDB is origin-scoped per browser). The problems are:

1. **Settings** — one shared `app_config.json`; any user changing the API key or target language affects everyone.
2. **Files** — uploaded SRT files and translated outputs are in shared directories; users see each other's files.
3. **Jobs** — any user can technically poll another user's job ID (minor, but still leaky).

---

## Proposed solution: full client-side storage (IndexedDB)

Since users provide their own personal API keys and there is no shared server resource, **all user data lives in the browser's IndexedDB**. No auth, no sessions, no server-side user directories. The backend becomes stateless — it receives everything it needs per-request from the frontend.

### Design principles

1. **API key is personal** — each user enters and stores their own key in IndexedDB. Never persisted on the server.
2. **Settings in IndexedDB** — model, temperature, languages, translator name, etc. all stored alongside matching/removal words.
3. **Files stay ephemeral on server** — uploaded SRT files and translated outputs use a short-lived job-scoped temp directory that is cleaned up after translation. Files are sent/returned directly via the API, not stored permanently on the server.
4. **No auth needed** — IndexedDB is origin-scoped per browser; each user's data is naturally isolated.

### Architecture overview

```
Browser (IndexedDB "srt-translator"):
  settingsStore    → { key: "settings", value: { api_key, model, temperature, ... } }
  matchingWords    → [{ source, target }, ...]     (already exists)
  removalWords     → [{ word }, ...]               (already exists)

Server (stateless):
  POST /api/translate  → receives files + settings + matching/removal words
                       → returns translated files
  No persistent user data on disk
```

---

## Implementation steps

### Phase 1 — Add settings to IndexedDB

**File: `frontend/src/utils/db.ts`** (modify)

- Add a new object store `settings` (bump DB_VERSION to 2).
- Provide `getSettings()` and `saveSettings(data)` functions.
- The settings object stores all fields currently in `app_config.json`:
  ```typescript
  interface Settings {
    ai_platform: string;
    api_key: string;
    model: string;
    temperature: number;
    top_p: number;
    src_lang: string;
    tgt_lang: string;
    translator_name: string;
    matching_case_insensitive: boolean;
    replace_credits: boolean;
    add_credits: boolean;
    append_credits_at_end: boolean;
  }
  ```

```typescript
const SETTINGS_STORE = "settings";
const SETTINGS_KEY = "app_settings";

// In openDB onupgradeneeded:
if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
  db.createObjectStore(SETTINGS_STORE);
}

export async function getSettings(): Promise<Settings> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, "readonly");
    const store = tx.objectStore(SETTINGS_STORE);
    const req = store.get(SETTINGS_KEY);
    req.onsuccess = () => resolve(req.result ?? DEFAULT_SETTINGS);
    req.onerror = () => reject(req.error);
  });
}

export async function saveSettings(data: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const merged = { ...current, ...data };
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, "readwrite");
    const store = tx.objectStore(SETTINGS_STORE);
    store.put(merged, SETTINGS_KEY);
    tx.oncomplete = () => resolve(merged);
    tx.onerror = () => reject(tx.error);
  });
}
```

### Phase 2 — Update `useSettings` hook

**File: `frontend/src/hooks/useSettings.ts`** (modify)

- Replace backend API calls with IndexedDB reads/writes.
- Load settings from `db.getSettings()` on mount.
- `updateSettings()` writes to IndexedDB via `db.saveSettings()`.
- Remove dependency on `settingsApi`.

```typescript
export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const updateSettings = async (data: Partial<Settings>) => {
    const updated = await saveSettings(data);
    setSettings(updated);
  };

  return { settings, updateSettings };
}
```

### Phase 3 — Remove backend settings API

**File: `backend/routers/settings.py`** — Delete or empty out (no longer needed).
**File: `backend/services/settings_service.py`** — Delete or empty out.
**File: `frontend/src/api/settingsApi.ts`** — Delete or empty out.
**File: `backend/main.py`** — Remove `settings.router` from includes.

### Phase 4 — Send settings with translation request

**File: `frontend/src/types/translation.ts`** (modify)

- Extend the translation request to include all settings fields.

**File: `frontend/src/api/translationApi.ts`** (modify)

- `startTranslation()` now sends settings alongside files, matching words, and removal words.

```typescript
startTranslation: (
  files: string[],
  settings: Settings,
  matchingWords: MatchingWord[],
  removalWords: string[],
) => post<TranslationResult>("/translate", {
  files,
  settings: {
    api_key: settings.api_key,
    model: settings.model,
    temperature: settings.temperature,
    top_p: settings.top_p,
    src_lang: settings.src_lang,
    tgt_lang: settings.tgt_lang,
    translator_name: settings.translator_name,
    matching_case_insensitive: settings.matching_case_insensitive,
    replace_credits: settings.replace_credits,
    add_credits: settings.add_credits,
    append_credits_at_end: settings.append_credits_at_end,
  },
  matching_words: matchingWords.map(w => ({ source: w.source, target: w.target })),
  removal_words: removalWords,
}),
```

**File: `frontend/src/hooks/useTranslation.ts`** (modify)

- `startTranslation()` accepts settings and passes them to the API.

**File: `frontend/src/pages/HomePage.tsx`** (modify)

- Pass loaded settings into `startTranslation()`.

### Phase 5 — Backend accepts settings in request body

**File: `backend/schemas/translation.py`** (modify)

- Add a `TranslationSettings` model and include it in `TranslationRequest`.

```python
class TranslationSettings(BaseModel):
    api_key: str
    model: str = "gpt-4o-mini"
    temperature: float = 0.2
    top_p: float = 0.1
    src_lang: str = "en"
    tgt_lang: str = "el"
    translator_name: str = "Ntamas"
    matching_case_insensitive: bool = False
    replace_credits: bool = True
    add_credits: bool = True
    append_credits_at_end: bool = False

class TranslationRequest(BaseModel):
    files: list[str]
    settings: TranslationSettings
    matching_words: list[MatchingWordEntry] = []
    removal_words: list[str] = []
```

**File: `backend/services/translation_service.py`** (modify)

- `create_job()` stores the settings dict from the request.
- `run_translation()` reads settings from the job instead of `load_config()`.

```python
def create_job(files, settings_dict, matching_words, removal_words) -> str:
    _jobs[job_id] = {
        ...
        "settings": settings_dict,
    }

async def run_translation(job_id, ...):
    config = job["settings"]  # instead of load_config()
    api_key = config["api_key"]
    ...
```

### Phase 6 — Make uploaded files ephemeral (job-scoped)

**File: `backend/services/file_service.py`** (modify)

- Uploaded files go to a temp directory (or stay in a short-lived job-scoped folder).
- After translation completes and the user downloads, files are cleaned up.
- Alternative approach: keep the current shared `data/subtitles/` and `data/translated/` directories but scope filenames by a random job prefix (e.g., `{job_id}_{filename}`) to avoid collisions, with cleanup after completion.

```python
def save_uploaded_file(filename: str, content: bytes, job_prefix: str = "") -> dict:
    _ensure_dirs()
    safe_name = f"{job_prefix}_{filename}" if job_prefix else filename
    dest = SUBTITLES_DIR / safe_name
    dest.write_bytes(content)
    return _file_info(dest)
```

> **Note**: This phase is optional for an initial rollout. Since matching words & settings are now client-side, the main privacy concern (API keys, personal config) is already solved. File isolation can be added incrementally if needed.

### Phase 7 — Remove server-side config file dependency

**File: `backend/config.py`** (modify)

- Remove `load_config()` / `save_config()` (no longer called).
- Keep `DATA_DIR`, `DEFAULTS` for reference and directory setup only.
- Or keep them for a potential "admin/default config" fallback.

### Phase 8 — Update GeneralSettings page

**File: `frontend/src/pages/settings/GeneralSettings.tsx`** (modify)

- Already uses `useSettings()` hook — should work automatically once the hook reads/writes IndexedDB instead of the API.
- Verify that all setting fields render correctly.

---

## Files to create/modify

| File                                      | Action | Description                                              |
| ----------------------------------------- | ------ | -------------------------------------------------------- |
| `frontend/src/utils/db.ts`                | Modify | Add `settings` store, `getSettings()`, `saveSettings()`  |
| `frontend/src/hooks/useSettings.ts`       | Modify | Read/write IndexedDB instead of backend API              |
| `frontend/src/api/settingsApi.ts`         | Delete | No longer needed                                         |
| `frontend/src/api/translationApi.ts`      | Modify | Send settings in translation request                     |
| `frontend/src/hooks/useTranslation.ts`    | Modify | Accept and pass settings to API                          |
| `frontend/src/pages/HomePage.tsx`         | Modify | Pass settings into `startTranslation()`                  |
| `backend/schemas/translation.py`          | Modify | Add `TranslationSettings` to `TranslationRequest`        |
| `backend/services/translation_service.py` | Modify | Use request-provided settings instead of `load_config()` |
| `backend/routers/settings.py`             | Delete | No longer needed                                         |
| `backend/services/settings_service.py`    | Delete | No longer needed                                         |
| `backend/config.py`                       | Modify | Remove `load_config`/`save_config`, keep dir constants   |
| `backend/main.py`                         | Modify | Remove settings router                                   |

---

## What stays the same

- **IndexedDB** matching words & removal words — already per-browser, no changes needed.
- **Frontend components** (ProgressBar, ProgressCard, StatusBadge, etc.) — unaffected.
- **Core translation logic** (`core/translate.py`, `core/placeholders.py`, etc.) — unaffected.
- **File upload/download API** — structure stays the same (optional file isolation later).
- **WebSocket progress streaming** — unchanged.

---

## Security considerations

1. **API key stays in the browser** — stored in IndexedDB, sent only in POST body over HTTPS. Never persisted on the server disk.
2. **No shared secrets** — each user provides their own API key. If a user doesn't set a key, translation simply fails.
3. **No auth overhead** — zero friction, no cookies, no sessions, no server-side user state.
4. **HTTPS required in production** — API key is sent in the request body, so TLS is essential.
5. **File privacy** — for a future phase, file uploads can be scoped by job prefix to prevent filename collisions between users.

---

## Migration path

1. **Existing `data/app_config.json`** — no longer used by the app. Can be deleted or kept for manual reference.
2. **Users visiting for the first time** — will see default settings in the UI, need to enter their own API key.
3. **Existing browser data** — IndexedDB matching/removal words are preserved. Settings will initialize to defaults on first load.

---

## Estimated effort

- Phase 1–2: ~30 min (IndexedDB settings + hook update)
- Phase 3: ~15 min (delete backend settings API)
- Phase 4–5: ~45 min (send settings in request, update schemas/services)
- Phase 6: ~30 min (optional file isolation)
- Phase 7–8: ~15 min (cleanup config, verify GeneralSettings page)

**Total: ~2–2.5 hours**
