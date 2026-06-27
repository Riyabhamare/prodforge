from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from models.database import create_tables
from routers import tasks, users, analytics, coach, forge
app = FastAPI(
    title="ProdForge API",
    description="AI-powered productivity execution engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    create_tables()
    print("✅ ProdForge API started successfully")

app.include_router(users.router,     prefix="/api/users",     tags=["Users"])
app.include_router(tasks.router,     prefix="/api/tasks",     tags=["Tasks"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(coach.router,     prefix="/api/coach",     tags=["Coach"])
app.include_router(forge.router,     prefix="/api/ai",        tags=["AI"])

@app.get("/")
async def root():
    return {"app": "ProdForge", "status": "running", "version": "1.0.0", "docs": "/docs"}

@app.get("/health")
async def health():
    return {"status": "healthy"}