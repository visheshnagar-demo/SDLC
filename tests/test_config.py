import pytest
from server.config import Settings


def test_allowed_origins_default():
    settings = Settings()
    assert isinstance(settings.ALLOWED_ORIGINS, list)
    assert len(settings.ALLOWED_ORIGINS) > 0


def test_allowed_origins_empty_string():
    settings = Settings(ALLOWED_ORIGINS="")
    assert settings.ALLOWED_ORIGINS == []


def test_allowed_origins_comma_separated():
    settings = Settings(ALLOWED_ORIGINS="http://localhost:8000, https://example.com")
    assert settings.ALLOWED_ORIGINS == ["http://localhost:8000", "https://example.com"]


def test_allowed_origins_json_list():
    settings = Settings(ALLOWED_ORIGINS='["http://localhost:3000", "https://app.example.com"]')
    assert settings.ALLOWED_ORIGINS == ["http://localhost:3000", "https://app.example.com"]


def test_allowed_origins_python_list():
    settings = Settings(ALLOWED_ORIGINS=["http://site1.com", "http://site2.com"])
    assert settings.ALLOWED_ORIGINS == ["http://site1.com", "http://site2.com"]
