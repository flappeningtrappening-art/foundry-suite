from fastapi import APIRouter, HTTPException
from src.models.analysis import AnalysisRequest, AnalysisResponse
from src.services.agents.forensic_chain import run_forensic_chain

router = APIRouter()

@router.post("/", response_model=AnalysisResponse)
async def analyze_documents(request: AnalysisRequest):
    try:
        # Trigger the agentic chain
        result = await run_forensic_chain(
            query=request.query,
            case_id=request.case_id,
            user_id=request.user_id, # Pass user_id for audit logging
            include_general_knowledge=request.include_general_knowledge,
            documents_to_compare=request.documents_to_compare
        )
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
