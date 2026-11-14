"""Alembic environment.

Schema ownership moved from Prisma to Alembic. Revision 0001_baseline
represents the schema created by apps/backend/prisma/migrations/
20260807093213_init — existing databases are marked with
``alembic stamp 0001_baseline`` (no DDL runs). Write new revisions by hand
(``alembic revision -m "..."``); autogenerate is not configured because the
app reflects tables instead of declaring ORM models.
"""

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.config import get_settings

config = context.config
config.set_main_option("sqlalchemy.url", get_settings().database_url)


def run_migrations_offline() -> None:
    context.configure(url=config.get_main_option("sqlalchemy.url"), literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(config.get_section(config.config_ini_section, {}), prefix="sqlalchemy.",
                                     poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
