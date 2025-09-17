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

### Batch Processing

Process all SRT files in a directory:

```bash
srt-translate --input-dir ./subtitles --output-dir ./translated
```

### Advanced Options

Use a different model and append watermark:

```bash
srt-translate input.srt output.srt --model gpt-4 --temperature 0.1 --append-watermark
```

Disable credit replacement:

```bash
srt-translate input.srt output.srt --no-replace-credits
```

## Command Line Options

| Option                  | Default       | Description                        |
| ----------------------- | ------------- | ---------------------------------- |
| `--src`                 | `en`          | Source language code               |
| `--tgt`                 | `el`          | Target language code               |
| `--model`               | `gpt-4o-mini` | OpenAI model to use                |
| `--temperature`         | `0.2`         | Sampling temperature (0-2)         |
| `--top-p`               | `0.1`         | Top-p sampling parameter (0-1)     |
| `--glossary`            | None          | Path to glossary file              |
| `--glossary-ci`         | False         | Case-insensitive glossary matching |
| `--replace-credits`     | True          | Replace translator credits         |
| `--no-replace-credits`  | False         | Don't replace translator credits   |
| `--append-watermark`    | False         | Append watermark cue at end        |
| `--no-append-watermark` | True          | Don't append watermark cue         |

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
