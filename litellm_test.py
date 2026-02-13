import litellm
import os
from dotenv import load_dotenv

load_dotenv("/home/blitz/monetization/foundry-suite/solution-factory/services/analytic-service/.env")

# litellm expects ZHIPUAI_API_KEY for 'zai/' models
api_key = os.getenv("ZHIPUAI_API_KEY")
print(f"Testing ZhipuAI with key: {api_key[:5]}...{api_key[-5:]}")

try:
    response = litellm.completion(
        model="openai/glm-4.6v-flash", 
        messages=[{"role": "user", "content": "Say 'GLM Active' if you can hear me."}],
        api_key=api_key,
        api_base="https://open.bigmodel.cn/api/paas/v4/"
    )
    print(f"Response: {response.choices[0].message.content}")
except Exception as e:
    print(f"❌ GLM Test Failed: {e}")
