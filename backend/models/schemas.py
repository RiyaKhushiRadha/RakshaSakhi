from pydantic import BaseModel
from typing import Literal

class TriggerRequest(BaseModel):
    type: Literal['button', 'voice']

class ChatRequest(BaseModel):
    message: str
