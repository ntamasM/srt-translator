import React, { useRef, useState } from "react";
import { Download, Upload, Trash2, AlertTriangle } from "lucide-react";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import { useToast } from "../../components/Toast";
import {
  getSettings,
  saveSettings,
  getPackages,
  savePackage,
  deletePackage,
} from "../../utils/db";
import type { Settings, TranslationPackage } from "../../types/settings";

interface ExportData {
  version: number;
  exportedAt: string;
  settings: Settings;
  packages: TranslationPackage[];
}

export default function ManageData() {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [importing, setImporting] = useState(false);

  /* ── Export ──────────────────────────────────────────────────────── */
  const handleExport = async () => {
    try {
      const [settings, packages] = await Promise.all([
        getSettings(),
        getPackages(),
      ]);

      const data: ExportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        settings,
        packages,
      };

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `srt-translator-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addToast(
        "success",
        `Exported ${packages.length} package(s) and settings`,
      );
    } catch (err: any) {
      addToast("error", err.message || "Export failed");
    }
  };

  /* ── Import ─────────────────────────────────────────────────────── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      setImporting(true);
      try {
        const raw = reader.result as string;
        const data = JSON.parse(raw) as ExportData;

        if (!data.version || !data.settings || !Array.isArray(data.packages)) {
          throw new Error(
            "Invalid backup file. Expected version, settings, and packages fields.",
          );
        }

        // Import settings (skip api_key to avoid overwriting credentials)
        const { api_key, ...importedSettings } = data.settings;
        await saveSettings(importedSettings);

        // Import packages — merge by adding/overwriting
        let importedCount = 0;
        for (const pkg of data.packages) {
          if (!pkg.id || !pkg.name) continue;
          await savePackage(pkg);
          importedCount++;
        }

        addToast(
          "success",
          `Imported settings and ${importedCount} package(s). API key was not overwritten.`,
        );
      } catch (err: any) {
        addToast("error", `Import failed: ${err.message}`);
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  /* ── Delete all ─────────────────────────────────────────────────── */
  const handleDeleteAll = async () => {
    if (deleteConfirmText !== "DELETE") return;
    try {
      const packages = await getPackages();
      for (const pkg of packages) {
        await deletePackage(pkg.id);
      }

      // Reset settings to defaults (keep api_key)
      const current = await getSettings();
      await saveSettings({
        ai_platform: "openai",
        model: "gpt-4o-mini",
        temperature: 0.2,
        top_p: 0.1,
        top_k: 40,
        frequency_penalty: 0,
        presence_penalty: 0,
        src_lang: "en",
        tgt_lang: "el",
        translator_name: "AI",
        matching_case_insensitive: false,
        replace_credits: true,
        add_credits: true,
        append_credits_at_end: false,
        activePackageId: null,
        api_key: current.api_key, // preserve API key
      });

      setDeleteOpen(false);
      setDeleteConfirmText("");
      addToast(
        "success",
        `Deleted ${packages.length} package(s) and reset settings`,
      );
    } catch (err: any) {
      addToast("error", err.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Export ──────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="border-b border-base-300 pb-2 text-base font-semibold text-base-content dark:border-dark-base-300 dark:text-dark-base-content">
          Export Data
        </h2>
        <p className="text-sm text-base-content/70 dark:text-dark-base-content/50">
          Download all your translation packages and settings as a JSON file.
          You can use this to back up your data or transfer it to another
          browser.
        </p>
        <Button onClick={handleExport} icon={<Download size={16} />}>
          Export All Data
        </Button>
      </section>

      {/* ── Import ─────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="border-b border-base-300 pb-2 text-base font-semibold text-base-content dark:border-dark-base-300 dark:text-dark-base-content">
          Import Data
        </h2>
        <p className="text-sm text-base-content/70 dark:text-dark-base-content/50">
          Restore data from a previously exported JSON file. Existing packages
          with the same ID will be overwritten. Your API key will not be
          changed.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          loading={importing}
          icon={<Upload size={16} />}
        >
          Import from JSON File
        </Button>
      </section>

      {/* ── Delete ─────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="border-b border-error/30 pb-2 text-base font-semibold text-error dark:text-dark-error">
          Danger Zone
        </h2>
        <p className="text-sm text-base-content/70 dark:text-dark-base-content/50">
          Permanently delete all translation packages and reset settings to
          defaults. Your API key will be preserved. This action cannot be
          undone.
        </p>
        <Button
          variant="secondary"
          onClick={() => setDeleteOpen(true)}
          icon={<Trash2 size={16} />}
          className="border-error/50 text-error hover:bg-error/10 dark:border-dark-error/50 dark:text-dark-error dark:hover:bg-dark-error/10"
        >
          Delete All Data
        </Button>
      </section>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteConfirmText("");
        }}
        title="Delete All Data"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteConfirmText("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAll}
              disabled={deleteConfirmText !== "DELETE"}
              className="!bg-error !text-white hover:!bg-error/90 disabled:!bg-error/40"
            >
              Delete Everything
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-error/30 bg-error/10 p-3 dark:border-dark-error/30 dark:bg-dark-error/10">
            <AlertTriangle
              size={20}
              className="mt-0.5 shrink-0 text-error dark:text-dark-error"
            />
            <p className="text-sm text-error/90 dark:text-dark-error/90">
              This will permanently delete all your translation packages and
              reset all settings to their defaults. Your API key will be
              preserved.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-base-content dark:text-dark-base-content">
              Type <strong>DELETE</strong> to confirm
            </label>
            <input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full rounded-lg border border-base-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-error dark:border-dark-base-300 dark:bg-dark-base-200 dark:text-dark-base-content"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
