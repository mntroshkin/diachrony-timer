from datetime import datetime

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, column_property
from sqlalchemy import select, func, false


class Base(DeclarativeBase):
    pass

# class User(Base):
#     __tablename__ = "user"

#     id: Mapped[int] = mapped_column(primary_key=True)
#     username: Mapped[str]
#     last_login: Mapped[datetime] = mapped_column(DateTime)

#     tasks: Mapped[list["Task"]] = relationship(back_populates="user")

class TimerSession(Base):
    __tablename__ = "session"

    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("task.id", ondelete="CASCADE"))
    started_at: Mapped[datetime] = mapped_column(nullable=False)
    finished_at: Mapped[datetime] = mapped_column(nullable=False)
    duration: Mapped[float] = mapped_column(nullable=False)

    task: Mapped["Task"] = relationship(back_populates="sessions")


class Task(Base):
    __tablename__ = "task"

    id: Mapped[int] = mapped_column(primary_key=True)
    # user_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    task_text: Mapped[str] = mapped_column(nullable=False)
    completed: Mapped[bool] = mapped_column(server_default=false(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    sessions: Mapped[list[TimerSession]] = relationship(back_populates="task",
                                                        cascade="all, delete",
                                                        passive_deletes=True)

    tracked_sessions = column_property(
        select(func.count(TimerSession.id))
        .where(TimerSession.task_id == id)
        .correlate_except(TimerSession)
        .scalar_subquery()
    )
    tracked_time = column_property(
        select(func.coalesce(func.sum(TimerSession.duration), 0))
        .where(TimerSession.task_id == id)
        .correlate_except(TimerSession)
        .scalar_subquery(),
    )
    # user: Mapped["User"] = relationship(back_populates="tasks")
