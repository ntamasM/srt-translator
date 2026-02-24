export const API_BASE_URL = "/api";
const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
export const WS_BASE_URL = `${wsProtocol}://${window.location.host}/ws`;

export const AI_PLATFORMS = [
  { value: "openai", label: "OpenAI" },
  { value: "gemini", label: "Google Gemini" },
  { value: "claude", label: "Anthropic Claude" },
] as const;

export const DEFAULT_MODELS: Record<string, string> = {
  openai: "gpt-4o-mini",
  gemini: "gemini-pro",
  claude: "claude-sonnet-4-20250514",
};
