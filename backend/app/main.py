from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models as _models
from app.api.routes import contents, dashboard, health, system
from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.repositories.contents import seed_demo_contents

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.auto_create_schema:
        Base.metadata.create_all(bind=engine)
    if settings.seed_demo_data:
        with SessionLocal() as session:
            seed_demo_contents(session)
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="API de orquestração do pipeline DarkFactory.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.api_prefix)
app.include_router(dashboard.router, prefix=settings.api_prefix)
app.include_router(contents.router, prefix=settings.api_prefix)
app.include_router(system.router, prefix=settings.api_prefix)
