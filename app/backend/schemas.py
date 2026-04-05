from datetime import datetime

from pydantic import BaseModel


class TaskBase(BaseModel):
    task_text: str
    completed: bool = False

class TaskCreate(TaskBase):
    pass

class TaskOut(TaskBase):
    id: int
    created_at: datetime
    tracked_time: float
    tracked_sessions: int

    class Config:
        from_attributes = True


class TimerSessionBase(BaseModel):
    task_id: int
    started_at: datetime
    finished_at: datetime
    duration: float

class TimerSessionCreate(TimerSessionBase):
    pass

class TimerSessionOut(TimerSessionBase):
    id: int
    
    class Config:
        from_attributes = True
