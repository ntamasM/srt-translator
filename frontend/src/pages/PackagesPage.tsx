import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  BookOpen,
  Ban,
  Tag,
  Check,
  Package,
  Download,
  Upload,
  X,
  CheckSquare,
  Square,
  MinusSquare,
} from "lucide-react";
import Button from "../components/Button";
import Modal from "../components/Modal";
import { useToast } from "../components/Toast";
import { useSettings } from "../hooks/useSettings";
import { getPackages, savePackage, deletePackage } from "../utils/db";
import { importPackages } from "../utils/importPackages";
import type { TranslationPackage } from "../types/settings";

export default function PackagesPage() {
  const [packages, setPackages] = useState<TranslationPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<TranslationPackage | null>(
    null,
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { settings, updateSettings } = useSettings();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPackages();
      data.sort((a, b) => b.updatedAt - a.updatedAt);
      setPackages(data);
    } catch {
      addToast("error", "Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    const pkg: TranslationPackage = {
      id: crypto.randomUUID(),
      name: "New Package",
      titleKeyword: "",
      keywords: [],
      matchingWords: [],
      removalWords: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await savePackage(pkg);
    navigate(`/packages/${pkg.id}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePackage(deleteTarget.id);
      setDeleteTarget(null);
      selected.delete(deleteTarget.id);
      setSelected(new Set(selected));
      await load();
      if (settings?.defaultPackageId === deleteTarget.id) {
        await updateSettings({ defaultPackageId: null });
      }
      addToast("success", "Package deleted");
    } catch (err: any) {
      addToast("error", err.message);
    }
  };

  const handleSetDefault = async (pkg: TranslationPackage) => {
    const newId = settings?.defaultPackageId === pkg.id ? null : pkg.id;
    await updateSettings({ defaultPackageId: newId });
    addToast(
      "success",
      newId ? `"${pkg.name}" set as default package` : "Default package cleared",
    );
  };

  /* ── Selection ───────────────────────────────────────────────────── */
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === packages.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(packages.map((p) => p.id)));
    }
  };

  const clearSelection = () => setSelected(new Set());

  /* ── Export selected ─────────────────────────────────────────────── */
  const handleExportSelected = () => {
    const toExport = packages.filter((p) => selected.has(p.id));
    if (toExport.length === 0) return;

    const json = JSON.stringify(toExport, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    const namePart =
      toExport.length === 1
        ? toExport[0].name.replace(/[^a-zA-Z0-9_-]/g, "_")
        : `${toExport.length}-packages`;
    a.download = `srt-packages-${namePart}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast("success", `Exported ${toExport.length} package(s)`);
  };

  /* ── Bulk delete selected ────────────────────────────────────────── */
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const handleBulkDelete = async () => {
    try {
      for (const id of selected) {
        await deletePackage(id);
      }
      const count = selected.size;
      if (settings?.defaultPackageId && selected.has(settings.defaultPackageId)) {
        await updateSettings({ defaultPackageId: null });
      }
      setSelected(new Set());
      setBulkDeleteOpen(false);
      await load();
      addToast("success", `Deleted ${count} package(s)`);
    } catch (err: any) {
      addToast("error", err.message);
    }
  };

  /* ── Import ─────────────────────────────────────────────────────── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const incoming: Partial<TranslationPackage>[] = Array.isArray(parsed)
          ? parsed
          : [parsed];

        if (!incoming[0]?.name || !incoming[0]?.matchingWords) {
          throw new Error(
            "Invalid file. Expected a JSON array of translation packages.",
          );
        }

        const importedCount = await importPackages(incoming);
        await load();
        addToast("success", `Imported ${importedCount} package(s)`);
      } catch (err: any) {
        addToast("error", `Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-base-content dark:text-dark-base-content">
          Translation Packages
        </h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            icon={<Upload size={16} />}
          >
            Import
          </Button>
          <Button onClick={handleCreate} icon={<Plus size={16} />}>
            New Package
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="mb-4 text-sm text-base-content/70 dark:text-dark-base-content/50">
        Create packages for movies or series you translate. Each package
        contains keywords that help the AI produce contextually accurate
        translations, along with matching and removal words specific to that
        content.
      </p>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-accent bg-primary/10 px-3 py-2 dark:border-dark-primary dark:bg-dark-primary/10">
          <span className="text-sm font-medium text-primary dark:text-dark-primary">
            {selected.size} selected
          </span>
          <div className="ml-auto flex gap-2">
            <Button
              variant="secondary"
              onClick={handleExportSelected}
              icon={<Download size={14} />}
              className="!px-3 !py-1 !text-xs"
            >
              Export
            </Button>
            <Button
              variant="secondary"
              onClick={() => setBulkDeleteOpen(true)}
              icon={<Trash2 size={14} />}
              className="!px-3 !py-1 !text-xs border-error/50 text-error hover:bg-error/10 dark:border-dark-error/50 dark:text-error dark:hover:bg-dark-error/10"
            >
              Delete
            </Button>
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

      {loading ? (
        <p className="text-sm text-base-content/60">Loading…</p>
      ) : packages.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-base-300 py-12 dark:border-dark-base-300">
          <Package
            size={40}
            className="text-base-content/30 dark:text-dark-base-content/30"
          />
          <p className="text-sm text-base-content/60 dark:text-dark-base-content/50">
            No packages yet. Create one to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Select-all header */}
          <button
            onClick={toggleSelectAll}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-base-content/60 hover:bg-base-100 dark:text-dark-base-content/50 dark:hover:bg-dark-base-200"
          >
            {selected.size === packages.length ? (
              <CheckSquare size={14} className="text-primary" />
            ) : selected.size > 0 ? (
              <MinusSquare size={14} className="text-primary" />
            ) : (
              <Square size={14} />
            )}
            {selected.size === packages.length ? "Deselect all" : "Select all"}
          </button>

          {packages.map((pkg) => {
            const isDefault = settings?.defaultPackageId === pkg.id;
            const isSelected = selected.has(pkg.id);
            return (
              <div
                key={pkg.id}
                className={`group relative cursor-pointer rounded-xl border p-4 transition-colors hover:border-primary/40 dark:hover:border-dark-primary/40 ${
                  isSelected
                    ? "border-accent bg-primary/5 dark:border-dark-primary dark:bg-dark-primary/5"
                    : isDefault
                      ? "border-primary/60 bg-primary/5 dark:border-dark-primary/60 dark:bg-dark-primary/5"
                      : "border-base-300 bg-base-100 dark:border-dark-base-300 dark:bg-dark-base-200"
                }`}
                onClick={() => navigate(`/packages/${pkg.id}`)}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <div
                    className="mt-0.5"
                    onClick={(e) => toggleSelect(pkg.id, e)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="h-4 w-4 rounded border-base-300 text-primary focus:ring-primary"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    {isDefault && (
                      <span className="absolute right-3 top-3 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary dark:bg-dark-primary/20 dark:text-dark-primary">
                        Default
                      </span>
                    )}

                    <h3 className="text-base font-semibold text-base-content dark:text-dark-base-content">
                      {pkg.name || "Untitled"}
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

                    {/* Action buttons */}
                    <div
                      className="mt-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="secondary"
                        onClick={() => handleSetDefault(pkg)}
                        icon={
                          isDefault ? (
                            <Check size={14} />
                          ) : (
                            <Package size={14} />
                          )
                        }
                        className="!px-3 !py-1 !text-xs"
                      >
                        {isDefault ? "Remove Default" : "Set as Default"}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setDeleteTarget(pkg)}
                        icon={<Trash2 size={14} />}
                        className="!px-3 !py-1 !text-xs border-error/50 text-error hover:bg-error/10 dark:border-dark-error/50 dark:text-error dark:hover:bg-dark-error/10"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Single delete confirmation modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Package"
        actions={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="!bg-error !text-white hover:!bg-error/90"
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-base-content/70 dark:text-dark-base-content/50">
          Are you sure you want to delete "{deleteTarget?.name}"? This action
          cannot be undone.
        </p>
      </Modal>

      {/* Bulk delete confirmation modal */}
      <Modal
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title="Delete Selected Packages"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setBulkDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkDelete}
              className="!bg-error !text-white hover:!bg-error/90"
            >
              Delete {selected.size} Package{selected.size !== 1 ? "s" : ""}
            </Button>
          </>
        }
      >
        <p className="text-sm text-base-content/70 dark:text-dark-base-content/50">
          Are you sure you want to delete {selected.size} selected package
          {selected.size !== 1 ? "s" : ""}? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
