"""Detection and handling of translator credits in SRT files."""

import re
from typing import List, Pattern


class CreditsDetector:
    """Detects and handles translator credit lines in SRT subtitles."""
    
    def __init__(self, translator_name: str = "Ntamas"):
        """Initialize the credits detector with patterns for various languages.
        
        Args:
            translator_name: Name of the translator to use in credit replacement
        """
        # English patterns
        english_patterns = [
            r'\btranslated?\s+by\b',
            r'\bsubtitles?\s+by\b',
            r'\bsubs?\s+by\b',
            r'\btranslator\s*:',
            r'\btranslation\s*:',
            r'\bsubtitle\s*:',
        ]
        
        # Greek patterns
        greek_patterns = [
            r'\bμετάφραση\b',
            r'\bυπότιτλο[ιστ]\b',
            r'\bμεταφραστή[ςσ]\b',
            r'\bμετέφρασε\b',
        ]
        
        # Combine all patterns
        all_patterns = english_patterns + greek_patterns
        
        # Compile regex patterns (case insensitive)
        self.credit_patterns: List[Pattern] = [
            re.compile(pattern, re.IGNORECASE) for pattern in all_patterns
        ]
        
        # Replacement text
        self.replacement_text = f"Translated by {translator_name} with AI"
    
    def is_credit_line(self, text: str) -> bool:
        """Check if a text line appears to be a translator credit.
        
        Args:
            text: Text line to check
            
        Returns:
            True if the line appears to be a credit line
        """
        if not text or not text.strip():
            return False
        
        # Check against all patterns
        for pattern in self.credit_patterns:
            if pattern.search(text):
                return True
        
        return False
    
    def replace_credit_line(self, text: str) -> str:
        """Replace a credit line with our standard credit.
        
        Args:
            text: Original credit line
            
        Returns:
            Replacement credit text
        """
        if self.is_credit_line(text):
            return self.replacement_text
        return text
    
    def process_subtitle_lines(self, lines: List[str], replace_credits: bool = True) -> List[str]:
        """Process a list of subtitle lines, replacing credits if enabled.
        
        Args:
            lines: List of subtitle lines
            replace_credits: Whether to replace detected credit lines
            
        Returns:
            Processed lines with credits replaced (if enabled)
        """
        if not replace_credits:
            return lines
        
        processed_lines = []
        for line in lines:
            if self.is_credit_line(line):
                processed_lines.append(self.replacement_text)
            else:
                processed_lines.append(line)
        
        return processed_lines