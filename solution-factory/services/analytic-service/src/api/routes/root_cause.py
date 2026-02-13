from fastapi import APIRouter, HTTPException
from src.models.analysis import AnalysisResponse
from src.services.agents.root_cause_chain import run_5why_chain
from pydantic import BaseModel

router = APIRouter()

class RootCauseRequest(BaseModel):
    case_id: str
    user_id: str
    finding_id: str

@router.post("/", response_model=AnalysisResponse)
async def perform_root_cause_analysis(request: RootCauseRequest):
    try:
        result = await run_5why_chain(
            case_id=request.case_id,
            user_id=request.user_id,
            finding_id=request.finding_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
