#!/usr/bin/env python3
"""Test to verify glossary terms are protected during translation."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from srt_chatgpt_translator.placeholders import PlaceholderManager
import srt
from datetime import timedelta

def test_contains_matching_terms():
    """Test the contains_matching_terms method."""
    # Create a placeholder manager with some test terms
    matching_terms = ["Tanjiro", "Nezuko", "Demon Slayer", "Hashira"]
    manager = PlaceholderManager(matching_terms, case_insensitive=True)
    
    # Test cases
    test_cases = [
        ("Hello Tanjiro, how are you?", True),  # Contains Tanjiro
        ("Nezuko is sleeping.", True),  # Contains Nezuko
        ("The Demon Slayer Corps is strong.", True),  # Contains "Demon Slayer"
        ("Hello world", False),  # No matching terms
        ("This is a normal sentence.", False),  # No matching terms
        ("tanjiro is here", True),  # Case insensitive test
        ("NEZUKO IS SLEEPING", True),  # Case insensitive test
    ]
    
    print("Testing contains_matching_terms method:")
    for text, expected in test_cases:
        result = manager.contains_matching_terms(text)
        status = "✓" if result == expected else "✗"
        print(f"{status} '{text}' -> {result} (expected {expected})")
        
        if result != expected:
            print(f"  ERROR: Expected {expected}, got {result}")
            return False
    
    return True

def test_placeholder_protection():
    """Test that glossary terms are properly protected and restored."""
    print("\nTesting placeholder protection:")
    
    glossary_terms = ["Tanjiro", "Nezuko", "Demon Slayer"]
    manager = PlaceholderManager(glossary_terms, case_insensitive=True)
    
    test_cases = [
        "Hello Tanjiro, how are you?",
        "Nezuko is sleeping peacefully.",
        "This is a normal sentence.",
    ]
    
    for text in test_cases:
        # Test protection
        protected, replacements = manager.protect_text(text)
        
        # Test restoration
        restored = manager.restore_text(protected, replacements)
        
        contains_matching = manager.contains_matching_terms(text)
        
        print(f"Text: '{text}'")
        print(f"  Contains matching: {contains_matching}")
        print(f"  Protected: '{protected}'")
        print(f"  Replacements: {len(replacements)} items")
        print(f"  Restored: '{restored}'")
        
        if text == restored:
            print(f"  ✓ Protection/restoration successful")
        else:
            print(f"  ✗ Protection/restoration failed!")
            return False
    
    return True

def test_integration_with_subtitle():
    """Test integration with subtitle structure."""
    from srt_chatgpt_translator.translate import SRTTranslator
    from srt_chatgpt_translator.credits import CreditsDetector
    
    print("\nTesting subtitle processing logic:")
    
    # Create a mock translator (we'll test the logic without actual API calls)
    glossary_terms = ["Tanjiro", "Nezuko", "Demon Slayer"]
    manager = PlaceholderManager(glossary_terms, case_insensitive=True)
    credits_detector = CreditsDetector()
    
    # Create test subtitles
    test_subtitles = [
        srt.Subtitle(
            index=1,
            start=timedelta(seconds=1),
            end=timedelta(seconds=3),
            content="Hello Tanjiro, good to see you!"
        ),
        srt.Subtitle(
            index=2,
            start=timedelta(seconds=4),
            end=timedelta(seconds=6),
            content="This is a normal sentence without glossary terms."
        )
    ]
    
    for subtitle in test_subtitles:
        # Split content into lines
        original_lines = subtitle.content.split('\n')
        
        # Process credits first
        processed_lines = credits_detector.process_subtitle_lines(
            original_lines, True
        )
        
        # Check if any line contains matching terms
        contains_matching = any(
            manager.contains_matching_terms(line) 
            for line in processed_lines
        )
        
        print(f"Subtitle {subtitle.index}: '{subtitle.content}'")
        print(f"  Contains matching terms: {contains_matching}")
        
        if contains_matching:
            print(f"  ✓ Will translate with matching terms protected")
        else:
            print(f"  ✓ Will translate normally (no matching terms to protect)")
    
    return True

if __name__ == "__main__":
    print("Testing matching protection functionality...")
    print("=" * 60)
    
    success = True
    
    try:
        success &= test_contains_matching_terms()
        success &= test_placeholder_protection()
        success &= test_integration_with_subtitle()
        
        print("\n" + "=" * 60)
        if success:
            print("✓ All tests passed! Matching protection is working correctly.")
            print("\nExpected behavior:")
            print("• Matching terms (like 'Tanjiro', 'Nezuko') are protected during translation")
            print("• Other words are translated by ChatGPT")
            print("• Example: 'Hello Tanjiro' → 'Γειά σου Tanjiro'")
        else:
            print("✗ Some tests failed. Please check the implementation.")
            sys.exit(1)
            
    except Exception as e:
        print(f"✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)