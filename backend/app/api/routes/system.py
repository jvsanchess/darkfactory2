from fastapi import APIRouter, Depends
from app.config import Settings, get_settings
from app.database import database_is_online
from app.queue import queue_is_online
from app.schemas import ComponentHealth, SystemHealth

router = APIRouter(tags=["system"])


@router.get("/system", response_model=SystemHealth)
def system_health(settings: Settings = Depends(get_settings)) -> SystemHealth:
    database_online = database_is_online()
    queue_online = queue_is_online()

    database = ComponentHealth(
        status="online" if database_online else "offline",
        detail=None if database_online else "Banco indisponível",
    )
    queue = ComponentHealth(
        status=(
            "online"
            if queue_online
            else "disabled"
            if not settings.queue_enabled
            else "offline"
        ),
        detail=None if queue_online or not settings.queue_enabled else "Redis indisponível",
    )
    return SystemHealth(
        status="ok"
        if database_online and (queue_online or not settings.queue_enabled)
        else "degraded",
        database=database,
        queue=queue,
    )
