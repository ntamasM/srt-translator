#!/usr/bin/env python3
"""Test the actual translation skipping with a mock OpenAI client."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import srt
from srt_chatgpt_translator.translate import SRTTranslator
from srt_chatgpt_translator.openai_client import OpenAITranslationClient

# Mock the OpenAI client to avoid actual API calls
class MockOpenAIClient(OpenAITranslationClient):
    def __init__(self):
        # Don't call parent __init__ to avoid API key requirement
        pass
    
    def translate_lines(self, lines, src_lang, tgt_lang):
        """Mock translation - just add '[TRANSLATED]' prefix to show it was processed."""
        return [f"[TRANSLATED] {line}" for line in lines]

def test_glossary_protection_integration():
    """Test that glossary terms are protected while other words are translated."""
    print("Testing glossary protection during translation...")
    
    # Create translator with glossary
    glossary_file = "../data/glossary/DemonSlayerGlossary.txt"
    
    # Create a mock translator
    translator = SRTTranslator(
        api_key="mock_key",  # Not used since we'll mock the client
        glossary_file=glossary_file,
        glossary_case_insensitive=True
    )
    
    # Replace the real client with our mock
    translator.client = MockOpenAIClient()
    
    # Read our test SRT file
    with open("test_sample.srt", 'r', encoding='utf-8') as f:
        content = f.read()
    
    subtitles = list(srt.parse(content))
    
    print(f"\nProcessing {len(subtitles)} test subtitles:")
    print("=" * 50)
    
    translated_subtitles = []
    for subtitle in subtitles:
        print(f"\nSubtitle {subtitle.index}: '{subtitle.content}'")
        
        # Check if contains glossary terms
        original_lines = subtitle.content.split('\n')
        processed_lines = translator.credits_detector.process_subtitle_lines(
            original_lines, translator.replace_credits
        )
        
        contains_glossary = any(
            translator.placeholder_manager.contains_glossary_terms(line) 
            for line in processed_lines
        )
        
        print(f"  Contains glossary terms: {contains_glossary}")
        
        # Translate the subtitle
        translated_subtitle = translator._translate_subtitle(subtitle, "en", "el")
        translated_subtitles.append(translated_subtitle)
        
        print(f"  Result: '{translated_subtitle.content}'")
        
        if contains_glossary:
            # Should contain both translated parts and preserved glossary terms
            # Check that glossary terms are preserved
            if "Tanjiro" in subtitle.content and "Tanjiro" in translated_subtitle.content:
                print(f"  ✓ Glossary term 'Tanjiro' preserved")
            elif "Nezuko" in subtitle.content and "Nezuko" in translated_subtitle.content:
                print(f"  ✓ Glossary term 'Nezuko' preserved")
            else:
                print(f"  ✗ ERROR: Glossary terms not preserved!")
                return False
                
            # Check that other words were translated (mock adds [TRANSLATED] prefix)
            if "[TRANSLATED]" in translated_subtitle.content:
                print(f"  ✓ Other words were translated")
            else:
                print(f"  ✗ ERROR: Other words were not translated!")
                return False
        else:
            # Should be fully translated (mock adds [TRANSLATED] prefix)
            if "[TRANSLATED]" in translated_subtitle.content:
                print(f"  ✓ Fully translated (no glossary terms)")
            else:
                print(f"  ✗ ERROR: Translation failed!")
                return False
    
    print("\n" + "=" * 50)
    print("✓ Glossary protection working correctly!")
    return True

if __name__ == "__main__":
    try:
        success = test_glossary_protection_integration()
        if not success:
            sys.exit(1)
    except Exception as e:
        print(f"✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)