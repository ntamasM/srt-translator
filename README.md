# SRT ChatGPT Translator

A production-ready Python CLI tool that translates SubRip (.srt) subtitle files using OpenAI's API while preserving exact structure, timing, and formatting.

## 🚀 Key Features

- **Structure Preservation**: Maintains exact SRT structure including cue indices, timestamps, and line counts
- **HTML Tag Protection**: Preserves inline HTML tags (`<i>`, `<b>`, `<font>`, etc.) and entities (`&amp;`, `&lt;`, etc.)
- **Word Replacement System**: Replaces specific terms in translations using `source --> target` format matching files
- **Smart Credits Management**: Automatically detects, replaces, and intelligently inserts translator credits
- **Word Removal**: Completely removes unwanted words or patterns from translations
- **Structured Output**: Uses OpenAI's Responses API with JSON schema for reliable translation
- **Batch Processing**: Process entire directories of SRT files
- **Robust Error Handling**: Multiple retry strategies with graceful fallbacks

## Installation

1. Clone the repository:

```bash
git clone https://github.com/ntamasM/srt-translator.git
cd srt-translator
```

2. Install the package and dependencies:

```bash
pip install -e .
```

3. Set up your OpenAI API key:

```bash
cp .env.example .env
# Edit .env and set your OPENAI_API_KEY
```

## 📁 Recommended Data Structure

```
data/
├── subtitles/          # Source SRT files to translate
├── translated/         # Output directory for translated files
├── matching/          # Word replacement files (source --> target)
└── remove/            # Word removal files
```

## Usage Examples

### Basic Translation

```bash
srt-translate input.srt output.srt
```

### With Word Replacement

```bash
srt-translate input.srt output.srt --matching anime_terms.txt
```

### Batch Processing

```bash
srt-translate --input-dir ./subtitles --output-dir ./translated
```

### Complete Example

```bash
srt-translate input.srt output.srt \
  --src en --tgt el \
  --matching anime_terms.txt --matching-ci \
  --removal-file profanity.txt \
  --translator-name "Your Name"
```

## Quick Start Scripts

For convenience, the repository includes ready-to-use scripts for batch translation:

### Windows Users (`run_translation.ps1`)

```powershell
.\run_translation.ps1
```

This PowerShell script automatically:

- Translates ALL SRT files in `data\subtitles\` directory
- Outputs translated files to `data\translated\` directory
- Uses English to Greek translation with matching terms
- Applies case-insensitive matching from `data\matching\DemonSlayerToEl.txt`

### Linux/Mac Users (`run_translation.sh`)

```bash
./run_translation.sh
```

This bash script performs the same batch translation as the PowerShell version.

### Before Running Scripts

1. **Set up your API key**: Make sure your OpenAI API key is configured in the `.env` file
2. **Prepare your files**: Place your SRT files in the `data/subtitles/` directory
3. **Customize if needed**: Edit the script files to change source/target languages, matching files, or other parameters

The scripts use the recommended data structure and will process all SRT files in the subtitles directory automatically.

## Command Line Options

### Positional Arguments

| Argument      | Required | Description                                        |
| ------------- | -------- | -------------------------------------------------- |
| `input_file`  | Yes\*    | Input SRT file path (when not using `--input-dir`) |
| `output_file` | Yes\*    | Output SRT file path (when using `input_file`)     |

\*Either use `input_file`/`output_file` for single file mode OR `--input-dir`/`--output-dir` for batch mode.

### Optional Arguments

| Option                        | Default       | Type   | Description                                   |
| ----------------------------- | ------------- | ------ | --------------------------------------------- |
| `--input-dir`                 | None          | String | Input directory containing SRT files (batch)  |
| `--output-dir`                | None          | String | Output directory for translated files (batch) |
| `--src`                       | `en`          | String | Source language code                          |
| `--tgt`                       | `el`          | String | Target language code                          |
| `--model`                     | `gpt-4o-mini` | String | OpenAI model to use                           |
| `--temperature`               | `0.2`         | Float  | Sampling temperature (0-2)                    |
| `--top-p`                     | `0.1`         | Float  | Top-p sampling parameter (0-1)                |
| `--matching`                  | None          | String | Path to word replacement file                 |
| `--matching-ci`               | False         | Flag   | Case-insensitive word replacement             |
| `--removal-file`              | None          | String | Path to word removal file                     |
| `--translator-name`           | `Ntamas`      | String | Name of translator to use in credits          |
| `--replace-old-credits`       | True          | Flag   | Replace existing translator credits           |
| `--add-new-credits`           | True          | Flag   | Intelligently add translator credits          |
| `--append-credits-at-the-end` | False         | Flag   | Force credits at end instead of finding gaps  |

## Word Replacement System

The matching system supports **post-translation word replacement** using a simple `source --> target` format:

### How It Works

1. **Translation First**: AI translates the subtitle normally
2. **Word Replacement**: After translation, specific terms are replaced using your matching file
3. **Intelligent Matching**: Uses word boundaries to avoid partial replacements

### Matching File Format

Create a text file with `source --> target` format:

```
# Comments start with #
# English --> Greek translations for anime terms

Demon Slayer Corps --> Σώμα Εξολοθρευτών Δαιμόνων
Water Breathing --> Αναπνοή του Νερού
Thunder Breathing --> Αναπνοή της Βροντής
Nichirin Blade --> Λεπίδα Νιτσιρίν
Total Concentration Breathing --> Αναπνοή Ολικής Συγκέντρωσης
Final Selection --> Τελική Δοκιμασία

# Character names (keep same)
Tanjiro --> Tanjiro
Nezuko --> Nezuko
```

### Example Process

**Original**: "The Demon Slayer Corps uses Water Breathing techniques."

**Step 1 - AI Translation**: "Το Σώμα Εξολοθρευτών Δαιμόνων χρησιμοποιεί τεχνικές Water Breathing."

**Step 2 - Word Replacement**: "Το Σώμα Εξολοθρευτών Δαιμόνων χρησιμοποιεί τεχνικές Αναπνοή του Νερού."

## Word Removal

Remove unwanted words or patterns from subtitles using the `--removal-file` option:

### Removal File Format

```
damn
shit
hell
{\an8}
[MUSIC]
```

### Smart Pattern Matching

- **Normal words**: Uses word boundaries (removes "word" from "word text" but not from "password")
- **Special patterns**: Removes pattern anywhere it appears (removes `{\an8}` from `{\an8}text`)

## Smart Credits Management

### Credit Options

- **`--replace-old-credits`** (default: True): Replaces existing translator credits with yours
- **`--add-new-credits`** (default: True): Intelligently adds translator credits
- **`--append-credits-at-the-end`** (default: False): Forces credits at the end

### How It Works

1. **Gap Analysis**: Analyzes timing gaps between subtitles (≥5 seconds)
2. **Optimal Placement**: Inserts credits in the largest suitable gap
3. **Fallback**: If no suitable gap exists, credits are added at the end
4. **Force End Option**: Use `--append-credits-at-the-end` to always put credits at the end

## Processing Order

The tool processes subtitles in the following order:

1. **Credit Replacement**: Replace existing translator credits (if enabled)
2. **Word Removal**: Remove specified words from original text
3. **Term Protection**: Protect built-in honorifics from translation
4. **Translation**: Translate remaining text using OpenAI
5. **Word Replacement**: Apply word replacements from matching file
6. **Structure Restoration**: Restore formatting and timing
7. **Smart Credits Insertion**: Add translator credits in optimal location

## Complete Example

### Input File (`sample.srt`)

```srt
1
00:00:01,000 --> 00:00:03,500
Hello, this is a <i>sample</i> subtitle with Demon Slayer Corps.

2
00:00:04,000 --> 00:00:06,500
Character says: "Thank you, sensei!" about Water Breathing.

3
00:00:07,000 --> 00:00:09,500
Translated by Original Translator
```

### Matching File (`anime_terms.txt`)

```
Demon Slayer Corps --> Σώμα Εξολοθρευτών Δαιμόνων
Water Breathing --> Αναπνοή του Νερού
```

### Command

```bash
srt-translate sample.srt output.srt \
  --matching anime_terms.txt \
  --translator-name "Ntamas"
```

### Output File (`output.srt`)

```srt
1
00:00:01,000 --> 00:00:03,500
Γεια σας, αυτός είναι ένας <i>δείγμα</i> υπότιτλος με Σώμα Εξολοθρευτών Δαιμόνων.

2
00:00:04,000 --> 00:00:06,500
Ο χαρακτήρας λέει: "Ευχαριστώ, sensei!" για Αναπνοή του Νερού.

3
00:00:07,000 --> 00:00:09,500
Translated by Ntamas with AI
```

## Environment Variables

Set your OpenAI API key in a `.env` file or environment:

```bash
OPENAI_API_KEY=your_api_key_here
```

## Error Handling

The tool implements multiple retry strategies:

1. **Batch Translation**: Attempts to translate all lines in one API call
2. **Indexed Translation**: Adds line numbers to help model maintain structure
3. **Line-by-Line Fallback**: Translates each line individually if batch fails

If translation fails completely, the original line is preserved.

## Development

### Running Tests

```bash
pytest
```

### Project Structure

```
src/srt_chatgpt_translator/
├── __init__.py          # Package initialization
├── cli.py              # Command-line interface
├── translate.py        # Main translation logic
├── openai_client.py    # OpenAI API wrapper
├── placeholders.py     # HTML/word protection & replacement
├── credits.py          # Credits detection & replacement
└── word_removal.py     # Word removal functionality
```

## Requirements

- Python 3.9+
- OpenAI API key
- Dependencies: `openai`, `srt`, `python-dotenv`, `tqdm`

## License

MIT License - see [LICENSE](LICENSE) file for details.
