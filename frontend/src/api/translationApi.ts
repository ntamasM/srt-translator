import { post } from "./client";
import { WS_BASE_URL } from "../utils/constants";
import type {
  TranslationResult,
  TranslationProgress,
} from "../types/translation";
import type { MatchingWord, Settings } from "../types/settings";

export const translationApi = {
  startTranslation: (
    files: string[],
    settings: Settings,
    matchingWords: MatchingWord[] = [],
    removalWords: string[] = [],
  ) =>
    post<TranslationResult>("/translate", {
      files,
      settings: {
        ai_platform: settings.ai_platform,
        api_key: settings.api_key,
        model: settings.model,
        temperature: settings.temperature,
        top_p: settings.top_p,
        src_lang: settings.src_lang,
        tgt_lang: settings.tgt_lang,
        translator_name: settings.translator_name,
        matching_case_insensitive: settings.matching_case_insensitive,
        replace_credits: settings.replace_credits,
        add_credits: settings.add_credits,
        append_credits_at_end: settings.append_credits_at_end,
      },
      matching_words: matchingWords.map((w) => ({
        source: w.source,
        target: w.target,
      })),
      removal_words: removalWords,
    }),

  cancelTranslation: (jobId: string) =>
    post<{ status: string; message: string }>(`/translate/${jobId}/cancel`, {}),

  createProgressWebSocket: (
    jobId: string,
    callbacks: {
      onProgress: (data: TranslationProgress) => void;
      onClose?: () => void;
      onError?: (err: Event) => void;
    },
  ): WebSocket => {
    const ws = new WebSocket(`${WS_BASE_URL}/translate/${jobId}`);

    ws.onmessage = (event) => {
      try {
        const data: TranslationProgress = JSON.parse(event.data);
        callbacks.onProgress(data);
      } catch {}
    };

    ws.onclose = () => callbacks.onClose?.();
    ws.onerror = (err) => callbacks.onError?.(err);

    return ws;
  },
};
