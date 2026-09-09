import os
from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

TEST_DATABASE = Path("/tmp/darkfactory-api-tests.db")
TEST_DATABASE.unlink(missing_ok=True)

os.environ["DARKFACTORY_DATABASE_URL"] = (
    f"sqlite+pysqlite:///{TEST_DATABASE.as_posix()}"
)
os.environ["DARKFACTORY_AUTO_CREATE_SCHEMA"] = "true"
os.environ["DARKFACTORY_SEED_DEMO_DATA"] = "true"
os.environ["DARKFACTORY_QUEUE_ENABLED"] = "false"

from app.database import engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as test_client:
        yield test_client
    engine.dispose()
    TEST_DATABASE.unlink(missing_ok=True)
