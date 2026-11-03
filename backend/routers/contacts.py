import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db, Contact
from backend.models.schemas import ContactCreate, ContactResponse, ContactUpdateRequest

router = APIRouter()


@router.get("/contacts", response_model=List[ContactResponse])
def get_contacts(db: Session = Depends(get_db)):
    """Retrieve all emergency contacts, ordered by primary status and creation time."""
    contacts = db.query(Contact).order_by(Contact.is_primary.desc(), Contact.created_at.asc()).all()
    return contacts


@router.post("/contacts", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def create_contact(contact_in: ContactCreate, db: Session = Depends(get_db)):
    """Add a new emergency contact."""
    name = (contact_in.name or "").strip()
    if not name:
        raise HTTPException(
            status_code=422,
            detail="name cannot be empty."
        )
    if len(name) < 2:
        raise HTTPException(
            status_code=422,
            detail="name must be at least 2 characters."
        )

    phone_cleaned = re.sub(r"[\s\-]", "", str(contact_in.phone or ""))
    if not phone_cleaned:
        raise HTTPException(
            status_code=422,
            detail="phone cannot be empty."
        )
    if not re.match(r"^(?:\+\d{1,4})?[0-9]{10}$", phone_cleaned):
        raise HTTPException(
            status_code=422,
            detail="phone must be a valid 10-digit number with optional country code prefix."
        )

    telegram_id = (contact_in.telegram_chat_id or "").strip()
    if not telegram_id:
        raise HTTPException(
            status_code=422,
            detail="telegram_chat_id cannot be empty."
        )
    if not re.match(r"^\d{9,14}$", telegram_id):
        raise HTTPException(
            status_code=422,
            detail="telegram_chat_id must be strictly a 9 to 14 digits numeric string."
        )

    new_contact = Contact(
        name=name,
        phone=phone_cleaned,
        telegram_chat_id=telegram_id,
        relationship=contact_in.relationship.strip() if contact_in.relationship else "Friend/Family",
        is_primary=True
    )
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)
    return new_contact


@router.put("/contacts/{contact_id}", response_model=ContactResponse)
def update_contact(contact_id: int, contact_in: ContactUpdateRequest, db: Session = Depends(get_db)):
    """Update an existing emergency contact in SQLite database."""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contact with ID {contact_id} not found."
        )

    if contact_in.name is not None:
        name = contact_in.name.strip()
        if not name:
            raise HTTPException(
                status_code=422,
                detail="name cannot be empty."
            )
        if len(name) < 2:
            raise HTTPException(
                status_code=422,
                detail="name must be at least 2 characters."
            )
        contact.name = name

    if contact_in.phone is not None:
        phone_cleaned = re.sub(r"[\s\-]", "", str(contact_in.phone))
        if not phone_cleaned:
            raise HTTPException(
                status_code=422,
                detail="phone cannot be empty."
            )
        if not re.match(r"^(?:\+\d{1,4})?[0-9]{10}$", phone_cleaned):
            raise HTTPException(
                status_code=422,
                detail="phone must be a valid 10-digit number with optional country code prefix."
            )
        contact.phone = phone_cleaned

    if contact_in.telegram_chat_id is not None:
        telegram_id = contact_in.telegram_chat_id.strip()
        if not telegram_id:
            raise HTTPException(
                status_code=422,
                detail="telegram_chat_id cannot be empty."
            )
        if not re.match(r"^\d{9,14}$", telegram_id):
            raise HTTPException(
                status_code=422,
                detail="telegram_chat_id must be strictly a 9 to 14 digits numeric string."
            )
        contact.telegram_chat_id = telegram_id

    if contact_in.relationship is not None:
        rel = contact_in.relationship.strip() if contact_in.relationship else "Friend/Family"
        contact.relationship = rel if rel else "Friend/Family"

    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/contacts/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(get_db)):
    """Remove an emergency contact by ID."""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contact with ID {contact_id} not found."
        )

    db.delete(contact)
    db.commit()
    return {"status": "deleted", "id": contact_id, "message": "Contact deleted successfully."}
