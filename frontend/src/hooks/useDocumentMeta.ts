import { useEffect } from "react";

type Meta = {
  title?: string;
  description?: string;
};

const DEFAULT_TITLE =
  "SRT Translator — Free AI Subtitle Translator (OpenAI, Gemini, Claude, DeepSeek)";
const DEFAULT_DESCRIPTION =
  "Free online SRT subtitle translator powered by AI. Translate .srt files with OpenAI GPT-4o, Google Gemini, Anthropic Claude, or DeepSeek across 70+ languages.";

function setMetaDescription(value: string) {
  let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!tag) {
    tag = document.createElement("meta");
    tag.name = "description";
    document.head.appendChild(tag);
  }
  tag.content = value;
}

export function useDocumentMeta({ title, description }: Meta) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) setMetaDescription(description);
    return () => {
      document.title = DEFAULT_TITLE;
      setMetaDescription(DEFAULT_DESCRIPTION);
    };
  }, [title, description]);
}
