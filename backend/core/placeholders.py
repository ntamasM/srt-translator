"""Placeholder management for protecting tags and matching terms during translation."""

import re
from typing import Dict, List, Set, Tuple


class PlaceholderManager:
    """Manages placeholders for HTML tags and matching terms to protect them during translation."""
    
    def __init__(self, matching_terms: List[str] = None, case_insensitive: bool = False, 
                 replacement_mapping: Dict[str, str] = None):
        """Initialize the placeholder manager.
        
        Args:
            matching_terms: List of terms to protect from translation
            case_insensitive: Whether matching should be case-insensitive
            replacement_mapping: Dictionary for post-translation word replacements
        """
        self.case_insensitive = case_insensitive
        unique_terms = {
            term.strip() for term in (matching_terms or []) if term and term.strip()
        }
        # Deterministic order: longest first, then lexical order.
        self.matching_terms = sorted(unique_terms, key=lambda t: (-len(t), t.lower(), t))
        self.replacement_mapping = replacement_mapping or {}
        
        # If case insensitive, create lowercase lookup set
        if self.case_insensitive:
            self.matching_lookup = {term.lower() for term in self.matching_terms}
        else:
            self.matching_lookup = set(self.matching_terms)
        
        # Regex for HTML-like tags
        self.tag_pattern = re.compile(r'<[^>]*>')
        
        # Regex for HTML entities
        self.entity_pattern = re.compile(r'&[a-zA-Z0-9#]+;')
        
        # Placeholder patterns
        self.tag_placeholder = "HTMLTAG_{}"
        self.entity_placeholder = "HTMLENTITY_{}"
        self.matching_placeholder = "MATCHINGTERM_{}"
    
    def protect_text(self, text: str) -> Tuple[str, Dict[str, str]]:
        """Protect HTML tags, entities, and matching terms with placeholders.
        
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
        
        # Protect matching terms
        protected_text, _, _ = self._protect_matching_terms(
            protected_text, replacements, counter
        )

        return protected_text, replacements

    def protect_text_with_counter(self, text: str, start_counter: int) -> Tuple[str, Dict[str, str], int]:
        """Protect text and return the next available counter.

        This is used for batched translation flows where placeholders must be
        unique across many lines/subtitles.
        """
        protected_text = text
        replacements = {}
        counter = start_counter

        for match in self.tag_pattern.finditer(text):
            tag = match.group(0)
            placeholder = self.tag_placeholder.format(counter)
            replacements[placeholder] = tag
            protected_text = protected_text.replace(tag, placeholder, 1)
            counter += 1

        for match in self.entity_pattern.finditer(text):
            entity = match.group(0)
            placeholder = self.entity_placeholder.format(counter)
            replacements[placeholder] = entity
            protected_text = protected_text.replace(entity, placeholder, 1)
            counter += 1

        protected_text, replacements, counter = self._protect_matching_terms(
            protected_text, replacements, counter
        )
        return protected_text, replacements, counter
    
    def restore_text(self, text: str, replacements: Dict[str, str]) -> str:
        """Restore protected content from placeholders.
        
        Args:
            text: Text with placeholders
            replacements: Map of placeholder -> original content
            
        Returns:
            Text with original content restored
        """
        restored_text = text
        
        # Replace longer placeholders first to avoid prefix collisions
        # (e.g., MATCHINGTERM_1 inside MATCHINGTERM_10).
        for placeholder in sorted(replacements.keys(), key=len, reverse=True):
            original = replacements[placeholder]
            restored_text = restored_text.replace(placeholder, original)
        
        return restored_text
    
    def _build_boundary_pattern(self, escaped_term: str) -> re.Pattern:
        """Build a boundary-safe regex pattern for exact term matching.

        Uses Unicode-aware non-word boundaries instead of ``\b`` for better
        behavior across punctuation and multi-script subtitles.
        """
        if self.case_insensitive:
            return re.compile(r'(?<!\w)' + escaped_term + r'(?!\w)', re.IGNORECASE)
        return re.compile(r'(?<!\w)' + escaped_term + r'(?!\w)')

    def _protect_matching_terms(self, text: str, replacements: Dict[str, str],
                               start_counter: int) -> Tuple[str, Dict[str, str], int]:
        """Protect matching terms with placeholders.
        
        Args:
            text: Text to process
            replacements: Existing replacements dict to update
            start_counter: Starting counter for new placeholders
            
        Returns:
            Text with matching terms protected
        """
        if not self.matching_terms:
            return text, replacements, start_counter
        
        protected_text = text
        counter = start_counter
        
        # Create patterns for each matching term
        for term in self.matching_terms:
            if not term.strip():
                continue
            
            # Escape special regex characters
            escaped_term = re.escape(term)
            
            pattern = self._build_boundary_pattern(escaped_term)
            
            # Find all matches
            matches = list(pattern.finditer(protected_text))
            
            # Replace from end to start to preserve positions
            for match in reversed(matches):
                matched_text = match.group(0)
                placeholder = self.matching_placeholder.format(counter)
                replacements[placeholder] = matched_text
                
                start, end = match.span()
                protected_text = protected_text[:start] + placeholder + protected_text[end:]
                counter += 1
        
        return protected_text, replacements, counter

    def contains_matching_terms(self, text: str) -> bool:
        """Check if text contains any matching terms.
        
        Args:
            text: Text to check for matching terms
            
        Returns:
            True if any matching terms are found, False otherwise
        """
        if not self.matching_terms:
            return False
        
        # Create patterns for each matching term
        for term in self.matching_terms:
            if not term.strip():
                continue
            
            # Escape special regex characters
            escaped_term = re.escape(term)
            
            pattern = self._build_boundary_pattern(escaped_term)
            
            # Check if pattern matches
            if pattern.search(text):
                return True
        
        return False

    def apply_replacements(self, text: str) -> str:
        """Apply post-translation word replacements.
        
        Args:
            text: Translated text to apply replacements to
            
        Returns:
            Text with replacements applied
        """
        if not self.replacement_mapping:
            return text
        
        result_text = text
        
        # Apply replacements in order of longest to shortest to avoid partial replacements
        sorted_replacements = sorted(self.replacement_mapping.items(), 
                                   key=lambda x: len(x[0]), reverse=True)
        
        for source_term, target_term in sorted_replacements:
            if not source_term.strip() or not target_term.strip():
                continue
            
            # Escape special regex characters in source term
            escaped_source = re.escape(source_term)
            
            pattern = self._build_boundary_pattern(escaped_source)
            
            # Replace all occurrences
            result_text = pattern.sub(target_term, result_text)
        
        return result_text


def load_matching_file(filepath: str) -> List[str]:
    """Load matching terms from a file.
    
    Args:
        filepath: Path to matching file (one term per line)
        
    Returns:
        List of matching terms
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            terms = []
            for line in f:
                term = line.strip()
                if term and not term.startswith('#'):  # Allow comments
                    # Check if it's a replacement format (term1 --> term2)
                    if '-->' in term:
                        # Extract the source term (before -->)
                        source_term = term.split('-->', 1)[0].strip()
                        terms.append(source_term)
                    else:
                        terms.append(term)
            return terms
    except FileNotFoundError:
        print(f"Warning: Matching file not found: {filepath}")
        return []
    except Exception as e:
        print(f"Warning: Error reading matching file {filepath}: {e}")
        return []


def load_replacement_mapping(filepath: str) -> Dict[str, str]:
    """Load replacement mapping from a file with 'source --> target' format.
    
    Args:
        filepath: Path to matching file with replacement format
        
    Returns:
        Dictionary mapping source terms to target terms
    """
    replacements = {}
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line or line.startswith('#'):  # Skip empty lines and comments
                    continue
                
                if '-->' in line:
                    parts = line.split('-->', 1)  # Split only on first occurrence
                    if len(parts) == 2:
                        source = parts[0].strip()
                        target = parts[1].strip()
                        if source and target:
                            replacements[source] = target
                    else:
                        print(f"Warning: Invalid format in {filepath} line {line_num}: {line}")
                else:
                    print(f"Warning: No '-->' found in {filepath} line {line_num}: {line}")
        
        print(f"Loaded {len(replacements)} replacement mappings from {filepath}")
        return replacements
        
    except FileNotFoundError:
        print(f"Warning: Replacement file not found: {filepath}")
        return {}
    except Exception as e:
        print(f"Warning: Error reading replacement file {filepath}: {e}")
        return {}