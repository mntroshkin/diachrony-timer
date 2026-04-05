from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_session

router = APIRouter(prefix='/api/sessions', tags=['Sessions'])

@router.get('/', response_model=list[schemas.TimerSessionOut])
def get_timer_sessions(task_id: Optional[int] = None, session: Session = Depends(get_session)):
    """Get all sessions. If task id is provided, get all sessions for that task."""
    
    if task_id is None:
        timer_sessions = session.query(models.TimerSession).all()
    else:
        task = session.query(models.Task).filter(models.Task.id == task_id).first()
        if task is None:
            raise HTTPException(status_code=404, detail="Task not found")
        timer_sessions = session.query(models.TimerSession).filter(models.TimerSession.task_id == task_id).all()
    
    return [schemas.TimerSessionOut.model_validate(timer_session) for timer_session in timer_sessions]


@router.post('/', status_code=201, response_model=schemas.TimerSessionOut)
def create_timer_session(new_timer_session: schemas.TimerSessionCreate,
                         session: Session = Depends(get_session)):
    
    task_id = new_timer_session.task_id
    task = session.query(models.Task).filter(models.Task.id == task_id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    timer_session = models.TimerSession(**new_timer_session.model_dump())
    session.add(timer_session)
    session.commit()
    session.refresh(timer_session)
    return schemas.TimerSessionOut.model_validate(timer_session)