"""Main translation logic for SRT files."""

import os
import srt
from pathlib import Path
from typing import List, Optional
from tqdm import tqdm

from .client_factory import create_translation_client
from .placeholders import PlaceholderManager, load_matching_file, load_replacement_mapping
from .credits import CreditsDetector
from .word_removal import WordRemover


class SRTTranslator:
    """Handles translation of SRT subtitle files while preserving structure."""
    
    def __init__(self, api_key: str, model: str = "gpt-4o-mini", 
                 temperature: float = 0.2, top_p: float = 0.1,
                 matching_file: Optional[str] = None, 
                 matching_case_insensitive: bool = False,
                 replace_credits: bool = True,
                 translator_name: str = "AI",
                 removal_file: Optional[str] = None,
                 ai_platform: str = "openai"):
        """Initialize the SRT translator.
        
        Args:
            api_key: API key for the chosen AI platform
            model: Model to use for translation
            temperature: Sampling temperature
            top_p: Top-p sampling parameter
            matching_file: Path to matching file
            matching_case_insensitive: Whether matching should be case-insensitive
            replace_credits: Whether to replace translator credits
            translator_name: Name of the translator to use in credits
            removal_file: Path to file containing words to completely remove
            ai_platform: AI provider to use (openai, gemini, claude)
        """
        self.client = create_translation_client(
            ai_platform=ai_platform,
            api_key=api_key,
            model=model,
            temperature=temperature,
            top_p=top_p,
        )
        
        # Load matching terms and replacement mapping
        matching_terms = []
        replacement_mapping = {}
        if matching_file and os.path.exists(matching_file):
            matching_terms = load_matching_file(matching_file)
            replacement_mapping = load_replacement_mapping(matching_file)
        
        self.placeholder_manager = PlaceholderManager(
            matching_terms, matching_case_insensitive, replacement_mapping
        )
        self.credits_detector = CreditsDetector(translator_name)
        self.word_remover = WordRemover(removal_file)
        self.replace_credits = replace_credits
        self.translator_name = translator_name
    
    @staticmethod
    def parse_srt_file(input_path: str) -> List[srt.Subtitle]:
        """Parse an SRT file and return list of subtitles.

        Args:
            input_path: Path to the SRT file.

        Returns:
            List of srt.Subtitle objects.
        """
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

        return subtitles

    def finalize_subtitles(
        self,
        translated_subtitles: List[srt.Subtitle],
        output_path: str,
        add_credits: bool = True,
        append_credits_at_end: bool = False,
    ) -> None:
        """Apply credits and write translated subtitles to an SRT file.

        Args:
            translated_subtitles: Already-translated subtitle list.
            output_path: Path to write the output SRT.
            add_credits: Whether to add credits.
            append_credits_at_end: Force credits at end instead of gap.
        """
        if add_credits:
            if append_credits_at_end:
                watermark_cue = self._create_watermark_cue(translated_subtitles)
                translated_subtitles.append(watermark_cue)
            else:
                translated_subtitles = self._insert_credits_smartly(translated_subtitles)

        output_content = srt.compose(translated_subtitles, reindex=False)

        try:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(output_content)
        except Exception as e:
            raise Exception(f"Failed to write output file {output_path}: {e}")

    def translate_file(self, input_path: str, output_path: str, 
                      src_lang: str, tgt_lang: str, 
                      add_credits: bool = True,
                      append_credits_at_end: bool = False) -> None:
        """Translate an SRT file.
        
        Args:
            input_path: Path to input SRT file
            output_path: Path to output SRT file
            src_lang: Source language code
            tgt_lang: Target language code
            add_credits: Whether to intelligently add credits (default: True)
            append_credits_at_end: Whether to force credits at the end instead of finding gaps (default: False)
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
            translated_subtitle = self.translate_subtitle(subtitle, src_lang, tgt_lang)
            translated_subtitles.append(translated_subtitle)
        
        # Add credits intelligently (either in a gap or at the end)
        if add_credits:
            if append_credits_at_end:
                # Force credits at the end
                watermark_cue = self._create_watermark_cue(translated_subtitles)
                translated_subtitles.append(watermark_cue)
            else:
                # Smart insertion (try gaps first, then end)
                translated_subtitles = self._insert_credits_smartly(translated_subtitles)
        
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
                           add_credits: bool = True,
                           append_credits_at_end: bool = False) -> None:
        """Translate all SRT files in a directory.
        
        Args:
            input_dir: Input directory path
            output_dir: Output directory path
            src_lang: Source language code
            tgt_lang: Target language code
            add_credits: Whether to intelligently add credits (default: True)
            append_credits_at_end: Whether to force credits at the end instead of finding gaps (default: False)
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
                    src_lang, tgt_lang, add_credits, append_credits_at_end
                )
            except Exception as e:
                print(f"Error processing {srt_file.name}: {e}")
                continue
    
    def translate_subtitle(self, subtitle: srt.Subtitle, src_lang: str, tgt_lang: str) -> srt.Subtitle:
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
        
        # Apply word removal
        processed_lines = self.word_remover.process_subtitle_lines(processed_lines)
        
        # Protect content and translate
        protected_lines = []
        all_replacements = {}
        
        for line in processed_lines:
            protected_line, replacements = self.placeholder_manager.protect_text(line)
            protected_lines.append(protected_line)
            all_replacements.update(replacements)
        
        # Translate the protected lines (let errors propagate to caller)
        translated_lines = self.client.translate_lines(
            protected_lines, src_lang, tgt_lang
        )
        
        # Restore protected content
        restored_lines = []
        for line in translated_lines:
            restored_line = self.placeholder_manager.restore_text(line, all_replacements)
            restored_lines.append(restored_line)
        
        # Apply word replacements from matching file
        final_lines = []
        for line in restored_lines:
            replaced_line = self.placeholder_manager.apply_replacements(line)
            final_lines.append(replaced_line)
        
        # Create new subtitle with translated content
        return srt.Subtitle(
            index=subtitle.index,
            start=subtitle.start,
            end=subtitle.end,
            content='\n'.join(final_lines)
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
            content=f"Translated by {self.translator_name} with the help of AI"
        )

    def _find_best_gap_for_credits(self, subtitles: List[srt.Subtitle], min_gap_seconds: float = 3.0) -> tuple:
        """Find the best gap near the centre of the subtitle timeline.

        Strategy:
        1. Compute the total duration (first start → last end).
        2. Define a *centre zone* from 1/3 to 2/3 of total duration.
        3. Collect every gap ≥ *min_gap_seconds* that falls within (or
           overlaps) the centre zone.
        4. Among those, pick the one whose midpoint is closest to the
           exact centre of the timeline.
        5. If nothing qualifies inside the centre zone, fall back to the
           best gap anywhere.

        Returns:
            ``(insert_after_index, gap_seconds, credit_start, credit_end)``
            or ``(None, 0, None, None)`` when no usable gap exists.
        """
        if len(subtitles) < 2:
            return None, 0, None, None

        # Timeline boundaries
        timeline_start = subtitles[0].start
        timeline_end = subtitles[-1].end
        total_seconds = (timeline_end - timeline_start).total_seconds()
        if total_seconds <= 0:
            return None, 0, None, None

        centre_time = timeline_start + srt.timedelta(seconds=total_seconds / 2)
        zone_start = timeline_start + srt.timedelta(seconds=total_seconds / 3)
        zone_end = timeline_start + srt.timedelta(seconds=2 * total_seconds / 3)

        # Gather all usable gaps
        all_gaps = []  # (position_index, gap_seconds, credit_start, credit_end, distance_to_centre)
        for i in range(len(subtitles) - 1):
            current_end = subtitles[i].end
            next_start = subtitles[i + 1].start
            gap_secs = (next_start - current_end).total_seconds()

            if gap_secs < min_gap_seconds:
                continue

            # Centre the 3-second credit inside the gap
            gap_midpoint = current_end + srt.timedelta(seconds=gap_secs / 2)
            credit_start = gap_midpoint - srt.timedelta(seconds=1.5)
            credit_end = gap_midpoint + srt.timedelta(seconds=1.5)

            # Make sure credits don't overlap neighbours
            if credit_start < current_end or credit_end > next_start:
                continue

            distance = abs((gap_midpoint - centre_time).total_seconds())
            in_zone = (gap_midpoint >= zone_start and gap_midpoint <= zone_end)

            all_gaps.append((subtitles[i].index, gap_secs, credit_start, credit_end, distance, in_zone))

        if not all_gaps:
            return None, 0, None, None

        # Prefer gaps inside the centre zone; among those pick closest to centre
        centre_gaps = [g for g in all_gaps if g[5]]
        if centre_gaps:
            best = min(centre_gaps, key=lambda g: g[4])
        else:
            # Fallback: closest gap to centre anywhere
            best = min(all_gaps, key=lambda g: g[4])

        return best[0], best[1], best[2], best[3]

    def _insert_credits_smartly(self, subtitles: List[srt.Subtitle]) -> List[srt.Subtitle]:
        """Insert credits near the centre of the subtitle timeline.

        Finds the best gap in the middle third of the file so the credits
        are likely to be seen by the viewer. Falls back to appending at the
        end if no suitable gap exists.
        """
        if not subtitles:
            return subtitles

        insert_after_index, gap_seconds, credit_start, credit_end = self._find_best_gap_for_credits(subtitles)

        if insert_after_index is not None:
            insert_position = next(i for i, sub in enumerate(subtitles) if sub.index == insert_after_index) + 1

            credits_subtitle = srt.Subtitle(
                index=len(subtitles) + 1,
                start=credit_start,
                end=credit_end,
                content=f"Translated by {self.translator_name} with the help of AI"
            )

            result = subtitles[:insert_position] + [credits_subtitle] + subtitles[insert_position:]

            for i, subtitle in enumerate(result, 1):
                subtitle.index = i

            minutes = credit_start.total_seconds() / 60
            print(f"Credits inserted at {minutes:.1f}min (in {gap_seconds:.1f}s gap after subtitle {insert_after_index})")
            return result
        else:
            credits_subtitle = self._create_watermark_cue(subtitles)
            print("Credits appended at the end (no suitable gap found)")
            return subtitles + [credits_subtitle]