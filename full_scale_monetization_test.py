import os
import requests
import json
import uuid
from supabase import create_client, Client

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
ANALYTIC_SERVICE_URL = "http://127.0.0.1:8000/api/v1"

# REAL DATA FOR TESTING
TEST_CASE_ID = str(uuid.uuid4())
USER_ID = "20832948-cd0b-4b60-92eb-87b72f72a936"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def setup_test_data():
    print(f"Setting up test case {TEST_CASE_ID}...")
    
    # 0. Create the case first (Foreign Key constraint)
    supabase.table("analysis_cases").insert({
        "id": TEST_CASE_ID,
        "user_id": USER_ID,
        "name": "Full Scale Monetization Test Case"
    }).execute()

    # 1. Find existing sections from two different documents
    sections = supabase.table("document_sections").select("*").limit(20).execute().data
    
    if not sections:
        print("No sections found to copy. Make sure there is data in document_sections.")
        return False
        
    # 2. Duplicate them into our new test case
    # This simulates having multiple documents in one case
    new_sections = []
    for i, s in enumerate(sections):
        new_sections.append({
            "case_id": TEST_CASE_ID,
            "user_id": USER_ID,
            "document_id": s['document_id'], # We keep the original doc ID to simulate different files
            "content": s['content'],
            "embedding": s['embedding'],
            "metadata": s['metadata']
        })
        
    supabase.table("document_sections").insert(new_sections).execute()
    print(f"Copied {len(new_sections)} sections into test case.")
    return True

def test_forensic_marketing():
    print("\n--- [TEST: REAL ESTATE FACTORY (Forensic Marketing)] ---")
    address = "742 Evergreen Terrace"
    features = "Pink house, two car garage, near nuclear plant, friendly neighbors"
    
    forensic_query = f"""
      TASK: Write a high-end, compelling real estate listing description for the property at {address}.
      
      PROPERTY DATA (Manual):
      - Price: $450,000
      - Manual Features: {features}
      
      FORENSIC GOAL: 
      1. Cross-reference the manual features above with the uploaded forensic documents.
      2. Find value-adds or risks.
      
      OUTPUT FORMAT: Catchy headline, 200 words copy, source citations.
    """
    
    payload = {
        "query": forensic_query,
        "case_id": TEST_CASE_ID,
        "user_id": USER_ID
    }
    
    response = requests.post(f"{ANALYTIC_SERVICE_URL}/analyze/", json=payload)
    result = response.json()
    print(f"LISTING RESULT:\n{result['report'][:1000]}\n")
    if result['citations']:
        print(f"SUCCESS: Grounded in {len(result['citations'])} forensic sources.")

def test_contradiction_engine():
    print("\n--- [TEST: CONTRADICTION ENGINE] ---")
    
    # Get the document IDs we just used
    docs = supabase.table("document_sections").select("document_id").eq("case_id", TEST_CASE_ID).execute().data
    doc_ids = list(set([d['document_id'] for d in docs]))
    
    if len(doc_ids) < 2:
        print("SKIP: Need at least 2 documents for contradiction test.")
        return

    payload = {
        "case_id": TEST_CASE_ID,
        "user_id": USER_ID,
        "document_ids": doc_ids[:2]
    }
    
    response = requests.post(f"{ANALYTIC_SERVICE_URL}/contradictions/", json=payload)
    result = response.json()
    print(f"CONTRADICTION REPORT:\n{result['report'][:1000]}\n")

if __name__ == "__main__":
    if setup_test_data():
        test_forensic_marketing()
        test_contradiction_engine()
        print("\n--- FULL SCALE TEST COMPLETE ---")
