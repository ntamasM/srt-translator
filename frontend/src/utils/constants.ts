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
