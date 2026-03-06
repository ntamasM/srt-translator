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
      bg: "bg-primary/10 border-accent dark:bg-dark-primary/15 dark:border-dark-primary",
      bar: "bg-primary",
      text: "text-primary dark:text-dark-primary",
      label: `Translating… ${pct}% (${completedFiles.length}/${totalFiles} files)`,
    },
    complete: {
      icon: <CheckCircle size={16} />,
      bg: "bg-success/10 border-success/30 dark:bg-dark-success/20 dark:border-dark-success/30",
      bar: "bg-success/100",
      text: "text-success dark:text-dark-success",
      label: `Translation complete — ${totalFiles} file(s) ready`,
    },
    cancelled: {
      icon: <XCircle size={16} />,
      bg: "bg-warning/10 border-warning/30 dark:bg-dark-warning/20 dark:border-dark-warning/30",
      bar: "bg-warning/100",
      text: "text-warning-content dark:text-dark-warning",
      label: "Translation cancelled",
    },
    error: {
      icon: <AlertCircle size={16} />,
      bg: "bg-error/10 border-error/30 dark:bg-dark-error/20 dark:border-dark-error/50",
      bar: "bg-error/100",
      text: "text-error dark:text-dark-error",
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
        <div className="ml-auto h-1.5 w-32 overflow-hidden rounded-full bg-accent dark:bg-dark-primary/30">
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
