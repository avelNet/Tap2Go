

class Settings(BaseSettings):
    database_url: PostgresDsn
    redis_url: RedisDsn
    secret_key: str = Field(min_length=32)
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    jwt_refresh_token_expire_days: int = 30
    
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:8080"
    ]

settings = Settings()