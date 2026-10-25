from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator
from typing import Literal, Optional, Union, Any


class TriggerRequest(BaseModel):
    type: Literal['button', 'voice']
    trigger_type: Optional[str] = None
    location: Optional[Union[dict, str, Any]] = None


class AlertRequest(BaseModel):
    type: Optional[str] = "button"
    location: Optional[Union[dict, str, Any]] = None


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"
    mode: Optional[str] = "daily"
    location: Optional[Union[dict, str, Any]] = None


class ContactCreate(BaseModel):
    name: str
    phone: str
    telegram_chat_id: str
    relationship: Optional[str] = "Friend/Family"

    @field_validator("name", "phone", "telegram_chat_id")
    @classmethod
    def validate_non_empty(cls, value: str, info):
        if not value or not value.strip():
            raise ValueError(f"{info.field_name} cannot be empty.")
        return value.strip()


class ContactResponse(BaseModel):
    id: int
    name: str
    phone: str
    telegram_chat_id: Optional[str] = None
    relationship: Optional[str] = None
    is_primary: bool = True
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
