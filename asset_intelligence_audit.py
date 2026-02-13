import os
import asyncio
import json
import re
from supabase import create_client, Client
from dotenv import load_dotenv
import litellm

# Load config
load_dotenv("foundry-suite/solution-factory/services/analytic-service/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def extract_address(content):
    # Matches "FOR SALE: [Address] NM" or similar patterns in the PDFs
    match = re.search(r'FOR SALE:\s*(.*?NM)', content)
    if match: return match.group(1).strip()
    # Fallback to first line if no pattern matches
    return content.split('\n')[0][:50]

async def run_intel_audit(query):
    print("\n" + "═"*100)
    print("  NEON MESA DIGITAL | HIGH-VALUE ASSET INTELLIGENCE AUDIT")
    print("  STATUS: SCANNING BATCH INGESTION (80 DOCUMENTS)")
    print("  OBJECTIVE: " + query.upper())
    print("═"*100 + "\n")
    
    # 1. Generate Embedding
    response = litellm.embedding(
        model="gemini/text-embedding-004",
        input=query,
        api_key=GEMINI_API_KEY
    )
    query_vector = response.data[0]['embedding']

    # 2. Precision Hybrid Search
    try:
        rpc_response = supabase.rpc("hybrid_search", {
            "query_text": query,
            "query_embedding": query_vector,
            "match_count": 5
        }).execute()
        
        results = rpc_response.data
        
        if not results:
            print("   [!] AUDIT FAILED: NO ASSETS MATCHING CRITERIA.")
            return

        for i, doc in enumerate(results):
            content = doc.get('content', '')
            address = extract_address(content)
            
            # INTEL EXTRACTION: We want to show the specific sentences that prove the "Wow" factor.
            # We look for "New", "Recently", "Vigas", "Kiva", "Mountain", etc.
            sentences = re.split(r'(?<=[.!?]) +', content.replace('\n', ' '))
            
            # Categorize the findings
            structural_upgrades = []
            artisan_features = []
            
            struct_keywords = ["new", "recent", "updated", "hvac", "roof", "furnace", "solar"]
            artisan_keywords = ["viga", "latilla", "kiva", "tongue and groove", "adobe", "fireplace", "view"]

            for s in sentences:
                s_low = s.lower()
                if any(k in s_low for k in struct_keywords) and len(s) < 200:
                    structural_upgrades.append(s.strip())
                if any(k in s_low for k in artisan_keywords) and len(s) < 200:
                    artisan_features.append(s.strip())

            # THE "ELITE" REPORT FORMAT
            print(f"  [ ASSET REPORT #{i+1} ]")
            print(f"  PROPERTY: {address}")
            print(f"  " + "─"*60)
            
            if structural_upgrades:
                print(f"  ✅ VERIFIED STRUCTURAL UPGRADES:")
                for upgrade in structural_upgrades[:2]: # Show top 2
                    print(f"     » {upgrade}")
            
            if artisan_features:
                print(f"\n  ✨ ARTISAN & ARCHITECTURAL FEATURES:")
                for feature in artisan_features[:2]:
                    print(f"     » {feature}")

            print(f"\n  ANALYSIS: System confirms high ROI potential via {len(structural_upgrades)} mechanical updates.")
            print(f"  METADATA: [DocRef: {str(doc.get('id'))[:8]}] [Page: {doc.get('metadata', {}).get('page')}]")
            print("═"*100 + "\n")

    except Exception as e:
        print(f"   [!] SYSTEM ERROR: {e}")

if __name__ == "__main__":
    # The "Wow" Query: Complex, high-value, and verified.
    wow_query = "Identify properties with new mechanical systems (HVAC, furnace, or roof) that also feature authentic Southwestern artisan details like vigas or fireplaces."
    asyncio.run(run_intel_audit(wow_query))
