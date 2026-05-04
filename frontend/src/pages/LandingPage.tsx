import React from "react";
import { Link } from "react-router-dom";
import {
  Play,
  Github,
  Globe,
  FileText,
  Languages,
  Package,
  Sparkles,
  Zap,
  Database,
  Settings,
  Clapperboard,
  Upload,
  Download,
  Heart,
  Star,
  ExternalLink,
  Cpu,
} from "lucide-react";
import logoIcon from "../../assets/icons/Srt-Translator--icon.svg";

const steps = [
  {
    icon: <Package size={22} />,
    title: "Create or Import a Package",
    description:
      "Build a translation package for your movie or series — title keyword, context tags, matching words, and removal words. Or browse the Suggestions catalog and import a curated package in one click.",
  },
  {
    icon: <Settings size={22} />,
    title: "Configure Settings",
    description:
      "Choose your AI platform and model, set source and target languages, and adjust translation parameters.",
  },
  {
    icon: <Upload size={22} />,
    title: "Upload Subtitles",
    description:
      "Drag & drop or browse to upload one or more .srt subtitle files and select your package.",
  },
  {
    icon: <Play size={22} />,
    title: "Start Translation",
    description:
      "Hit translate and watch real-time progress as each file is processed with your package's context.",
  },
  {
    icon: <Download size={22} />,
    title: "Download Results",
    description:
      "Download translated subtitle files individually or all at once.",
  },
];

const features = [
  {
    icon: <FileText size={28} className="text-primary dark:text-dark-primary" />,
    title: "SRT File Support",
    description:
      "Upload and translate standard .srt subtitle files while preserving timestamps and formatting.",
  },
  {
    icon: <Languages size={28} className="text-accent dark:text-dark-accent" />,
    title: "Multi-Platform AI",
    description:
      "Translate using OpenAI, Google Gemini, Anthropic Claude, or DeepSeek — choose the platform that works best for you.",
  },
  {
    icon: <Package size={28} className="text-success dark:text-dark-success" />,
    title: "Translation Packages",
    description:
      "Create per-content packages with keywords, matching words, and removal words for contextually accurate translations.",
  },
  {
    icon: <Sparkles size={28} className="text-primary dark:text-dark-primary" />,
    title: "Suggestion Packages",
    description:
      "Browse a curated catalog of ready-made translation packages for popular movies and series. Import with one click.",
  },
  {
    icon: <Zap size={28} className="text-warning dark:text-dark-warning" />,
    title: "Batch Processing",
    description:
      "Upload multiple files at once and translate them all in a single run with real-time progress tracking.",
  },
  {
    icon: <Globe size={28} className="text-info dark:text-dark-info" />,
    title: "70+ Languages",
    description:
      "Translate between over 70 languages. Configure source and target languages, AI model, and advanced parameters.",
  },
  {
    icon: <Database size={28} className="text-secondary-content dark:text-dark-base-content" />,
    title: "Import & Export",
    description:
      "Export and import packages as JSON files. Back up your entire configuration or share packages between devices.",
  },
  {
    icon: <Settings size={28} className="text-secondary dark:text-dark-secondary" />,
    title: "Smart Word Handling",
    description:
      "Matching words protect terms during translation. Removal words strip unwanted text before the AI sees it.",
  },
  {
    icon: <Clapperboard size={28} className="text-error dark:text-dark-error" />,
    title: "File Management",
    description:
      "Browse previously translated files, preview results, and download individually or in bulk.",
  },
];

const aiPlatforms = [
  {
    name: "OpenAI",
    models: "GPT-4o, GPT-4o mini",
    color: "text-success dark:text-dark-success",
    border: "border-success/20 dark:border-dark-success/20",
    bg: "bg-success/5 dark:bg-dark-success/5",
  },
  {
    name: "Google Gemini",
    models: "Gemini 1.5, 2.0 Flash",
    color: "text-info dark:text-dark-info",
    border: "border-info/20 dark:border-dark-info/20",
    bg: "bg-info/5 dark:bg-dark-info/5",
  },
  {
    name: "Anthropic Claude",
    models: "Claude 3.5, Haiku",
    color: "text-warning dark:text-dark-warning",
    border: "border-warning/20 dark:border-dark-warning/20",
    bg: "bg-warning/5 dark:bg-dark-warning/5",
  },
  {
    name: "DeepSeek",
    models: "DeepSeek V3, R1",
    color: "text-accent dark:text-dark-accent",
    border: "border-accent/20 dark:border-dark-accent/20",
    bg: "bg-accent/5 dark:bg-dark-accent/5",
  },
];

const stats = [
  { label: "70+ Languages" },
  { label: "4 AI Platforms" },
  { label: "Batch Processing" },
  { label: "Free & Open Source" },
];

const mockSrt = `1
00:00:01,000 --> 00:00:03,500
Previously on our series...

2
00:00:04,200 --> 00:00:07,800
The mission begins at dawn.
Stay close and follow my lead.

3
00:00:08,500 --> 00:00:11,000
← Translated instantly with AI →`;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-base-100 dark:bg-dark-base-100">
      {/* Sticky navbar */}
      <header className="sticky top-0 z-50 border-b border-base-300 bg-base-100/95 backdrop-blur dark:border-dark-base-300 dark:bg-dark-base-100/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoIcon} alt="SRT Translator" className="h-7 w-7 rounded" />
            <span className="text-lg font-bold text-base-content dark:text-dark-base-content">
              SRT Translator
            </span>
          </Link>
          <Link
            to="/translate"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:bg-dark-primary"
          >
            <Play size={15} />
            Open App
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex min-h-[85vh] flex-col items-center justify-center px-6 py-20 text-center">
        <span className="mb-4 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary dark:bg-dark-primary/20 dark:text-dark-primary">
          Free &amp; Open Source
        </span>

        <h1 className="mb-6 max-w-3xl text-5xl font-black leading-tight text-base-content md:text-7xl dark:text-dark-base-content">
          Translate{" "}
          <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent dark:from-dark-primary dark:to-dark-accent">
            Subtitles
          </span>{" "}
          with AI
        </h1>

        <p className="mb-10 max-w-xl text-lg text-base-content/70 md:text-xl dark:text-dark-base-content/60">
          Upload .srt files, choose an AI provider, and download your translated
          subtitles — in seconds, with full contextual accuracy.
        </p>

        <div className="mb-14 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/translate"
            className="flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-base font-semibold text-white shadow-lg transition-opacity hover:opacity-90 dark:bg-dark-primary"
          >
            <Play size={18} />
            Start Translating
          </Link>
          <a
            href="https://github.com/ntamasM/srt-translator"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-7 py-3.5 text-base font-semibold text-base-content transition-colors hover:border-primary/40 dark:border-dark-base-300 dark:bg-dark-base-200 dark:text-dark-base-content dark:hover:border-dark-primary/40"
          >
            <Github size={18} />
            View on GitHub
          </a>
        </div>

        {/* Mock SRT preview */}
        <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-base-300 shadow-xl dark:border-dark-base-300">
          <div className="flex items-center gap-1.5 border-b border-base-300 bg-base-200 px-4 py-2.5 dark:border-dark-base-300 dark:bg-dark-base-200">
            <span className="h-3 w-3 rounded-full bg-error/60" />
            <span className="h-3 w-3 rounded-full bg-warning/60" />
            <span className="h-3 w-3 rounded-full bg-success/60" />
            <span className="ml-2 text-xs font-medium text-base-content/50 dark:text-dark-base-content/40">
              episode-01.srt
            </span>
          </div>
          <pre className="bg-base-100 p-5 text-left font-mono text-xs leading-relaxed text-base-content/80 dark:bg-dark-base-100 dark:text-dark-base-content/70">
            {mockSrt}
          </pre>
        </div>
      </section>

      {/* Stats bar */}
      <div className="border-y border-base-300 bg-base-200/60 py-5 dark:border-dark-base-300 dark:bg-dark-base-200/40">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-3 px-6">
          {stats.map((s) => (
            <span
              key={s.label}
              className="rounded-full bg-base-100 px-5 py-2 text-sm font-medium text-base-content shadow-sm dark:bg-dark-base-100 dark:text-dark-base-content"
            >
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary dark:text-dark-primary">
            Simple workflow
          </p>
          <h2 className="text-3xl font-bold text-base-content md:text-4xl dark:text-dark-base-content">
            How It Works
          </h2>
        </div>

        <div className="space-y-6">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-5 rounded-2xl border border-base-300 bg-base-100 p-6 dark:border-dark-base-300 dark:bg-dark-base-100"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white dark:bg-dark-primary">
                {i + 1}
              </div>
              <div>
                <h3 className="mb-1 flex items-center gap-2 text-base font-semibold text-base-content dark:text-dark-base-content">
                  <span className="text-primary dark:text-dark-primary">{step.icon}</span>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-base-content/70 dark:text-dark-base-content/50">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-base-200/50 py-20 dark:bg-dark-base-200/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary dark:text-dark-primary">
              9 features built in
            </p>
            <h2 className="text-3xl font-bold text-base-content md:text-4xl dark:text-dark-base-content">
              Everything You Need
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl border border-base-300 bg-base-100 p-6 transition-all hover:border-primary/30 hover:shadow-md dark:border-dark-base-300 dark:bg-dark-base-100 dark:hover:border-dark-primary/30"
              >
                <div className="mb-3">{f.icon}</div>
                <h3 className="mb-2 text-base font-semibold text-base-content dark:text-dark-base-content">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-base-content/70 dark:text-dark-base-content/50">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Platforms */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary dark:text-dark-primary">
            Your choice of AI
          </p>
          <h2 className="mb-3 text-3xl font-bold text-base-content md:text-4xl dark:text-dark-base-content">
            Choose Your AI Provider
          </h2>
          <p className="text-base-content/60 dark:text-dark-base-content/50">
            Use the model you already have an API key for.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {aiPlatforms.map((p) => (
            <div
              key={p.name}
              className={`rounded-xl border p-5 ${p.border} ${p.bg}`}
            >
              <Cpu size={24} className={`mb-3 ${p.color}`} />
              <h3 className={`mb-1 text-base font-bold ${p.color}`}>{p.name}</h3>
              <p className="text-xs text-base-content/60 dark:text-dark-base-content/50">
                {p.models}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-3xl rounded-2xl bg-base-200 p-12 text-center dark:bg-dark-base-200">
          <h2 className="mb-3 text-3xl font-bold text-base-content md:text-4xl dark:text-dark-base-content">
            Ready to translate your subtitles?
          </h2>
          <p className="mb-8 text-base-content/60 dark:text-dark-base-content/50">
            Free to use. No account required. Bring your own API key.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/translate"
              className="flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-base font-semibold text-white shadow-lg transition-opacity hover:opacity-90 dark:bg-dark-primary"
            >
              <Play size={18} />
              Open Translator
            </Link>
            <a
              href="https://github.com/ntamasM/srt-translator"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-7 py-3.5 text-base font-semibold text-base-content transition-colors hover:border-primary/40 dark:border-dark-base-300 dark:bg-dark-base-100 dark:text-dark-base-content"
            >
              <Star size={18} className="fill-warning text-warning dark:fill-dark-warning dark:text-dark-warning" />
              Star on GitHub
            </a>
            <a
              href="https://ntamadakis.gr/support-me"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-error/30 bg-error/5 px-7 py-3.5 text-base font-semibold text-error transition-colors hover:bg-error/10 dark:border-dark-error/30 dark:bg-dark-error/5 dark:text-dark-error dark:hover:bg-dark-error/10"
            >
              <Heart size={18} />
              Support Me
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-base-300 dark:border-dark-base-300">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoIcon} alt="SRT Translator" className="h-6 w-6 rounded" />
              <span className="text-sm font-bold text-base-content dark:text-dark-base-content">
                SRT Translator
              </span>
            </Link>
            <div className="flex items-center gap-5 text-sm text-base-content/60 dark:text-dark-base-content/50">
              <a
                href="https://github.com/ntamasM/srt-translator"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-base-content dark:hover:text-dark-base-content"
              >
                <Github size={14} />
                GitHub
              </a>
              <a
                href="https://ntamadakis.gr/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-base-content dark:hover:text-dark-base-content"
              >
                <ExternalLink size={14} />
                Portfolio
              </a>
              <a
                href="https://ntamadakis.gr/support-me"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-base-content dark:hover:text-dark-base-content"
              >
                <Heart size={14} />
                Support
              </a>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-base-content/40 dark:text-dark-base-content/30">
            Developed with{" "}
            <Heart size={11} className="inline text-error dark:text-dark-error" />{" "}
            by{" "}
            <a
              href="https://ntamadakis.gr/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Manolis Ntamadakis
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
