# SRT ChatGPT Translator

A production-ready Python CLI tool that translates SubRip (.srt) subtitle files using OpenAI's API while preserving exact structure, timing, and formatting.

## Features

- **Structure Preservation**: Maintains exact SRT structure including cue indices, timestamps, and line counts
- **HTML Tag Protection**: Preserves inline HTML tags (`<i>`, `<b>`, `<font>`, etc.) and entities (`&amp;`, `&lt;`, etc.)
- **Glossary Support**: Protects specified terms from translation (built-in anime honorifics included)
- **Credits Handling**: Automatically detects and replaces translator credits with "Translated by Ntamas with AI"
- **Structured Output**: Uses OpenAI's Responses API with JSON schema for reliable translation
- **Batch Processing**: Process entire directories of SRT files
- **Robust Error Handling**: Multiple retry strategies with graceful fallbacks

## Installation

1. Clone the repository:

```bash
git clone https://github.com/ntamas/srt-chatgpt-translator.git
cd srt-chatgpt-translator
```

2. Install the package and dependencies:

```bash
pip install -e .
```

For development, install with test dependencies:

```bash
pip install -e ".[dev]"
```

3. Set up your OpenAI API key:

```bash
cp .env.example .env
# Edit .env and set your OPENAI_API_KEY
```

## Usage

### Basic Translation

Translate a single SRT file from English to Greek:

```bash
srt-translate input.srt output.srt
```

### Specify Languages

Explicitly set source and target languages:

```bash
srt-translate input.srt output.srt --src en --tgt el
```

### Use Custom Glossary

Protect specific terms from translation:

```bash
srt-translate input.srt output.srt --glossary terms.txt --glossary-ci
```

### Remove Unwanted Words

Remove specific words during translation:

```bash
srt-translate input.srt output.srt --removal-file remove_words.txt
```

### Custom Translator Name

Set custom translator name in credits:

```bash
srt-translate input.srt output.srt --translator-name "Your Name"
```

### Batch Processing

Process all SRT files in a directory:

```bash
srt-translate --input-dir ./subtitles --output-dir ./translated
```

### Advanced Model Settings

Use a different model with custom temperature and top-p:

```bash
srt-translate input.srt output.srt --model gpt-4 --temperature 0.1 --top-p 0.05
```

### Disable Features

Disable credit replacement and don't append watermark:

```bash
srt-translate input.srt output.srt --no-replace-credits --no-append-watermark
```

### Complete Example

Use all features together:

```bash
srt-translate input.srt output.srt \
  --src en --tgt el \
  --model gpt-4o-mini \
  --temperature 0.2 --top-p 0.1 \
  --glossary anime_terms.txt --glossary-ci \
  --removal-file profanity.txt \
  --translator-name "Your Name"
  # Credits will be automatically inserted in the best gap!
```

### Batch Processing with Options

Process entire directory with custom settings:

```bash
srt-translate --input-dir ./raw_subtitles --output-dir ./clean_translated \
  --src en --tgt es \
  --glossary preserve_terms.txt --glossary-ci \
  --removal-file filter_words.txt \
  --translator-name "Team Translator" \
  --model gpt-4o \
  --temperature 0.15
```

## Command Line Options

### Positional Arguments

| Argument      | Required | Description                                        |
| ------------- | -------- | -------------------------------------------------- |
| `input_file`  | Yes\*    | Input SRT file path (when not using `--input-dir`) |
| `output_file` | Yes\*    | Output SRT file path (when using `input_file`)     |

\*Either use `input_file`/`output_file` for single file mode OR `--input-dir`/`--output-dir` for batch mode.

### Optional Arguments

| Option                  | Default       | Type   | Description                                   |
| ----------------------- | ------------- | ------ | --------------------------------------------- |
| `--input-dir`           | None          | String | Input directory containing SRT files (batch)  |
| `--output-dir`          | None          | String | Output directory for translated files (batch) |
| `--src`                 | `en`          | String | Source language code                          |
| `--tgt`                 | `el`          | String | Target language code                          |
| `--model`               | `gpt-4o-mini` | String | OpenAI model to use                           |
| `--temperature`         | `0.2`         | Float  | Sampling temperature (0-2)                    |
| `--top-p`               | `0.1`         | Float  | Top-p sampling parameter (0-1)                |
| `--glossary`            | None          | String | Path to glossary file                         |
| `--glossary-ci`         | False         | Flag   | Case-insensitive glossary matching            |
| `--removal-file`        | None          | String | Path to word removal file                     |
| `--translator-name`     | `Ntamas`      | String | Name of translator to use in credits          |
| `--replace-credits`     | True          | Flag   | Replace translator credits (default: enabled) |
| `--no-replace-credits`  | False         | Flag   | Don't replace translator credits              |
| `--add-credits`         | True          | Flag   | Smart credits insertion (default: enabled)    |
| `--no-add-credits`      | False         | Flag   | Don't add translator credits automatically    |
| `--append-watermark`    | False         | Flag   | Append watermark cue at end (legacy)          |
| `--no-append-watermark` | True          | Flag   | Don't append watermark cue (default)          |

### Usage Modes

#### Single File Mode

```bash
srt-translate input.srt output.srt [options]
```

#### Batch Mode

```bash
srt-translate --input-dir ./subtitles --output-dir ./translated [options]
```

### Parameter Details

#### Temperature (`--temperature`)

- **Range**: 0.0 to 2.0
- **Default**: 0.2
- **Description**: Controls randomness in translation. Lower values (0.1-0.3) make output more deterministic and consistent. Higher values (0.7-1.0) make output more creative but potentially less consistent.

#### Top-p (`--top-p`)

- **Range**: 0.0 to 1.0
- **Default**: 0.1
- **Description**: Controls diversity via nucleus sampling. Lower values focus on most likely words, higher values allow more variation.

#### Language Codes (`--src`, `--tgt`)

- **Format**: ISO 639-1 language codes (e.g., `en`, `es`, `fr`, `de`, `ja`, `ko`)
- **Examples**:
  - English to Spanish: `--src en --tgt es`
  - Japanese to English: `--src ja --tgt en`
  - French to German: `--src fr --tgt de`

#### Model Selection (`--model`)

- **Available Models**: Any OpenAI model (e.g., `gpt-4`, `gpt-4o`, `gpt-4o-mini`, `gpt-3.5-turbo`)
- **Recommendation**: `gpt-4o-mini` for cost-effective translation, `gpt-4o` for highest quality

### File Requirements

#### Glossary File Format

- One term per line
- Comments start with `#`
- Case sensitivity controlled by `--glossary-ci` flag

#### Removal File Format

- One word or pattern per line to remove
- Case-insensitive matching
- **Smart Pattern Matching**:
  - Normal words: Uses word boundaries (removes "word" from "word text" but not from "password")
  - Special patterns (containing symbols): Removes pattern anywhere it appears (removes `{\an8}` from `{\an8}text`)
- Supports subtitle formatting codes like `{\an8}`, `[MUSIC]`, etc.

## Glossary File Format

Create a text file with one term per line:

```
# Comments start with #
Tokyo
Kyoto
sensei
Tanaka-san
anime
```

The tool includes built-in protection for common anime honorifics:

- `-san`, `-kun`, `-chan`, `-sama`
- `senpai`, `sensei`, `onii-chan`, etc.

## Word Removal

The tool supports complete removal of specified words from subtitles using the `--removal-file` option. This is useful for filtering out profanity, unwanted text, or technical annotations.

### Remove Specific Words

Remove words listed in a file from translated subtitles:

```bash
srt-translate input.srt output.srt --removal-file remove_words.txt
```

### Word Removal File Format

Create a text file with one word or pattern per line to remove:

```
damn
shit
hell
stupid
idiot
{\an8}
[MUSIC]
```

### Word Removal Examples

#### Example Input (with profanity and formatting codes)

```srt
1
00:00:01,000 --> 00:00:03,000
{\an8}This damn movie is stupid and hell.

2
00:00:04,000 --> 00:00:06,000
What an idiot! That's so shit.

3
00:00:07,000 --> 00:00:09,000
[MUSIC]Background music{\an8}continues.

4
00:00:10,000 --> 00:00:12,000
This is a normal line without bad words.
```

#### Example Output (after word removal)

```srt
1
00:00:01,000 --> 00:00:03,000
This movie is and.

2
00:00:04,000 --> 00:00:06,000
What an! That's so.

3
00:00:07,000 --> 00:00:09,000
Background musiccontinues.

4
00:00:10,000 --> 00:00:12,000
This is a normal line without bad words.
```

**Note**: The tool intelligently handles both regular words (with word boundaries) and special patterns like `{\an8}` that may be attached to other text.

### Common Use Cases

- **Profanity Filtering**: Remove offensive language from subtitles
- **Technical Cleanup**: Remove subtitle formatting codes like `{\an8}` or `[MUSIC]`
- **Content Moderation**: Filter inappropriate content for different audiences
- **Translation Cleanup**: Remove specific words that don't translate well

### Combine with Translation and Glossary

Use word removal alongside translation and glossary protection:

```bash
srt-translate input.srt output.srt \
  --src en --tgt el \
  --glossary anime_terms.txt --glossary-ci \
  --removal-file profanity.txt
```

### Processing Order

The tool processes subtitles in the following order:

1. **Word Removal**: Remove specified words from original text
2. **Glossary Protection**: Protect terms from translation
3. **Translation**: Translate remaining text
4. **Structure Restoration**: Restore formatting and timing
5. **Smart Credits Insertion**: Add translator credits in optimal location

## Smart Credits Insertion

The tool automatically adds translator credits without disrupting the viewing experience.

### How It Works

1. **Gap Analysis**: Analyzes timing gaps between subtitles (≥5 seconds)
2. **Optimal Placement**: Inserts credits in the largest suitable gap
3. **Fallback**: If no suitable gap exists, credits are added at the end
4. **Non-Intrusive**: Credits appear during natural pauses in dialogue

### Examples

#### Credits in Gap

```srt
147
00:08:48,000 --> 00:08:50,947
Last subtitle before gap.

148                              ← Credits inserted here
00:09:00,645 --> 00:09:03,645
Translated by Ntamas with AI

149                              ← Original subtitle 148 renumbered
00:09:13,344 --> 00:09:15,096
Next subtitle after gap.
```

#### Credits at End (no suitable gap)

```srt
355
00:23:38,416 --> 00:23:40,252
Final dialogue subtitle.

356
00:23:41,252 --> 00:23:44,252
Translated by Ntamas with AI
```

### Control Options

```bash
# Default behavior (credits enabled)
srt-translate input.srt output.srt

# Disable automatic credits
srt-translate input.srt output.srt --no-add-credits

# Custom translator name
srt-translate input.srt output.srt --translator-name "Your Name"
```

## Environment Variables

Set your OpenAI API key in a `.env` file or environment:

```bash
OPENAI_API_KEY=your_api_key_here
```

## Examples

### Example Input (sample.srt)

```srt
1
00:00:01,000 --> 00:00:03,500
Hello, this is a <i>sample</i> subtitle.

2
00:00:04,000 --> 00:00:06,500
Character says: "Thank you, sensei!"

3
00:00:07,000 --> 00:00:09,500
Translated by Original Translator
```

### Example Output (translated.srt)

```srt
1
00:00:01,000 --> 00:00:03,500
Γεια σας, αυτός είναι ένας <i>δείγμα</i> υπότιτλος.

2
00:00:04,000 --> 00:00:06,500
Ο χαρακτήρας λέει: "Ευχαριστώ, sensei!"

3
00:00:07,000 --> 00:00:09,500
Translated by Ntamas with AI
```

## Translation Process

1. **Parse**: Reads SRT file and parses structure
2. **Protect**: Replaces HTML tags, entities, and glossary terms with placeholders
3. **Credits**: Detects and handles translator credit lines
4. **Translate**: Sends to OpenAI with structured output requirements
5. **Restore**: Replaces placeholders with original protected content
6. **Compose**: Reconstructs SRT with preserved structure

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
├── placeholders.py     # HTML/glossary protection
└── credits.py          # Credits detection
```

## Requirements

- Python 3.9+
- OpenAI API key
- Dependencies: `openai`, `srt`, `python-dotenv`, `tqdm`

## License

MIT License - see [LICENSE](LICENSE) file for details.
