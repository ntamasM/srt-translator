export const API_BASE_URL = "/api";
const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
export const WS_BASE_URL = `${wsProtocol}://${window.location.host}/ws`;

export const LANGUAGES = [
  { value: "af", label: "Afrikaans" },
  { value: "sq", label: "Albanian" },
  { value: "am", label: "Amharic" },
  { value: "ar", label: "Arabic" },
  { value: "hy", label: "Armenian" },
  { value: "az", label: "Azerbaijani" },
  { value: "eu", label: "Basque" },
  { value: "be", label: "Belarusian" },
  { value: "bn", label: "Bengali" },
  { value: "bs", label: "Bosnian" },
  { value: "bg", label: "Bulgarian" },
  { value: "ca", label: "Catalan" },
  { value: "zh", label: "Chinese" },
  { value: "hr", label: "Croatian" },
  { value: "cs", label: "Czech" },
  { value: "da", label: "Danish" },
  { value: "nl", label: "Dutch" },
  { value: "en", label: "English" },
  { value: "et", label: "Estonian" },
  { value: "fi", label: "Finnish" },
  { value: "fr", label: "French" },
  { value: "ka", label: "Georgian" },
  { value: "de", label: "German" },
  { value: "el", label: "Greek" },
  { value: "gu", label: "Gujarati" },
  { value: "he", label: "Hebrew" },
  { value: "hi", label: "Hindi" },
  { value: "hu", label: "Hungarian" },
  { value: "is", label: "Icelandic" },
  { value: "id", label: "Indonesian" },
  { value: "it", label: "Italian" },
  { value: "ja", label: "Japanese" },
  { value: "kn", label: "Kannada" },
  { value: "kk", label: "Kazakh" },
  { value: "ko", label: "Korean" },
  { value: "lv", label: "Latvian" },
  { value: "lt", label: "Lithuanian" },
  { value: "mk", label: "Macedonian" },
  { value: "ms", label: "Malay" },
  { value: "ml", label: "Malayalam" },
  { value: "mr", label: "Marathi" },
  { value: "mn", label: "Mongolian" },
  { value: "ne", label: "Nepali" },
  { value: "no", label: "Norwegian" },
  { value: "fa", label: "Persian" },
  { value: "pl", label: "Polish" },
  { value: "pt", label: "Portuguese" },
  { value: "pa", label: "Punjabi" },
  { value: "ro", label: "Romanian" },
  { value: "ru", label: "Russian" },
  { value: "sr", label: "Serbian" },
  { value: "si", label: "Sinhala" },
  { value: "sk", label: "Slovak" },
  { value: "sl", label: "Slovenian" },
  { value: "es", label: "Spanish" },
  { value: "sw", label: "Swahili" },
  { value: "sv", label: "Swedish" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "th", label: "Thai" },
  { value: "tr", label: "Turkish" },
  { value: "uk", label: "Ukrainian" },
  { value: "ur", label: "Urdu" },
  { value: "uz", label: "Uzbek" },
  { value: "vi", label: "Vietnamese" },
] as const;

export const AI_PLATFORMS = [
  { value: "openai", label: "OpenAI" },
  { value: "gemini", label: "Google Cloud AI API" },
  { value: "claude", label: "Anthropic Claude" },
  { value: "deepseek", label: "DeepSeek" },
] as const;

export const DEFAULT_MODELS: Record<string, string> = {
  openai: "gpt-4o-mini",
  gemini: "gemini-2.0-flash",
  claude: "claude-sonnet-4-20250514",
  deepseek: "deepseek-chat",
};

export type PlatformParam =
  | "temperature"
  | "top_p"
  | "top_k"
  | "frequency_penalty"
  | "presence_penalty";

export interface ParamConfig {
  label: string;
  field: PlatformParam;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  hint: string;
}

const TEMPERATURE = (max: number): ParamConfig => ({
  label: "Temperature",
  field: "temperature",
  min: 0,
  max,
  step: 0.1,
  defaultValue: 0.2,
  hint: "Controls randomness. Lower values (0.1\u20130.3) produce more consistent translations; higher values add variety.",
});

const TOP_P: ParamConfig = {
  label: "Top-P",
  field: "top_p",
  min: 0,
  max: 1,
  step: 0.05,
  defaultValue: 0.1,
  hint: "Nucleus sampling threshold. Lower values make output more focused and deterministic.",
};

const TOP_K: ParamConfig = {
  label: "Top-K",
  field: "top_k",
  min: 1,
  max: 100,
  step: 1,
  defaultValue: 40,
  hint: "Limits sampling to the top K most likely tokens. Lower values make output more focused.",
};

const FREQUENCY_PENALTY: ParamConfig = {
  label: "Frequency Penalty",
  field: "frequency_penalty",
  min: -2,
  max: 2,
  step: 0.1,
  defaultValue: 0,
  hint: "Penalizes tokens based on how often they appear. Positive values reduce repetition.",
};

const PRESENCE_PENALTY: ParamConfig = {
  label: "Presence Penalty",
  field: "presence_penalty",
  min: -2,
  max: 2,
  step: 0.1,
  defaultValue: 0,
  hint: "Penalizes tokens that have already appeared. Positive values encourage topic diversity.",
};

export const PLATFORM_PARAMS: Record<string, ParamConfig[]> = {
  openai: [TEMPERATURE(2), TOP_P, FREQUENCY_PENALTY, PRESENCE_PENALTY],
  gemini: [TEMPERATURE(2), TOP_P, TOP_K, FREQUENCY_PENALTY, PRESENCE_PENALTY],
  claude: [TEMPERATURE(1), TOP_P, TOP_K],
  deepseek: [TEMPERATURE(2), TOP_P, FREQUENCY_PENALTY, PRESENCE_PENALTY],
};
