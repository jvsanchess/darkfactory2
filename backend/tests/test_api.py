from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.repositories.contents import ContentRepository
from app.tasks import process_pipeline, publish_content


def test_health(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_dashboard_contract(client: TestClient) -> None:
    response = client.get("/api/v1/dashboard")
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["stages"]) == 8
    assert len(payload["contents"]) == 3


def test_approve_content_is_idempotent(client: TestClient) -> None:
    first = client.patch("/api/v1/contents/1/approve")
    second = client.patch("/api/v1/contents/1/approve")
    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json()["status"] == "Aprovado"
    assert second.json()["stage"] == "Publicação"


def test_missing_content(client: TestClient) -> None:
    response = client.patch("/api/v1/contents/999/approve")
    assert response.status_code == 404


def test_system_reports_database_online(client: TestClient) -> None:
    response = client.get("/api/v1/system")
    assert response.status_code == 200
    assert response.json()["database"]["status"] == "online"
    assert response.json()["queue"]["status"] == "disabled"


def test_processing_requires_enabled_queue(client: TestClient) -> None:
    response = client.post("/api/v1/contents/2/process")
    assert response.status_code == 503


def test_processing_rejects_unknown_stage(client: TestClient) -> None:
    response = client.post("/api/v1/contents/2/process?from_stage=Desconhecida")
    assert response.status_code == 422


def test_worker_reprocesses_from_selected_stage(client: TestClient) -> None:
    with SessionLocal() as session:
        repository = ContentRepository(session)
        job = repository.create_job(2, "pipeline", "Roteiro")
        result = process_pipeline.run(2, job.id, "Roteiro")
        refreshed = repository.get(2)
        assert result["completed_stages"][0] == "Roteiro"
        assert result["requires_human_approval"] is True
        assert refreshed is not None
        assert refreshed.status == "Aguardando aprovação"


def test_publication_worker_requires_and_preserves_approval(client: TestClient) -> None:
    with SessionLocal() as session:
        repository = ContentRepository(session)
        approved = repository.approve(3)
        assert approved is not None
        job = repository.create_job(3, "publication", "Publicação")
        result = publish_content.run(3, job.id)
        assert result["publication_ready"] is True
        assert repository.get(3).status == "Aprovado"
