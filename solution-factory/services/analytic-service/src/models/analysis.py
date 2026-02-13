from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class AnalysisRequest(BaseModel):
    query: str
    case_id: str
    user_id: str # Required for audit trail
    include_general_knowledge: bool = False
    documents_to_compare: Optional[List[str]] = None

class SourceCitation(BaseModel):
    file_name: str
    page: Optional[int] = None
    content: str

class AnalysisResponse(BaseModel):
    report: str
    citations: List[SourceCitation]
    contradictions_found: bool
    metadata: Dict[str, Any] = Field(default_factory=dict)
