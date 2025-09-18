# PowerShell script to translate ALL SRT files with Greek matching terms

# Make sure you have set your OpenAI API key in the .env file first!
# Edit .env and replace 'your_openai_api_key_here' with your actual API key

# Change to the project directory
Set-Location "c:\Users\Ntamas\Desktop\Personal\srt-translator"

# Run the translation command - BATCH MODE for all SRT files
& "C:/Users/Ntamas/AppData/Local/Microsoft/WindowsApps/python3.13.exe" -m srt_chatgpt_translator.cli `
    --input-dir "data\subtitles" `
    --output-dir "data\translated" `
    --src en `
    --tgt el `
    --matching "data\matching\DemonSlayerToEl.txt" `
    --matching-ci `
    --translator-name "Ntamas"

Write-Host "Translation completed! Check the output files in data\translated\"