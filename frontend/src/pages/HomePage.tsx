import React, { useEffect } from "react";
import { ArrowRightLeft, Play, RotateCcw, X, Square } from "lucide-react";
import Button from "../components/Button";
import FileDropZone from "../components/FileDropZone";
import ProgressBar from "../components/ProgressBar";
import ProgressCard from "../components/ProgressCard";
import { useFileUpload } from "../hooks/useFileUpload";
import { useTranslation } from "../hooks/useTranslation";
import { useSettings } from "../hooks/useSettings";
import { useToast } from "../components/Toast";
import { formatFileSize, overallProgress } from "../utils/helpers";
import { filesApi } from "../api/filesApi";
import { getMatchingWords, getRemovalWords, getSettings } from "../utils/db";

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
  } = useFileUpload();
  const {
    status,
    fileProgress,
    completedFiles,
    error,
    startTranslation,
    cancelTranslation,
    reset,
  } = useTranslation();
  const { addToast } = useToast();

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

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
    if (files.length === 0 || !settings) return;
    try {
      const [matchingWords, removalWords, latestSettings] = await Promise.all([
        getMatchingWords(),
        getRemovalWords(),
        getSettings(),
      ]);
      startTranslation(
        files.map((f) => f.name),
        latestSettings,
        matchingWords,
        removalWords,
      );
    } catch {
      addToast("error", "Failed to load word lists from local storage");
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

  const canStart = files.length > 0 && status === "idle" && settings?.api_key;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Translate Subtitles
      </h1>

      {/* Language selector */}
      {settings && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Source:
            </span>
            <input
              value={settings.src_lang}
              onChange={(e) => updateSettings({ src_lang: e.target.value })}
              className="w-14 rounded border border-gray-300 px-2 py-1 text-center text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <button
            onClick={handleSwapLanguages}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            title="Swap languages"
          >
            <ArrowRightLeft size={18} />
          </button>

          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Target:
            </span>
            <input
              value={settings.tgt_lang}
              onChange={(e) => updateSettings({ tgt_lang: e.target.value })}
              className="w-14 rounded border border-gray-300 px-2 py-1 text-center text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
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
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Files ({files.length})
              </h2>
              {files.map((f) => (
                <div
                  key={f.name}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {f.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(f.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(f.name)}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
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
            <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
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
              className="w-full border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Stop Translation
            </Button>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="space-y-3">
            {progressList.map((fp) => (
              <ProgressCard
                key={fp.filename}
                progress={fp}
                onDownload={
                  fp.status === "done"
                    ? () => filesApi.downloadFile(fp.filename)
                    : undefined
                }
              />
            ))}
          </div>

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
    </div>
  );
}
