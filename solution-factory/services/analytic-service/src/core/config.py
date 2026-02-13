from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # API Configuration
    PROJECT_NAME: str = "SPECTRE Analytic Service"
    API_V1_STR: str = "/api/v1"
    
    # Supabase Configuration
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    
    # AI Configuration
    GEMINI_API_KEY: str
    ZHIPUAI_API_KEY: Optional[str] = None
    ZHIPUAI_API_BASE: str = "https://open.bigmodel.cn/api/paas/v4/"
    DEFAULT_MODEL: str = "glm-4.6v-flash" # The Orchestrator (temporarily GLM)
    PROSECUTOR_MODEL: str = "glm-4.6v-flash"
    JUDGE_MODEL: str = "glm-4.6v-flash"
    
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
