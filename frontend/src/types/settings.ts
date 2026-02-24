export interface Settings {
  ai_platform: string;
  api_key: string;
  model: string;
  temperature: number;
  top_p: number;
  src_lang: string;
  tgt_lang: string;
  translator_name: string;
  matching_case_insensitive: boolean;
  replace_credits: boolean;
  add_credits: boolean;
  append_credits_at_end: boolean;
}

export interface MatchingWord {
  source: string;
  target: string;
}

export interface RemovalWord {
  word: string;
}
