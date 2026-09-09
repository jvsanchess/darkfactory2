from collections.abc import Iterable

from celery.utils.log import get_task_logger
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import ContentRecord, PipelineJobRecord
from app.queue import celery_app

logger = get_task_logger(__name__)

PIPELINE_STAGES = [
    "Pauta",
    "Pesquisa",
    "Roteiro",
    "Mídia",
    "Narração",
    "Edição",
    "Revisão",
]


def stages_from(stage: str) -> Iterable[str]:
    try:
        start = PIPELINE_STAGES.index(stage)
    except ValueError:
        start = 0
    return PIPELINE_STAGES[start:]


def update_job(
    session: Session,
    job: PipelineJobRecord,
    *,
    status: str,
    stage: str,
    error: str | None = None,
) -> None:
    job.status = status
    job.current_stage = stage
    job.error = error
    session.commit()


@celery_app.task(
    bind=True,
    name="darkfactory.process_pipeline",
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_jitter=True,
    max_retries=3,
)
def process_pipeline(
    self, content_id: int, job_id: str, from_stage: str = "Pesquisa"
) -> dict[str, object]:
    with SessionLocal() as session:
        job = session.get(PipelineJobRecord, job_id)
        content = session.get(ContentRecord, content_id)
        if job is None or content is None:
            raise ValueError("Conteúdo ou trabalho não encontrado")

        completed: list[str] = []
        try:
            for stage in stages_from(from_stage):
                update_job(session, job, status="running", stage=stage)
                content.stage = stage
                content.status = (
                    "Aguardando aprovação" if stage == "Revisão" else "Em edição"
                )
                content.updated = "agora"
                session.commit()
                completed.append(stage)

            update_job(session, job, status="succeeded", stage="Revisão")
            logger.info("Pipeline concluído para conteúdo %s", content_id)
            return {
                "content_id": content_id,
                "job_id": job_id,
                "completed_stages": completed,
                "requires_human_approval": True,
            }
        except Exception as exc:
            update_job(
                session,
                job,
                status="failed",
                stage=job.current_stage,
                error=str(exc)[:1000],
            )
            raise


@celery_app.task(
    bind=True,
    name="darkfactory.publish_content",
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_jitter=True,
    max_retries=3,
)
def publish_content(self, content_id: int, job_id: str) -> dict[str, object]:
    with SessionLocal() as session:
        job = session.get(PipelineJobRecord, job_id)
        content = session.get(ContentRecord, content_id)
        if job is None or content is None:
            raise ValueError("Conteúdo ou trabalho não encontrado")
        if content.status != "Aprovado":
            update_job(
                session,
                job,
                status="failed",
                stage="Publicação",
                error="Aprovação humana obrigatória",
            )
            raise ValueError("Conteúdo ainda não foi aprovado")

        update_job(session, job, status="running", stage="Publicação")
        # A integração real com YouTube/TikTok será adicionada no módulo de publicação.
        update_job(session, job, status="succeeded", stage="Publicação")
        logger.info("Conteúdo %s liberado para publicação", content_id)
        return {
            "content_id": content_id,
            "job_id": job_id,
            "publication_ready": True,
        }
