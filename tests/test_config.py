from server.config import Settings


def test_allowed_origins_default():
    settings = Settings(_env_file=None)
    assert "http://localhost:5173" in settings.ALLOWED_ORIGINS
    assert "http://localhost:3000" in settings.ALLOWED_ORIGINS


def test_allowed_origins_comma_separated():
    settings = Settings(_env_file=None, ALLOWED_ORIGINS="http://example.com, https://app.example.com")
    assert settings.ALLOWED_ORIGINS == ["http://example.com", "https://app.example.com"]


def test_allowed_origins_wildcard():
    settings = Settings(_env_file=None, ALLOWED_ORIGINS="*")
    assert settings.ALLOWED_ORIGINS == ["*"]


def test_allowed_origins_single_string():
    settings = Settings(_env_file=None, ALLOWED_ORIGINS="http://localhost:3000")
    assert settings.ALLOWED_ORIGINS == ["http://localhost:3000"]


def test_allowed_origins_empty_string():
    settings = Settings(_env_file=None, ALLOWED_ORIGINS="")
    assert settings.ALLOWED_ORIGINS == []


def test_allowed_origins_json_list():
    settings = Settings(_env_file=None, ALLOWED_ORIGINS='["http://localhost:5173", "http://localhost:3000"]')
    assert settings.ALLOWED_ORIGINS == ["http://localhost:5173", "http://localhost:3000"]


def test_allowed_origins_python_list():
    settings = Settings(_env_file=None, ALLOWED_ORIGINS=["http://site1.com", "http://site2.com"])
    assert settings.ALLOWED_ORIGINS == ["http://site1.com", "http://site2.com"]
