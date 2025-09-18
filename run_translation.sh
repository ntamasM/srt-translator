#!/bin/bash
# Translation command for Demon Slayer SRT file with Greek matching terms

# Make sure you have set your OpenAI API key in the .env file first!
# Edit .env and replace 'your_openai_api_key_here' with your actual API key

# The command to translate ALL subtitle files in the subtitles directory:
cd "c:\Users\Ntamas\Desktop\Personal\srt-translator"

# Using Python module directly - BATCH MODE for all SRT files
C:/Users/Ntamas/AppData/Local/Microsoft/WindowsApps/python3.13.exe -m srt_chatgpt_translator.cli \
  --input-dir "data\subtitles" \
  --output-dir "data\translated" \
  --src en \
  --tgt el \
  --matching "data\matching\DemonSlayerToEl.txt" \
  --matching-ci \
  --translator-name "Ntamas"