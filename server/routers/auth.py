import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import User
from server.schemas import UserCreate, UserResponse, TokenResponse
from server.auth import hash_password, verify_password, create_access_token
from server.dependencies import get_current_user, record_audit

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication & RBAC"])


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
def register(user_in: UserCreate, request: Request, db: Session = Depends(get_db)):
    # Normalize phone
    phone = user_in.phone_number or user_in.phone

    # Check for existing user
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    role_val = (user_in.role or "PATIENT").upper()
    if role_val not in ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST", "PATIENT"]:
        role_val = "PATIENT"

    new_user = User(
        id=str(uuid.uuid4()),
        email=user_in.email.lower(),
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        phone_number=phone,
        role=role_val,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    record_audit(
        db=db,
        action="USER_REGISTERED",
        resource_type="USER",
        resource_id=new_user.id,
        user_id=new_user.id,
        ip_address=client_ip,
        user_agent=user_agent,
        details={"email": new_user.email, "role": new_user.role},
    )

    return new_user


@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    db: Session = Depends(get_db),
):
    # Support both JSON payload and application/x-www-form-urlencoded
    content_type = request.headers.get("content-type", "")
    username = None
    password = None

    if "application/json" in content_type:
        try:
            body = await request.json()
            username = body.get("username") or body.get("email")
            password = body.get("password")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON body")
    else:
        # Check form data
        form = await request.form()
        username = form.get("username") or form.get("email")
        password = form.get("password")

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username/email and password are required.",
        )

    user = db.query(User).filter(User.email == str(username).lower()).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated.",
        )

    token = create_access_token(
        data={
            "sub": user.id,
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "full_name": user.full_name,
        }
    )

    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    record_audit(
        db=db,
        action="USER_LOGIN",
        resource_type="AUTH",
        resource_id=user.id,
        user_id=user.id,
        ip_address=client_ip,
        user_agent=user_agent,
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
