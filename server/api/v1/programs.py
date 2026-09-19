from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import Program, User
from server.schemas import ProgramCreate, ProgramUpdate, ProgramResponse
from server.auth import get_current_user, require_roles

router = APIRouter(prefix="/programs", tags=["Programs"])


@router.get("", response_model=List[ProgramResponse])
def list_programs(
    category: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Program)
    if category:
        query = query.filter(Program.category == category)
    return query.offset(skip).limit(limit).all()


@router.post("", response_model=ProgramResponse, status_code=status.HTTP_201_CREATED)
def create_program(
    program_in: ProgramCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "News Manager", "Editor"])),
):
    program = Program(**program_in.model_dump())
    db.add(program)
    db.commit()
    db.refresh(program)
    return program


@router.get("/{program_id}", response_model=ProgramResponse)
def get_program(
    program_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Program not found"
        )
    return program


@router.put("/{program_id}", response_model=ProgramResponse)
def update_program(
    program_id: str,
    program_in: ProgramUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "News Manager", "Editor"])),
):
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Program not found"
        )

    update_data = program_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(program, field, value)

    db.commit()
    db.refresh(program)
    return program


@router.delete("/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_program(
    program_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "News Manager"])),
):
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Program not found"
        )

    db.delete(program)
    db.commit()
    return None
