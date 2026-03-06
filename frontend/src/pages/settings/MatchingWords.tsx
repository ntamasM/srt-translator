import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Search,
  ArrowRight,
  Check,
  X,
  Upload,
  CheckSquare,
  Square,
  MinusSquare,
} from "lucide-react";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import {
  getMatchingWords,
  addMatchingWord,
  removeMatchingWord,
  updateMatchingWord,
  importMatchingWords,
  removeMatchingWords,
} from "../../utils/db";
import { useToast } from "../../components/Toast";
import type { MatchingWord } from "../../types/settings";

export default function MatchingWords() {
  const [words, setWords] = useState<MatchingWord[]>([]);
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [search, setSearch] = useState("");
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editSource, setEditSource] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkEdits, setBulkEdits] = useState<
    Map<string, { source: string; target: string }>
  >(new Map());
  const { addToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMatchingWords();
      setWords(data);
    } catch (err: any) {
      addToast("error", "Failed to load matching words");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!source.trim()) return;
    try {
      await addMatchingWord(source.trim(), target.trim() || source.trim());
      await load();
      setSource("");
      setTarget("");
      addToast("success", "Matching word added");
    } catch (err: any) {
      addToast("error", err.message);
    }
  };

  const handleDelete = async (src: string) => {
    try {
      await removeMatchingWord(src);
      selected.delete(src);
      setSelected(new Set(selected));
      await load();
      addToast("success", "Matching word removed");
    } catch (err: any) {
      addToast("error", err.message);
    }
  };

  /* ── Selection ───────────────────────────────────────────────────── */
  const toggleSelect = (source: string) => {
    const next = new Set(selected);
    if (next.has(source)) next.delete(source);
    else next.add(source);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((w) => w.source)));
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
      await removeMatchingWords([...selected]);
      setSelected(new Set());
      await load();
      addToast("success", `Deleted ${selected.size} matching word(s)`);
    } catch (err: any) {
      addToast("error", err.message);
    }
  };

  /* ── Bulk edit ───────────────────────────────────────────────────── */
  const startBulkEdit = () => {
    const edits = new Map<string, { source: string; target: string }>();
    for (const src of selected) {
      const w = words.find((w) => w.source === src);
      if (w) edits.set(src, { source: w.source, target: w.target });
    }
    setBulkEdits(edits);
  };

  const cancelBulkEdit = () => setBulkEdits(new Map());

  const updateBulkEdit = (
    originalSource: string,
    field: "source" | "target",
    value: string,
  ) => {
    const next = new Map(bulkEdits);
    const entry = next.get(originalSource);
    if (entry) {
      next.set(originalSource, { ...entry, [field]: value });
      setBulkEdits(next);
    }
  };

  const saveBulkEdit = async () => {
    try {
      for (const [originalSource, edit] of bulkEdits) {
        await updateMatchingWord(
          originalSource,
          edit.source.trim(),
          edit.target.trim(),
        );
      }
      setBulkEdits(new Map());
      setSelected(new Set());
      await load();
      addToast("success", `Updated ${bulkEdits.size} matching word(s)`);
    } catch (err: any) {
      addToast("error", err.message);
    }
  };

  const startEdit = (idx: number) => {
    setEditIdx(idx);
    setEditSource(words[idx].source);
    setEditTarget(words[idx].target);
  };

  const cancelEdit = () => {
    setEditIdx(null);
  };

  const saveEdit = async () => {
    if (editIdx === null) return;
    const oldSource = words[editIdx].source;
    try {
      await updateMatchingWord(oldSource, editSource.trim(), editTarget.trim());
      await load();
      setEditIdx(null);
      addToast("success", "Matching word updated");
    } catch (err: any) {
      addToast("error", err.message);
    }
  };

  /* ── Bulk import ─────────────────────────────────────────────────── */
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkJson, setBulkJson] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseBulkJson = (text: string): MatchingWord[] => {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error("JSON must be an array");
    return parsed.map((item: any, i: number) => {
      if (typeof item.source !== "string" || !item.source.trim())
        throw new Error(`Item ${i}: missing "source"`);
      return {
        source: item.source.trim(),
        target:
          typeof item.target === "string" && item.target.trim()
            ? item.target.trim()
            : item.source.trim(),
      };
    });
  };

  const handleBulkImport = async () => {
    try {
      const entries = parseBulkJson(bulkJson);
      if (entries.length === 0) {
        addToast("error", "No entries found in JSON");
        return;
      }
      await importMatchingWords(entries);
      await load();
      setBulkJson("");
      setBulkOpen(false);
      addToast("success", `Imported ${entries.length} matching word(s)`);
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
        ? words.filter(
            (w) =>
              w.source.toLowerCase().includes(search.toLowerCase()) ||
              w.target.toLowerCase().includes(search.toLowerCase()),
          )
        : words,
    [words, search],
  );

  return (
    <div className="space-y-5">
      <p className="text-sm text-base-content/70 dark:text-dark-base-content/50">
        Matching words are protected during translation. Source terms are
        shielded from the AI, then replaced with the target term in the final
        output. Format: <code className="text-xs">source --&gt; target</code>
      </p>

      {/* Add form */}
      <div className="flex gap-2">
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Source term"
          className="flex-1 rounded-lg border border-base-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-dark-base-300 dark:bg-dark-base-200 dark:text-dark-base-content"
        />
        <ArrowRight size={18} className="mt-2.5 text-base-content/50" />
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Target term"
          className="flex-1 rounded-lg border border-base-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-dark-base-300 dark:bg-dark-base-200 dark:text-dark-base-content"
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
          className="w-full rounded-lg border border-base-300 py-2 pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-dark-base-300 dark:bg-dark-base-200 dark:text-dark-base-content"
        />
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-accent bg-primary/10 px-3 py-2 dark:border-dark-primary dark:bg-dark-primary/10">
          <span className="text-sm font-medium text-primary dark:text-dark-primary">
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
        <p className="text-sm text-base-content/60">No matching words found.</p>
      ) : (
        <div className="max-h-112 space-y-1 overflow-y-auto">
          {/* Select-all header */}
          <button
            onClick={toggleSelectAll}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-base-content/60 hover:bg-base-100 dark:text-dark-base-content/50 dark:hover:bg-dark-base-200"
          >
            {selected.size === filtered.length ? (
              <CheckSquare size={14} className="text-primary" />
            ) : selected.size > 0 ? (
              <MinusSquare size={14} className="text-primary" />
            ) : (
              <Square size={14} />
            )}
            {selected.size === filtered.length ? "Deselect all" : "Select all"}
          </button>

          {filtered.map((w) => {
            const realIdx = words.indexOf(w);
            const isEditing = editIdx === realIdx;
            const isBulkEditing = bulkEdits.has(w.source);
            const isSelected = selected.has(w.source);

            if (isEditing) {
              return (
                <div
                  key={w.source}
                  className="flex items-center gap-2 rounded-lg border border-accent bg-primary/10 px-3 py-2 dark:border-dark-primary dark:bg-dark-primary/10"
                >
                  <input
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value)}
                    className="flex-1 rounded border border-base-300 px-2 py-1 text-sm dark:border-dark-base-300 dark:bg-dark-base-200 dark:text-dark-base-content"
                  />
                  <ArrowRight size={14} className="text-base-content/50" />
                  <input
                    value={editTarget}
                    onChange={(e) => setEditTarget(e.target.value)}
                    className="flex-1 rounded border border-base-300 px-2 py-1 text-sm dark:border-dark-base-300 dark:bg-dark-base-200 dark:text-dark-base-content"
                  />
                  <button
                    onClick={saveEdit}
                    className="rounded p-1 text-success hover:bg-success/10 dark:hover:bg-dark-success/20"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="rounded p-1 text-base-content/50 hover:bg-base-200 dark:hover:bg-dark-base-200"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            }

            if (isBulkEditing) {
              const edit = bulkEdits.get(w.source)!;
              return (
                <div
                  key={w.source}
                  className="flex items-center gap-2 rounded-lg border border-accent bg-primary/10 px-3 py-2 dark:border-dark-primary dark:bg-dark-primary/10"
                >
                  <input
                    type="checkbox"
                    checked
                    onChange={() => toggleSelect(w.source)}
                    className="h-4 w-4 rounded border-base-300 text-primary focus:ring-primary"
                  />
                  <input
                    value={edit.source}
                    onChange={(e) =>
                      updateBulkEdit(w.source, "source", e.target.value)
                    }
                    className="flex-1 rounded border border-base-300 px-2 py-1 text-sm dark:border-dark-base-300 dark:bg-dark-base-200 dark:text-dark-base-content"
                  />
                  <ArrowRight size={14} className="text-base-content/50" />
                  <input
                    value={edit.target}
                    onChange={(e) =>
                      updateBulkEdit(w.source, "target", e.target.value)
                    }
                    className="flex-1 rounded border border-base-300 px-2 py-1 text-sm dark:border-dark-base-300 dark:bg-dark-base-200 dark:text-dark-base-content"
                  />
                </div>
              );
            }

            return (
              <div
                key={w.source}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                  isSelected
                    ? "border-accent bg-primary/10 dark:border-dark-primary dark:bg-dark-primary/5"
                    : "border-base-300 bg-base-100 dark:border-dark-base-300 dark:bg-dark-base-200"
                }`}
              >
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(w.source)}
                    className="h-4 w-4 rounded border-base-300 text-primary focus:ring-primary"
                  />
                  <span className="font-medium text-base-content dark:text-dark-base-content">
                    {w.source}
                  </span>
                  <ArrowRight size={14} className="text-base-content/50" />
                  <span className="text-base-content/70 dark:text-dark-base-content/50">
                    {w.target}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(realIdx)}
                    className="rounded p-1 text-base-content/50 hover:bg-base-200 hover:text-primary dark:hover:bg-dark-base-300"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(w.source)}
                    className="rounded p-1 text-base-content/50 hover:bg-error/10 hover:text-error dark:hover:bg-dark-error/10"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-base-content/60 dark:text-dark-base-content/50">
        {words.length} matching word{words.length !== 1 ? "s" : ""} total
      </p>

      {/* Bulk import modal */}
      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk Import Matching Words"
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
            Paste or upload a JSON array. Format:{" "}
            <code className="rounded bg-base-200 px-1 dark:bg-dark-base-300">
              {'[{"source": "...", "target": "..."}]'}
            </code>
          </p>
          <textarea
            value={bulkJson}
            onChange={(e) => setBulkJson(e.target.value)}
            rows={8}
            placeholder='[{"source": "Tanjiro", "target": "Τανζίρο"}]'
            className="w-full rounded-lg border border-base-300 px-3 py-2 font-mono text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-dark-base-300 dark:bg-dark-base-200 dark:text-dark-base-content"
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
