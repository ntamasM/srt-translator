"""Command-line interface for the SRT ChatGPT Translator."""

import argparse
import os
import sys
from typing import Optional

from dotenv import load_dotenv

from .translate import SRTTranslator


def create_parser() -> argparse.ArgumentParser:
    """Create the command-line argument parser."""
    parser = argparse.ArgumentParser(
        prog="srt-translate",
        description="Translate SubRip (.srt) subtitle files using OpenAI's API while preserving exact structure",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Translate a single file from English to Greek
  srt-translate input.srt output.srt

  # Specify source and target languages explicitly
  srt-translate input.srt output.srt --src en --tgt el

  # Use a custom matching file
  srt-translate input.srt output.srt --matching terms.txt --matching-ci

  # Remove specific words and set translator name
  srt-translate input.srt output.srt --removal-file remove_words.txt --translator-name "John"

  # Batch process all SRT files in a directory
  srt-translate --input-dir ./subs --output-dir ./translated

  # Use a different model and append credits at the end
  srt-translate input.srt output.srt --model gpt-4 --append-credits-at-the-end
        """
    )
    
    # Input/output arguments
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "input_file",
        nargs="?",
        help="Input SRT file path"
    )
    group.add_argument(
        "--input-dir",
        help="Input directory containing SRT files (batch mode)"
    )
    
    parser.add_argument(
        "output_file",
        nargs="?",
        help="Output SRT file path (required when using input_file)"
    )
    parser.add_argument(
        "--output-dir",
        help="Output directory for translated files (required when using --input-dir)"
    )
    
    # Language options
    parser.add_argument(
        "--src",
        default="en",
        help="Source language code (default: en)"
    )
    parser.add_argument(
        "--tgt",
        default="el",
        help="Target language code (default: el)"
    )
    
    # Model options
    parser.add_argument(
        "--model",
        default="gpt-4o-mini",
        help="OpenAI model to use (default: gpt-4o-mini)"
    )
    parser.add_argument(
        "--temperature",
        type=float,
        default=0.2,
        help="Sampling temperature (default: 0.2)"
    )
    parser.add_argument(
        "--top-p",
        type=float,
        default=0.1,
        help="Top-p sampling parameter (default: 0.1)"
    )
    
    # Matching options
    parser.add_argument(
        "--matching",
        help="Path to matching file (one term per line) - replaces translated terms"
    )
    parser.add_argument(
        "--matching-ci",
        action="store_true",
        help="Case-insensitive matching"
    )
    
    # Word removal options
    parser.add_argument(
        "--removal-file",
        help="Path to file containing words to completely remove (one word per line)"
    )
    
    # Translator name option
    parser.add_argument(
        "--translator-name",
        default="Ntamas",
        help="Name of the translator to use in credits (default: Ntamas)"
    )
    
    # Credits handling
    parser.add_argument(
        "--replace-old-credits",
        action="store_true",
        default=True,
        help="Replace existing translator credits with standard text (default: enabled)"
    )
    
    # Smart credits option
    parser.add_argument(
        "--add-new-credits",
        action="store_true",
        default=True,
        help="Intelligently add translator credits in gaps or at end (default: enabled)"
    )
    
    # End credits option
    parser.add_argument(
        "--append-credits-at-the-end",
        action="store_true",
        default=False,
        help="Append credits at the end instead of finding gaps (default: disabled)"
    )
    
    return parser


def validate_args(args: argparse.Namespace) -> None:
    """Validate command-line arguments."""
    # Check for single file mode requirements
    if args.input_file:
        if not args.output_file:
            print("Error: output_file is required when input_file is specified")
            sys.exit(1)
        if not os.path.exists(args.input_file):
            print(f"Error: Input file does not exist: {args.input_file}")
            sys.exit(1)
    
    # Check for batch mode requirements
    if args.input_dir:
        if not args.output_dir:
            print("Error: --output-dir is required when --input-dir is specified")
            sys.exit(1)
        if not os.path.exists(args.input_dir):
            print(f"Error: Input directory does not exist: {args.input_dir}")
            sys.exit(1)
        if not os.path.isdir(args.input_dir):
            print(f"Error: Input path is not a directory: {args.input_dir}")
            sys.exit(1)
    
    # Check matching file
    if args.matching and not os.path.exists(args.matching):
        print(f"Warning: Matching file does not exist: {args.matching}")
    
    # Check removal file
    if args.removal_file and not os.path.exists(args.removal_file):
        print(f"Warning: Removal file does not exist: {args.removal_file}")
    
    # Validate numeric parameters
    if args.temperature < 0 or args.temperature > 2:
        print("Error: Temperature must be between 0 and 2")
        sys.exit(1)
    
    if args.top_p < 0 or args.top_p > 1:
        print("Error: Top-p must be between 0 and 1")
        sys.exit(1)


def get_api_key() -> str:
    """Get OpenAI API key from environment."""
    # Load .env file if it exists
    load_dotenv()
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY environment variable is required")
        print("Set it in your environment or create a .env file with:")
        print("OPENAI_API_KEY=your_api_key_here")
        sys.exit(1)
    
    return api_key


def main() -> None:
    """Main entry point for the CLI application."""
    parser = create_parser()
    args = parser.parse_args()
    
    # Validate arguments
    validate_args(args)
    
    # Get API key
    api_key = get_api_key()
    
    # Create translator
    try:
        translator = SRTTranslator(
            api_key=api_key,
            model=args.model,
            temperature=args.temperature,
            top_p=args.top_p,
            matching_file=args.matching,
            matching_case_insensitive=args.matching_ci,
            replace_credits=args.replace_old_credits,
            translator_name=args.translator_name,
            removal_file=args.removal_file
        )
    except Exception as e:
        print(f"Error initializing translator: {e}")
        sys.exit(1)
    
    # Perform translation
    try:
        if args.input_file:
            # Single file mode
            translator.translate_file(
                input_path=args.input_file,
                output_path=args.output_file,
                src_lang=args.src,
                tgt_lang=args.tgt,
                add_credits=args.add_new_credits,
                append_credits_at_end=args.append_credits_at_the_end
            )
        else:
            # Batch mode
            translator.translate_directory(
                input_dir=args.input_dir,
                output_dir=args.output_dir,
                src_lang=args.src,
                tgt_lang=args.tgt,
                add_credits=args.add_new_credits,
                append_credits_at_end=args.append_credits_at_the_end
            )
    except KeyboardInterrupt:
        print("\nTranslation interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"Error during translation: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()