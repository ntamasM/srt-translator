import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Search,
  Upload,
  Check,
  X,
  CheckSquare,
  Square,
  MinusSquare,
} from "lucide-react";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import {
  getRemovalWords,
  addRemovalWord,
  removeRemovalWord,
  importRemovalWords,
  removeRemovalWords,
} from "../../utils/db";
import { useToast } from "../../components/Toast";

export default function RemoveWords() {
  const [words, setWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkEdits, setBulkEdits] = useState<Map<string, string>>(new Map());
  const { addToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getRemovalWords();
      setWords(data);
    } catch (err: any) {
      addToast("error", "Failed to load removal words");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!newWord.trim()) return;
    try {
      await addRemovalWord(newWord.trim());
      await load();
      setNewWord("");
      addToast("success", "Removal word added");
    } catch (err: any) {
      addToast("error", err.message);
    }
  };

  const handleDelete = async (word: string) => {
    try {
      await removeRemovalWord(word);
      selected.delete(word);
      setSelected(new Set(selected));
      await load();
      addToast("success", "Removal word removed");
    } catch (err: any) {
      addToast("error", err.message);
    }
  };

  /* ── Selection ───────────────────────────────────────────────────── */
  const toggleSelect = (word: string) => {
    const next = new Set(selected);
    if (next.has(word)) next.delete(word);
    else next.add(word);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered));
    }
  };

  const clearSelection = () => {
    setSelected(new Set());
    setBulkEdits(new Map());
  };

  /* ── Bulk delete ─────────────────────────────────────────────────── */
  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    try {
      await removeRemovalWords([...selected]);
      const count = selected.size;
      setSelected(new Set());
      await load();
      addToast("success", `Deleted ${count} removal word(s)`);
    } catch (err: any) {
      addToast("error", err.message);
    }
  };

  /* ── Bulk edit ───────────────────────────────────────────────────── */
  const startBulkEdit = () => {
    const edits = new Map<string, string>();
    for (const word of selected) {
      edits.set(word, word);
    }
    setBulkEdits(edits);
  };

  const cancelBulkEdit = () => setBulkEdits(new Map());

  const updateBulkEdit = (originalWord: string, value: string) => {
    const next = new Map(bulkEdits);
    next.set(originalWord, value);
    setBulkEdits(next);
  };

  const saveBulkEdit = async () => {
    try {
      // Remove old entries, add new ones
      const toRemove = [...bulkEdits.keys()];
      const toAdd = [...bulkEdits.values()]
        .map((v) => v.trim())
        .filter(Boolean);
      await removeRemovalWords(toRemove);
      if (toAdd.length > 0) await importRemovalWords(toAdd);
      setBulkEdits(new Map());
      setSelected(new Set());
      await load();
      addToast("success", `Updated ${bulkEdits.size} removal word(s)`);
    } catch (err: any) {
      addToast("error", err.message);
    }
  };

  /* ── Bulk import ─────────────────────────────────────────────────── */
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkJson, setBulkJson] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseBulkJson = (text: string): string[] => {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error("JSON must be an array");
    return parsed.map((item: any, i: number) => {
      if (typeof item !== "string" || !item.trim())
        throw new Error(`Item ${i}: must be a non-empty string`);
      return item.trim();
    });
  };

  const handleBulkImport = async () => {
    try {
      const entries = parseBulkJson(bulkJson);
      if (entries.length === 0) {
        addToast("error", "No entries found in JSON");
        return;
      }
      await importRemovalWords(entries);
      await load();
      setBulkJson("");
      setBulkOpen(false);
      addToast("success", `Imported ${entries.length} removal word(s)`);
    } catch (err: any) {
      addToast("error", `Invalid JSON: ${err.message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBulkJson(reader.result as string);
    reader.readAsText(file);
    e.target.value = "";
  };

  const filtered = useMemo(
    () =>
      search
        ? words.filter((w) => w.toLowerCase().includes(search.toLowerCase()))
        : words,
    [words, search],
  );

  return (
    <div className="space-y-5">
      <p className="text-sm text-base-content/70 dark:text-dark-base-content/50">
        Words listed here are completely removed (case-insensitive) from
        subtitle text before translation. Useful for stripping profanity or
        unwanted annotations.
      </p>

      {/* Add form */}
      <div className="flex gap-2">
        <input
          value={newWord}
          onChange={(e) => setNewWord(e.target.value)}
          placeholder="Word or phrase to remove"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="flex-1 rounded-lg border border-base-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-dark-base-300 dark:bg-dark-base-200 dark:text-dark-base-content"
        />
        <Button onClick={handleAdd} icon={<Plus size={16} />}>
          Add
        </Button>
        <Button
          variant="secondary"
          onClick={() => setBulkOpen(true)}
          icon={<Upload size={16} />}
        >
          Bulk
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter…"
          className="w-full rounded-lg border border-base-300 py-2 pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-dark-base-300 dark:bg-dark-base-200 dark:text-dark-base-content"
        />
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 dark:border-primary-800 dark:bg-primary-900/20">
          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
            {selected.size} selected
          </span>
          <div className="ml-auto flex gap-2">
            {bulkEdits.size > 0 ? (
              <>
                <Button
                  onClick={saveBulkEdit}
                  icon={<Check size={14} />}
                  className="!px-3 !py-1 !text-xs"
                >
                  Save All
                </Button>
                <Button
                  variant="secondary"
                  onClick={cancelBulkEdit}
                  icon={<X size={14} />}
                  className="!px-3 !py-1 !text-xs"
                >
                  Cancel Edit
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={startBulkEdit}
                  icon={<Pencil size={14} />}
                  className="!px-3 !py-1 !text-xs"
                >
                  Edit Selected
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleBulkDelete}
                  icon={<Trash2 size={14} />}
                  className="!px-3 !py-1 !text-xs border-error/50 text-error hover:bg-error/10 dark:border-dark-error/50 dark:text-error dark:hover:bg-dark-error/10"
                >
                  Delete Selected
                </Button>
              </>
            )}
            <Button
              variant="secondary"
              onClick={clearSelection}
              icon={<X size={14} />}
              className="!px-3 !py-1 !text-xs"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="text-sm text-base-content/60">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-base-content/60">No removal words found.</p>
      ) : (
        <div className="max-h-112 space-y-1 overflow-y-auto">
          {/* Select-all header */}
          <button
            onClick={toggleSelectAll}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-base-content/60 hover:bg-base-100 dark:text-dark-base-content/50 dark:hover:bg-dark-base-200"
          >
            {selected.size === filtered.length ? (
              <CheckSquare size={14} className="text-primary-600" />
            ) : selected.size > 0 ? (
              <MinusSquare size={14} className="text-primary-600" />
            ) : (
              <Square size={14} />
            )}
            {selected.size === filtered.length ? "Deselect all" : "Select all"}
          </button>

          {filtered.map((word) => {
            const isSelected = selected.has(word);
            const isBulkEditing = bulkEdits.has(word);

            if (isBulkEditing) {
              return (
                <div
                  key={word}
                  className="flex items-center gap-2 rounded-lg border border-primary-300 bg-primary-50 px-3 py-2 dark:border-primary-700 dark:bg-primary-900/20"
                >
                  <input
                    type="checkbox"
                    checked
                    onChange={() => toggleSelect(word)}
                    className="h-4 w-4 rounded border-base-300 text-primary-600 focus:ring-primary-500"
                  />
                  <input
                    value={bulkEdits.get(word)!}
                    onChange={(e) => updateBulkEdit(word, e.target.value)}
                    className="flex-1 rounded border border-base-300 px-2 py-1 text-sm dark:border-dark-base-300 dark:bg-dark-base-200 dark:text-dark-base-content"
                  />
                </div>
              );
            }

            return (
              <div
                key={word}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                  isSelected
                    ? "border-primary-300 bg-primary-50 dark:border-primary-700 dark:bg-primary-900/10"
                    : "border-base-300 bg-base-100 dark:border-dark-base-300 dark:bg-dark-base-200"
                }`}
              >
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(word)}
                    className="h-4 w-4 rounded border-base-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-base-content dark:text-dark-base-content">
                    {word}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(word)}
                  className="rounded p-1 text-base-content/50 hover:bg-error/10 hover:text-error dark:hover:bg-dark-error/10"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-base-content/60 dark:text-dark-base-content/50">
        {words.length} removal word{words.length !== 1 ? "s" : ""} total
      </p>

      {/* Bulk import modal */}
      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk Import Removal Words"
        actions={
          <>
            <Button variant="secondary" onClick={() => setBulkOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkImport} disabled={!bulkJson.trim()}>
              Import
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-base-content/60 dark:text-dark-base-content/50">
            Paste or upload a JSON array of strings. Format:{" "}
            <code className="rounded bg-base-200 px-1 dark:bg-dark-base-300">
              {'["word1", "word2"]'}
            </code>
          </p>
          <textarea
            value={bulkJson}
            onChange={(e) => setBulkJson(e.target.value)}
            rows={8}
            placeholder='["damn", "freaking"]'
            className="w-full rounded-lg border border-base-300 px-3 py-2 font-mono text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-dark-base-300 dark:bg-dark-base-200 dark:text-dark-base-content"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            icon={<Upload size={14} />}
            className="w-full"
          >
            Upload JSON file
          </Button>
        </div>
      </Modal>
    </div>
  );
}
