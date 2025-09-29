import os
from dataclasses import dataclass
from dotenv import load_dotenv

# Attempt to load .env from project root
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), os.pardir, ".env"))


@dataclass
class AzureOpenAIConfig:
    endpoint: str
    api_key: str
    deployment: str
    api_version: str


def load_azure_config() -> AzureOpenAIConfig:
    return AzureOpenAIConfig(
        endpoint=os.getenv("AZURE_OPENAI_ENDPOINT", ""),
        api_key=os.getenv("AZURE_OPENAI_KEY", ""),
        deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT", ""),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview"),
    )
 