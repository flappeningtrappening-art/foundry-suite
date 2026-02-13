import litellm
import json
import re
from typing import List, Optional, Dict, Any
from src.core.config import settings
from src.core.supabase_client import get_supabase_client
from src.models.analysis import AnalysisResponse, SourceCitation

async def run_contradiction_chain(
    case_id: str,
    user_id: str,
    document_ids: List[str]
) -> AnalysisResponse:
    supabase = get_supabase_client()
    
    # 1. Fetch sections from the specific documents
    sections_result = supabase.from_("document_sections") \
        .select("content, document_id, metadata") \
        .in_("document_id", document_ids) \
        .limit(100) \
        .execute()
    
    sections = sections_result.data or []
    
    if not sections:
        return AnalysisResponse(
            report="No content found in the selected documents to analyze.",
            citations=[],
            contradictions_found=False,
            metadata={"error": "No content found"}
        )

    # 2. Fetch Filenames
    files_result = supabase.from_("case_documents").select("id, file_name").in_("id", document_ids).execute()
    file_map = {f['id']: f['file_name'] for f in files_result.data}

    # 2.5 Yokoten: Retrieve Shared Intelligence
    shared_intel_context = ""
    try:
        shared_intel_result = supabase.table("shared_intelligence_vault") \
            .select("source_agent, content, finding_type") \
            .eq("case_id", case_id) \
            .execute()
        
        if shared_intel_result.data:
            shared_intel_blocks = [
                f"EXISTING {item['finding_type'].upper()} (from {item['source_agent']}): {item['content']}"
                for item in shared_intel_result.data
            ]
            shared_intel_context = "\n--- YOKOTEN SHARED TRUTH ---\n" + "\n".join(shared_intel_blocks)
    except Exception as e:
        print(f"Yokoten Retrieval Failed: {e}")

    # 3. Context Preparation
    context_blocks = []
    citations_data = []
    for sec in sections:
        file_name = file_map.get(sec['document_id'], "Unknown File")
        content = sec['content']
        
        page_match = re.search(r"\[Page: (\d+)\]", content)
        page_num = int(page_match.group(1)) if page_match else (sec.get('metadata', {}).get('page') if sec.get('metadata') else None)
        
        clean_content = content.replace(f"[Page: {page_num}]", "").strip() if page_num else content
        
        context_blocks.append(f"SOURCE: {file_name} (Page {page_num})\nCONTENT: {clean_content}\n---")
        citations_data.append({"file_name": file_name, "page": page_num, "content": clean_content})

    context_text = "\n".join(context_blocks)

    # 4. Agentic Contradiction Loop
    def get_model_kwargs(model_name: str):
        kwargs = {"num_retries": 3}
        if "glm" in model_name.lower():
            kwargs["api_base"] = settings.ZHIPUAI_API_BASE
            kwargs["api_key"] = settings.ZHIPUAI_API_KEY
            kwargs["custom_llm_provider"] = "openai"
        return kwargs

    # Agent 1: The Cross-Examiner (Prosecutor - GLM)
    print(f"Executing Cross-Examiner using {settings.PROSECUTOR_MODEL}...")
    cross_examiner_prompt = f"""
    ROLE: Forensic Cross-Examiner
    CONTEXT: {context_text}
    {shared_intel_context}
    TASK: Find contradictions BETWEEN the documents. 
    Cross-reference with EXISTING findings if provided.
    """
    
    messages_1 = [{"role": "system", "content": cross_examiner_prompt}, {"role": "user", "content": "Analyze these documents for any and all contradictions."}]
    response_1 = litellm.completion(
        model=settings.PROSECUTOR_MODEL, 
        messages=messages_1, 
        temperature=0.1,
        **get_model_kwargs(settings.PROSECUTOR_MODEL)
    )
    findings = response_1.choices[0].message.content

    # Agent 2: The Auditor (Orchestrator - Gemini)
    print(f"Executing Auditor using {settings.DEFAULT_MODEL}...")
    auditor_prompt = f"""
    ROLE: Forensic Auditor (Orchestrator Review)
    CONTEXT: {context_text}
    PREVIOUS FINDINGS: {findings}
    TASK: Verify contradictions. Organize by severity.
    """
    
    messages_2 = [{"role": "system", "content": auditor_prompt}, {"role": "user", "content": "Verify and categorize."}]
    response_2 = litellm.completion(
        model=settings.DEFAULT_MODEL, 
        messages=messages_2, 
        temperature=0.1,
        **get_model_kwargs(settings.DEFAULT_MODEL)
    )
    audited_findings = response_2.choices[0].message.content

    # Agent 3: The Judge (GLM)
    print(f"Executing Judge using {settings.JUDGE_MODEL}...")
    judge_prompt = f"""
    ROLE: SPECTRE Chief Intelligence Officer
    CONTEXT: {context_text}
    AUDITED FINDINGS: {audited_findings}
    TASK: Write the final "Contradiction & Discrepancy Report".
    - Use LaTeX for math.
    - Cite sources: [Source: "filename.pdf", Page: X].
    IMPORTANT: End your response with a JSON block labeled "KEY_FINDINGS_FOR_VAULT" containing a list of objects with "type", "content", and "confidence".
    """
    
    messages_3 = [{"role": "system", "content": judge_prompt}, {"role": "user", "content": "Produce final report."}]
    final_response = litellm.completion(
        model=settings.JUDGE_MODEL, 
        messages=messages_3, 
        temperature=0.2,
        **get_model_kwargs(settings.JUDGE_MODEL)
    )
    full_text = final_response.choices[0].message.content
    print(f"Judge complete using {settings.JUDGE_MODEL}.")
    
    report_text = full_text
    findings_to_save = []
    if "KEY_FINDINGS_FOR_VAULT" in full_text:
        try:
            parts = full_text.split("KEY_FINDINGS_FOR_VAULT")
            report_text = parts[0].strip()
            json_str = re.search(r"(\[.*\])", parts[1], re.DOTALL)
            if json_str:
                findings_to_save = json.loads(json_str.group(1))
        except Exception as e:
            print(f"Findings Extraction Failed: {e}")

    # 5. Save Findings to Vault (Yokoten)
    if findings_to_save:
        try:
            for finding in findings_to_save:
                supabase.table("shared_intelligence_vault").insert({
                    "case_id": case_id,
                    "user_id": user_id,
                    "finding_type": finding.get("type", "contradiction"),
                    "source_agent": "CONTRADICTION_ENGINE",
                    "content": finding.get("content", ""),
                    "confidence_score": finding.get("confidence", 1.0),
                    "citations": citations_data[:5]
                }).execute()
        except Exception as ve:
            print(f"FAILED TO SAVE VAULT FINDINGS (Table likely missing): {ve}")

    return AnalysisResponse(
        report=report_text,
        citations=[SourceCitation(**c) for c in citations_data[:50]],
        contradictions_found=True,
        metadata={"model": final_response.model, "agents_involved": 3}
    )

    return AnalysisResponse(
        report=report_text,
        citations=[SourceCitation(**c) for c in citations_data[:50]],
        contradictions_found=True,
        metadata={"model": final_response.model, "agents_involved": 3}
    )
