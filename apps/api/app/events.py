"""DomainEvent + AuditLog writers (same rows apps/backend writes)."""

from typing import Any

from sqlalchemy import Connection

from .db import insert_row


def publish(conn: Connection, type_: str, payload: dict[str, Any], entity_type: str | None, entity_id: str | None) -> None:
    insert_row(conn, "DomainEvent", {
        "type": type_, "payload": payload, "relatedEntityType": entity_type, "relatedEntityId": entity_id,
    })


def audit(conn: Connection, actor_id: str | None, action: str, entity_type: str, entity_id: str,
          metadata: dict[str, Any] | None = None) -> None:
    insert_row(conn, "AuditLog", {
        "actorId": actor_id, "action": action, "entityType": entity_type, "entityId": entity_id, "metadata": metadata,
    })
