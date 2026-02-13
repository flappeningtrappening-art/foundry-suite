from fastapi import APIRouter, HTTPException
from src.models.analysis import AnalysisResponse
from src.services.agents.contradiction_chain import run_contradiction_chain
from pydantic import BaseModel
from typing import List

router = APIRouter()

class ContradictionRequest(BaseModel):
    case_id: str
    user_id: str
    document_ids: List[str]

@router.post("/", response_model=AnalysisResponse)
async def detect_contradictions(request: ContradictionRequest):
    try:
        if not request.document_ids or len(request.document_ids) < 2:
            raise HTTPException(status_code=400, detail="At least two documents are required for contradiction analysis.")
            
        result = await run_contradiction_chain(
            case_id=request.case_id,
            user_id=request.user_id,
            document_ids=request.document_ids
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
