# backend/models/database.py

from sqlalchemy import (
    create_engine, Column, String, Integer,
    Float, Boolean, DateTime, Text, ForeignKey, JSON
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import uuid
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./prodforge.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # Required for SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Models ───────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    google_id = Column(String, unique=True, nullable=False)
    email = Column(String, nullable=False)
    name = Column(String)
    picture = Column(String)
    productivity_score = Column(Integer, default=50)
    peak_hours = Column(JSON, default={"start": 9, "end": 17})
    created_at = Column(DateTime, default=datetime.utcnow)

    tasks = relationship("Task", back_populates="user", cascade="all, delete")
    habits = relationship("Habit", back_populates="user", cascade="all, delete")
    analytics = relationship("Analytics", back_populates="user", cascade="all, delete")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    deadline = Column(DateTime)
    status = Column(String, default="pending")
    priority = Column(Integer, default=3)
    risk_score = Column(Float, default=0.0)
    completion_probability = Column(Float, default=0.8)
    ai_plan = Column(JSON)
    total_estimated_hours = Column(Float)
    rescue_mode = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="tasks")
    subtasks = relationship("Subtask", back_populates="task", cascade="all, delete")


class Subtask(Base):
    __tablename__ = "subtasks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String, ForeignKey("tasks.id"), nullable=False)
    title = Column(String, nullable=False)
    estimated_minutes = Column(Integer, default=30)
    status = Column(String, default="pending")
    scheduled_start = Column(DateTime)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="subtasks")


class Habit(Base):
    __tablename__ = "habits"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    streak = Column(Integer, default=0)
    last_completed = Column(DateTime)
    frequency = Column(String, default="daily")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="habits")


class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    tasks_completed = Column(Integer, default=0)
    tasks_missed = Column(Integer, default=0)
    focus_minutes = Column(Integer, default=0)
    productivity_score = Column(Integer, default=50)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="analytics")


# ─── Create all tables ────────────────────────────────────

def create_tables():
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully.")


if __name__ == "__main__":
    create_tables()