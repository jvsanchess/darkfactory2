from celery import Celery
from redis import Redis

from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "darkfactory",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks"],
)
celery_app.conf.update(
    task_default_queue=settings.queue_name,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    result_expires=3600,
    task_track_started=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    broker_connection_retry_on_startup=True,
)


def queue_is_online() -> bool:
    if not settings.queue_enabled:
        return False
    try:
        client = Redis.from_url(
            settings.redis_url,
            socket_connect_timeout=1,
            socket_timeout=1,
            decode_responses=True,
        )
        online = bool(client.ping())
        client.close()
        return online
    except Exception:
        return False
