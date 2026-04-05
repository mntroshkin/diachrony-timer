from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_session

router = APIRouter(prefix='/api/tasks', tags=['Tasks'])

@router.get('/', response_model=list[schemas.TaskOut])
def get_tasks(session: Session = Depends(get_session)) -> list[schemas.TaskOut]:
    """Get all tasks"""

    tasks = session.query(models.Task).all()
    return [schemas.TaskOut.model_validate(task) for task in tasks]


@router.post('/', status_code=201, response_model=schemas.TaskOut)
def create_task(new_task: schemas.TaskCreate, session: Session = Depends(get_session)) -> schemas.TaskOut:
    task = models.Task(**new_task.model_dump())
    session.add(task)
    session.commit()
    session.refresh(task)
    return schemas.TaskOut.model_validate(task)


@router.get('/{id}', response_model=schemas.TaskOut)
def get_task(id: int, session: Session = Depends(get_session)) -> schemas.TaskOut:
    task = session.query(models.Task).filter(models.Task.id == id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return schemas.TaskOut.model_validate(task)


@router.put('/{id}', response_model=schemas.TaskOut)
def update_task(id: int, updated_task: schemas.TaskCreate, 
                session: Session = Depends(get_session)) -> schemas.TaskOut:
    task_query = session.query(models.Task).filter(models.Task.id == id)
    if task_query.first() is None:
        raise HTTPException(status_code=404, detail="Task not found")
    task_query.update(updated_task.model_dump()) # type: ignore
    session.commit()
    return schemas.TaskOut.model_validate(task_query.first())


@router.delete('/{id}', status_code=204)
def delete_task(id: int, session: Session = Depends(get_session)):
    task_query = session.query(models.Task).filter(models.Task.id == id)
    if task_query.first() is None:
        raise HTTPException(status_code=404, detail="Task not found")
    task_query.delete()
    session.commit()