"""Main translation logic for SRT files."""

import os
import srt
from pathlib import Path
from typing import List, Optional
from tqdm import tqdm

from .openai_client import OpenAITranslationClient
from .placeholders import PlaceholderManager, load_glossary_file
from .credits import CreditsDetector


class SRTTranslator:
    """Handles translation of SRT subtitle files while preserving structure."""
    
    def __init__(self, api_key: str, model: str = "gpt-4o-mini", 
                 temperature: float = 0.2, top_p: float = 0.1,
                 glossary_file: Optional[str] = None, 
                 glossary_case_insensitive: bool = False,
                 replace_credits: bool = True):
        """Initialize the SRT translator.
        
        Args:
            api_key: OpenAI API key
            model: Model to use for translation
            temperature: Sampling temperature
            top_p: Top-p sampling parameter
            glossary_file: Path to glossary file
            glossary_case_insensitive: Whether glossary matching is case-insensitive
            replace_credits: Whether to replace translator credits
        """
        self.client = OpenAITranslationClient(api_key, model, temperature, top_p)
        
        # Load glossary terms
        glossary_terms = []
        if glossary_file and os.path.exists(glossary_file):
            glossary_terms = load_glossary_file(glossary_file)
        
        self.placeholder_manager = PlaceholderManager(
            glossary_terms, glossary_case_insensitive
        )
        self.credits_detector = CreditsDetector()
        self.replace_credits = replace_credits
    
    def translate_file(self, input_path: str, output_path: str, 
                      src_lang: str, tgt_lang: str, 
                      append_watermark: bool = False) -> None:
        """Translate an SRT file.
        
        Args:
            input_path: Path to input SRT file
            output_path: Path to output SRT file
            src_lang: Source language code
            tgt_lang: Target language code
            append_watermark: Whether to append watermark cue at the end
        """
        # Read and parse SRT file
        try:
            with open(input_path, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
        except Exception as e:
            raise Exception(f"Failed to read input file {input_path}: {e}")
        
        try:
            subtitles = list(srt.parse(content))
        except Exception as e:
            raise Exception(f"Failed to parse SRT file {input_path}: {e}")
        
        if not subtitles:
            raise Exception(f"No subtitles found in {input_path}")
        
        print(f"Translating {len(subtitles)} cues from {src_lang} to {tgt_lang}...")
        
        # Translate each subtitle
        translated_subtitles = []
        for subtitle in tqdm(subtitles, desc="Translating cues"):
            translated_subtitle = self._translate_subtitle(subtitle, src_lang, tgt_lang)
            translated_subtitles.append(translated_subtitle)
        
        # Add watermark if requested
        if append_watermark:
            watermark_cue = self._create_watermark_cue(translated_subtitles)
            translated_subtitles.append(watermark_cue)
        
        # Generate output SRT content
        output_content = srt.compose(translated_subtitles, reindex=False)
        
        # Write output file
        try:
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(output_content)
        except Exception as e:
            raise Exception(f"Failed to write output file {output_path}: {e}")
        
        print(f"Translation completed: {output_path}")
    
    def translate_directory(self, input_dir: str, output_dir: str,
                           src_lang: str, tgt_lang: str,
                           append_watermark: bool = False) -> None:
        """Translate all SRT files in a directory.
        
        Args:
            input_dir: Input directory path
            output_dir: Output directory path
            src_lang: Source language code
            tgt_lang: Target language code
            append_watermark: Whether to append watermark cue at the end
        """
        input_path = Path(input_dir)
        output_path = Path(output_dir)
        
        if not input_path.exists():
            raise Exception(f"Input directory does not exist: {input_dir}")
        
        # Find all SRT files
        srt_files = list(input_path.glob("*.srt"))
        if not srt_files:
            print(f"No SRT files found in {input_dir}")
            return
        
        print(f"Found {len(srt_files)} SRT files to translate")
        
        # Create output directory
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Translate each file
        for srt_file in srt_files:
            input_file_path = str(srt_file)
            output_file_path = str(output_path / srt_file.name)
            
            print(f"\nProcessing: {srt_file.name}")
            try:
                self.translate_file(
                    input_file_path, output_file_path, 
                    src_lang, tgt_lang, append_watermark
                )
            except Exception as e:
                print(f"Error processing {srt_file.name}: {e}")
                continue
    
    def _translate_subtitle(self, subtitle: srt.Subtitle, src_lang: str, tgt_lang: str) -> srt.Subtitle:
        """Translate a single subtitle while preserving structure.
        
        Args:
            subtitle: Original subtitle
            src_lang: Source language code
            tgt_lang: Target language code
            
        Returns:
            Translated subtitle with same timing and index
        """
        # Split content into lines
        original_lines = subtitle.content.split('\n')
        
        # Process credits first
        processed_lines = self.credits_detector.process_subtitle_lines(
            original_lines, self.replace_credits
        )
        
        # Protect content and translate
        protected_lines = []
        all_replacements = {}
        
        for line in processed_lines:
            protected_line, replacements = self.placeholder_manager.protect_text(line)
            protected_lines.append(protected_line)
            all_replacements.update(replacements)
        
        # Translate the protected lines
        try:
            translated_lines = self.client.translate_lines(
                protected_lines, src_lang, tgt_lang
            )
        except Exception as e:
            print(f"Translation failed for subtitle {subtitle.index}: {e}")
            translated_lines = protected_lines  # Keep original on failure
        
        # Restore protected content
        restored_lines = []
        for line in translated_lines:
            restored_line = self.placeholder_manager.restore_text(line, all_replacements)
            restored_lines.append(restored_line)
        
        # Create new subtitle with translated content
        return srt.Subtitle(
            index=subtitle.index,
            start=subtitle.start,
            end=subtitle.end,
            content='\n'.join(restored_lines)
        )
    
    def _create_watermark_cue(self, existing_subtitles: List[srt.Subtitle]) -> srt.Subtitle:
        """Create a watermark cue to append at the end.
        
        Args:
            existing_subtitles: List of existing subtitles
            
        Returns:
            Watermark subtitle cue
        """
        # Find the highest index and latest end time
        max_index = max(sub.index for sub in existing_subtitles) if existing_subtitles else 0
        latest_end = max(sub.end for sub in existing_subtitles) if existing_subtitles else srt.timedelta(0)
        
        # Create watermark cue starting 1 second after the last subtitle
        watermark_start = latest_end + srt.timedelta(seconds=1)
        watermark_end = watermark_start + srt.timedelta(seconds=3)
        
        return srt.Subtitle(
            index=max_index + 1,
            start=watermark_start,
            end=watermark_end,
            content="Translated by Ntamas with AI"
        )