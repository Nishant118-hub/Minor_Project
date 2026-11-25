from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration loaded from environment variables or a local .env file."""

    port: int = 8000
    model_path: str = "models/risk_model.joblib"
    synthetic_model_path: str = "models/risk_model.synthetic.joblib"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
