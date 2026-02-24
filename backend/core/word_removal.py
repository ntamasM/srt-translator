"""Word removal functionality for SRT files."""

import os
from typing import List, Set
import re


class WordRemover:
    """Handles complete removal of specified words from subtitle text."""
    
    def __init__(self, removal_file: str = None):
        """Initialize the word remover.
        
        Args:
            removal_file: Path to file containing words to remove (one per line)
        """
        self.removal_words: Set[str] = set()
        
        if removal_file and os.path.exists(removal_file):
            self.load_removal_words(removal_file)
    
    def load_removal_words(self, file_path: str) -> None:
        """Load words to remove from a text file.
        
        Args:
            file_path: Path to file containing words to remove (one per line)
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                words = f.read().strip().split('\n')
                # Clean and filter empty lines
                self.removal_words = {word.strip() for word in words if word.strip()}
            print(f"Loaded {len(self.removal_words)} words for removal from {file_path}")
        except Exception as e:
            print(f"Warning: Failed to load removal words from {file_path}: {e}")
    
    def remove_words_from_text(self, text: str) -> str:
        """Remove specified words from text completely.
        
        Args:
            text: Input text
            
        Returns:
            Text with specified words removed
        """
        if not self.removal_words or not text:
            return text
        
        # Create a copy to work with
        result = text
        
        # Remove each word (case-insensitive)
        for word in self.removal_words:
            # Escape special regex characters in the word
            escaped_word = re.escape(word)
            
            # For patterns that contain non-alphanumeric characters (like {\an8}),
            # use simple string matching instead of word boundaries
            if re.search(r'[^\w\s]', word):
                # Remove the pattern anywhere it appears (case-insensitive)
                result = re.sub(escaped_word, '', result, flags=re.IGNORECASE)
            else:
                # For normal words, use word boundaries to avoid partial matches
                pattern = r'\b' + escaped_word + r'\b'
                result = re.sub(pattern, '', result, flags=re.IGNORECASE)
        
        # Clean up multiple spaces and punctuation issues
        result = re.sub(r'\s+', ' ', result)  # Multiple spaces to single space
        result = re.sub(r'\s+([.!?,:;])', r'\1', result)  # Remove space before punctuation
        result = re.sub(r'([.!?])\s*([.!?])', r'\1', result)  # Remove duplicate punctuation
        result = re.sub(r'\n\s*\n', '\n', result)  # Multiple newlines to single
        result = result.strip()  # Remove leading/trailing whitespace
        
        return result
    
    def process_subtitle_lines(self, lines: List[str]) -> List[str]:
        """Process a list of subtitle lines, removing specified words.
        
        Args:
            lines: List of subtitle lines
            
        Returns:
            Processed lines with specified words removed
        """
        if not self.removal_words:
            return lines
        
        processed_lines = []
        for line in lines:
            cleaned_line = self.remove_words_from_text(line)
            # Only add non-empty lines
            if cleaned_line:
                processed_lines.append(cleaned_line)
        
        # If all lines were removed, keep one empty line to preserve subtitle structure
        if not processed_lines and lines:
            processed_lines = [""]
        
        return processed_lines