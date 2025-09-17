"""Placeholder management for protecting tags and glossary terms during translation."""

import re
from typing import Dict, List, Set, Tuple


class PlaceholderManager:
    """Manages placeholders for HTML tags and glossary terms to protect them during translation."""
    
    def __init__(self, glossary_terms: List[str] = None, case_insensitive: bool = False):
        """Initialize the placeholder manager.
        
        Args:
            glossary_terms: List of terms to protect from translation
            case_insensitive: Whether glossary matching should be case-insensitive
        """
        self.case_insensitive = case_insensitive
        self.glossary_terms = set(glossary_terms or [])
        
        # Add default anime honorifics
        default_honorifics = {
            "-san", "-kun", "-chan", "-sama", "senpai", "sensei", 
            "-senpai", "-sensei", "onii-chan", "onee-chan", "onii-san", "onee-san"
        }
        self.glossary_terms.update(default_honorifics)
        
        # If case insensitive, create lowercase lookup set
        if self.case_insensitive:
            self.glossary_lookup = {term.lower() for term in self.glossary_terms}
        else:
            self.glossary_lookup = self.glossary_terms
        
        # Regex for HTML-like tags
        self.tag_pattern = re.compile(r'<[^>]*>')
        
        # Regex for HTML entities
        self.entity_pattern = re.compile(r'&[a-zA-Z0-9#]+;')
        
        # Placeholder patterns
        self.tag_placeholder = "HTMLTAG_{}"
        self.entity_placeholder = "HTMLENTITY_{}"
        self.glossary_placeholder = "GLOSSARYTERM_{}"
    
    def protect_text(self, text: str) -> Tuple[str, Dict[str, str]]:
        """Protect HTML tags, entities, and glossary terms with placeholders.
        
        Args:
            text: Original text to protect
            
        Returns:
            Tuple of (protected_text, replacement_map)
        """
        protected_text = text
        replacements = {}
        counter = 0
        
        # Protect HTML tags
        for match in self.tag_pattern.finditer(text):
            tag = match.group(0)
            placeholder = self.tag_placeholder.format(counter)
            replacements[placeholder] = tag
            protected_text = protected_text.replace(tag, placeholder, 1)
            counter += 1
        
        # Protect HTML entities
        for match in self.entity_pattern.finditer(text):
            entity = match.group(0)
            placeholder = self.entity_placeholder.format(counter)
            replacements[placeholder] = entity
            protected_text = protected_text.replace(entity, placeholder, 1)
            counter += 1
        
        # Protect glossary terms
        protected_text = self._protect_glossary_terms(protected_text, replacements, counter)
        
        return protected_text, replacements
    
    def restore_text(self, text: str, replacements: Dict[str, str]) -> str:
        """Restore protected content from placeholders.
        
        Args:
            text: Text with placeholders
            replacements: Map of placeholder -> original content
            
        Returns:
            Text with original content restored
        """
        restored_text = text
        
        # Sort by placeholder name to ensure consistent replacement order
        for placeholder in sorted(replacements.keys()):
            original = replacements[placeholder]
            restored_text = restored_text.replace(placeholder, original)
        
        return restored_text
    
    def _protect_glossary_terms(self, text: str, replacements: Dict[str, str], 
                               start_counter: int) -> str:
        """Protect glossary terms with placeholders.
        
        Args:
            text: Text to process
            replacements: Existing replacements dict to update
            start_counter: Starting counter for new placeholders
            
        Returns:
            Text with glossary terms protected
        """
        if not self.glossary_terms:
            return text
        
        protected_text = text
        counter = start_counter
        
        # Create patterns for each glossary term
        for term in self.glossary_terms:
            if not term.strip():
                continue
            
            # Escape special regex characters
            escaped_term = re.escape(term)
            
            # Create pattern with word boundaries to avoid partial matches
            if self.case_insensitive:
                pattern = re.compile(r'\b' + escaped_term + r'\b', re.IGNORECASE)
            else:
                pattern = re.compile(r'\b' + escaped_term + r'\b')
            
            # Find all matches
            matches = list(pattern.finditer(protected_text))
            
            # Replace from end to start to preserve positions
            for match in reversed(matches):
                matched_text = match.group(0)
                placeholder = self.glossary_placeholder.format(counter)
                replacements[placeholder] = matched_text
                
                start, end = match.span()
                protected_text = protected_text[:start] + placeholder + protected_text[end:]
                counter += 1
        
        return protected_text

    def contains_glossary_terms(self, text: str) -> bool:
        """Check if text contains any glossary terms.
        
        Args:
            text: Text to check for glossary terms
            
        Returns:
            True if any glossary terms are found, False otherwise
        """
        if not self.glossary_terms:
            return False
        
        # Create patterns for each glossary term
        for term in self.glossary_terms:
            if not term.strip():
                continue
            
            # Escape special regex characters
            escaped_term = re.escape(term)
            
            # Create pattern with word boundaries to avoid partial matches
            if self.case_insensitive:
                pattern = re.compile(r'\b' + escaped_term + r'\b', re.IGNORECASE)
            else:
                pattern = re.compile(r'\b' + escaped_term + r'\b')
            
            # Check if pattern matches
            if pattern.search(text):
                return True
        
        return False


def load_glossary_file(filepath: str) -> List[str]:
    """Load glossary terms from a file.
    
    Args:
        filepath: Path to glossary file (one term per line)
        
    Returns:
        List of glossary terms
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            terms = []
            for line in f:
                term = line.strip()
                if term and not term.startswith('#'):  # Allow comments
                    terms.append(term)
            return terms
    except FileNotFoundError:
        print(f"Warning: Glossary file not found: {filepath}")
        return []
    except Exception as e:
        print(f"Warning: Error reading glossary file {filepath}: {e}")
        return []