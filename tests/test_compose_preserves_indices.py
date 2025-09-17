"""Tests for SRT composition and index preservation."""

import pytest
import srt
from datetime import timedelta


class TestComposePreservesIndices:
    """Test that SRT composition preserves original indices."""
    
    def test_reindex_false_preserves_indices(self):
        """Test that reindex=False preserves original subtitle indices."""
        # Create subtitles with non-sequential indices
        subtitles = [
            srt.Subtitle(
                index=5,
                start=timedelta(seconds=1),
                end=timedelta(seconds=3),
                content="First subtitle"
            ),
            srt.Subtitle(
                index=10,
                start=timedelta(seconds=4),
                end=timedelta(seconds=6),
                content="Second subtitle"
            ),
            srt.Subtitle(
                index=15,
                start=timedelta(seconds=7),
                end=timedelta(seconds=9),
                content="Third subtitle"
            )
        ]
        
        # Compose with reindex=False
        srt_content = srt.compose(subtitles, reindex=False)
        
        # Parse back and check indices
        parsed_subtitles = list(srt.parse(srt_content))
        
        assert len(parsed_subtitles) == 3
        assert parsed_subtitles[0].index == 5
        assert parsed_subtitles[1].index == 10
        assert parsed_subtitles[2].index == 15
    
    def test_reindex_true_changes_indices(self):
        """Test that reindex=True changes indices to be sequential."""
        # Create subtitles with non-sequential indices
        subtitles = [
            srt.Subtitle(
                index=5,
                start=timedelta(seconds=1),
                end=timedelta(seconds=3),
                content="First subtitle"
            ),
            srt.Subtitle(
                index=10,
                start=timedelta(seconds=4),
                end=timedelta(seconds=6),
                content="Second subtitle"
            )
        ]
        
        # Compose with reindex=True (default)
        srt_content = srt.compose(subtitles, reindex=True)
        
        # Parse back and check indices
        parsed_subtitles = list(srt.parse(srt_content))
        
        assert len(parsed_subtitles) == 2
        assert parsed_subtitles[0].index == 1
        assert parsed_subtitles[1].index == 2
    
    def test_timing_preservation(self):
        """Test that timing is preserved regardless of reindex setting."""
        original_start = timedelta(seconds=1, milliseconds=500)
        original_end = timedelta(seconds=3, milliseconds=750)
        
        subtitle = srt.Subtitle(
            index=42,
            start=original_start,
            end=original_end,
            content="Test content"
        )
        
        # Test with reindex=False
        srt_content = srt.compose([subtitle], reindex=False)
        parsed = list(srt.parse(srt_content))[0]
        
        assert parsed.start == original_start
        assert parsed.end == original_end
        assert parsed.content == "Test content"
    
    def test_content_preservation(self):
        """Test that content is preserved exactly."""
        content_with_formatting = "Line 1 with <i>italics</i>\nLine 2 with &amp; entity"
        
        subtitle = srt.Subtitle(
            index=1,
            start=timedelta(seconds=1),
            end=timedelta(seconds=3),
            content=content_with_formatting
        )
        
        srt_content = srt.compose([subtitle], reindex=False)
        parsed = list(srt.parse(srt_content))[0]
        
        assert parsed.content == content_with_formatting
    
    def test_empty_subtitles_list(self):
        """Test composition of empty subtitles list."""
        srt_content = srt.compose([], reindex=False)
        assert srt_content == ""
        
        parsed = list(srt.parse(srt_content))
        assert len(parsed) == 0
    
    def test_single_subtitle(self):
        """Test composition of single subtitle."""
        subtitle = srt.Subtitle(
            index=100,
            start=timedelta(seconds=1),
            end=timedelta(seconds=3),
            content="Single subtitle"
        )
        
        srt_content = srt.compose([subtitle], reindex=False)
        parsed = list(srt.parse(srt_content))[0]
        
        assert parsed.index == 100
        assert parsed.content == "Single subtitle"
    
    def test_multiline_content_preservation(self):
        """Test that multiline content is preserved correctly."""
        multiline_content = "First line\nSecond line\nThird line"
        
        subtitle = srt.Subtitle(
            index=1,
            start=timedelta(seconds=1),
            end=timedelta(seconds=3),
            content=multiline_content
        )
        
        srt_content = srt.compose([subtitle], reindex=False)
        parsed = list(srt.parse(srt_content))[0]
        
        assert parsed.content == multiline_content
        assert parsed.content.count('\n') == 2
    
    def test_duplicate_indices_allowed(self):
        """Test that duplicate indices are preserved when reindex=False."""
        subtitles = [
            srt.Subtitle(
                index=1,
                start=timedelta(seconds=1),
                end=timedelta(seconds=3),
                content="First"
            ),
            srt.Subtitle(
                index=1,  # Duplicate index
                start=timedelta(seconds=4),
                end=timedelta(seconds=6),
                content="Second"
            )
        ]
        
        srt_content = srt.compose(subtitles, reindex=False)
        parsed_subtitles = list(srt.parse(srt_content))
        
        assert len(parsed_subtitles) == 2
        assert parsed_subtitles[0].index == 1
        assert parsed_subtitles[1].index == 1
        assert parsed_subtitles[0].content == "First"
        assert parsed_subtitles[1].content == "Second"