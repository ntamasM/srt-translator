"""Tests for placeholder management functionality."""

import pytest
from src.srt_chatgpt_translator.placeholders import PlaceholderManager, load_matching_file


class TestPlaceholderManager:
    """Test the PlaceholderManager class."""
    
    def test_protect_html_tags(self):
        """Test protection of HTML tags."""
        manager = PlaceholderManager()
        text = "Hello <i>world</i> and <b>everyone</b>!"
        
        protected, replacements = manager.protect_text(text)
        
        # Should contain placeholders instead of tags
        assert "<i>" not in protected
        assert "<b>" not in protected
        assert "HTMLTAG_" in protected
        
        # Should have correct number of replacements
        assert len(replacements) == 4  # <i>, </i>, <b>, </b>
        
        # Verify replacement content
        tag_replacements = {k: v for k, v in replacements.items() if "HTMLTAG_" in k}
        assert "<i>" in tag_replacements.values()
        assert "</i>" in tag_replacements.values()
        assert "<b>" in tag_replacements.values()
        assert "</b>" in tag_replacements.values()
    
    def test_protect_html_entities(self):
        """Test protection of HTML entities."""
        manager = PlaceholderManager()
        text = "Romeo &amp; Juliet &lt; Shakespeare"
        
        protected, replacements = manager.protect_text(text)
        
        # Should contain placeholders instead of entities
        assert "&amp;" not in protected
        assert "&lt;" not in protected
        assert "HTMLENTITY_" in protected
        
        # Should have correct number of replacements
        entity_replacements = {k: v for k, v in replacements.items() if "HTMLENTITY_" in k}
        assert len(entity_replacements) == 2
        assert "&amp;" in entity_replacements.values()
        assert "&lt;" in entity_replacements.values()
    
    def test_protect_matching_terms_case_sensitive(self):
        """Test protection of matching terms (case sensitive)."""
        terms = ["Tokyo", "sensei", "anime"]
        manager = PlaceholderManager(matching_terms=terms, case_insensitive=False)
        text = "I went to Tokyo with my sensei to watch anime."
        
        protected, replacements = manager.protect_text(text)
        
        # Should contain placeholders instead of terms
        assert "Tokyo" not in protected
        assert "sensei" not in protected
        assert "anime" not in protected
        assert "MATCHINGTERM_" in protected
        
        # Should have correct replacements
        matching_replacements = {k: v for k, v in replacements.items() if "MATCHINGTERM_" in k}
        assert len(matching_replacements) == 3
        assert "Tokyo" in matching_replacements.values()
        assert "sensei" in matching_replacements.values()
        assert "anime" in matching_replacements.values()
    
    def test_protect_matching_terms_case_insensitive(self):
        """Test protection of matching terms (case insensitive)."""
        terms = ["Tokyo", "sensei"]
        manager = PlaceholderManager(matching_terms=terms, case_insensitive=True)
        text = "I went to TOKYO with my SENSEI."
        
        protected, replacements = manager.protect_text(text)
        
        # Should contain placeholders instead of terms
        assert "TOKYO" not in protected
        assert "SENSEI" not in protected
        assert "MATCHINGTERM_" in protected
        
        # Should preserve original case in replacements
        matching_replacements = {k: v for k, v in replacements.items() if "MATCHINGTERM_" in k}
        assert len(matching_replacements) == 2
        assert "TOKYO" in matching_replacements.values()
        assert "SENSEI" in matching_replacements.values()
    
    def test_restore_text_round_trip(self):
        """Test that protection and restoration is a round trip."""
        terms = ["Tokyo", "sensei"]
        manager = PlaceholderManager(matching_terms=terms)
        original_text = "Hello <i>Tokyo</i> &amp; sensei!"
        
        protected, replacements = manager.protect_text(original_text)
        restored = manager.restore_text(protected, replacements)
        
        assert restored == original_text
    
    def test_default_anime_honorifics_included(self):
        """Test that default anime honorifics are included."""
        manager = PlaceholderManager()
        text = "Thank you, Tanaka-san and sensei!"
        
        protected, replacements = manager.protect_text(text)
        
        # Should protect default honorifics
        assert "-san" not in protected
        assert "sensei" not in protected
        assert "MATCHINGTERM_" in protected
    
    def test_word_boundaries_respected(self):
        """Test that matching terms respect word boundaries."""
        terms = ["cat"]
        manager = PlaceholderManager(matching_terms=terms)
        text = "The cat and concatenation."
        
        protected, replacements = manager.protect_text(text)
        
        # Should only protect "cat" as a whole word, not part of "concatenation"
        matching_replacements = {k: v for k, v in replacements.items() if "MATCHINGTERM_" in k}
        assert len(matching_replacements) == 1
        assert "cat" in matching_replacements.values()
        assert "concatenation" in protected  # Should not be protected
    
    def test_empty_text_handling(self):
        """Test handling of empty or whitespace-only text."""
        manager = PlaceholderManager()
        
        # Empty string
        protected, replacements = manager.protect_text("")
        assert protected == ""
        assert len(replacements) == 0
        
        # Whitespace only
        protected, replacements = manager.protect_text("   ")
        assert protected == "   "
        assert len(replacements) == 0
    
    def test_complex_mixed_content(self):
        """Test protection of complex mixed content."""
        terms = ["Tokyo", "sensei"]
        manager = PlaceholderManager(matching_terms=terms)
        text = "In <b>Tokyo</b>, my sensei said &quot;Hello&quot;!"
        
        protected, replacements = manager.protect_text(text)
        restored = manager.restore_text(protected, replacements)
        
        # Should round-trip correctly
        assert restored == text
        
        # Should have protected all types of content
        assert len(replacements) >= 5  # <b>, </b>, Tokyo, sensei, &quot;


class TestLoadMatchingFile:
    """Test the load_glossary_file function."""
    
    def test_load_valid_file(self, tmp_path):
        """Test loading a valid matching file."""
        matching_file = tmp_path / "matching.txt"
        matching_file.write_text("Tokyo\nKyoto\nsensei\n# This is a comment\n\n", encoding="utf-8")
        
        terms = load_matching_file(str(matching_file))
        
        assert len(terms) == 3
        assert "Tokyo" in terms
        assert "Kyoto" in terms
        assert "sensei" in terms
        assert "# This is a comment" not in terms  # Comments should be filtered
    
    def test_load_nonexistent_file(self):
        """Test loading a nonexistent file."""
        terms = load_matching_file("nonexistent.txt")
        assert terms == []
    
    def test_load_empty_file(self, tmp_path):
        """Test loading an empty file."""
        matching_file = tmp_path / "empty.txt"
        matching_file.write_text("", encoding="utf-8")
        
        terms = load_matching_file(str(matching_file))
        assert terms == []
    
    def test_load_file_with_only_comments_and_whitespace(self, tmp_path):
        """Test loading a file with only comments and whitespace."""
        matching_file = tmp_path / "comments.txt"
        matching_file.write_text("# Comment 1\n\n  \n# Comment 2\n\t\n", encoding="utf-8")
        
        terms = load_matching_file(str(matching_file))
        assert terms == []