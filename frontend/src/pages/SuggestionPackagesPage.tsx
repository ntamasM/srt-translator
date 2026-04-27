import React, { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Tag,
  BookOpen,
  Ban,
  Download,
  X,
  CheckSquare,
  Square,
  MinusSquare,
  Search,
} from "lucide-react";
import Button from "../components/Button";
import { useToast } from "../components/Toast";
import { suggestionPackagesApi } from "../api/suggestionPackagesApi";
import { importPackages } from "../utils/importPackages";
import type { SuggestionPackage } from "../types/settings";

export default function SuggestionPackagesPage() {
  const [items, setItems] = useState<SuggestionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await suggestionPackagesApi.list();
        if (cancelled) return;
        data.sort((a, b) => a.name.localeCompare(b.name));
        setItems(data);
      } catch {
        if (!cancelled) addToast("error", "Failed to load suggestions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [addToast]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.categories.forEach((c) => set.add(c)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (selectedCategories.size > 0) {
        for (const sel of selectedCategories) {
          if (!i.categories.includes(sel)) return false;
        }
      }
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) ||
        i.titleKeyword.toLowerCase().includes(q) ||
        i.categories.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [items, search, selectedCategories]);

  const toggleCategory = (cat: string) => {
    const next = new Set(selectedCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setSelectedCategories(next);
  };

  const toggleSelect = (filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selected);
    if (next.has(filename)) next.delete(filename);
    else next.add(filename);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    const visible = filtered.map((i) => i.filename);
    const allSelected = visible.every((f) => selected.has(f));
    if (allSelected) {
      const next = new Set(selected);
      visible.forEach((f) => next.delete(f));
      setSelected(next);
    } else {
      const next = new Set(selected);
      visible.forEach((f) => next.add(f));
      setSelected(next);
    }
  };

  const clearSelection = () => setSelected(new Set());

  const stripMeta = (
    pkg: SuggestionPackage,
  ): Partial<import("../types/settings").TranslationPackage> => {
    const { filename: _f, categories: _c, ...rest } = pkg;
    void _f;
    void _c;
    return rest;
  };

  const handleImportOne = async (pkg: SuggestionPackage) => {
    if (importing) return;
    setImporting(true);
    try {
      const count = await importPackages([stripMeta(pkg)]);
      if (count > 0) addToast("success", `Imported "${pkg.name}"`);
      else addToast("error", "Import failed");
    } catch (err: any) {
      addToast("error", `Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleImportSelected = async () => {
    if (importing) return;
    setImporting(true);
    try {
      const toImport = items
        .filter((i) => selected.has(i.filename))
        .map(stripMeta);
      const count = await importPackages(toImport);
      setSelected(new Set());
      addToast("success", `Imported ${count} package(s)`);
    } catch (err: any) {
      addToast("error", `Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const visibleSelectedCount = filtered.filter((i) =>
    selected.has(i.filename),
  ).length;
  const allVisibleSelected =
    filtered.length > 0 && visibleSelectedCount === filtered.length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-base-content dark:text-dark-base-content">
          Suggestion Packages
        </h1>
      </div>

      <p className="mb-4 text-sm text-base-content/70 dark:text-dark-base-content/50">
        Browse curated translation packages and import the ones you need into
        your collection.
      </p>

      {/* Filter row */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="relative">
          <label htmlFor="suggestion-search" className="sr-only">
            Search
          </label>
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 dark:text-dark-base-content/40"
          />
          <input
            id="suggestion-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, title, or category…"
            className="w-full rounded-lg border border-base-300 px-3 py-2 pl-9 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary dark:border-dark-base-300 dark:bg-dark-base-200 dark:text-dark-base-content"
          />
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const active = selectedCategories.has(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/20 text-primary dark:bg-dark-primary/30 dark:text-dark-primary"
                      : "bg-primary/10 text-primary hover:bg-primary/20 dark:bg-dark-primary/20 dark:text-dark-primary dark:hover:bg-dark-primary/30"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-accent bg-primary/10 px-3 py-2 dark:border-dark-primary dark:bg-dark-primary/10">
          <span className="text-sm font-medium text-primary dark:text-dark-primary">
            {selected.size} selected
          </span>
          <div className="ml-auto flex gap-2">
            <Button
              onClick={handleImportSelected}
              loading={importing}
              icon={<Download size={14} />}
              className="!px-3 !py-1 !text-xs"
            >
              Import selected
            </Button>
            <Button
              variant="ghost"
              onClick={clearSelection}
              icon={<X size={14} />}
              className="!px-3 !py-1 !text-xs"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-base-content/60">Loading…</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-base-300 py-12 dark:border-dark-base-300">
          <Sparkles
            size={40}
            className="text-base-content/30 dark:text-dark-base-content/30"
          />
          <p className="text-sm text-base-content/60 dark:text-dark-base-content/50">
            No suggestions available yet.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-base-300 py-12 dark:border-dark-base-300">
          <p className="text-sm text-base-content/60 dark:text-dark-base-content/50">
            No suggestions match your filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Select-all header */}
          <button
            onClick={toggleSelectAll}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-base-content/60 hover:bg-base-100 dark:text-dark-base-content/50 dark:hover:bg-dark-base-200"
          >
            {allVisibleSelected ? (
              <CheckSquare size={14} className="text-primary" />
            ) : visibleSelectedCount > 0 ? (
              <MinusSquare size={14} className="text-primary" />
            ) : (
              <Square size={14} />
            )}
            {allVisibleSelected ? "Deselect all" : "Select all"}
          </button>

          {filtered.map((pkg) => {
            const isSelected = selected.has(pkg.filename);
            return (
              <div
                key={pkg.filename}
                className={`group relative rounded-xl border p-4 transition-colors hover:border-primary/40 dark:hover:border-dark-primary/40 ${
                  isSelected
                    ? "border-accent bg-primary/5 dark:border-dark-primary dark:bg-dark-primary/5"
                    : "border-base-300 bg-base-100 dark:border-dark-base-300 dark:bg-dark-base-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <div
                    className="mt-0.5 cursor-pointer"
                    onClick={(e) => toggleSelect(pkg.filename, e)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="h-4 w-4 rounded border-base-300 text-primary focus:ring-primary"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-base-content dark:text-dark-base-content">
                      {pkg.name}
                    </h3>

                    {pkg.titleKeyword && (
                      <p className="mt-0.5 text-sm text-base-content/60 dark:text-dark-base-content/50">
                        {pkg.titleKeyword}
                      </p>
                    )}

                    <div className="mt-2 flex items-center gap-4 text-xs text-base-content/50 dark:text-dark-base-content/40">
                      <span className="flex items-center gap-1">
                        <Tag size={12} />
                        {pkg.keywords.length + (pkg.titleKeyword ? 1 : 0)}{" "}
                        keywords
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen size={12} />
                        {pkg.matchingWords.length} matching
                      </span>
                      <span className="flex items-center gap-1">
                        <Ban size={12} />
                        {pkg.removalWords.length} removal
                      </span>
                    </div>

                    {pkg.categories.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {pkg.categories.map((cat) => (
                          <span
                            key={cat}
                            className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary dark:bg-dark-primary/20 dark:text-dark-primary"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex gap-2">
                      <Button
                        onClick={() => handleImportOne(pkg)}
                        loading={importing}
                        icon={<Download size={14} />}
                        className="!px-3 !py-1 !text-xs"
                      >
                        Import
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
