import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, X, Plus, Save } from "lucide-react";
import Button from "../components/Button";
import MatchingWordsEditor from "../components/MatchingWordsEditor";
import RemovalWordsEditor from "../components/RemovalWordsEditor";
import { useToast } from "../components/Toast";
import { getPackage, savePackage } from "../utils/db";
import type { TranslationPackage, MatchingWord } from "../types/settings";

type Tab = "keywords" | "matching" | "removal";

const tabs: { key: Tab; label: string }[] = [
  { key: "keywords", label: "Keywords" },
  { key: "matching", label: "Matching Words" },
  { key: "removal", label: "Remove Words" },
];

export default function PackageDetailPage() {
  const { packageId } = useParams<{ packageId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [pkg, setPkg] = useState<TranslationPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("keywords");
  const [name, setName] = useState("");
  const [titleKeyword, setTitleKeyword] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    if (!packageId) return;
    setLoading(true);
    try {
      const data = await getPackage(packageId);
      if (!data) {
        addToast("error", "Package not found");
        navigate("/packages");
        return;
      }
      setPkg(data);
      setName(data.name);
      setTitleKeyword(data.titleKeyword);
      setKeywords([...data.keywords]);
      setDirty(false);
    } catch {
      addToast("error", "Failed to load package");
    } finally {
      setLoading(false);
    }
  }, [packageId, navigate, addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const persist = useCallback(
    async (updated: TranslationPackage) => {
      updated.updatedAt = Date.now();
      await savePackage(updated);
      setPkg(updated);
    },
    [],
  );

  /* ── Keywords tab handlers ─────────────────────────────────────── */
  const handleSaveKeywords = async () => {
    if (!pkg) return;
    const updated = {
      ...pkg,
      name: name.trim() || "Untitled",
      titleKeyword: titleKeyword.trim(),
      keywords: [...keywords],
    };
    await persist(updated);
    setDirty(false);
    addToast("success", "Package saved");
  };

  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (!kw || keywords.includes(kw)) return;
    setKeywords([...keywords, kw]);
    setNewKeyword("");
    setDirty(true);
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
    setDirty(true);
  };

  /* ── Matching words tab handlers (operate on pkg.matchingWords) ── */
  const handleMatchingAdd = async (source: string, target: string) => {
    if (!pkg) return;
    const exists = pkg.matchingWords.some((w) => w.source === source);
    const updated = {
      ...pkg,
      matchingWords: exists
        ? pkg.matchingWords.map((w) =>
            w.source === source ? { source, target } : w,
          )
        : [...pkg.matchingWords, { source, target }],
    };
    await persist(updated);
  };

  const handleMatchingDelete = async (source: string) => {
    if (!pkg) return;
    const updated = {
      ...pkg,
      matchingWords: pkg.matchingWords.filter((w) => w.source !== source),
    };
    await persist(updated);
  };

  const handleMatchingUpdate = async (
    oldSource: string,
    newSource: string,
    newTarget: string,
  ) => {
    if (!pkg) return;
    let words = [...pkg.matchingWords];
    if (oldSource !== newSource) {
      words = words.filter((w) => w.source !== oldSource);
    }
    const idx = words.findIndex((w) => w.source === newSource);
    if (idx >= 0) {
      words[idx] = { source: newSource, target: newTarget };
    } else {
      words.push({ source: newSource, target: newTarget });
    }
    await persist({ ...pkg, matchingWords: words });
  };

  const handleMatchingImport = async (entries: MatchingWord[]) => {
    if (!pkg) return;
    const merged = [...pkg.matchingWords];
    for (const entry of entries) {
      const idx = merged.findIndex((w) => w.source === entry.source);
      if (idx >= 0) {
        merged[idx] = entry;
      } else {
        merged.push(entry);
      }
    }
    await persist({ ...pkg, matchingWords: merged });
  };

  const handleMatchingBulkDelete = async (sources: string[]) => {
    if (!pkg) return;
    const set = new Set(sources);
    await persist({
      ...pkg,
      matchingWords: pkg.matchingWords.filter((w) => !set.has(w.source)),
    });
  };

  /* ── Removal words tab handlers (operate on pkg.removalWords) ──── */
  const handleRemovalAdd = async (word: string) => {
    if (!pkg) return;
    if (pkg.removalWords.includes(word)) return;
    await persist({ ...pkg, removalWords: [...pkg.removalWords, word] });
  };

  const handleRemovalDelete = async (word: string) => {
    if (!pkg) return;
    await persist({
      ...pkg,
      removalWords: pkg.removalWords.filter((w) => w !== word),
    });
  };

  const handleRemovalImport = async (entries: string[]) => {
    if (!pkg) return;
    const set = new Set(pkg.removalWords);
    for (const w of entries) set.add(w);
    await persist({ ...pkg, removalWords: [...set] });
  };

  const handleRemovalBulkDelete = async (wordsToDelete: string[]) => {
    if (!pkg) return;
    const set = new Set(wordsToDelete);
    await persist({
      ...pkg,
      removalWords: pkg.removalWords.filter((w) => !set.has(w)),
    });
  };

  const handleRemovalBulkUpdate = async (
    toRemove: string[],
    toAdd: string[],
  ) => {
    if (!pkg) return;
    const removeSet = new Set(toRemove);
    const remaining = pkg.removalWords.filter((w) => !removeSet.has(w));
    const addSet = new Set(remaining);
    for (const w of toAdd) addSet.add(w);
    await persist({ ...pkg, removalWords: [...addSet] });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-base-content/60">Loading…</p>
      </div>
    );
  }

  if (!pkg) return null;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/packages")}
          className="rounded-lg p-1.5 text-base-content/60 hover:bg-base-200 dark:text-dark-base-content/50 dark:hover:bg-dark-base-200"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-base-content dark:text-dark-base-content">
          {pkg.name || "Untitled Package"}
        </h1>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-base-200 p-1 dark:bg-dark-base-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md px-3 py-2 text-center text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-base-100 text-primary shadow dark:bg-dark-base-300 dark:text-dark-primary"
                : "text-base-content/70 hover:text-base-content dark:text-dark-base-content/50 dark:hover:text-dark-base-content"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "keywords" && (
        <div className="space-y-5">
          <p className="text-sm text-base-content/70 dark:text-dark-base-content/50">
            Keywords give the AI context about the content being translated.
            The title and additional keywords help produce more accurate,
            contextual translations.
          </p>

          {/* Package name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-base-content dark:text-dark-base-content">
              Package Name
            </label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setDirty(true);
              }}
              placeholder="e.g. Hunter x Hunter"
              className="w-full rounded-lg border border-base-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-dark-base-300 dark:bg-dark-base-200 dark:text-dark-base-content"
            />
          </div>

          {/* Title keyword */}
          <div>
            <label className="mb-1 block text-sm font-medium text-base-content dark:text-dark-base-content">
              Title Keyword
            </label>
            <input
              value={titleKeyword}
              onChange={(e) => {
                setTitleKeyword(e.target.value);
                setDirty(true);
              }}
              placeholder="e.g. Hunter x Hunter"
              className="w-full rounded-lg border border-base-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-dark-base-300 dark:bg-dark-base-200 dark:text-dark-base-content"
            />
            <p className="mt-1 text-xs text-base-content/50 dark:text-dark-base-content/40">
              The title of the movie or series. This is sent to the AI so it
              knows what it's translating.
            </p>
          </div>

          {/* Additional keywords */}
          <div>
            <label className="mb-1 block text-sm font-medium text-base-content dark:text-dark-base-content">
              Additional Keywords
            </label>
            <div className="flex gap-2">
              <input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                placeholder="e.g. anime, fantasy, adventure"
                className="flex-1 rounded-lg border border-base-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-dark-base-300 dark:bg-dark-base-200 dark:text-dark-base-content"
              />
              <Button onClick={addKeyword} icon={<Plus size={16} />}>
                Add
              </Button>
            </div>
            <p className="mt-1 text-xs text-base-content/50 dark:text-dark-base-content/40">
              Tags that describe the genre, tone, or domain of this content.
            </p>
          </div>

          {/* Keywords list */}
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary dark:bg-dark-primary/20 dark:text-dark-primary"
                >
                  {kw}
                  <button
                    onClick={() => removeKeyword(kw)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 dark:hover:bg-dark-primary/30"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Save button */}
          <Button
            onClick={handleSaveKeywords}
            disabled={!dirty}
            icon={<Save size={16} />}
          >
            Save Keywords
          </Button>
        </div>
      )}

      {tab === "matching" && (
        <MatchingWordsEditor
          words={pkg.matchingWords}
          loading={false}
          onAdd={handleMatchingAdd}
          onDelete={handleMatchingDelete}
          onUpdate={handleMatchingUpdate}
          onImport={handleMatchingImport}
          onBulkDelete={handleMatchingBulkDelete}
          description="Matching words for this package. Source terms are protected during translation, then replaced with the target term."
        />
      )}

      {tab === "removal" && (
        <RemovalWordsEditor
          words={pkg.removalWords}
          loading={false}
          onAdd={handleRemovalAdd}
          onDelete={handleRemovalDelete}
          onImport={handleRemovalImport}
          onBulkDelete={handleRemovalBulkDelete}
          onBulkUpdate={handleRemovalBulkUpdate}
          description="Removal words for this package. These words are removed from subtitle text before translation."
        />
      )}
    </div>
  );
}
