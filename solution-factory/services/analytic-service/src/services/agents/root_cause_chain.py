import litellm
import json
import re
from typing import List, Optional, Dict, Any
from src.core.config import settings
from src.core.supabase_client import get_supabase_client
from src.models.analysis import AnalysisResponse, SourceCitation

async def run_5why_chain(
    case_id: str,
    user_id: str,
    finding_id: str
) -> AnalysisResponse:
    supabase = get_supabase_client()
    
    # 1. Fetch the specific finding from the vault
    finding_result = supabase.table("shared_intelligence_vault") \
        .select("*") \
        .eq("id", finding_id) \
        .single() \
        .execute()
    
    finding = finding_result.data
    if not finding:
        return AnalysisResponse(
            report="Finding not found in the vault.",
            citations=[],
            contradictions_found=False,
            metadata={"error": "Finding not found"}
        )

    # 2. Fetch all document context for this case to drill down
    sections_result = supabase.from_("document_sections") \
        .select("content, document_id, metadata") \
        .eq("case_id", case_id) \
        .limit(100) \
        .execute()
    
    context_text = "\n".join([f"CONTENT: {s['content']}" for s in sections_result.data or []])

    # 3. The 5-Why Iterative Loop
    def get_model_kwargs(model_name: str):
        kwargs = {"num_retries": 3}
        if "glm" in model_name.lower():
            kwargs["api_base"] = settings.ZHIPUAI_API_BASE
            kwargs["api_key"] = settings.ZHIPUAI_API_KEY
            kwargs["custom_llm_provider"] = "openai"
        return kwargs

    current_subject = finding['content']
    reasoning_steps = []
    
    for i in range(1, 6):
        print(f"Executing Why Step {i} using {settings.PROSECUTOR_MODEL}...")
        why_prompt = f"""
        ROLE: Forensic Root Cause Analyst (Prosecutor Role)
        CONTEXT: {context_text}
        CURRENT SUBJECT: {current_subject}
        PREVIOUS STEPS: {json.dumps(reasoning_steps)}
        
        TASK: This is Step {i} of a 5-Why analysis. 
        Ask "Why" the current subject is happening based ONLY on the evidence in the context.
        Provide a concise answer and identify the deeper underlying factor.
        """
        
        response = litellm.completion(
            model=settings.PROSECUTOR_MODEL, 
            messages=[{"role": "system", "content": why_prompt}],
            temperature=0.1,
            **get_model_kwargs(settings.PROSECUTOR_MODEL)
        )
        answer = response.choices[0].message.content
        reasoning_steps.append({f"Why {i}": answer})
        current_subject = answer # Drill deeper

    # 4. Final Verdict Agent (The Judge)
    print(f"Executing Final Verdict using {settings.JUDGE_MODEL}...")
    final_prompt = f"""
    ROLE: FOUNDRY Quality Director (Judge)
    FINDING: {finding['content']}
    5-WHY TRACE: {json.dumps(reasoning_steps)}
    TASK: Write a final Root Cause Analysis (RCA) report.
    - Categorize as: "DATA ENTRY ERROR", "GENUINE CONTRADICTION", or "SYSTEMIC ANOMALY".
    - Provide a "Corrective Action" (Kaizen) to prevent recurrence.
    - Cite source evidence using: [Source: "filename.pdf", Page: X].
    """
    
    final_response = litellm.completion(
        model=settings.JUDGE_MODEL, 
        messages=[{"role": "system", "content": final_prompt}],
        temperature=0.2,
        **get_model_kwargs(settings.JUDGE_MODEL)
    )
    report_text = final_response.choices[0].message.content
    print(f"RCA Complete using {settings.JUDGE_MODEL}.")

    # 5. Update the finding in the vault with the RCA results
    try:
        supabase.table("shared_intelligence_vault").update({
            "is_verified": True,
            "tags": finding.get("tags", []) + ["RCA_COMPLETE"],
            "content": f"{finding['content']}\n\nROOT CAUSE VERDICT: {report_text[:500]}..."
        }).eq("id", finding_id).execute()
    except Exception as e:
        print(f"Failed to update vault with RCA: {e}")

    return AnalysisResponse(
        report=report_text,
        citations=[], # Citations are woven into the report
        contradictions_found=True,
        metadata={"model": final_response.model, "steps": 5, "finding_id": finding_id}
    )
