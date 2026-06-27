# backend/routers/users.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import uuid
import os
from jose import jwt

from models.database import get_db, User

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey123")
ALGORITHM = os.getenv("ALGORITHM", "HS256")


# ─── Schemas ──────────────────────────────────────────────

class UserCreate(BaseModel):
    google_id: str
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    google_id: str
    email: str
    name: Optional[str]
    picture: Optional[str]
    productivity_score: int
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# ─── Helpers ──────────────────────────────────────────────

def create_access_token(data: dict, expires_minutes: int = 1440) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str, db: Session) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ─── Routes ───────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login_or_register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Login or register a user via Google OAuth data.
    Frontend sends google_id, email, name, picture after Google sign-in.
    """
    # Check if user exists
    user = db.query(User).filter(User.google_id == user_data.google_id).first()

    if not user:
        # Register new user
        user = User(
            id=str(uuid.uuid4()),
            google_id=user_data.google_id,
            email=user_data.email,
            name=user_data.name,
            picture=user_data.picture,
            productivity_score=50,
            peak_hours={"start": 9, "end": 17}
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"✅ New user registered: {user.email}")
    else:
        # Update profile info
        user.name = user_data.name or user.name
        user.picture = user_data.picture or user.picture
        db.commit()

    token = create_access_token({"sub": user.id, "email": user.email})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_me(token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    return UserResponse.from_orm(user)


@router.get("/demo-login", response_model=TokenResponse)
async def demo_login(db: Session = Depends(get_db)):
    """
    Demo login endpoint — creates/returns a demo user without Google OAuth.
    Use this for testing until Google OAuth is set up.
    """
    demo_google_id = "demo_user_001"
    user = db.query(User).filter(User.google_id == demo_google_id).first()

    if not user:
        user = User(
            id=str(uuid.uuid4()),
            google_id=demo_google_id,
            email="demo@prodforge.ai",
            name="Demo User",
            picture=None,
            productivity_score=72,
            peak_hours={"start": 20, "end": 23}
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": user.id, "email": user.email})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )


@router.put("/productivity-score")
async def update_productivity_score(
    token: str,
    score: int,
    db: Session = Depends(get_db)
):
    user = get_current_user(token, db)
    user.productivity_score = max(0, min(100, score))
    db.commit()
    return {"message": "Score updated", "score": user.productivity_score}