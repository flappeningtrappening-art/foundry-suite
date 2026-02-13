import litellm
import json
import re
from typing import List, Optional, Dict, Any
from src.core.config import settings
from src.core.supabase_client import get_supabase_client
from src.models.analysis import AnalysisResponse, SourceCitation
from duckduckgo_search import DDGS

async def run_forensic_chain(
    query: str,
    case_id: str,
    user_id: str,
    include_general_knowledge: bool = False,
    documents_to_compare: Optional[List[str]] = None
) -> AnalysisResponse:
    supabase = get_supabase_client()
    
    # 1. Generate Query Embedding
    embedding_response = litellm.embedding(
        model="gemini/text-embedding-004",
        input=query
    )
    query_embedding = embedding_response.data[0]['embedding']
    
    # 1.5 Yokoten: Retrieve Shared Intelligence
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
            shared_intel_context = "\n---\n YOKOTEN SHARED TRUTH ---\n" + "\n".join(shared_intel_blocks)
    except Exception as e:
        print(f"Yokoten Retrieval Failed: {e}")

    # 2. Vector Search Retrieval
    rpc_params = {
        "query_embedding": query_embedding,
        "match_threshold": 0.3,
        "match_count": 20,
        "filter_case_id": case_id
    }
    
    search_result = supabase.rpc("match_document_sections", rpc_params).execute()
    documents = search_result.data or []
    
    context_text = ""
    citations_data = []
    
    if not documents:
        context_text = "No relevant documents found in the forensic locker."
    else:
        # 3. Context Preparation
        context_blocks = []
        for doc in documents:
            file_name = doc.get('file_name', "Unknown File")
            content = doc['content']
            
            page_num = None
            try:
                page_match = re.search(r"\\[Page: (\\d+)\\]", content)
                if page_match:
                    page_num = int(page_match.group(1))
            except Exception as re_err:
                print(f"Regex Page Error: {re_err}")
            
            context_blocks.append(f"SOURCE: {file_name} (Page {page_num})\nCONTENT: {content}\n---")
            citations_data.append({"file_name": file_name, "page": page_num, "content": content})

        context_text = "\n".join(context_blocks)

    # 4. Agentic Debate Loop
    print("Executing Forensic Chain agents...")
    
    live_context = ""
    if include_general_knowledge:
        try:
            with DDGS() as ddgs:
                search_results = list(ddgs.text(query, max_results=5))
                live_context = "\n".join([f"WEB_RESULT: {r['body']}" for r in search_results])
        except Exception as e:
            print(f"Live search failed: {e}")

    # Poke-Yoke: Retry configuration for litellm
    retry_params = {
        "num_retries": 3,
        "constant_delay": 2
    }

    def get_model_kwargs(model_name: str):
        kwargs = {**retry_params}
        if "glm" in model_name.lower():
            kwargs["api_base"] = settings.ZHIPUAI_API_BASE
            kwargs["api_key"] = settings.ZHIPUAI_API_KEY
            kwargs["custom_llm_provider"] = "openai"
        return kwargs

    # Agent 1: The Prosecutor (GLM)
    print(f"Executing Prosecutor using {settings.PROSECUTOR_MODEL}...")
    prosecutor_prompt = f"""
    ROLE: Forensic Prosecutor
    CONTEXT: {context_text}
    {shared_intel_context}
    TASK: Analyze the user's query against the context. 
    Find every piece of evidence. Specifically, look for inconsistencies where Document A might contradict Document B or itself.
    List findings clearly.
    """
    
    messages_1 = [{"role": "system", "content": prosecutor_prompt}, {"role": "user", "content": query}]
    
    prosecutor_response = litellm.completion(
        model=settings.PROSECUTOR_MODEL, 
        messages=messages_1, 
        temperature=0.1,
        **get_model_kwargs(settings.PROSECUTOR_MODEL)
    )
    initial_findings = prosecutor_response.choices[0].message.content

    # Agent 2: The Skeptic (Gemini - Orchestrator)
    print(f"Executing Skeptic using {settings.DEFAULT_MODEL}...")
    skeptic_prompt = f"""
    ROLE: Forensic Skeptic / Defense (Orchestrator Review)
    CONTEXT: {context_text}
    LIVE WEB CONTEXT: {live_context}
    PREVIOUS FINDINGS: {initial_findings}
    TASK: Review findings. Cross-reference with LIVE WEB CONTEXT if available. 
    Identify logical leaps or outdated info.
    **CRITICAL POKA-YOKE**: Double-check all names, titles, and judicial affiliations.
    """
    
    messages_2 = [{"role": "system", "content": skeptic_prompt}, {"role": "user", "content": "Challenge the findings."}]
    skeptic_response = litellm.completion(
        model=settings.DEFAULT_MODEL, 
        messages=messages_2, 
        temperature=0.1,
        **get_model_kwargs(settings.DEFAULT_MODEL)
    )
    skeptic_critique = skeptic_response.choices[0].message.content

    # Agent 3: The Judge (GLM)
    print(f"Executing Judge using {settings.JUDGE_MODEL}...")
    judge_prompt = f"""
    ROLE: SPECTRE Chief Intelligence Officer
    CONTEXT: {context_text}
    {shared_intel_context}
    PROSECUTOR FINDINGS: {initial_findings}
    SKEPTIC CRITIQUE: {skeptic_critique}
    TASK: Write the final report.
    - Highlight genuine "CRITICAL DISCREPANCIES".
    - Use LaTeX for math.
    - Cite as: [Source: "filename.pdf", Page: X].
    - Label live data as "**LIVE VERIFICATION (Real-time Web Search)**".
    
    IMPORTANT: At the very end of your response, provide a JSON block labeled "KEY_FINDINGS_FOR_VAULT" containing a list of objects with "type", "content", and "confidence".
    { "STRICT MODE: Use only source context." if not include_general_knowledge else "" }
    """
    
    messages_3 = [{"role": "system", "content": judge_prompt}, {"role": "user", "content": query}]
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
            json_match = re.search(r"\\[.*\\]", parts[1], re.DOTALL)
            if json_match:
                findings_to_save = json.loads(json_match.group(0))
        except Exception as e:
            print(f"Findings Extraction Failed: {e}")

    # 5. Save Chain of Custody Audit Log
    print("Saving logs and shared findings...")
    try:
        if findings_to_save:
            for finding in findings_to_save:
                supabase.table("shared_intelligence_vault").insert({
                    "case_id": case_id,
                    "user_id": user_id,
                    "finding_type": finding.get("type", "fact"),
                    "source_agent": "INTEL",
                    "content": finding.get("content", ""),
                    "confidence_score": finding.get("confidence", 1.0),
                    "citations": citations_data[:5]
                }).execute()

        audit_log = {
            "user_id": user_id,
            "case_id": case_id,
            "query": query,
            "prosecutor_findings": initial_findings,
            "skeptic_critique": skeptic_critique,
            "final_report": report_text,
            "citations": citations_data,
            "metadata": {
                "model": final_response.model,
                "usage": final_response.usage.dict(),
                "live_search_performed": bool(live_context)
            }
        }
        supabase.table("forensic_audit_logs").insert(audit_log).execute()
    except Exception as e:
        print(f"FAILED TO SAVE AUDIT LOG: {e}")

    contradictions_found = "CRITICAL DISCREPANCIES" in report_text or "contradict" in report_text.lower()

    return AnalysisResponse(
        report=report_text,
        citations=[SourceCitation(**c) for c in citations_data],
        contradictions_found=contradictions_found,
        metadata={"model": final_response.model, "agents_involved": 4}
    )
