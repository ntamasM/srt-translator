# SEO Improvement Plan — SRT Translator

**Target executor:** Claude Haiku (must follow every step literally, in order, with no creative interpretation)
**Project root:** `C:\Users\Ntamas\Desktop\Personal\srt-translator`
**Frontend root:** `C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend`
**Production URL:** `https://srt-translator.nt-sites.gr/`

## Scope & Goals

Improve search-engine discoverability for **all routes** in the SPA, with strongest focus on the **Landing Page (`/`)** since it is the public marketing surface. Outputs must be ready for submission to **Google Search Console** (sitemap + verified robots.txt).

Routes that exist (see `frontend/src/App.tsx`):
- `/` → LandingPage (PUBLIC — primary SEO target)
- `/translate` → TranslatePage
- `/files` → OldFilesPage
- `/packages` → PackagesPage
- `/packages/:packageId` → PackageDetailPage (dynamic — exclude from sitemap)
- `/suggestion-packages` → SuggestionPackagesPage
- `/settings/general` → GeneralSettings
- `/settings/data` → ManageData

## Hard Rules for the Executor

1. **Do NOT delete or rename existing files** unless this plan explicitly tells you to.
2. **Do NOT change application logic** (no edits to `.tsx` files outside what is listed in Step 7).
3. **Do NOT install npm dependencies** unless Step 7 is being executed and the user has approved it.
4. **Paths are Windows absolute paths** — keep them exactly as written.
5. **Production URL is always `https://srt-translator.nt-sites.gr/`** — never invent another domain.
6. **All new files must use UTF-8 with LF line endings** (do not produce BOM).
7. After each step, **verify the file exists and contains the expected content** before moving on.
8. If a step's "Verify" check fails, **stop and report** — do not attempt to fix by guessing.

---

## Inventory of Existing Assets

These already exist and will be re-used (do not regenerate them):

| Path | Purpose |
| --- | --- |
| `frontend/public/og-image.png` | Current OG image (logo only, 256×256 — kept as fallback) |
| `frontend/assets/icons/Srt-Translator--icon.svg` | Primary favicon (SVG) |
| `frontend/assets/icons/Srt-Translator--icon.png` | PNG icon |
| `frontend/assets/Media/Srt-Translator-Proccess-Image.png` | Screenshot of translation process |
| `frontend/assets/Media/Srt-Translator-Settings-Image.png` | Screenshot of settings page |
| `frontend/index.html` | Already has basic SEO tags (will be expanded in Step 1) |

---

## Step 1 — Replace `frontend/index.html` (Landing Page meta tags)

**Action:** Overwrite the file `C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\index.html` with **exactly** the content in the block below. No deviations.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#2f7d6b" />

    <!-- Icons & manifest -->
    <link rel="icon" type="image/svg+xml" href="/assets/icons/Srt-Translator--icon.svg" />
    <link rel="alternate icon" type="image/png" href="/assets/icons/Srt-Translator--icon.png" />
    <link rel="apple-touch-icon" href="/assets/icons/Srt-Translator--icon.png" />
    <link rel="manifest" href="/site.webmanifest" />

    <!-- Primary SEO -->
    <title>SRT Translator — Free AI Subtitle Translator (OpenAI, Gemini, Claude, DeepSeek)</title>
    <meta name="description" content="Free online SRT subtitle translator powered by AI. Translate .srt files with OpenAI GPT-4o, Google Gemini, Anthropic Claude, or DeepSeek across 70+ languages. Batch processing, contextual translation packages for movies and TV series, no signup required." />
    <meta name="keywords" content="srt translator, subtitle translator, ai subtitle translator, translate srt online, srt to greek, srt to english, openai subtitle translation, gemini subtitle translator, claude subtitle translator, deepseek subtitle translator, free srt translator, batch subtitle translation, movie subtitle translator, tv series subtitles" />
    <meta name="author" content="Manolis Ntamadakis" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
    <meta name="googlebot" content="index, follow" />
    <link rel="canonical" href="https://srt-translator.nt-sites.gr/" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://srt-translator.nt-sites.gr/" />
    <meta property="og:title" content="SRT Translator — Free AI Subtitle Translator" />
    <meta property="og:description" content="Translate .srt subtitle files with OpenAI, Gemini, Claude, or DeepSeek. 70+ languages, batch processing, contextual translation packages for movies and series. Free & open source." />
    <meta property="og:image" content="https://srt-translator.nt-sites.gr/og-cover.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="SRT Translator — AI-powered subtitle translation interface" />
    <meta property="og:site_name" content="SRT Translator" />
    <meta property="og:locale" content="en_US" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="SRT Translator — Free AI Subtitle Translator" />
    <meta name="twitter:description" content="Translate .srt subtitle files with OpenAI, Gemini, Claude, or DeepSeek. 70+ languages, batch processing, contextual packages. Free & open source." />
    <meta name="twitter:image" content="https://srt-translator.nt-sites.gr/og-cover.png" />
    <meta name="twitter:image:alt" content="SRT Translator — AI-powered subtitle translation interface" />

    <!-- Structured Data: SoftwareApplication -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "SRT Translator",
      "alternateName": "AI SRT Subtitle Translator",
      "applicationCategory": "MultimediaApplication",
      "applicationSubCategory": "Subtitle Translation",
      "operatingSystem": "Web",
      "description": "Free AI-powered SRT subtitle translation tool supporting OpenAI GPT-4o, Google Gemini, Anthropic Claude, and DeepSeek. Batch processing, 70+ languages, contextual translation packages for movies and TV series.",
      "url": "https://srt-translator.nt-sites.gr/",
      "image": "https://srt-translator.nt-sites.gr/og-cover.png",
      "screenshot": [
        "https://srt-translator.nt-sites.gr/screenshots/translate-process.png",
        "https://srt-translator.nt-sites.gr/screenshots/settings.png"
      ],
      "featureList": [
        "Translate .srt subtitle files with AI",
        "Supports OpenAI, Google Gemini, Anthropic Claude, DeepSeek",
        "70+ source and target languages",
        "Batch processing of multiple files",
        "Contextual translation packages for movies and series",
        "Matching words and removal words for accurate translations",
        "Import and export packages as JSON",
        "Browse curated suggestion packages",
        "Real-time translation progress tracking"
      ],
      "author": {
        "@type": "Person",
        "name": "Manolis Ntamadakis",
        "url": "https://ntamadakis.gr/"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5",
        "bestRating": "5",
        "ratingCount": "1"
      },
      "codeRepository": "https://github.com/ntamasM/srt-translator",
      "license": "https://github.com/ntamasM/srt-translator/blob/main/LICENSE"
    }
    </script>

    <!-- Structured Data: WebSite (enables sitelinks search box) -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "SRT Translator",
      "url": "https://srt-translator.nt-sites.gr/",
      "description": "Free AI-powered SRT subtitle translation tool.",
      "publisher": {
        "@type": "Person",
        "name": "Manolis Ntamadakis",
        "url": "https://ntamadakis.gr/"
      },
      "inLanguage": "en"
    }
    </script>

    <!-- Structured Data: FAQPage -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Is SRT Translator free to use?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. SRT Translator is completely free and open source. You bring your own API key for the AI provider of your choice (OpenAI, Google Gemini, Anthropic Claude, or DeepSeek)."
          }
        },
        {
          "@type": "Question",
          "name": "Which AI providers does SRT Translator support?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "SRT Translator supports OpenAI (GPT-4o, GPT-4o mini), Google Gemini (1.5, 2.0 Flash), Anthropic Claude (3.5, Haiku), and DeepSeek (V3, R1)."
          }
        },
        {
          "@type": "Question",
          "name": "How many languages are supported?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "More than 70 source and target languages are supported, including English, Greek, Spanish, French, German, Italian, Portuguese, Japanese, Korean, Chinese, and many more."
          }
        },
        {
          "@type": "Question",
          "name": "Can I translate multiple subtitle files at once?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. SRT Translator supports batch processing — drag and drop multiple .srt files and translate them all in a single run with real-time progress tracking."
          }
        },
        {
          "@type": "Question",
          "name": "What is a translation package?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "A translation package is a per-content profile that gives the AI extra context: a title keyword, context tags, matching words (protected during translation), and removal words (stripped before translation). Packages dramatically improve accuracy for movies and TV series."
          }
        },
        {
          "@type": "Question",
          "name": "Is my API key stored on a server?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. Your API key is stored only in your browser's local storage. It is never sent to any server other than the AI provider you have selected."
          }
        }
      ]
    }
    </script>

    <script
      defer
      src="https://analytics.ntamadakis.gr/app-metrics"
      data-website-id="a4372929-c48d-4c52-809e-e03c24589a25"
    ></script>
  </head>
  <body>
    <div id="root"></div>
    <noscript>
      <div style="max-width:640px;margin:40px auto;padding:24px;font-family:system-ui,sans-serif;line-height:1.6;color:#333;">
        <h1>SRT Translator — AI Subtitle Translator</h1>
        <p>
          SRT Translator is a free, open-source web tool that translates
          <code>.srt</code> subtitle files using leading AI providers including
          OpenAI GPT-4o, Google Gemini, Anthropic Claude, and DeepSeek. It supports
          70+ languages, batch processing, and contextual translation packages
          tuned for movies and TV series.
        </p>
        <p>JavaScript is required to use the app. Please enable JavaScript in your browser.</p>
        <p>
          <a href="https://github.com/ntamasM/srt-translator">View source on GitHub</a>
        </p>
      </div>
    </noscript>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Verify:**
- File size ≥ 7 KB.
- File starts with `<!doctype html>` and ends with `</html>`.
- The string `og-cover.png` appears at least 3 times.

---

## Step 2 — Create `frontend/public/robots.txt`

**Action:** Create the file `C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\public\robots.txt` with **exactly** this content:

```
User-agent: *
Allow: /
Disallow: /settings
Disallow: /settings/
Disallow: /files
Disallow: /packages/

Sitemap: https://srt-translator.nt-sites.gr/sitemap.xml
```

**Why these Disallows:**
- `/settings` and `/files` are personal user data views — no SEO value, do not index.
- `/packages/` (with trailing slash) blocks the dynamic `:packageId` detail routes; the static `/packages` index is still allowed because it does not match the disallow with the trailing slash.

**Verify:**
- The file is exactly 7 non-empty lines (plus a trailing newline).
- The `Sitemap:` line points to the production domain.

---

## Step 3 — Create `frontend/public/sitemap.xml`

**Action:** Create the file `C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\public\sitemap.xml` with **exactly** this content. Use today's date (`2026-05-18`) as `<lastmod>` for every URL.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://srt-translator.nt-sites.gr/</loc>
    <lastmod>2026-05-18</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>https://srt-translator.nt-sites.gr/og-cover.png</image:loc>
      <image:title>SRT Translator — AI-powered subtitle translation</image:title>
    </image:image>
    <image:image>
      <image:loc>https://srt-translator.nt-sites.gr/screenshots/translate-process.png</image:loc>
      <image:title>SRT Translator translation process screen</image:title>
    </image:image>
    <image:image>
      <image:loc>https://srt-translator.nt-sites.gr/screenshots/settings.png</image:loc>
      <image:title>SRT Translator settings and AI configuration</image:title>
    </image:image>
  </url>
  <url>
    <loc>https://srt-translator.nt-sites.gr/translate</loc>
    <lastmod>2026-05-18</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://srt-translator.nt-sites.gr/packages</loc>
    <lastmod>2026-05-18</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://srt-translator.nt-sites.gr/suggestion-packages</loc>
    <lastmod>2026-05-18</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>
```

**Verify:**
- File starts with the XML declaration.
- Contains exactly 4 `<url>` blocks.
- All URLs use HTTPS and the production domain.

---

## Step 4 — Create `frontend/public/site.webmanifest`

**Action:** Create the file `C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\public\site.webmanifest` with **exactly** this content:

```json
{
  "name": "SRT Translator",
  "short_name": "SRT Translator",
  "description": "Free AI-powered SRT subtitle translation tool. Translate .srt files with OpenAI, Gemini, Claude, or DeepSeek across 70+ languages.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#0f1413",
  "theme_color": "#2f7d6b",
  "orientation": "portrait-primary",
  "lang": "en",
  "icons": [
    {
      "src": "/assets/icons/Srt-Translator--icon.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/assets/icons/Srt-Translator--icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any"
    }
  ]
}
```

**Verify:** The file is valid JSON (the executor must parse it mentally — no comments, no trailing commas).

---

## Step 5 — Copy screenshot assets into `public/`

**Why:** Files inside `frontend/assets/` are imported through the bundler and get hashed filenames at build time. For SEO (Open Graph, sitemap image entries, JSON-LD `screenshot`) we need **stable, predictable URLs**. These live under `public/` and are copied verbatim to the build output.

**Action 5a — create the directory:**
```
C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\public\screenshots
```

**Action 5b — copy these two files (PowerShell):**

```powershell
Copy-Item "C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\assets\Media\Srt-Translator-Proccess-Image.png" `
          "C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\public\screenshots\translate-process.png"

Copy-Item "C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\assets\Media\Srt-Translator-Settings-Image.png" `
          "C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\public\screenshots\settings.png"
```

**Action 5c — create the OG cover image.**

The OG cover should be 1200×630 px. We do **not** have a pre-made one. Use the existing **process screenshot** as the OG cover by copying it to `og-cover.png` at the public root. (It is wider-than-tall and represents the product well — acceptable for now. The user can replace it later with a designed graphic.)

```powershell
Copy-Item "C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\assets\Media\Srt-Translator-Proccess-Image.png" `
          "C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\public\og-cover.png"
```

> **Do NOT delete** the existing `frontend/public/og-image.png` (logo). It is kept as a fallback referenced by older external links.

**Verify (PowerShell):**
```powershell
Test-Path "C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\public\og-cover.png"
Test-Path "C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\public\screenshots\translate-process.png"
Test-Path "C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\public\screenshots\settings.png"
```
All three must return `True`.

---

## Step 6 — Improve semantic HTML on the Landing Page

**File:** `C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\src\pages\LandingPage.tsx`

Make exactly the following edits using the Edit tool. **Do not modify anything else in the file.**

### Edit 6.1 — improve the logo `<img>` alt text in the navbar

Find:
```tsx
<img src={logoIcon} alt="SRT Translator" className="h-7 w-7 rounded" />
```
Replace with:
```tsx
<img src={logoIcon} alt="SRT Translator logo — AI subtitle translation tool" className="h-7 w-7 rounded" width="28" height="28" />
```

### Edit 6.2 — improve the footer logo `<img>` alt text

Find:
```tsx
<img src={logoIcon} alt="SRT Translator" className="h-6 w-6 rounded" />
```
Replace with:
```tsx
<img src={logoIcon} alt="SRT Translator logo" className="h-6 w-6 rounded" width="24" height="24" />
```

### Edit 6.3 — wrap the hero section in semantic landmarks

Find:
```tsx
      {/* Hero */}
      <section className="flex min-h-[85vh] flex-col items-center justify-center px-6 py-20 text-center">
```
Replace with:
```tsx
      {/* Hero */}
      <main>
      <section aria-labelledby="hero-heading" className="flex min-h-[85vh] flex-col items-center justify-center px-6 py-20 text-center">
```

### Edit 6.4 — give the `<h1>` an id

Find:
```tsx
        <h1 className="mb-6 max-w-3xl text-5xl font-black leading-tight text-base-content md:text-7xl dark:text-dark-base-content">
```
Replace with:
```tsx
        <h1 id="hero-heading" className="mb-6 max-w-3xl text-5xl font-black leading-tight text-base-content md:text-7xl dark:text-dark-base-content">
```

### Edit 6.5 — close `<main>` before the footer

Find:
```tsx
      {/* Footer */}
      <footer className="border-t border-base-300 dark:border-dark-base-300">
```
Replace with:
```tsx
      </main>

      {/* Footer */}
      <footer className="border-t border-base-300 dark:border-dark-base-300">
```

**Verify after Edit 6.5:**
- File has exactly **one** `<main>` opening tag and exactly **one** `</main>` closing tag.
- File has exactly **one** `<h1` (the hero heading).
- File still compiles — run `cd C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend; npx tsc --noEmit` and confirm 0 errors. If any error appears, **revert the edits in this step and stop**.

---

## Step 7 — Per-route document title updates (optional, low-risk)

> **Only execute Step 7 if Steps 1–6 all verified successfully.** If anything in the previous steps failed, skip Step 7 entirely.

Google does render JS and will pick up dynamic `<title>` changes. We will avoid pulling in `react-helmet-async` (extra dependency) and instead use a tiny inline hook.

### 7.1 — Create the hook

Create the file `C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\src\hooks\useDocumentMeta.ts` with **exactly** this content:

```ts
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
```

### 7.2 — Add per-page meta to **TranslatePage**

File: `C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\src\pages\TranslatePage.tsx`

Read the file first. Then:

1. Add this import at the top of the file alongside the other imports (place it after the last existing `import` line):
   ```ts
   import { useDocumentMeta } from "../hooks/useDocumentMeta";
   ```
2. Inside the component function body, **as the first statement** of the function, add:
   ```ts
   useDocumentMeta({
     title: "Translate Subtitles — SRT Translator",
     description: "Upload .srt subtitle files and translate them with OpenAI, Gemini, Claude, or DeepSeek across 70+ languages.",
   });
   ```

If the file structure makes this ambiguous (e.g., multiple exported components), **stop and report** — do not guess.

### 7.3 — Add per-page meta to **PackagesPage**

File: `C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\src\pages\PackagesPage.tsx`

Same procedure as 7.2 with:
```ts
useDocumentMeta({
  title: "Translation Packages — SRT Translator",
  description: "Create and manage per-content translation packages with title keywords, matching words, and removal words for contextually accurate subtitle translation.",
});
```

### 7.4 — Add per-page meta to **SuggestionPackagesPage**

File: `C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\src\pages\SuggestionPackagesPage.tsx`

Same procedure with:
```ts
useDocumentMeta({
  title: "Suggestion Packages — SRT Translator",
  description: "Browse curated translation packages for popular movies and TV series. Import any package with one click to improve subtitle translation accuracy.",
});
```

**Do NOT** add per-page meta to OldFilesPage, PackageDetailPage, or any settings page — they are excluded from indexing in `robots.txt`.

**Verify Step 7:**
- Run `cd C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend; npx tsc --noEmit` → 0 errors.

---

## Step 8 — Build verification

Run from the frontend folder:
```powershell
npm run build
```

After the build completes, verify the following files exist in `frontend/dist/`:

```powershell
Test-Path "C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\dist\index.html"
Test-Path "C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\dist\robots.txt"
Test-Path "C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\dist\sitemap.xml"
Test-Path "C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\dist\site.webmanifest"
Test-Path "C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\dist\og-cover.png"
Test-Path "C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\dist\og-image.png"
Test-Path "C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\dist\screenshots\translate-process.png"
Test-Path "C:\Users\Ntamas\Desktop\Personal\srt-translator\frontend\dist\screenshots\settings.png"
```
All must return `True`. If any return `False`, stop and report.

Also confirm `frontend/dist/index.html` contains the string `og-cover.png` (proves the new index.html shipped).

---

## Step 9 — Google Search Console Submission Checklist (manual — for the user)

Once everything is deployed to `https://srt-translator.nt-sites.gr/`:

1. **Open Google Search Console** → add property → `https://srt-translator.nt-sites.gr/` (URL prefix).
2. **Verify ownership.** Easiest method: DNS TXT record on `nt-sites.gr`. If DNS is not convenient, use the HTML file method:
   - Search Console will give a file like `google<hash>.html`.
   - Save it to `frontend/public/` and rebuild + redeploy.
3. **Submit the sitemap:** in Search Console → Sitemaps → paste `sitemap.xml` → Submit.
4. **Request indexing** for the home page: Search Console → URL Inspection → enter `https://srt-translator.nt-sites.gr/` → Request indexing.
5. **Test rich results:** https://search.google.com/test/rich-results → paste the home URL → confirm `SoftwareApplication`, `WebSite`, and `FAQPage` are detected.
6. **Test OG preview:** https://opengraph.xyz/ or Facebook's Sharing Debugger → paste the home URL → confirm `og-cover.png` renders at 1200×630.

---

## Summary of Files Created or Modified

| Action | Path |
| --- | --- |
| Overwrite | `frontend/index.html` |
| Create | `frontend/public/robots.txt` |
| Create | `frontend/public/sitemap.xml` |
| Create | `frontend/public/site.webmanifest` |
| Create | `frontend/public/og-cover.png` (copy of process screenshot) |
| Create | `frontend/public/screenshots/translate-process.png` |
| Create | `frontend/public/screenshots/settings.png` |
| Edit | `frontend/src/pages/LandingPage.tsx` (semantic HTML only — see Step 6) |
| Create (Step 7 only) | `frontend/src/hooks/useDocumentMeta.ts` |
| Edit (Step 7 only) | `frontend/src/pages/TranslatePage.tsx` |
| Edit (Step 7 only) | `frontend/src/pages/PackagesPage.tsx` |
| Edit (Step 7 only) | `frontend/src/pages/SuggestionPackagesPage.tsx` |

**No files are deleted. No npm packages are installed.**

---

## What This Plan Deliberately Does NOT Do

These are intentional non-goals. **Do not add them.**

- **No SSR / SSG / prerendering.** Adding `vite-plugin-prerender` or migrating to Next.js is out of scope. Modern Googlebot renders JS and the static `<title>`/`<meta>` in `index.html` already covers the home page.
- **No `react-helmet-async`** — avoided to skip a new dependency. The tiny hook in Step 7 covers the secondary pages.
- **No new copywriting on LandingPage.** Content is already good; we only add semantic landmarks and alt text.
- **No backend changes.**
- **No CSP / security-header changes.** Out of scope.
