from pydantic import BaseModel
from typing import Literal, Optional, Union, Any

class TriggerRequest(BaseModel):
    type: Literal['button', 'voice']
    trigger_type: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"
    mode: Optional[str] = "daily"
    location: Optional[Union[dict, str, Any]] = None
