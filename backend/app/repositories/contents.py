from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models import ContentRecord, PipelineJobRecord
from app.schemas import ContentItem


class ContentRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list(self, search: str | None = None) -> list[ContentItem]:
        statement: Select[tuple[ContentRecord]] = select(ContentRecord).order_by(
            ContentRecord.id
        )
        if search:
            statement = statement.where(ContentRecord.title.ilike(f"%{search}%"))
        records = self.session.scalars(statement).all()
        return [ContentItem.model_validate(record) for record in records]

    def get(self, content_id: int) -> ContentItem | None:
        record = self.session.get(ContentRecord, content_id)
        return ContentItem.model_validate(record) if record else None

    def approve(self, content_id: int) -> ContentItem | None:
        record = self.session.get(ContentRecord, content_id)
        if record is None:
            return None
        if record.status != "Aprovado":
            record.status = "Aprovado"
            record.stage = "Publicação"
            record.updated = "agora"
            record.approved_at = datetime.now(timezone.utc)
            self.session.commit()
            self.session.refresh(record)
        return ContentItem.model_validate(record)

    def create_job(
        self, content_id: int, task_name: str, current_stage: str
    ) -> PipelineJobRecord:
        job = PipelineJobRecord(
            id=str(uuid4()),
            content_id=content_id,
            task_name=task_name,
            status="queued",
            current_stage=current_stage,
        )
        self.session.add(job)
        self.session.commit()
        self.session.refresh(job)
        return job

    def attach_task(self, job: PipelineJobRecord, task_id: str) -> None:
        job.external_task_id = task_id
        self.session.commit()

    def fail_job(self, job: PipelineJobRecord, error: str) -> None:
        job.status = "failed"
        job.error = error[:1000]
        self.session.commit()


def seed_demo_contents(session: Session) -> None:
    if session.scalar(select(ContentRecord.id).limit(1)) is not None:
        return
    session.add_all(
        [
            ContentRecord(
                id=1,
                title="O lance de Neymar que dividiu a internet",
                format="Shorts · Futebol",
                duration="00:47",
                status="Aguardando aprovação",
                stage="Revisão final",
                score=92,
                source="YouTube + notícias",
                updated="há 8 min",
            ),
            ContentRecord(
                id=2,
                title="Abel Ferreira e a decisão mais comentada da rodada",
                format="Shorts · Futebol",
                duration="00:54",
                status="Aguardando aprovação",
                stage="Revisão final",
                score=87,
                source="YouTube",
                updated="há 21 min",
            ),
            ContentRecord(
                id=3,
                title="A virada improvável que mudou o campeonato",
                format="Shorts · História",
                duration="00:42",
                status="Em edição",
                stage="Legendas e cortes",
                score=81,
                source="TVMaze + mídia livre",
                updated="há 34 min",
            ),
        ]
    )
    session.commit()
