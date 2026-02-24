import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { useTranslationContext } from "../contexts/TranslationContext";
import { overallProgress } from "../utils/helpers";

/**
 * Persistent banner shown at the top of every page while a translation
 * is running (or has just finished). Clicking navigates to Home.
 */
export default function TranslationBanner() {
  const { status, fileProgress, completedFiles, error } =
    useTranslationContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show when idle or when already on the home page
  if (status === "idle") return null;
  if (location.pathname === "/") return null;

  const progressList = Object.values(fileProgress);
  const pct = overallProgress(progressList);
  const totalFiles = progressList.length;

  const config: Record<
    string,
    {
      icon: React.ReactNode;
      bg: string;
      bar: string;
      text: string;
      label: string;
    }
  > = {
    translating: {
      icon: <Loader2 size={16} className="animate-spin" />,
      bg: "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700",
      bar: "bg-blue-500",
      text: "text-blue-700 dark:text-blue-300",
      label: `Translating… ${pct}% (${completedFiles.length}/${totalFiles} files)`,
    },
    complete: {
      icon: <CheckCircle size={16} />,
      bg: "bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700",
      bar: "bg-green-500",
      text: "text-green-700 dark:text-green-300",
      label: `Translation complete — ${totalFiles} file(s) ready`,
    },
    cancelled: {
      icon: <XCircle size={16} />,
      bg: "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700",
      bar: "bg-yellow-500",
      text: "text-yellow-700 dark:text-yellow-300",
      label: "Translation cancelled",
    },
    error: {
      icon: <AlertCircle size={16} />,
      bg: "bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-700",
      bar: "bg-red-500",
      text: "text-red-700 dark:text-red-300",
      label: error || "Translation failed",
    },
  };

  const c = config[status] ?? config.translating;

  return (
    <button
      onClick={() => navigate("/")}
      className={`flex w-full items-center gap-3 border-b px-4 py-2.5 transition-colors hover:opacity-90 ${c.bg}`}
    >
      <span className={c.text}>{c.icon}</span>
      <span className={`text-sm font-medium ${c.text}`}>{c.label}</span>

      {/* Mini progress bar */}
      {status === "translating" && (
        <div className="ml-auto h-1.5 w-32 overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
          <div
            className={`h-full rounded-full transition-all duration-300 ${c.bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <span className={`ml-auto text-xs ${c.text} opacity-70`}>
        ← Back to translation
      </span>
    </button>
  );
}
