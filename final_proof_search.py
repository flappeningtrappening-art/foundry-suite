import os
import asyncio
import json
from supabase import create_client, Client
from dotenv import load_dotenv
import litellm

# Load config
load_dotenv("foundry-suite/solution-factory/services/analytic-service/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

async def run_final_proof(query):
    print(f"\n📡 REAL ESTATE INTELLIGENCE QUERY: '{query}'")
    
    # 1. Generate Embedding
    response = litellm.embedding(
        model="gemini/text-embedding-004",
        input=query,
        api_key=GEMINI_API_KEY
    )
    query_vector = response.data[0]['embedding']

    # 2. Hybrid Search
    try:
        rpc_response = supabase.rpc("hybrid_search", {
            "query_text": query,
            "query_embedding": query_vector,
            "match_count": 5
        }).execute()
        
        results = rpc_response.data
        
        if not results:
            print("   (No matching properties found)")
            return

        print(f"   ✅ Found {len(results)} high-confidence matches:\n")
        for i, doc in enumerate(results):
            content = doc.get('content', '')
            # Clean snippet for professional display
            clean_snippet = content[:250].replace('\n', ' ').strip()
            print(f"   [{i+1}] {clean_snippet}...")
            print(f"       Source Record ID: {doc.get('id')}\n")

    except Exception as e:
        print(f"   ❌ Search Error: {e}")

if __name__ == "__main__":
    # The ultimate "Group 3" query
    target_query = "Find properties in Alamogordo with slump block construction and mountain views"
    asyncio.run(run_final_proof(target_query))
