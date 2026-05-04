export type Theme = "light" | "dark" | "system";

export type DateFormat = "system" | "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";

export interface Settings {
  ai_platform: string;
  api_key: string;
  model: string;
  temperature: number;
  top_p: number;
  top_k: number;
  frequency_penalty: number;
  presence_penalty: number;
  src_lang: string;
  tgt_lang: string;
  translator_name: string;
  matching_case_insensitive: boolean;
  replace_credits: boolean;
  add_credits: boolean;
  append_credits_at_end: boolean;
  theme: Theme;
  date_format: DateFormat;
  defaultPackageId: string | null;
}

export interface MatchingWord {
  source: string;
  target: string;
}

export interface RemovalWord {
  word: string;
}

export interface TranslationPackage {
  id: string;
  name: string;
  titleKeyword: string;
  keywords: string[];
  matchingWords: MatchingWord[];
  removalWords: string[];
  createdAt: number;
  updatedAt: number;
}

export interface SuggestionPackage {
  filename: string;
  name: string;
  categories: string[];
  titleKeyword: string;
  keywords: string[];
  matchingWords: MatchingWord[];
  removalWords: string[];
}
