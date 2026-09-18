import uuid
from typing import List, Optional
from sqlalchemy import or_, desc
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from server.models.todo import Todo, utc_now
from server.schemas.todo import TodoCreate, TodoUpdate


class TodoService:
    @staticmethod
    def list_todos(
        db: Session,
        status_filter: str = "all",
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Todo]:
        query = db.query(Todo)

        # Status filtering
        if status_filter == "active":
            query = query.filter(Todo.is_completed.is_(False))
        elif status_filter == "completed":
            query = query.filter(Todo.is_completed.is_(True))
        elif status_filter != "all":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid status filter '{status_filter}'. Must be 'all', 'active', or 'completed'.",
            )

        # Keyword search
        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Todo.title.ilike(term),
                    Todo.description.ilike(term),
                )
            )

        # Sort order: newest first
        query = query.order_by(desc(Todo.created_at))

        # Pagination
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_todo_by_id(db: Session, todo_id: uuid.UUID) -> Todo:
        todo = db.query(Todo).filter(Todo.id == todo_id).first()
        if not todo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Todo item not found",
            )
        return todo

    @staticmethod
    def create_todo(db: Session, payload: TodoCreate) -> Todo:
        todo = Todo(
            id=uuid.uuid4(),
            title=payload.title,
            description=payload.description,
            is_completed=False,
            created_at=utc_now(),
            updated_at=utc_now(),
        )
        db.add(todo)
        db.commit()
        db.refresh(todo)
        return todo

    @staticmethod
    def update_todo(db: Session, todo_id: uuid.UUID, payload: TodoUpdate) -> Todo:
        todo = TodoService.get_todo_by_id(db, todo_id)

        update_data = payload.model_dump(exclude_unset=True)
        if not update_data:
            return todo

        for key, value in update_data.items():
            setattr(todo, key, value)

        todo.updated_at = utc_now()
        db.commit()
        db.refresh(todo)
        return todo

    @staticmethod
    def delete_todo(db: Session, todo_id: uuid.UUID) -> None:
        todo = TodoService.get_todo_by_id(db, todo_id)
        db.delete(todo)
        db.commit()
