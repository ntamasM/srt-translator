import React from "react";
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
} from "lucide-react";

const features = [
  {
    icon: <FileText size={32} className="text-blue-500" />,
    title: "SRT File Support",
    description:
      "Upload and translate standard .srt subtitle files while preserving timestamps and formatting.",
  },
  {
    icon: <Languages size={32} className="text-emerald-500" />,
    title: "Multi-Language Translation",
    description:
      "Translate subtitles between many languages powered by OpenAI's language models.",
  },
  {
    icon: <Zap size={32} className="text-amber-500" />,
    title: "Batch Processing",
    description:
      "Upload multiple files at once and translate them all in a single run with real-time progress tracking.",
  },
  {
    icon: <Settings size={32} className="text-violet-500" />,
    title: "Word Matching & Removal",
    description:
      "Configure custom word matching rules and removal lists to fine-tune your translations.",
  },
  {
    icon: <Globe size={32} className="text-cyan-500" />,
    title: "Configurable Settings",
    description:
      "Customize source & target languages, model selection, and advanced translation parameters.",
  },
  {
    icon: <Clapperboard size={32} className="text-rose-500" />,
    title: "File Management",
    description:
      "Browse previously translated files, download results, and manage your subtitle library.",
  },
];

const steps = [
  {
    icon: <Settings size={20} />,
    title: "Configure Settings",
    description:
      "Set your source and target languages, choose an OpenAI model, and adjust translation options.",
  },
  {
    icon: <Upload size={20} />,
    title: "Upload Subtitles",
    description:
      "Drag & drop or browse to upload one or more .srt subtitle files.",
  },
  {
    icon: <Play size={20} />,
    title: "Start Translation",
    description:
      "Hit translate and watch real-time progress as each file is processed.",
  },
  {
    icon: <Download size={20} />,
    title: "Download Results",
    description:
      "Download translated subtitle files individually or all at once as a zip archive.",
  },
];

const techStack = [
  { icon: "⚛️", text: "React 19 + TypeScript" },
  { icon: "⚡", text: "Vite 7" },
  { icon: "🎨", text: "Tailwind CSS 4" },
  { icon: "🐍", text: "FastAPI (Python)" },
  { icon: "🤖", text: "OpenAI API" },
  { icon: "💾", text: "IndexedDB (local settings)" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12">
      {/* Header */}
      <div className="text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <Clapperboard size={40} className="text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">
            SRT Translator
          </h1>
        </div>
        <p className="text-lg text-gray-600 md:text-xl dark:text-gray-400">
          A modern subtitle translation tool powered by OpenAI
        </p>
      </div>

      {/* How It Works */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 md:p-8 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">
          How It Works
        </h2>
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Key Features */}
      <section>
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">
          Key Features
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="mb-3">{feature.icon}</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 md:p-8 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">
          Tech Stack
        </h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Built with a modern frontend and a Python backend for reliable,
          high-quality translations.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {techStack.map((tech, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
            >
              <span className="text-2xl">{tech.icon}</span>
              <span className="text-gray-700 dark:text-gray-300">
                {tech.text}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Developer & Support */}
      <section className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 animate-pulse bg-linear-to-br from-blue-500/20 via-violet-500/20 to-rose-500/20" />
        <div className="absolute inset-0 bg-linear-to-tl from-blue-500/10 via-transparent to-violet-500/10" />

        <div className="relative rounded-2xl border border-blue-500/20 bg-white/80 p-8 shadow-2xl backdrop-blur-sm md:p-12 dark:bg-gray-900/80">
          <div className="mb-8 text-center">
            {/* Avatar */}
            <div className="mb-6 inline-block">
              <div className="mx-auto h-24 w-24 rounded-full bg-linear-to-br from-blue-600 to-violet-600 p-1 shadow-lg">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-gray-900">
                  <span className="text-4xl">👨‍💻</span>
                </div>
              </div>
            </div>

            <h2 className="mb-3 bg-linear-to-r from-blue-600 to-violet-600 bg-clip-text text-2xl font-bold text-transparent md:text-4xl">
              Developer & Support
            </h2>

            <div className="mx-auto max-w-2xl">
              <p className="mb-2 text-sm tracking-wider text-gray-500 dark:text-gray-500">
                Developed by:
              </p>
              <h3 className="mb-6 text-xl font-bold text-blue-600 md:text-3xl">
                Manolis Ntamadakis
              </h3>
              <p className="text-base leading-relaxed text-gray-600 md:text-lg dark:text-gray-400">
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
              <div className="absolute -inset-0.5 rounded-lg bg-linear-to-r from-blue-600 to-blue-400 opacity-30 blur transition duration-300 group-hover:opacity-60" />
              <div className="relative flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 py-4 font-semibold text-white shadow-lg transition-transform duration-200 group-hover:scale-105">
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
              <div className="absolute -inset-0.5 rounded-lg bg-linear-to-r from-violet-500 to-rose-500 opacity-30 blur transition duration-300 group-hover:opacity-60" />
              <div className="relative flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-violet-500 to-rose-500 px-8 py-4 font-semibold text-white shadow-lg transition-transform duration-200 group-hover:scale-105">
                <Heart size={20} className="animate-pulse" />
                Support Me
                <ExternalLink
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </div>
            </a>
          </div>

          <div className="border-t border-gray-200 pt-6 text-center dark:border-gray-700">
            <p className="animate-pulse bg-linear-to-r from-blue-600 via-violet-600 to-rose-500 bg-clip-text text-lg font-medium text-transparent">
              Thank you for using SRT Translator! ✨
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
