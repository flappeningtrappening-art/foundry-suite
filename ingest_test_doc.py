import os
import json
import uuid
import asyncio
import fitz  # PyMuPDF
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

# Load config from analytic-service/.env
load_dotenv("foundry-suite/solution-factory/services/analytic-service/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Use litellm for embedding (same as analytic-service)
import litellm

# Configure Pandas for string serialization
pd.set_option('display.max_rows', None)
pd.set_option('display.max_columns', None)
pd.set_option('display.width', 1000)

def _extract_content_from_pdf(file_path):
    """
    Extracts text and tables from a PDF using PyMuPDF (fitz).
    Returns a list of dicts: {'page': int, 'content': str}
    """
    if not os.path.exists(file_path):
        print(f"❌ Error: File not found at {file_path}")
        return []

    doc = fitz.open(file_path)
    extracted_sections = []

    for page_num, page in enumerate(doc):
        page_text = page.get_text()
        
        # 1. Basic Text Extraction
        section_content = f"[Page: {page_num + 1}] {page_text}\n"

        # 2. Forensic Table Extraction
        # Using text strategy for borderless/layout-based tables common in audits
        tabs = page.find_tables(
            vertical_strategy="text", 
            horizontal_strategy="text",
            snap_tolerance=5,
            join_tolerance=3,
            edge_min_length=3,
            min_words_vertical=3
        )

        if tabs.tables:
            section_content += f"\n--- EXTRACTED TABLES (Page {page_num + 1}) ---\n"
            for i, table in enumerate(tabs.tables):
                df = table.to_pandas()
                if not df.empty:
                    # Convert to Markdown-like string for better LLM comprehension
                    section_content += f"\nTable {i+1}:\n"
                    section_content += df.to_markdown(index=False)
                    section_content += "\n"
        
        extracted_sections.append({
            "page": page_num + 1,
            "content": section_content
        })

    doc.close()
    return extracted_sections

async def ingest_test_doc(file_path, case_id, user_id):
    print(f"Ingesting {file_path} into case {case_id}...")
    
    # 1. Register document
    doc_id = str(uuid.uuid4())
    supabase.table("case_documents").insert({
        "id": doc_id,
        "case_id": case_id,
        "user_id": user_id,
        "file_name": os.path.basename(file_path),
        "storage_path": f"test/{os.path.basename(file_path)}",
        "metadata": {"status": "ready"}
    }).execute()

    # 2. Extract REAL content using PyMuPDF
    content_chunks = _extract_content_from_pdf(file_path)
    
    if not content_chunks:
        print("⚠️ No content extracted. Aborting embedding.")
        return doc_id

    # 3. Embed and Insert
    print(f"Processing {len(content_chunks)} pages/chunks...")
    for chunk_data in content_chunks:
        content_text = chunk_data['content']
        page_num = chunk_data['page']

        # Skip empty pages
        if not content_text.strip():
            continue

        try:
            embedding_response = litellm.embedding(
                model="gemini/text-embedding-004",
                input=content_text,
                api_key=GEMINI_API_KEY
            )
            embedding = embedding_response.data[0]['embedding']
            
            supabase.table("document_sections").insert({
                "document_id": doc_id,
                "case_id": case_id,
                "user_id": user_id,
                "content": content_text,
                "embedding": embedding,
                "metadata": {"page": page_num}
            }).execute()
            print(f"✅ Indexed Page {page_num}")
            
        except Exception as e:
            print(f"❌ Failed to embed Page {page_num}: {e}")
        
    print(f"Ingestion complete for doc {doc_id}.")
    return doc_id

if __name__ == "__main__":
    import glob
    
    # We'll use the CASE_ID from the previous run if we can, or just a new one
    USER_ID = "20832948-cd0b-4b60-92eb-87b72f72a936"
    CASE_ID = "967397ab-0de9-4ee9-ace1-ce5767238b99" 
    
    # Path to the directory containing listing PDFs
    assets_dir = "foundry-suite/test_assets"
    pdf_files = glob.glob(os.path.join(assets_dir, "*.pdf"))
    
    print(f"🚀 Found {len(pdf_files)} listings to process.")
    
    for i, pdf_path in enumerate(pdf_files):
        print(f"\n--- Processing Listing {i+1}/{len(pdf_files)} ---")
        asyncio.run(ingest_test_doc(pdf_path, CASE_ID, USER_ID))
    
    print("\n✅ BATCH INGESTION COMPLETE.")
