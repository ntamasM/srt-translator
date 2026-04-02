import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  BookOpen,
  Ban,
  Tag,
  Check,
  Package,
} from "lucide-react";
import Button from "../components/Button";
import Modal from "../components/Modal";
import { useToast } from "../components/Toast";
import { useSettings } from "../hooks/useSettings";
import { getPackages, savePackage, deletePackage } from "../utils/db";
import type { TranslationPackage } from "../types/settings";

export default function PackagesPage() {
  const [packages, setPackages] = useState<TranslationPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<TranslationPackage | null>(
    null,
  );
  const { settings, updateSettings } = useSettings();
  const { addToast } = useToast();
  const navigate = useNavigate();

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
      await load();
      // Re-read settings in case activePackageId was cleared
      if (settings?.activePackageId === deleteTarget.id) {
        await updateSettings({ activePackageId: null });
      }
      addToast("success", "Package deleted");
    } catch (err: any) {
      addToast("error", err.message);
    }
  };

  const handleSetActive = async (pkg: TranslationPackage) => {
    const newId =
      settings?.activePackageId === pkg.id ? null : pkg.id;
    await updateSettings({ activePackageId: newId });
    addToast(
      "success",
      newId ? `"${pkg.name}" set as active package` : "Active package cleared",
    );
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-base-content dark:text-dark-base-content">
          Translation Packages
        </h1>
        <Button onClick={handleCreate} icon={<Plus size={16} />}>
          New Package
        </Button>
      </div>

      <p className="mb-4 text-sm text-base-content/70 dark:text-dark-base-content/50">
        Create packages for movies or series you translate. Each package
        contains keywords that help the AI produce contextually accurate
        translations, along with matching and removal words specific to that
        content.
      </p>

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
          {packages.map((pkg) => {
            const isActive = settings?.activePackageId === pkg.id;
            return (
              <div
                key={pkg.id}
                className={`group relative cursor-pointer rounded-xl border p-4 transition-colors hover:border-primary/40 dark:hover:border-dark-primary/40 ${
                  isActive
                    ? "border-primary/60 bg-primary/5 dark:border-dark-primary/60 dark:bg-dark-primary/5"
                    : "border-base-300 bg-base-100 dark:border-dark-base-300 dark:bg-dark-base-200"
                }`}
                onClick={() => navigate(`/packages/${pkg.id}`)}
              >
                {isActive && (
                  <span className="absolute right-3 top-3 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary dark:bg-dark-primary/20 dark:text-dark-primary">
                    Active
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
                    {pkg.keywords.length + (pkg.titleKeyword ? 1 : 0)} keywords
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
                    onClick={() => handleSetActive(pkg)}
                    icon={
                      isActive ? <Check size={14} /> : <Package size={14} />
                    }
                    className="!px-3 !py-1 !text-xs"
                  >
                    {isActive ? "Deactivate" : "Set Active"}
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
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
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
    </div>
  );
}

