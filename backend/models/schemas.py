from datetime import datetime
import re
from pydantic import BaseModel, ConfigDict, field_validator
from typing import Literal, Optional, Union, Any


class TriggerRequest(BaseModel):
    type: Literal['button', 'voice']
    trigger_type: Optional[str] = None
    location: Optional[Union[dict, str, Any]] = None
    user_name: Optional[str] = "RakshaSakhi User"


class AlertRequest(BaseModel):
    type: Optional[str] = "button"
    location: Optional[Union[dict, str, Any]] = None
    user_name: Optional[str] = "RakshaSakhi User"


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

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        if value is None:
            raise ValueError("name cannot be empty.")
        trimmed = str(value).strip()
        if not trimmed:
            raise ValueError("name cannot be empty.")
        if len(trimmed) < 2:
            raise ValueError("name must be at least 2 characters.")
        return trimmed

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        if value is None:
            raise ValueError("phone cannot be empty.")
        trimmed = str(value).strip()
        if not trimmed:
            raise ValueError("phone cannot be empty.")
        cleaned = re.sub(r"[\s\-]", "", trimmed)
        if not re.match(r"^(?:\+\d{1,4})?[0-9]{10}$", cleaned):
            raise ValueError("phone must be a valid 10-digit number with optional country code prefix (e.g. +91).")
        return cleaned

    @field_validator("telegram_chat_id")
    @classmethod
    def validate_telegram_chat_id(cls, value: str) -> str:
        if value is None:
            raise ValueError("telegram_chat_id cannot be empty.")
        trimmed = str(value).strip()
        if not trimmed:
            raise ValueError("telegram_chat_id cannot be empty.")
        if not re.match(r"^\d{9,14}$", trimmed):
            raise ValueError("telegram_chat_id must be strictly a 9 to 14 digits numeric string.")
        return trimmed

    @field_validator("relationship")
    @classmethod
    def validate_relationship(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            trimmed = str(value).strip()
            return trimmed if trimmed else "Friend/Family"
        return "Friend/Family"


class ContactUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    relationship: Optional[str] = None

    @field_validator("name", mode="before")
    @classmethod
    def validate_name_optional(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            trimmed = str(value).strip()
            if not trimmed:
                raise ValueError("name cannot be empty.")
            if len(trimmed) < 2:
                raise ValueError("name must be at least 2 characters.")
            return trimmed
        return value

    @field_validator("phone", mode="before")
    @classmethod
    def validate_phone_optional(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            trimmed = str(value).strip()
            if not trimmed:
                raise ValueError("phone cannot be empty.")
            cleaned = re.sub(r"[\s\-]", "", trimmed)
            if not re.match(r"^(?:\+\d{1,4})?[0-9]{10}$", cleaned):
                raise ValueError("phone must be a valid 10-digit number with optional country code prefix (e.g. +91).")
            return cleaned
        return value

    @field_validator("telegram_chat_id", mode="before")
    @classmethod
    def validate_telegram_chat_id_optional(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            trimmed = str(value).strip()
            if not trimmed:
                raise ValueError("telegram_chat_id cannot be empty.")
            if not re.match(r"^\d{9,14}$", trimmed):
                raise ValueError("telegram_chat_id must be strictly a 9 to 14 digits numeric string.")
            return trimmed
        return value

    @field_validator("relationship", mode="before")
    @classmethod
    def validate_relationship_optional(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            trimmed = str(value).strip()
            return trimmed if trimmed else "Friend/Family"
        return value


class ContactResponse(BaseModel):
    id: int
    name: str
    phone: str
    telegram_chat_id: Optional[str] = None
    relationship: Optional[str] = None
    is_primary: bool = True
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
