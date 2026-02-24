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
      <p className="text-sm text-gray-600 dark:text-gray-400">
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
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
        <ArrowRight size={18} className="mt-2.5 text-gray-400" />
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Target term"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
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
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter…"
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800 dark:bg-blue-900/20">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
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
                  className="!px-3 !py-1 !text-xs border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
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
        <p className="text-sm text-gray-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500">No matching words found.</p>
      ) : (
        <div className="max-h-112 space-y-1 overflow-y-auto">
          {/* Select-all header */}
          <button
            onClick={toggleSelectAll}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {selected.size === filtered.length ? (
              <CheckSquare size={14} className="text-blue-600" />
            ) : selected.size > 0 ? (
              <MinusSquare size={14} className="text-blue-600" />
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
                  className="flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 dark:border-blue-700 dark:bg-blue-900/20"
                >
                  <input
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value)}
                    className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                  <ArrowRight size={14} className="text-gray-400" />
                  <input
                    value={editTarget}
                    onChange={(e) => setEditTarget(e.target.value)}
                    className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                  <button
                    onClick={saveEdit}
                    className="rounded p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
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
                  className="flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 dark:border-blue-700 dark:bg-blue-900/20"
                >
                  <input
                    type="checkbox"
                    checked
                    onChange={() => toggleSelect(w.source)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <input
                    value={edit.source}
                    onChange={(e) =>
                      updateBulkEdit(w.source, "source", e.target.value)
                    }
                    className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                  <ArrowRight size={14} className="text-gray-400" />
                  <input
                    value={edit.target}
                    onChange={(e) =>
                      updateBulkEdit(w.source, "target", e.target.value)
                    }
                    className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
              );
            }

            return (
              <div
                key={w.source}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                  isSelected
                    ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/10"
                    : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                }`}
              >
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(w.source)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {w.source}
                  </span>
                  <ArrowRight size={14} className="text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {w.target}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(realIdx)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-700"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(w.source)}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
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
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Paste or upload a JSON array. Format:{" "}
            <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">
              {'[{"source": "...", "target": "..."}]'}
            </code>
          </p>
          <textarea
            value={bulkJson}
            onChange={(e) => setBulkJson(e.target.value)}
            rows={8}
            placeholder='[{"source": "Tanjiro", "target": "Τανζίρο"}]'
            className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
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
