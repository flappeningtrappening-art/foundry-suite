import litellm
import os
from dotenv import load_dotenv

# Path to the analytic-service .env
load_dotenv("/home/blitz/monetization/foundry-suite/solution-factory/services/analytic-service/.env")

api_key = os.getenv("ZHIPUAI_API_KEY")
api_base = "https://open.bigmodel.cn/api/paas/v4/"
model = "glm-4.6v-flash"

print(f"Testing GLM Connection...")
print(f"Model: {model}")
print(f"Base: {api_base}")

try:
    response = litellm.completion(
        model=model, 
        messages=[{"role": "user", "content": "Confirm your identity and status."}],
        api_key=api_key,
        api_base=api_base,
        custom_llm_provider="openai"
    )
    print(f"SUCCESS!")
    print(f"Response: {response.choices[0].message.content}")
except Exception as e:
    print(f"❌ Connection Failed: {e}")
