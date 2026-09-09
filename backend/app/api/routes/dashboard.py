from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_session
from app.queue import queue_is_online
from app.repositories.contents import ContentRepository
from app.schemas import (
    DashboardSnapshot,
    Metric,
    PipelineStage,
    RenderStatus,
    ServiceStatus,
)

router = APIRouter(tags=["dashboard"])
SessionDep = Annotated[Session, Depends(get_session)]


@router.get("/dashboard", response_model=DashboardSnapshot)
def dashboard(
    session: SessionDep,
) -> DashboardSnapshot:
    contents = ContentRepository(session).list()
    pending = sum(item.status == "Aguardando aprovação" for item in contents)
    queue_online = queue_is_online()
    services = [
        ServiceStatus(name="PostgreSQL", detail="Persistência do pipeline", state="Online"),
        ServiceStatus(
            name="Redis / Celery",
            detail="Fila de processamento",
            state="Online" if queue_online else "Offline",
        ),
        ServiceStatus(name="YouTube Data", detail="Coleta de tendências", state="Online"),
        ServiceStatus(name="TMDb", detail="Metadados e referências", state="Online"),
        ServiceStatus(name="TVMaze", detail="Catálogo de séries", state="Online"),
        ServiceStatus(name="FFmpeg", detail="Renderização local", state="Processando"),
        ServiceStatus(name="ElevenLabs", detail="Narração", state="Online"),
    ]
    online_percent = round(
        100 * sum(service.state == "Online" for service in services) / len(services)
    )
    return DashboardSnapshot(
        metrics=[
            Metric(label="No pipeline", value="15", note="+4 hoje"),
            Metric(label="Para aprovar", value=f"{pending:02d}", note="Requer atenção"),
            Metric(label="Publicados hoje", value="02", note="Próximo às 19:30"),
            Metric(
                label="Serviços online",
                value=f"{online_percent}%",
                note="1 processando",
            ),
        ],
        stages=[
            PipelineStage(name="Pauta", value=3, color="violet"),
            PipelineStage(name="Pesquisa", value=2, color="blue"),
            PipelineStage(name="Roteiro", value=2, color="cyan"),
            PipelineStage(name="Mídia", value=1, color="amber"),
            PipelineStage(name="Narração", value=1, color="orange"),
            PipelineStage(name="Edição", value=2, color="pink"),
            PipelineStage(name="Revisão", value=pending, color="red"),
            PipelineStage(name="Publicação", value=1, color="green"),
        ],
        contents=contents,
        services=services,
        render=RenderStatus(filename="virada_improvavel_v3.mp4", progress=68),
    )
