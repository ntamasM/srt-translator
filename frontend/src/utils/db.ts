/**
 * IndexedDB utility for storing settings and translation packages client-side.
 */

import type { Settings, TranslationPackage } from "../types/settings";

const DB_NAME = "srt-translator";
const DB_VERSION = 4;
const SETTINGS_STORE = "settings";
const PACKAGES_STORE = "packages";
const SETTINGS_KEY = "app_settings";

const DEFAULT_SETTINGS: Settings = {
  ai_platform: "openai",
  api_key: "",
  model: "gpt-4o-mini",
  temperature: 0.2,
  top_p: 0.1,
  top_k: 40,
  frequency_penalty: 0,
  presence_penalty: 0,
  src_lang: "en",
  tgt_lang: "el",
  translator_name: "AI",
  matching_case_insensitive: false,
  replace_credits: true,
  add_credits: true,
  append_credits_at_end: false,
  theme: "system",
  date_format: "system",
  defaultPackageId: null,
};

let _dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_dbPromise) return _dbPromise;

  _dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      // Legacy stores — kept so older DBs upgrade without errors
      if (!db.objectStoreNames.contains("matchingWords")) {
        db.createObjectStore("matchingWords", { keyPath: "source" });
      }
      if (!db.objectStoreNames.contains("removalWords")) {
        db.createObjectStore("removalWords", { keyPath: "word" });
      }
      if (!db.objectStoreNames.contains(PACKAGES_STORE)) {
        db.createObjectStore(PACKAGES_STORE, { keyPath: "id" });
      }
      // Recreate settings store with proper keyPath on upgrade
      if (db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.deleteObjectStore(SETTINGS_STORE);
      }
      db.createObjectStore(SETTINGS_STORE, { keyPath: "_key" });
    };
    req.onblocked = () => {
      _dbPromise = null;
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => {
        db.close();
        _dbPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => {
      _dbPromise = null;
      reject(req.error);
    };
  });

  return _dbPromise;
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<Settings> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, "readonly");
    const store = tx.objectStore(SETTINGS_STORE);
    const req = store.get(SETTINGS_KEY);
    req.onsuccess = () => {
      if (req.result) {
        const { _key, ...settings } = req.result;
        resolve(settings as Settings);
      } else {
        resolve({ ...DEFAULT_SETTINGS });
      }
    };
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
    store.put({ _key: SETTINGS_KEY, ...merged });
    tx.oncomplete = () => resolve(merged);
    tx.onerror = () => reject(tx.error);
  });
}

// ── Packages ─────────────────────────────────────────────────────────────────

export async function getPackages(): Promise<TranslationPackage[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PACKAGES_STORE, "readonly");
    const req = tx.objectStore(PACKAGES_STORE).getAll();
    req.onsuccess = () => resolve(req.result as TranslationPackage[]);
    req.onerror = () => reject(req.error);
  });
}

export async function getPackage(
  id: string,
): Promise<TranslationPackage | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PACKAGES_STORE, "readonly");
    const req = tx.objectStore(PACKAGES_STORE).get(id);
    req.onsuccess = () => resolve(req.result as TranslationPackage | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function savePackage(pkg: TranslationPackage): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PACKAGES_STORE, "readwrite");
    tx.objectStore(PACKAGES_STORE).put(pkg);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deletePackage(id: string): Promise<void> {
  // If this package is the active one, clear the active selection
  const settings = await getSettings();
  if (settings.defaultPackageId === id) {
    await saveSettings({ defaultPackageId: null });
  }
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PACKAGES_STORE, "readwrite");
    tx.objectStore(PACKAGES_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
