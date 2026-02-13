import os
import asyncio
import json
import httpx
from supabase import create_client, Client
from dotenv import load_dotenv

# Load config from analytic-service
load_dotenv("solution-factory/services/analytic-service/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
ANALYTIC_SERVICE_URL = "http://127.0.0.1:8000/api/v1"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

async def run_full_audit():
    print("🚀 STARTING MASS FORENSIC AUDIT (80 PROPERTIES)", flush=True)
    print("CASE_ID: 967397ab-0de9-4ee9-ace1-ce5767238b99", flush=True)
    print("LEAD ANALYST: GLM-4.6V Flash", flush=True)
    print("JUDGE: Gemini 2.0 Flash", flush=True)
    print("-" * 50, flush=True)

    # 1. Get all unique properties (documents) in this case
    case_id = "967397ab-0de9-4ee9-ace1-ce5767238b99"
    user_id = "20832948-cd0b-4b60-92eb-87b72f72a936"
    
    docs_result = supabase.table("case_documents").select("id, file_name").eq("case_id", case_id).execute()
    docs = docs_result.data
    
    if not docs:
        print("❌ No documents found in database.")
        return

    print(f"Found {len(docs)} documents to analyze.")

    master_findings = []

    # 2. Iterate and analyze (using the analytic service API)
    async with httpx.AsyncClient(timeout=120.0) as client:
            for i, doc in enumerate(docs):
                file_name = doc['file_name']
                print(f"[{i+1}/{len(docs)}] Analyzing: {file_name}...", flush=True)
                
                query = f"Provide a forensic summary for the property in {file_name}. Identify pricing, acreage, zoning, and any potential legal or structural risks mentioned."
                
                try:
                    response = await client.post(f"{ANALYTIC_SERVICE_URL}/analyze/", json={
                        "query": query,
                        "case_id": case_id,
                        "user_id": user_id
                    })
                    
                    if response.status_code == 200:
                        result = response.json()
                        master_findings.append({
                            "file": file_name,
                            "report": result['report']
                        })
                        print(f"  ✅ Analysis complete for {file_name}", flush=True)
                    else:
                        print(f"  ❌ API Error ({response.status_code}): {response.text}", flush=True)
                except Exception as e:
                    print(f"  ❌ Request failed for {file_name}: {e}", flush=True)
    # 3. Generate Master Synthesis using the Judge
    print("\n" + "="*50)
    print("⚖️ GENERATING MASTER SYNTHESIS REPORT...")
    print("="*50)
    
    synthesis_query = "Synthesize a Master Forensic Report for all 80 properties analyzed. Group properties by location (Alamogordo, Tularosa, Cloudcroft). Highlight top 3 high-value opportunities and any critical discrepancies found across the entire portfolio."
    
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            final_resp = await client.post(f"{ANALYTIC_SERVICE_URL}/analyze/", json={
                "query": synthesis_query,
                "case_id": case_id,
                "user_id": user_id
            })
            
            if final_resp.status_code == 200:
                master_report = final_resp.json()['report']
                
                # Save results
                with open("MASTER_FORENSIC_REPORT.md", "w") as f:
                    f.write("# MASTER FORENSIC PORTFOLIO REPORT\n\n")
                    f.write(master_report)
                
                print("\n✅ MASTER REPORT GENERATED: MASTER_FORENSIC_REPORT.md")
                print("\nSUMMARY PREVIEW:\n")
                print(master_report[:1000] + "...")
            else:
                print(f"❌ Final Synthesis Failed: {final_resp.text}")
    except Exception as e:
        print(f"❌ Synthesis Request Failed: {e}")

if __name__ == "__main__":
    asyncio.run(run_full_audit())
