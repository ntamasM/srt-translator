import React, { useEffect, useState } from "react";
import {
  Globe,
  Zap,
  FileText,
  Languages,
  Clapperboard,
  Settings,
  Upload,
  Play,
  Download,
  ExternalLink,
  Heart,
  Package,
  Database,
  Sparkles,
} from "lucide-react";
import logoIcon from "../../assets/icons/Srt-Translator--icon.svg";
import { configApi } from "../api/configApi";

const features = [
  {
    icon: <FileText size={32} className="text-primary" />,
    title: "SRT File Support",
    description:
      "Upload and translate standard .srt subtitle files while preserving timestamps and formatting.",
  },
  {
    icon: <Languages size={32} className="text-accent" />,
    title: "Multi-Platform AI",
    description:
      "Translate subtitles using OpenAI, Google Gemini, Anthropic Claude, or DeepSeek — choose the platform that works best for you.",
  },
  {
    icon: <Package size={32} className="text-success" />,
    title: "Translation Packages",
    description:
      "Create per-content packages with keywords, matching words, and removal words. The AI uses these keywords to produce contextually accurate translations.",
  },
  {
    icon: <Sparkles size={32} className="text-primary" />,
    title: "Suggestion Packages",
    description:
      "Browse a curated catalog of ready-made translation packages for popular movies and series. Filter by multiple categories at once and import the ones you need with one click.",
  },
  {
    icon: <Zap size={32} className="text-warning" />,
    title: "Batch Processing",
    description:
      "Upload multiple files at once and translate them all in a single run with real-time progress tracking.",
  },
  {
    icon: <Globe size={32} className="text-info" />,
    title: "70+ Languages",
    description:
      "Translate between over 70 languages. Configure source and target languages, AI model, and advanced parameters.",
  },
  {
    icon: <Database size={32} className="text-secondary-content" />,
    title: "Import & Export",
    description:
      "Export and import packages as JSON files. Back up your entire configuration or share packages between devices.",
  },
  {
    icon: <Settings size={32} className="text-secondary" />,
    title: "Smart Word Handling",
    description:
      "Matching words protect terms during translation and replace them in the output. Removal words strip unwanted text before the AI sees it.",
  },
  {
    icon: <Clapperboard size={32} className="text-error" />,
    title: "File Management",
    description: "",  // filled dynamically
  },
];

const steps = [
  {
    icon: <Package size={20} />,
    title: "Create or Import a Package",
    description:
      "Build a translation package for the movie or series you want to translate — title keyword, context tags, matching words, and removal words. Or browse the Suggestions catalog and import a curated package in one click.",
  },
  {
    icon: <Settings size={20} />,
    title: "Configure Settings",
    description:
      "Choose your AI platform and model, set source and target languages, and adjust translation parameters.",
  },
  {
    icon: <Upload size={20} />,
    title: "Upload Subtitles",
    description:
      "Drag & drop or browse to upload one or more .srt subtitle files. Set your package as active.",
  },
  {
    icon: <Play size={20} />,
    title: "Start Translation",
    description:
      "Hit translate and watch real-time progress as each file is processed with your package's context.",
  },
  {
    icon: <Download size={20} />,
    title: "Download Results",
    description:
      "Download translated subtitle files individually or all at once.",
  },
];

const techStack = [
  { icon: "⚛️", text: "React 19 + TypeScript" },
  { icon: "⚡", text: "Vite 7" },
  { icon: "🎨", text: "Tailwind CSS 4" },
  { icon: "🐍", text: "FastAPI (Python)" },
  { icon: "🤖", text: "Multi-AI (OpenAI, Gemini, Claude, DeepSeek)" },
  { icon: "💾", text: "IndexedDB (local storage)" },
];

export default function AboutPage() {
  const [maxAgeDays, setMaxAgeDays] = useState(7);

  useEffect(() => {
    configApi.getConfig().then((cfg) => setMaxAgeDays(cfg.file_max_age_days));
  }, []);

  // Update the File Management description with the dynamic value
  const resolvedFeatures = features.map((f) =>
    f.title === "File Management"
      ? {
          ...f,
          description: `Browse previously translated files, preview results, download individually or in bulk, with automatic cleanup after ${maxAgeDays} days.`,
        }
      : f,
  );

  return (
    <div className="mx-auto max-w-5xl space-y-12">
      {/* Header */}
      <div className="text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <img
            src={logoIcon}
            alt="SRT Translator"
            className="h-10 w-10 rounded-lg"
          />
          <h1 className="text-3xl font-bold text-base-content md:text-4xl dark:text-dark-base-content">
            SRT Translator
          </h1>
        </div>
        <p className="text-lg text-base-content/70 md:text-xl dark:text-dark-base-content/50">
          A modern subtitle translation tool powered by AI
        </p>
      </div>

      {/* How It Works */}
      <section className="rounded-xl border border-base-300 bg-base-100 p-6 md:p-8 dark:border-dark-base-300 dark:bg-dark-base-100">
        <h2 className="mb-6 text-2xl font-bold text-base-content md:text-3xl dark:text-dark-base-content">
          How It Works
        </h2>
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className="mb-1 text-lg font-semibold text-base-content dark:text-dark-base-content">
                  {step.title}
                </h3>
                <p className="text-base-content/70 dark:text-dark-base-content/50">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Key Features */}
      <section>
        <h2 className="mb-6 text-center text-2xl font-bold text-base-content md:text-3xl dark:text-dark-base-content">
          Key Features
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resolvedFeatures.map((feature, index) => (
            <div
              key={index}
              className="rounded-xl border border-base-300 bg-base-100 p-5 transition-shadow hover:shadow-lg dark:border-dark-base-300 dark:bg-dark-base-100"
            >
              <div className="mb-3">{feature.icon}</div>
              <h3 className="mb-2 text-lg font-semibold text-base-content dark:text-dark-base-content">
                {feature.title}
              </h3>
              <p className="text-sm text-base-content/70 dark:text-dark-base-content/50">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="rounded-xl border border-base-300 bg-base-100 p-6 md:p-8 dark:border-dark-base-300 dark:bg-dark-base-100">
        <h2 className="mb-4 text-2xl font-bold text-base-content md:text-3xl dark:text-dark-base-content">
          Tech Stack
        </h2>
        <p className="mb-6 text-base-content/70 dark:text-dark-base-content/50">
          Built with a modern frontend and a Python backend for reliable,
          high-quality translations.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {techStack.map((tech, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-lg bg-base-100 p-4 dark:bg-dark-base-200"
            >
              <span className="text-2xl">{tech.icon}</span>
              <span className="text-base-content/80 dark:text-dark-base-content">
                {tech.text}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Developer & Support */}
      <section className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 animate-pulse bg-linear-to-br from-primary/30 via-error/15 to-warning/20" />
        <div className="absolute inset-0 bg-linear-to-tl from-primary/15 via-transparent to-error/10" />

        <div className="relative rounded-2xl border border-base-300 bg-white p-8 shadow-2xl md:p-12 dark:border-dark-base-300 dark:bg-dark-base-200">
          <div className="mb-8 text-center">
            {/* Avatar */}
            <div className="mb-6 inline-block">
              <div className="mx-auto h-24 w-24 rounded-full bg-linear-to-br from-primary to-neutral p-1 shadow-lg dark:from-dark-primary dark:to-dark-accent">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-base-100 dark:bg-dark-base-100">
                  <span className="text-4xl">👨‍💻</span>
                </div>
              </div>
            </div>

            <h2 className="mb-3 bg-linear-to-r from-primary to-neutral bg-clip-text text-2xl font-bold text-transparent md:text-4xl dark:from-dark-primary dark:to-dark-accent">
              Developer & Support
            </h2>

            <div className="mx-auto max-w-2xl">
              <p className="mb-2 text-sm tracking-wider text-base-content/60 dark:text-dark-base-content/50">
                Developed by:
              </p>
              <h3 className="mb-6 text-xl font-bold text-base-content md:text-3xl dark:text-dark-primary">
                Manolis Ntamadakis
              </h3>
              <p className="text-base leading-relaxed text-base-content/70 md:text-lg dark:text-dark-base-content/50">
                Full-stack developer passionate about building useful tools. If
                you find this project helpful, consider supporting its continued
                development!
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="https://ntamadakis.gr/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative w-full sm:w-auto"
            >
              <div className="absolute -inset-0.5 rounded-lg bg-linear-to-r from-primary to-neutral opacity-40 blur transition duration-300 group-hover:opacity-70" />
              <div className="relative flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 font-semibold text-white shadow-lg transition-transform duration-200 group-hover:scale-105">
                <Globe size={20} />
                Visit Portfolio
                <ExternalLink
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </div>
            </a>

            <a
              href="https://ntamadakis.gr/support-me"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative w-full sm:w-auto"
            >
              <div className="absolute -inset-0.5 rounded-lg bg-linear-to-r from-error/80 to-warning/80 opacity-30 blur transition duration-300 group-hover:opacity-60" />
              <div className="relative flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-error to-warning px-8 py-4 font-semibold text-white shadow-lg transition-transform duration-200 group-hover:scale-105">
                <Heart size={20} className="animate-pulse" />
                Support Me
                <ExternalLink
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </div>
            </a>
          </div>

          <div className="border-t border-base-300 pt-6 text-center dark:border-dark-base-300">
            <p className="animate-pulse bg-linear-to-r from-primary via-accent to-error bg-clip-text text-lg font-medium text-transparent dark:from-dark-primary dark:via-dark-accent dark:to-dark-error">
              Thank you for using SRT Translator! ✨
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
