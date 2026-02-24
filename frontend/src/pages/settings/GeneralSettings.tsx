import React, { useState, useEffect } from "react";
import { Save, Eye, EyeOff } from "lucide-react";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import SelectField from "../../components/SelectField";
import { useSettings } from "../../hooks/useSettings";
import { useToast } from "../../components/Toast";
import { AI_PLATFORMS, DEFAULT_MODELS } from "../../utils/constants";
import type { Settings } from "../../types/settings";

export default function GeneralSettings() {
  const { settings, isLoading, updateSettings } = useSettings();
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
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Loading settings…
      </p>
    );
  }

  return (
    <div className="space-y-6">
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
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          API Key
        </label>
        <div className="flex gap-2">
          <input
            type={showKey ? "text" : "password"}
            value={form.api_key || ""}
            onChange={(e) => handleChange("api_key", e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            placeholder="sk-..."
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
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
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Controls randomness. Lower values (0.1–0.3) produce more consistent
            translations; higher values add variety.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
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
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
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
            className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
          >
            <input
              type="checkbox"
              checked={!!(form as any)[key]}
              onChange={(e) => handleChange(key, e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span>{label}</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
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
