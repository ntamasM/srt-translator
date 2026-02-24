import React, { useEffect, useState } from "react";
import {
  Download,
  Trash2,
  RefreshCw,
  Upload,
  Languages,
  Clock,
} from "lucide-react";
import { filesApi } from "../api/filesApi";
import { useToast } from "../components/Toast";
import { formatFileSize } from "../utils/helpers";
import type { FileInfo } from "../types/files";

type Tab = "uploaded" | "translated";

const MAX_AGE_DAYS = 7;

function daysUntilDeletion(modified: string): number {
  const modifiedDate = new Date(modified).getTime();
  const now = Date.now();
  const elapsed = now - modifiedDate;
  const remaining = MAX_AGE_DAYS - elapsed / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(remaining));
}

export default function OldFilesPage() {
  const [tab, setTab] = useState<Tab>("uploaded");
  const [uploaded, setUploaded] = useState<FileInfo[]>([]);
  const [translated, setTranslated] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const refresh = async () => {
    setLoading(true);
    try {
      const [u, t] = await Promise.all([
        filesApi.listFiles(),
        filesApi.listTranslated(),
      ]);
      setUploaded(u);
      setTranslated(t);
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
      await filesApi.deleteFile(filename);
      setUploaded((prev) => prev.filter((f) => f.name !== filename));
      addToast("success", `Deleted ${filename}`);
    } catch (err: any) {
      addToast("error", err.message || "Delete failed");
    }
  };

  const handleDownload = (filename: string) => {
    filesApi.downloadFile(filename);
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Old Files
        </h1>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {t.icon}
            {t.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                tab === t.key
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                  : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Retention notice */}
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Files older than 7 days are automatically deleted.
      </p>

      {/* File list */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <RefreshCw size={20} className="animate-spin" />
          <span className="ml-2 text-sm">Loading…</span>
        </div>
      ) : files.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
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
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                  {f.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(f.size)} ·{" "}
                  {new Date(f.modified).toLocaleString()}
                </p>
              </div>
              <div className="ml-4 flex items-center gap-2">
                {(() => {
                  const days = daysUntilDeletion(f.modified);
                  return (
                    <span
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        days <= 1
                          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                          : days <= 3
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                      }`}
                      title={`Deleted in ${days} day${days !== 1 ? "s" : ""}`}
                    >
                      <Clock size={12} />
                      {days}d
                    </span>
                  );
                })()}
                {tab === "translated" && (
                  <button
                    onClick={() => handleDownload(f.name)}
                    className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                )}
                {tab === "uploaded" && (
                  <button
                    onClick={() => handleDelete(f.name)}
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
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
    </div>
  );
}
