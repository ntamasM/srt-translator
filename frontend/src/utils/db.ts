/**
 * IndexedDB utility for storing matching words and removal words client-side.
 */

import type { MatchingWord, Settings } from "../types/settings";

const DB_NAME = "srt-translator";
const DB_VERSION = 3;
const MATCHING_STORE = "matchingWords";
const REMOVAL_STORE = "removalWords";
const SETTINGS_STORE = "settings";
const SETTINGS_KEY = "app_settings";

const DEFAULT_SETTINGS: Settings = {
  ai_platform: "openai",
  api_key: "",
  model: "gpt-4o-mini",
  temperature: 0.2,
  top_p: 0.1,
  src_lang: "en",
  tgt_lang: "el",
  translator_name: "AI",
  matching_case_insensitive: false,
  replace_credits: true,
  add_credits: true,
  append_credits_at_end: false,
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(MATCHING_STORE)) {
        db.createObjectStore(MATCHING_STORE, { keyPath: "source" });
      }
      if (!db.objectStoreNames.contains(REMOVAL_STORE)) {
        db.createObjectStore(REMOVAL_STORE, { keyPath: "word" });
      }
      // Recreate settings store with proper keyPath on upgrade
      if (db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.deleteObjectStore(SETTINGS_STORE);
      }
      db.createObjectStore(SETTINGS_STORE, { keyPath: "_key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ── Matching words ────────────────────────────────────────────────────────────

export async function getMatchingWords(): Promise<MatchingWord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MATCHING_STORE, "readonly");
    const store = tx.objectStore(MATCHING_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as MatchingWord[]);
    req.onerror = () => reject(req.error);
  });
}

export async function addMatchingWord(
  source: string,
  target: string,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MATCHING_STORE, "readwrite");
    const store = tx.objectStore(MATCHING_STORE);
    store.put({ source, target });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeMatchingWord(source: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MATCHING_STORE, "readwrite");
    const store = tx.objectStore(MATCHING_STORE);
    store.delete(source);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateMatchingWord(
  oldSource: string,
  newSource: string,
  newTarget: string,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MATCHING_STORE, "readwrite");
    const store = tx.objectStore(MATCHING_STORE);
    if (oldSource !== newSource) {
      store.delete(oldSource);
    }
    store.put({ source: newSource, target: newTarget });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearMatchingWords(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MATCHING_STORE, "readwrite");
    tx.objectStore(MATCHING_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeMatchingWords(sources: string[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MATCHING_STORE, "readwrite");
    const store = tx.objectStore(MATCHING_STORE);
    for (const source of sources) {
      store.delete(source);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function importMatchingWords(
  words: MatchingWord[],
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MATCHING_STORE, "readwrite");
    const store = tx.objectStore(MATCHING_STORE);
    for (const w of words) {
      store.put(w);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Removal words ─────────────────────────────────────────────────────────────

export async function getRemovalWords(): Promise<string[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(REMOVAL_STORE, "readonly");
    const store = tx.objectStore(REMOVAL_STORE);
    const req = store.getAll();
    req.onsuccess = () =>
      resolve((req.result as { word: string }[]).map((r) => r.word));
    req.onerror = () => reject(req.error);
  });
}

export async function addRemovalWord(word: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(REMOVAL_STORE, "readwrite");
    tx.objectStore(REMOVAL_STORE).put({ word });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeRemovalWord(word: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(REMOVAL_STORE, "readwrite");
    tx.objectStore(REMOVAL_STORE).delete(word);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function importRemovalWords(words: string[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(REMOVAL_STORE, "readwrite");
    const store = tx.objectStore(REMOVAL_STORE);
    for (const word of words) {
      store.put({ word });
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearRemovalWords(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(REMOVAL_STORE, "readwrite");
    tx.objectStore(REMOVAL_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeRemovalWords(
  wordsToDelete: string[],
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(REMOVAL_STORE, "readwrite");
    const store = tx.objectStore(REMOVAL_STORE);
    for (const word of wordsToDelete) {
      store.delete(word);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
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
