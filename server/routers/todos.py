import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.schemas.todo import Todo, TodoCreate, TodoUpdate
from server.services.todo_service import TodoService

router = APIRouter(prefix="/api/v1/todos", tags=["todos"])


@router.get("", response_model=List[Todo], status_code=status.HTTP_200_OK)
def list_todos(
    status: str = Query("all", description="Filter by status: all, active, completed"),
    search: Optional[str] = Query(
        None, description="Search term in title or description"
    ),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Max number of records to return"),
    db: Session = Depends(get_db),
):
    return TodoService.list_todos(
        db=db,
        status_filter=status,
        search=search,
        skip=skip,
        limit=limit,
    )


@router.post("", response_model=Todo, status_code=status.HTTP_201_CREATED)
def create_todo(
    payload: TodoCreate,
    db: Session = Depends(get_db),
):
    return TodoService.create_todo(db=db, payload=payload)


@router.get("/{id}", response_model=Todo, status_code=status.HTTP_200_OK)
def get_todo(
    id: uuid.UUID,
    db: Session = Depends(get_db),
):
    return TodoService.get_todo_by_id(db=db, todo_id=id)


@router.put("/{id}", response_model=Todo, status_code=status.HTTP_200_OK)
def update_todo(
    id: uuid.UUID,
    payload: TodoUpdate,
    db: Session = Depends(get_db),
):
    return TodoService.update_todo(db=db, todo_id=id, payload=payload)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
    id: uuid.UUID,
    db: Session = Depends(get_db),
):
    TodoService.delete_todo(db=db, todo_id=id)
    return None
