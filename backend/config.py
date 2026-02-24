"""Backend configuration — directory constants only.

Settings are now stored client-side in the browser's IndexedDB and sent
with each translation request. No server-side config file is needed.
"""

from pathlib import Path

# Resolve paths relative to the project root (one level up from backend/)
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"


def ensure_dirs() -> None:
    """Create data directories if they don't exist."""
    for sub in ("subtitles", "translated"):
        (DATA_DIR / sub).mkdir(parents=True, exist_ok=True)
