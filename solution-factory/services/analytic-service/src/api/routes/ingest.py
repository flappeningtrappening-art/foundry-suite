from fastapi import APIRouter, HTTPException, UploadFile, File
from src.core.robust_extractor import extractor
from src.core.config import settings
from supabase import create_client, Client
from pydantic import BaseModel
from typing import List, Dict

router = APIRouter()

class IngestRequest(BaseModel):
    document_id: str
    user_id: str

class UrlIngestRequest(BaseModel):
    url: str
    case_id: str
    user_id: str

# Initialize Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

@router.post("/parse-pdf")
async def parse_pdf(file: UploadFile = File(...)):
    try:
        content = await file.read()
        markdown_text = extractor.extract_from_pdf(content)
        return {
            "success": True,
            "markdown": markdown_text,
            "page_count": 1 # MarkItDown treats as one doc
        }
    except Exception as e:
        print(f"PDF Robust Parse Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process-document")
async def process_document(request: IngestRequest):
    """
    Downloads document from Supabase storage and extracts its content using RobustExtractor.
    """
    try:
        # 1. Get document record
        print(f"📡 Robust Processing Document: {request.document_id}")
        doc_res = supabase.table("case_documents").select("*").eq("id", request.document_id).single().execute()
        
        if not doc_res.data:
            raise HTTPException(status_code=404, detail="Document not found in database")
        
        storage_path = doc_res.data["storage_path"]
        
        # 2. Download from Supabase
        print(f"   ... Downloading: {storage_path}")
        file_bytes = supabase.storage.from_("case-files").download(storage_path)
        
        # 3. Robust Extraction
        print(f"   ... Running Robust Markdown Extraction")
        markdown_content = extractor.extract_from_pdf(file_bytes)
        
        # 4. Store the extracted text back in the DB for RAG
        # We split by double newline to simulate "pages" or chunks for the existing RAG logic
        chunks = markdown_content.split('\n\n')
        
        # Clear old sections if any
        supabase.table("document_sections").delete().eq("document_id", request.document_id).execute()
        
        # Insert new chunks
        section_data = [
            {
                "document_id": request.document_id,
                "content": f"[Page: {i+1}] {chunk}",
                "metadata": {"type": "markdown_chunk"}
            }
            for i, chunk in enumerate(chunks) if chunk.strip()
        ]
        
        if section_data:
            supabase.table("document_sections").insert(section_data).execute()

        # Update document status
        supabase.table("case_documents").update({"metadata": {"status": "ready", "engine": "robust_v1"}}).eq("id", request.document_id).execute()
        
        return {
            "success": True,
            "document_id": request.document_id,
            "chunk_count": len(section_data),
            "preview": markdown_content[:500]
        }

    except Exception as e:
        print(f"❌ Robust Ingestion Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process-url")
async def process_url(request: UrlIngestRequest):
    """
    Scrapes a URL using Playwright and saves it as a virtual document.
    """
    try:
        print(f"📡 Scaping URL: {request.url}")
        markdown_content = await extractor.extract_from_url(request.url)
        
        # Create a virtual document record
        doc_record = supabase.table("case_documents").insert({
            "user_id": request.user_id,
            "file_name": f"Web: {request.url[:30]}...",
            "file_type": "text/markdown",
            "storage_path": f"web/{request.user_id}/{hash(request.url)}",
            "metadata": {"source": "url", "url": request.url, "status": "ready"}
        }).select().single().execute()
        
        doc_id = doc_record.data["id"]
        
        # Insert chunks
        chunks = markdown_content.split('\n\n')
        section_data = [
            {
                "document_id": doc_id,
                "content": f"[WebSource: {request.url}] {chunk}",
                "metadata": {"type": "web_chunk"}
            }
            for i, chunk in enumerate(chunks) if chunk.strip()
        ]
        
        if section_data:
            supabase.table("document_sections").insert(section_data).execute()

        return {"success": True, "document_id": doc_id, "chunk_count": len(section_data)}
    except Exception as e:
        print(f"❌ URL Scrape Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
