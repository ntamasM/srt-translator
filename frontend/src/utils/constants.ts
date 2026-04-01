export const API_BASE_URL = "/api";
const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
export const WS_BASE_URL = `${wsProtocol}://${window.location.host}/ws`;

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
