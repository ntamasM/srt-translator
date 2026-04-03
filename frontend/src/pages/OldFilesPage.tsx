import React, { useEffect, useState } from "react";
import {
  Download,
  Trash2,
  RefreshCw,
  Upload,
  Languages,
  Clock,
  Eye,
} from "lucide-react";
import { filesApi } from "../api/filesApi";
import { configApi } from "../api/configApi";
import { useToast } from "../components/Toast";
import { formatFileSize, formatDateTime } from "../utils/helpers";
import { useSettings } from "../hooks/useSettings";
import type { FileInfo } from "../types/files";
import Modal from "../components/Modal";

type Tab = "uploaded" | "translated";

function daysUntilDeletion(modified: string, maxAgeDays: number): number {
  const modifiedDate = new Date(modified).getTime();
  const now = Date.now();
  const elapsed = now - modifiedDate;
  const remaining = maxAgeDays - elapsed / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(remaining));
}

export default function OldFilesPage() {
  const [tab, setTab] = useState<Tab>("uploaded");
  const [uploaded, setUploaded] = useState<FileInfo[]>([]);
  const [translated, setTranslated] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxAgeDays, setMaxAgeDays] = useState(7);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFilename, setPreviewFilename] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const { addToast } = useToast();
  const { settings } = useSettings();

  const refresh = async () => {
    setLoading(true);
    try {
      const [u, t, cfg] = await Promise.all([
        filesApi.listFiles(),
        filesApi.listTranslated(),
        configApi.getConfig(),
      ]);
      setUploaded(u);
      setTranslated(t);
      setMaxAgeDays(cfg.file_max_age_days);
    } catch (err: any) {
      addToast("error", err.message || "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleDelete = async (filename: string) => {
    try {
      if (tab === "translated") {
        await filesApi.deleteTranslatedFile(filename);
        setTranslated((prev) => prev.filter((f) => f.name !== filename));
      } else {
        await filesApi.deleteFile(filename);
        setUploaded((prev) => prev.filter((f) => f.name !== filename));
      }
      addToast("success", `Deleted ${filename}`);
    } catch (err: any) {
      addToast("error", err.message || "Delete failed");
    }
  };

  const handleDownload = (filename: string) => {
    filesApi.downloadFile(filename);
  };

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

  const files = tab === "uploaded" ? uploaded : translated;

  const tabs: {
    key: Tab;
    label: string;
    icon: React.ReactNode;
    count: number;
  }[] = [
    {
      key: "uploaded",
      label: "Uploaded",
      icon: <Upload size={16} />,
      count: uploaded.length,
    },
    {
      key: "translated",
      label: "Translated",
      icon: <Languages size={16} />,
      count: translated.length,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-base-content dark:text-dark-base-content">
          Old Files
        </h1>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-base-300 px-3 py-1.5 text-sm text-base-content/70 transition-colors hover:bg-base-200 dark:border-dark-base-300 dark:text-dark-base-content/50 dark:hover:bg-dark-base-200"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-base-300 bg-base-200 p-1 dark:border-dark-base-300 dark:bg-dark-base-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-base-100 text-base-content shadow-sm dark:bg-dark-base-300 dark:text-dark-base-content"
                : "text-base-content/60 hover:text-base-content/80 dark:text-dark-base-content/50 dark:hover:text-dark-base-content"
            }`}
          >
            {t.icon}
            {t.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                tab === t.key
                  ? "bg-primary/20 text-primary dark:bg-dark-primary/25 dark:text-dark-primary"
                  : "bg-base-300 text-base-content/60 dark:bg-dark-base-300 dark:text-dark-base-content/50"
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Retention notice */}
      <p className="text-xs text-base-content/50 dark:text-dark-base-content/50">
        Files older than {maxAgeDays} days are automatically deleted.
      </p>

      {/* File list */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-base-content/50">
          <RefreshCw size={20} className="animate-spin" />
          <span className="ml-2 text-sm">Loading…</span>
        </div>
      ) : files.length === 0 ? (
        <div className="rounded-lg border border-dashed border-base-300 py-12 text-center dark:border-dark-base-300">
          <p className="text-sm text-base-content/60 dark:text-dark-base-content/50">
            {tab === "uploaded"
              ? "No uploaded files yet."
              : "No translated files yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((f) => (
            <div
              key={f.name}
              className="flex items-center justify-between rounded-lg border border-base-300 bg-base-100 px-4 py-3 dark:border-dark-base-300 dark:bg-dark-base-200"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-base-content dark:text-dark-base-content">
                  {f.name}
                </p>
                <p className="text-xs text-base-content/60 dark:text-dark-base-content/50">
                  {formatFileSize(f.size)} ·{" "}
                  {formatDateTime(f.modified, settings?.date_format)}
                </p>
              </div>
              <div className="ml-4 flex items-center gap-2">
                {(() => {
                  const days = daysUntilDeletion(f.modified, maxAgeDays);
                  return (
                    <span
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        days <= 1
                          ? "bg-error/20 text-error dark:bg-dark-error/20 dark:text-dark-error"
                          : days <= 3
                            ? "bg-warning/20 text-warning-content dark:bg-dark-warning/20 dark:text-dark-warning"
                            : "bg-base-200 text-base-content/60 dark:bg-dark-base-300 dark:text-dark-base-content/50"
                      }`}
                      title={`Deleted in ${days} day${days !== 1 ? "s" : ""}`}
                    >
                      <Clock size={12} />
                      {days}d
                    </span>
                  );
                })()}
                {tab === "translated" && (
                  <>
                    <button
                      onClick={() => handlePreview(f.name)}
                      className="rounded p-1.5 text-base-content/70 hover:bg-base-200 hover:text-base-content dark:text-dark-base-content/70 dark:hover:bg-dark-base-300 dark:hover:text-dark-base-content"
                      title="Preview"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDownload(f.name)}
                      className="rounded p-1.5 text-base-content/70 hover:bg-primary/10 hover:text-primary dark:text-dark-base-content/70 dark:hover:bg-dark-primary/10 dark:hover:text-dark-primary"
                      title="Download"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(f.name)}
                      className="rounded p-1.5 text-base-content/70 hover:bg-error/10 hover:text-error dark:text-dark-base-content/70 dark:hover:bg-dark-error/10 dark:hover:text-error"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
                {tab === "uploaded" && (
                  <button
                    onClick={() => handleDelete(f.name)}
                    className="rounded p-1.5 text-base-content/70 hover:bg-error/10 hover:text-error dark:text-dark-base-content/70 dark:hover:bg-dark-error/10 dark:hover:text-error"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
    </div>
  );
}
