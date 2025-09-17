"""Test configuration and shared fixtures."""

import pytest
from unittest.mock import Mock, MagicMock
import srt
from datetime import timedelta


@pytest.fixture
def sample_subtitle():
    """Create a sample subtitle for testing."""
    return srt.Subtitle(
        index=1,
        start=timedelta(seconds=1),
        end=timedelta(seconds=3),
        content="Hello <i>world</i>!"
    )


@pytest.fixture
def sample_subtitles():
    """Create a list of sample subtitles for testing."""
    return [
        srt.Subtitle(
            index=1,
            start=timedelta(seconds=1),
            end=timedelta(seconds=3),
            content="First subtitle"
        ),
        srt.Subtitle(
            index=2,
            start=timedelta(seconds=4),
            end=timedelta(seconds=6),
            content="Second subtitle"
        ),
        srt.Subtitle(
            index=3,
            start=timedelta(seconds=7),
            end=timedelta(seconds=9),
            content="Third subtitle"
        )
    ]


@pytest.fixture
def mock_openai_client():
    """Create a mock OpenAI client."""
    mock = Mock()
    mock.translate_lines.return_value = ["Translated line"]
    return mock


@pytest.fixture
def sample_glossary_terms():
    """Create sample glossary terms for testing."""
    return ["Tokyo", "Kyoto", "sensei", "Tanaka-san", "anime"]