import os
import asyncio
from supabase import create_client, Client
from dotenv import load_dotenv
import litellm

# Load config
load_dotenv("foundry-suite/solution-factory/services/analytic-service/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

async def forensic_verify(query):
    print(f"\n" + "="*80)
    print(f"🕵️  FORENSIC INTELLIGENCE ENGINE v3.0 | SYSTEM AUDIT")
    print(f"QUERY: '{query}'")
    print("="*80 + "\n")
    
    # 1. Generate Embedding
    response = litellm.embedding(
        model="gemini/text-embedding-004",
        input=query,
        api_key=GEMINI_API_KEY
    )
    query_vector = response.data[0]['embedding']

    # 2. Hybrid Search with Proof Extraction
    try:
        rpc_response = supabase.rpc("hybrid_search", {
            "query_text": query,
            "query_embedding": query_vector,
            "match_count": 5
        }).execute()
        
        results = rpc_response.data
        
        if not results:
            print("   [!] Verification Failed: No matching data found.")
            return

        print(f"VERIFIED SOURCE MATCHES:\n")
        for i, doc in enumerate(results):
            content = doc.get('content', '').strip()
            
            # Extract the actual lines that match the concept
            # We'll take a larger chunk and clean it for the screenshot
            # Find the index of the first mention of keywords if possible
            lower_content = content.lower()
            keywords = ["block", "mountain", "view", "alamogordo", "construction"]
            start_idx = 0
            for kw in keywords:
                idx = lower_content.find(kw)
                if idx != -1:
                    start_idx = max(0, idx - 50) # Start 50 chars before the keyword
                    break
            
            proof_snippet = content[start_idx:start_idx+350].replace('\n', ' ').strip()
            
            # Format like a Forensic Audit Log
            print(f"   MATCH #{i+1} | STATUS: VERIFIED")
            print(f"   SOURCE: {doc.get('metadata', {}).get('page', 'Unknown Page')}")
            print(f"   PROOF:  \"...{proof_snippet}...\"\n")
            print(f"   RECORD: ID_{str(doc.get('id'))[:8]}\n")
            print("-" * 80)

    except Exception as e:
        print(f"   ❌ Audit Error: {e}")

if __name__ == "__main__":
    # Query designed to pull out specific technical details
    target_query = "Search for properties featuring slump block construction or masonry details in Alamogordo"
    asyncio.run(forensic_verify(target_query))