from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "RakshaSakhi"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: list[str] = ["*"]

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()
