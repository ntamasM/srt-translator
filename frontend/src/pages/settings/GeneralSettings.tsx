import React, { useState, useEffect } from "react";
import { Save, Eye, EyeOff, Sun, Moon, Monitor } from "lucide-react";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import SelectField from "../../components/SelectField";
import { useSettings } from "../../hooks/useSettings";
import { useTheme } from "../../hooks/useTheme";
import { useToast } from "../../components/Toast";
import { AI_PLATFORMS, DEFAULT_MODELS } from "../../utils/constants";
import type { Settings } from "../../types/settings";
import type { Theme } from "../../types/settings";

export default function GeneralSettings() {
  const { settings, isLoading, updateSettings } = useSettings();
  const { theme, setTheme } = useTheme();
  const { addToast } = useToast();
  const [form, setForm] = useState<Partial<Settings>>({});
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync form with loaded settings
  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const handleChange = (
    field: keyof Settings,
    value: string | number | boolean,
  ) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-update model when platform changes
      if (field === "ai_platform" && typeof value === "string") {
        next.model = DEFAULT_MODELS[value] || "";
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(form);
      addToast("success", "Settings saved");
    } catch (err: any) {
      addToast("error", err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !form.ai_platform) {
    return (
      <p className="text-sm text-base-content/60 dark:text-dark-base-content/50">
        Loading settings…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Theme */}
      <div>
        <label className="mb-2 block text-sm font-medium text-base-content/80 dark:text-dark-base-content">
          Theme
        </label>
        <div className="inline-flex gap-1 rounded-lg bg-base-200 p-1 dark:bg-dark-base-200">
          {(
            [
              { value: "light", icon: <Sun size={16} />, label: "Light" },
              { value: "dark", icon: <Moon size={16} />, label: "Dark" },
              { value: "system", icon: <Monitor size={16} />, label: "System" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                theme === opt.value
                  ? "bg-base-100 text-primary shadow-sm dark:bg-dark-base-300 dark:text-dark-primary"
                  : "text-base-content/60 hover:text-base-content dark:text-dark-base-content/50 dark:hover:text-dark-base-content"
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-base-content/60 dark:text-dark-base-content/50">
          Choose light, dark, or follow your operating system preference.
        </p>
      </div>

      {/* AI Platform */}
      <SelectField
        label="AI Platform"
        options={AI_PLATFORMS.map((p) => ({ value: p.value, label: p.label }))}
        value={form.ai_platform}
        onChange={(e) => handleChange("ai_platform", e.target.value)}
        hint="The AI provider used for translation. Changing this will auto-update the model."
      />

      {/* API Key */}
      <div>
        <label className="mb-1 block text-sm font-medium text-base-content/80 dark:text-dark-base-content">
          API Key
        </label>
        <div className="flex gap-2">
          <input
            type={showKey ? "text" : "password"}
            value={form.api_key || ""}
            onChange={(e) => handleChange("api_key", e.target.value)}
            className="flex-1 rounded-lg border border-base-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-dark-base-300 dark:bg-dark-base-200 dark:text-dark-base-content"
            placeholder="sk-..."
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="rounded-lg border border-base-300 px-3 py-2 text-base-content/60 hover:bg-base-100 dark:border-dark-base-300 dark:hover:bg-dark-base-200"
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="mt-1 text-xs text-base-content/60 dark:text-dark-base-content/50">
          Your API key for the selected AI platform. Required to run
          translations. Stored locally in your browser only.
        </p>
      </div>

      {/* Model */}
      <InputField
        label="Model"
        value={form.model || ""}
        onChange={(e) => handleChange("model", e.target.value)}
        hint={`Default for ${form.ai_platform}: ${DEFAULT_MODELS[form.ai_platform || "openai"]}`}
      />

      {/* Temperature & Top-P */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-base-content/80 dark:text-dark-base-content">
            Temperature ({form.temperature})
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={form.temperature ?? 0.2}
            onChange={(e) =>
              handleChange("temperature", parseFloat(e.target.value))
            }
            className="w-full"
          />
          <p className="mt-1 text-xs text-base-content/60 dark:text-dark-base-content/50">
            Controls randomness. Lower values (0.1–0.3) produce more consistent
            translations; higher values add variety.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-base-content/80 dark:text-dark-base-content">
            Top-P ({form.top_p})
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={form.top_p ?? 0.1}
            onChange={(e) => handleChange("top_p", parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="mt-1 text-xs text-base-content/60 dark:text-dark-base-content/50">
            Nucleus sampling threshold. Lower values make output more focused
            and deterministic.
          </p>
        </div>
      </div>

      {/* Languages */}
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Source Language"
          value={form.src_lang || ""}
          onChange={(e) => handleChange("src_lang", e.target.value)}
          hint="Language code of the original subtitles (e.g. en, ja, es)."
        />
        <InputField
          label="Target Language"
          value={form.tgt_lang || ""}
          onChange={(e) => handleChange("tgt_lang", e.target.value)}
          hint="Language code to translate subtitles into (e.g. el, fr, de)."
        />
      </div>

      {/* Translator Name */}
      <InputField
        label="Translator Name"
        value={form.translator_name || ""}
        onChange={(e) => handleChange("translator_name", e.target.value)}
        hint="Your name or alias. Used when adding or replacing translator credits in the subtitle file."
      />

      {/* Checkboxes */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-base-content/80 dark:text-dark-base-content">
          Credits Options
        </h3>
        {(
          [
            [
              "replace_credits",
              "Replace old translator credits",
              "Remove existing translator credit lines and replace them with yours.",
            ],
            [
              "add_credits",
              "Add new translator credits",
              "Insert a new credit subtitle entry with your translator name.",
            ],
            [
              "append_credits_at_end",
              "Append credits at the very end",
              "Place the credit entry after the last subtitle instead of at the beginning.",
            ],
            [
              "matching_case_insensitive",
              "Case-insensitive matching",
              "Matching words will ignore upper/lower case when protecting terms.",
            ],
          ] as const
        ).map(([key, label, description]) => (
          <label
            key={key}
            className="flex items-start gap-2 text-sm text-base-content/80 dark:text-dark-base-content"
          >
            <input
              type="checkbox"
              checked={!!(form as any)[key]}
              onChange={(e) => handleChange(key, e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-base-300 text-primary focus:ring-primary"
            />
            <div>
              <span>{label}</span>
              <p className="text-xs text-base-content/60 dark:text-dark-base-content/50">
                {description}
              </p>
            </div>
          </label>
        ))}
      </div>

      {/* Save */}
      <Button onClick={handleSave} loading={saving} icon={<Save size={16} />}>
        Save Settings
      </Button>
    </div>
  );
}
