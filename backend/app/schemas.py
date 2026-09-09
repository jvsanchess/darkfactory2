from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


ContentStatus = Literal[
    "Aguardando aprovação",
    "Em edição",
    "Aprovado",
    "Publicado",
]
PipelineStageName = Literal[
    "Pauta",
    "Pesquisa",
    "Roteiro",
    "Mídia",
    "Narração",
    "Edição",
    "Revisão",
]


class ContentItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    format: str
    duration: str
    status: ContentStatus
    stage: str
    score: int = Field(ge=0, le=100)
    source: str
    updated: str
    approved_at: datetime | None = None


class ContentList(BaseModel):
    items: list[ContentItem]
    total: int


class Metric(BaseModel):
    label: str
    value: str
    note: str


class PipelineStage(BaseModel):
    name: str
    value: int
    color: str


class ServiceStatus(BaseModel):
    name: str
    detail: str
    state: Literal["Online", "Processando", "Offline"]


class RenderStatus(BaseModel):
    filename: str
    progress: int = Field(ge=0, le=100)


class DashboardSnapshot(BaseModel):
    metrics: list[Metric]
    stages: list[PipelineStage]
    contents: list[ContentItem]
    services: list[ServiceStatus]
    render: RenderStatus


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
    version: str
    environment: str


class QueueTaskResponse(BaseModel):
    job_id: str
    task_id: str
    status: Literal["queued"]
    from_stage: PipelineStageName


class ComponentHealth(BaseModel):
    status: Literal["online", "offline", "disabled"]
    detail: str | None = None


class SystemHealth(BaseModel):
    status: Literal["ok", "degraded"]
    database: ComponentHealth
    queue: ComponentHealth
