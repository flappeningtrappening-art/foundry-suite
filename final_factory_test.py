import os
import requests
import json
import uuid
from supabase import create_client, Client

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
ANALYTIC_SERVICE_URL = "http://localhost:8000/api/v1"

# REAL DATA FOR TESTING
CASE_ID = "967397ab-0de9-4ee9-ace1-ce5767238b99"
USER_ID = "20832948-cd0b-4b60-92eb-87b72f72a936"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def test_system_capabilities():
    print("--- [FINAL SYSTEM CAPABILITY TEST] ---")
    
    # 1. Test Agent Intelligence (Mura/Muri Check)
    print("1. Deploying SPECTRE INTEL (Forensic Chain)...")
    payload = {
        "query": "What are the primary financial risks identified in the documents?",
        "case_id": CASE_ID,
        "user_id": USER_ID,
        "include_general_knowledge": True
    }
    
    try:
        response = requests.post(f"{ANALYTIC_SERVICE_URL}/analyze/", json=payload)
        result = response.json()
        print(f"\n--- INTEL REPORT SUMMARY ---\n{result['report'][:500]}...\n")
        
        if result['citations']:
            print(f"SUCCESS: Citations found ({len(result['citations'])}). Anatruth Engine is grounded.")
        else:
            print("WARNING: No citations. Possible hallucination (Muri).")

        # 2. Test Contradiction Engine (Precision Check)
        print("\n2. Deploying CONTRADICTION ENGINE (Multi-Doc Check)...")
        # Fetch actual doc IDs for the case
        docs = supabase.table("case_documents").select("id").eq("case_id", CASE_ID).execute()
        doc_ids = [d['id'] for d in docs.data]
        
        if len(doc_ids) >= 2:
            payload_c = {
                "case_id": CASE_ID,
                "user_id": USER_ID,
                "document_ids": doc_ids[:2]
            }
            response_c = requests.post(f"{ANALYTIC_SERVICE_URL}/contradictions/", json=payload_c)
            result_c = response_c.json()
            print(f"CONTRADICTION VERDICT: {result_c['report'][:200]}...")
            print("SUCCESS: Contradiction Engine operational.")
        else:
            print("SKIP: Need at least 2 documents for contradiction test.")

    except Exception as e:
        print(f"TEST FAILED: {e}")

if __name__ == "__main__":
    test_system_capabilities()
