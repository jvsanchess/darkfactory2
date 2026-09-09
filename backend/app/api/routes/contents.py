from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.database import get_session
from app.queue import celery_app
from app.repositories.contents import ContentRepository
from app.schemas import (
    ContentItem,
    ContentList,
    PipelineStageName,
    QueueTaskResponse,
)

router = APIRouter(prefix="/contents", tags=["contents"])


SessionDep = Annotated[Session, Depends(get_session)]


@router.get("", response_model=ContentList)
def list_contents(
    session: SessionDep,
    search: str | None = Query(default=None, max_length=120),
) -> ContentList:
    items = ContentRepository(session).list(search)
    return ContentList(items=items, total=len(items))


@router.get("/{content_id}", response_model=ContentItem)
def get_content(content_id: int, session: SessionDep) -> ContentItem:
    item = ContentRepository(session).get(content_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conteúdo não encontrado")
    return item


@router.patch("/{content_id}/approve", response_model=ContentItem)
def approve_content(
    content_id: int,
    session: SessionDep,
    settings: Settings = Depends(get_settings),
) -> ContentItem:
    repository = ContentRepository(session)
    item = repository.approve(content_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conteúdo não encontrado")
    if settings.queue_enabled:
        job = repository.create_job(content_id, "publication", "Publicação")
        try:
            task = celery_app.send_task(
                "darkfactory.publish_content", args=[content_id, job.id]
            )
            repository.attach_task(job, task.id)
        except Exception as exc:
            repository.fail_job(job, str(exc))
    return item


@router.post("/{content_id}/process", response_model=QueueTaskResponse)
def process_content(
    content_id: int,
    session: SessionDep,
    from_stage: PipelineStageName = Query(default="Pesquisa"),
    settings: Settings = Depends(get_settings),
) -> QueueTaskResponse:
    repository = ContentRepository(session)
    if repository.get(content_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conteúdo não encontrado")
    if not settings.queue_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Fila de processamento desativada",
        )
    job = repository.create_job(content_id, "pipeline", from_stage)
    try:
        task = celery_app.send_task(
            "darkfactory.process_pipeline", args=[content_id, job.id, from_stage]
        )
        repository.attach_task(job, task.id)
    except Exception as exc:
        repository.fail_job(job, str(exc))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Fila indisponível",
        ) from exc
    return QueueTaskResponse(
        job_id=job.id,
        task_id=task.id,
        status="queued",
        from_stage=from_stage,
    )
