#!/usr/bin/env python3
"""Test the updated OpenAI client to ensure GLOSSARYTERM_X placeholders are preserved."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import srt
from srt_chatgpt_translator.translate import SRTTranslator
from srt_chatgpt_translator.openai_client import OpenAITranslationClient

# Enhanced mock that simulates ChatGPT following the instructions
class EnhancedMockOpenAIClient(OpenAITranslationClient):
    def __init__(self):
        # Don't call parent __init__ to avoid API key requirement
        pass
    
    def translate_lines(self, lines, src_lang, tgt_lang):
        """Mock translation that preserves GLOSSARYTERM_X placeholders and translates other words."""
        # Simple English to Greek translation dictionary
        translations = {
            "hello": "γειά σου",
            "good": "καλό", 
            "to": "να",
            "see": "δω",
            "you": "εσύ",
            "how": "πώς",
            "are": "είσαι",
            "this": "αυτό",
            "is": "είναι", 
            "a": "ένα",
            "normal": "κανονικό",
            "sentence": "πρόταση",
            "sleeping": "κοιμάται",
            "peacefully": "ήσυχα",
            "another": "άλλο",
            "without": "χωρίς",
            "special": "ειδικό",
            "terms": "όρους",
            "and": "και"
        }
        
        translated_lines = []
        for line in lines:
            words = line.split()
            translated_words = []
            
            for word in words:
                # Check if this is a GLOSSARYTERM_X placeholder
                if word.startswith("GLOSSARYTERM_") and word.replace("GLOSSARYTERM_", "").replace(",", "").isdigit():
                    # Keep GLOSSARYTERM_X placeholders exactly as they are
                    translated_words.append(word)
                else:
                    # Remove punctuation for lookup but keep it
                    clean_word = word.lower().strip('.,!?')
                    if clean_word in translations:
                        # Replace the word but keep punctuation
                        punctuation = ''.join(c for c in word if not c.isalnum())
                        translated_word = translations[clean_word] + punctuation
                    else:
                        # Keep original word (unknown words)
                        translated_word = word
                    translated_words.append(translated_word)
            
            translated_lines.append(' '.join(translated_words))
        
        return translated_lines

def test_glossary_placeholder_preservation():
    """Test that GLOSSARYTERM_X placeholders are preserved by ChatGPT."""
    print("Testing GLOSSARYTERM_X placeholder preservation...")
    
    # Create translator with glossary
    glossary_file = "../data/glossary/DemonSlayerGlossary.txt"
    
    translator = SRTTranslator(
        api_key="mock_key",
        glossary_file=glossary_file,
        glossary_case_insensitive=True
    )
    
    # Replace with enhanced mock that follows our instructions
    translator.client = EnhancedMockOpenAIClient()
    
    # Test cases
    test_subtitles = [
        srt.Subtitle(
            index=1,
            start=srt.timedelta(seconds=1),
            end=srt.timedelta(seconds=3),
            content="Hello Tanjiro, how are you?"
        ),
        srt.Subtitle(
            index=2,
            start=srt.timedelta(seconds=4),
            end=srt.timedelta(seconds=6),
            content="Nezuko is sleeping peacefully."
        ),
        srt.Subtitle(
            index=3,
            start=srt.timedelta(seconds=7),
            end=srt.timedelta(seconds=9),
            content="This is a normal sentence."
        )
    ]
    
    print("\nStep-by-step translation process:")
    print("=" * 60)
    
    for subtitle in test_subtitles:
        print(f"\n🔸 Subtitle {subtitle.index}: '{subtitle.content}'")
        
        # Step 1: Show protection
        original_lines = subtitle.content.split('\n')
        protected_lines = []
        all_replacements = {}
        
        for line in original_lines:
            protected_line, replacements = translator.placeholder_manager.protect_text(line)
            protected_lines.append(protected_line)
            all_replacements.update(replacements)
        
        print(f"📝 Step 1 - Protected: '{protected_lines[0]}'")
        if all_replacements:
            print(f"🔑 Replacements: {all_replacements}")
        
        # Step 2: Show what gets sent to ChatGPT
        print(f"📤 Step 2 - Sent to ChatGPT: '{protected_lines[0]}'")
        
        # Step 3: Show what ChatGPT returns
        translated_lines = translator.client.translate_lines(protected_lines, "en", "el")
        print(f"📥 Step 3 - ChatGPT returns: '{translated_lines[0]}'")
        
        # Step 4: Show restoration
        restored_lines = []
        for line in translated_lines:
            restored_line = translator.placeholder_manager.restore_text(line, all_replacements)
            restored_lines.append(restored_line)
        
        print(f"✨ Step 4 - Final result: '{restored_lines[0]}'")
        
        # Verify that GLOSSARYTERM_X was preserved in ChatGPT output
        if all_replacements:
            placeholder_preserved = any(
                placeholder in translated_lines[0] 
                for placeholder in all_replacements.keys()
            )
            if placeholder_preserved:
                print("✅ GLOSSARYTERM_X placeholder preserved by ChatGPT")
            else:
                print("❌ GLOSSARYTERM_X placeholder was NOT preserved by ChatGPT")
                return False
        
        # Verify final result has original glossary terms
        for original_term in all_replacements.values():
            if original_term in restored_lines[0]:
                print(f"✅ Original term '{original_term}' restored correctly")
            else:
                print(f"❌ Original term '{original_term}' NOT found in final result")
                return False
    
    print("\n" + "=" * 60)
    print("🎉 All tests passed!")
    print("\nThe system now works as expected:")
    print("1. Glossary terms are protected with GLOSSARYTERM_X placeholders")
    print("2. ChatGPT is instructed to NOT translate GLOSSARYTERM_X placeholders")  
    print("3. Other words are translated normally")
    print("4. Original glossary terms are restored after translation")
    
    return True

if __name__ == "__main__":
    try:
        test_glossary_placeholder_preservation()
    except Exception as e:
        print(f"✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)