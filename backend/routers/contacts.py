from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db, Contact
from backend.models.schemas import ContactCreate, ContactResponse

router = APIRouter()


@router.get("/contacts", response_model=List[ContactResponse])
def get_contacts(db: Session = Depends(get_db)):
    """Retrieve all emergency contacts, ordered by primary status and creation time."""
    contacts = db.query(Contact).order_by(Contact.is_primary.desc(), Contact.created_at.asc()).all()
    return contacts


@router.post("/contacts", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def create_contact(contact_in: ContactCreate, db: Session = Depends(get_db)):
    """Add a new emergency contact."""
    telegram_id = (contact_in.telegram_chat_id or "").strip()
    if not telegram_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="telegram_chat_id cannot be empty."
        )

    new_contact = Contact(
        name=contact_in.name.strip(),
        phone=contact_in.phone.strip(),
        telegram_chat_id=telegram_id,
        relationship=contact_in.relationship.strip() if contact_in.relationship else "Friend/Family",
        is_primary=True
    )
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)
    return new_contact


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
