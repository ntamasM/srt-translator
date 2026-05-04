import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRightLeft,
  Check,
  Play,
  RotateCcw,
  X,
  Square,
  Download,
  Package,
} from "lucide-react";
import Button from "../components/Button";
import FileDropZone from "../components/FileDropZone";
import ProgressBar from "../components/ProgressBar";
import ProgressCard from "../components/ProgressCard";
import Modal from "../components/Modal";
import { useTranslationContext } from "../contexts/TranslationContext";
import { useSettings } from "../hooks/useSettings";
import { useToast } from "../components/Toast";
import { formatFileSize, overallProgress } from "../utils/helpers";
import { filesApi } from "../api/filesApi";
import { getSettings, getPackage, getPackages } from "../utils/db";
import { LANGUAGES } from "../utils/constants";
import type { TranslationPackage } from "../types/settings";

export default function HomePage() {
  const { settings, updateSettings } = useSettings();
  const {
    files,
    isDragging,
    setIsDragging,
    isUploading,
    addFiles,
    removeFile,
    refreshFiles,
    status,
    fileProgress,
    completedFiles,
    error,
    startTranslation,
    cancelTranslation,
    reset,
  } = useTranslationContext();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFilename, setPreviewFilename] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Session-only package selection — does not persist to settings
  const [selectedPkg, setSelectedPkg] = useState<TranslationPackage | null>(null);
  const [allPackages, setAllPackages] = useState<TranslationPackage[]>([]);
  const [showPkgPicker, setShowPkgPicker] = useState(false);

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  // Load all packages for the picker
  useEffect(() => {
    getPackages().then((pkgs) => {
      pkgs.sort((a, b) => b.updatedAt - a.updatedAt);
      setAllPackages(pkgs);
    });
  }, []);

  // Initialize selected package from the default on first load
  useEffect(() => {
    if (!settings?.defaultPackageId) {
      setSelectedPkg(null);
      return;
    }
    getPackage(settings.defaultPackageId).then((pkg) => {
      setSelectedPkg(pkg ?? null);
      if (!pkg) updateSettings({ defaultPackageId: null });
    });
  }, [settings?.defaultPackageId]);

  const handleAddFiles = async (newFiles: File[]) => {
    try {
      await addFiles(newFiles);
      addToast("success", `Uploaded ${newFiles.length} file(s)`);
    } catch (err: any) {
      addToast("error", err.message || "Upload failed");
    }
  };

  const handleRemoveFile = async (name: string) => {
    try {
      await removeFile(name);
    } catch (err: any) {
      addToast("error", err.message || "Delete failed");
    }
  };

  const handleStart = async () => {
    if (files.length === 0 || !settings || !selectedPkg) return;
    try {
      const latestSettings = await getSettings();
      const matchingWords = selectedPkg.matchingWords;
      const removalWords = selectedPkg.removalWords;
      const keywords = [
        ...(selectedPkg.titleKeyword ? [selectedPkg.titleKeyword] : []),
        ...selectedPkg.keywords,
      ];

      startTranslation(
        files.map((f) => f.name),
        latestSettings,
        matchingWords,
        removalWords,
        keywords,
      );
    } catch {
      addToast("error", "Failed to load package data");
    }
  };

  const handleSwapLanguages = () => {
    if (!settings) return;
    updateSettings({
      src_lang: settings.tgt_lang,
      tgt_lang: settings.src_lang,
    });
  };

  const handleReset = () => {
    reset();
    refreshFiles();
  };

  const progressList = Object.values(fileProgress);
  const overallPct = overallProgress(progressList);

  const canStart =
    files.length > 0 && status === "idle" && settings?.api_key && !!selectedPkg;
  const doneFiles = useMemo(
    () =>
      progressList
        .filter((fp) => fp.status === "done")
        .map((fp) => fp.filename),
    [progressList],
  );
  const allTranslationsCompleted =
    progressList.length > 0 && progressList.every((fp) => fp.status === "done");

  const handlePreview = async (filename: string) => {
    setPreviewFilename(filename);
    setPreviewOpen(true);
    setIsPreviewLoading(true);
    try {
      const text = await filesApi.getTranslatedFileText(filename);
      setPreviewText(text);
    } catch (err: any) {
      setPreviewText("");
      addToast("error", err.message || "Failed to open preview");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleDownloadAll = () => {
    if (!allTranslationsCompleted) return;
    filesApi.downloadAllFiles(doneFiles);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-base-content dark:text-dark-base-content">
        Translate Subtitles
      </h1>

      {/* Language selector */}
      {settings && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-base-300 bg-base-100 px-4 py-2 shadow-sm dark:border-dark-base-300 dark:bg-dark-base-200">
            <span className="text-sm font-medium text-base-content/70 dark:text-dark-base-content">
              Source:
            </span>
            <select
              value={settings.src_lang}
              onChange={(e) => updateSettings({ src_lang: e.target.value })}
              className="rounded border border-base-300 px-2 py-1 text-sm dark:border-dark-base-300 dark:bg-dark-base-300 dark:text-dark-base-content"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSwapLanguages}
            className="rounded-full p-2 text-base-content/50 hover:bg-base-200 hover:text-base-content/70 dark:text-dark-base-content/50 dark:hover:bg-dark-base-200 dark:hover:text-dark-base-content/70"
            title="Swap languages"
          >
            <ArrowRightLeft size={18} />
          </button>

          <div className="flex items-center gap-2 rounded-lg border border-base-300 bg-base-100 px-4 py-2 shadow-sm dark:border-dark-base-300 dark:bg-dark-base-200">
            <span className="text-sm font-medium text-base-content/70 dark:text-dark-base-content">
              Target:
            </span>
            <select
              value={settings.tgt_lang}
              onChange={(e) => updateSettings({ tgt_lang: e.target.value })}
              className="rounded border border-base-300 px-2 py-1 text-sm dark:border-dark-base-300 dark:bg-dark-base-300 dark:text-dark-base-content"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Package selector */}
      {status === "idle" && (
        <div
          className={`flex items-center justify-between rounded-lg border px-4 py-2.5 ${
            selectedPkg
              ? "border-primary/30 bg-primary/5 dark:border-dark-primary/30 dark:bg-dark-primary/5"
              : "border-base-300 bg-base-100 dark:border-dark-base-300 dark:bg-dark-base-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Package
              size={16}
              className={
                selectedPkg
                  ? "text-primary dark:text-dark-primary"
                  : "text-base-content/40 dark:text-dark-base-content/40"
              }
            />
            {selectedPkg ? (
              <span className="text-sm font-medium text-base-content dark:text-dark-base-content">
                {selectedPkg.name}
                {selectedPkg.titleKeyword && (
                  <span className="ml-1.5 text-xs text-base-content/50 dark:text-dark-base-content/40">
                    — {selectedPkg.titleKeyword}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-sm text-base-content/50 dark:text-dark-base-content/40">
                No package selected — select one to start translating
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPkgPicker(true)}
              className="text-xs font-medium text-primary hover:underline dark:text-dark-primary"
            >
              {selectedPkg ? "Change" : "Select Package"}
            </button>
            {selectedPkg && (
              <button
                onClick={() => setSelectedPkg(null)}
                className="text-xs text-base-content/50 hover:text-base-content dark:text-dark-base-content/40 dark:hover:text-dark-base-content"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Drop zone (hidden while translating) */}
      {status === "idle" && (
        <>
          <FileDropZone
            onFiles={handleAddFiles}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
          />

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-base-content/80 dark:text-dark-base-content">
                Files ({files.length})
              </h2>
              {files.map((f) => (
                <div
                  key={f.name}
                  className="flex items-center justify-between rounded-lg border border-base-300 bg-base-100 px-4 py-2 dark:border-dark-base-300 dark:bg-dark-base-200"
                >
                  <div>
                    <p className="text-sm font-medium text-base-content dark:text-dark-base-content">
                      {f.name}
                    </p>
                    <p className="text-xs text-base-content/60 dark:text-dark-base-content/60">
                      {formatFileSize(f.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(f.name)}
                    className="rounded p-1 text-base-content/50 dark:text-dark-base-content/50 hover:bg-error/10 hover:text-error dark:hover:bg-dark-error/10 dark:hover:text-dark-error"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Start button */}
          <Button
            onClick={handleStart}
            disabled={!canStart}
            loading={isUploading}
            icon={<Play size={16} />}
            className="w-full"
          >
            {!settings?.api_key
              ? "Set API Key in Settings first"
              : !selectedPkg
                ? "Select a Package first"
                : "Start Translation"}
          </Button>
        </>
      )}

      {/* Progress section */}
      {(status === "translating" ||
        status === "complete" ||
        status === "cancelled" ||
        status === "error") && (
        <div className="space-y-4">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-base-content/80 dark:text-dark-base-content">
              {status === "complete"
                ? "Translation Complete"
                : status === "cancelled"
                  ? "Translation Cancelled"
                  : status === "error"
                    ? "Translation Error"
                    : "Translating…"}
            </h2>
            <ProgressBar value={overallPct} />
          </div>

          {/* Cancel button while translating */}
          {status === "translating" && (
            <Button
              variant="secondary"
              onClick={cancelTranslation}
              icon={<Square size={16} />}
              className="w-full border-error/50 text-error hover:bg-error/10 dark:border-dark-error/50 dark:text-error dark:hover:bg-dark-error/10"
            >
              Stop Translation
            </Button>
          )}

          {error && (
            <div className="rounded-lg border border-error/30 bg-error/10 p-4 dark:border-dark-error/30 dark:bg-dark-error/10">
              <div className="flex items-start gap-2">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-error dark:text-dark-error"
                />
                <div>
                  <p className="text-sm font-medium text-error dark:text-dark-error">
                    Translation Failed
                  </p>
                  <p className="mt-1 text-xs text-error/80 dark:text-dark-error/80">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {progressList.map((fp) => (
              <ProgressCard
                key={fp.filename}
                progress={fp}
                onPreview={
                  fp.status === "done"
                    ? () => handlePreview(fp.filename)
                    : undefined
                }
                onDownload={
                  fp.status === "done"
                    ? () => filesApi.downloadFile(fp.filename)
                    : undefined
                }
              />
            ))}
          </div>

          <Button
            variant="secondary"
            onClick={handleDownloadAll}
            disabled={!allTranslationsCompleted}
            icon={<Download size={16} />}
            className="w-full"
          >
            Download All
          </Button>

          {(status === "complete" ||
            status === "error" ||
            status === "cancelled") && (
            <Button
              variant="secondary"
              onClick={handleReset}
              icon={<RotateCcw size={16} />}
              className="w-full"
            >
              Translate More
            </Button>
          )}
        </div>
      )}

      {/* Preview modal */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewFilename ? `Preview: ${previewFilename}` : "Preview"}
      >
        {isPreviewLoading ? (
          <p>Loading preview...</p>
        ) : (
          <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-lg bg-base-200 p-3 text-xs dark:bg-dark-base-300">
            {previewText || "No preview content available."}
          </pre>
        )}
      </Modal>

      {/* Package picker modal */}
      <Modal
        open={showPkgPicker}
        onClose={() => setShowPkgPicker(false)}
        title="Select Package"
      >
        {allPackages.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Package
              size={32}
              className="text-base-content/30 dark:text-dark-base-content/30"
            />
            <p className="text-sm text-base-content/60 dark:text-dark-base-content/50">
              No packages yet.
            </p>
            <button
              onClick={() => {
                setShowPkgPicker(false);
                navigate("/packages");
              }}
              className="text-sm font-medium text-primary hover:underline dark:text-dark-primary"
            >
              Create a Package
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="max-h-[50vh] space-y-2 overflow-auto">
              {allPackages.map((pkg) => {
                const isDefault = settings?.defaultPackageId === pkg.id;
                const isCurrent = selectedPkg?.id === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    onClick={() => {
                      setSelectedPkg(pkg);
                      setShowPkgPicker(false);
                    }}
                    className={`w-full rounded-lg border px-4 py-3 text-left transition-colors hover:border-primary/40 dark:hover:border-dark-primary/40 ${
                      isCurrent
                        ? "border-primary/60 bg-primary/5 dark:border-dark-primary/60 dark:bg-dark-primary/5"
                        : "border-base-300 bg-base-100 dark:border-dark-base-300 dark:bg-dark-base-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-base-content dark:text-dark-base-content">
                        {pkg.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isDefault && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary dark:bg-dark-primary/20 dark:text-dark-primary">
                            Default
                          </span>
                        )}
                        {isCurrent && (
                          <Check
                            size={14}
                            className="text-primary dark:text-dark-primary"
                          />
                        )}
                      </div>
                    </div>
                    {pkg.titleKeyword && (
                      <p className="mt-0.5 text-xs text-base-content/60 dark:text-dark-base-content/50">
                        {pkg.titleKeyword}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="border-t border-base-300 pt-2 dark:border-dark-base-300">
              <button
                onClick={() => {
                  setShowPkgPicker(false);
                  navigate("/packages");
                }}
                className="text-xs font-medium text-primary hover:underline dark:text-dark-primary"
              >
                Manage Packages →
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
