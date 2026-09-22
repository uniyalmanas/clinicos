from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, UserProfile
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.db.session import get_db
from app.db.models import Clinic, UserAccount, ClinicMembership
from sqlalchemy.orm import Session
import uuid

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

# In-memory user store for dev/testing with seed accounts pre-loaded
# Password for seed accounts is "Password@123"
SEED_PASSWORD_HASH = get_password_hash("Password@123")

USERS_DB = {
    "+919876543210": {
        "id": "11111111-1111-1111-1111-111111111111",
        "phone": "+919876543210",
        "email": "dr.rahul@clinicos.in",
        "password_hash": SEED_PASSWORD_HASH,
        "full_name": "Dr. Rahul Sharma",
        "role": "doctor",
        "is_verified": True
    },
    "+919876543211": {
        "id": "22222222-2222-2222-2222-222222222222",
        "phone": "+919876543211",
        "email": "dr.aditi@clinicos.in",
        "password_hash": SEED_PASSWORD_HASH,
        "full_name": "Dr. Aditi Joshi",
        "role": "doctor",
        "is_verified": True
    },
    "+919876543214": {
        "id": "55555555-5555-5555-5555-555555555555",
        "phone": "+919876543214",
        "email": "pooja@dermacare.in",
        "password_hash": SEED_PASSWORD_HASH,
        "full_name": "Pooja Verma (Reception)",
        "role": "staff",
        "is_verified": True
    },
    "+919876543215": {
        "id": "77777777-7777-7777-7777-777777777777",
        "phone": "+919876543215",
        "email": "admin@clinicos.in",
        "password_hash": SEED_PASSWORD_HASH,
        "full_name": "ClinicOS Platform Admin",
        "role": "clinic_admin",
        "is_verified": True
    },
    "+919123456780": {
        "id": "66666666-6666-6666-6666-666666666661",
        "phone": "+919123456780",
        "email": "amit.rawat@gmail.com",
        "password_hash": SEED_PASSWORD_HASH,
        "full_name": "Amit Rawat",
        "role": "patient",
        "is_verified": True
    }
}

@router.post("/register", response_model=TokenResponse)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    if db.query(UserAccount).filter(UserAccount.phone == user_in.phone).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this phone number already exists."
        )
    
    new_id = str(uuid.uuid4())
    user_record = UserAccount(
        id=new_id,
        phone=user_in.phone,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        is_verified=False,
    )
    db.add(user_record)
    if user_in.clinic_id:
        db.add(ClinicMembership(
            id=str(uuid.uuid4()),
            user_id=new_id,
            clinic_id=user_in.clinic_id,
            role=user_in.role,
        ))
    db.commit()
    
    token = create_access_token(subject=new_id, role=user_in.role, clinic_id=user_in.clinic_id)
    return TokenResponse(
        access_token=token,
        role=user_in.role,
        user_id=new_id,
        full_name=user_in.full_name,
        phone=user_in.phone,
        clinic_id=user_in.clinic_id,
    )

@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(UserAccount).filter(
        UserAccount.phone == credentials.phone,
        UserAccount.is_active.is_(True),
    ).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password."
        )
    
    membership = db.query(ClinicMembership).filter(
        ClinicMembership.user_id == user.id,
        ClinicMembership.is_active.is_(True),
    ).first()
    role = membership.role if membership else user.role
    clinic_id = membership.clinic_id if membership else None
    token = create_access_token(subject=user.id, role=role, clinic_id=clinic_id)
    return TokenResponse(
        access_token=token,
        role=role,
        user_id=user.id,
        full_name=user.full_name,
        phone=user.phone,
        clinic_id=clinic_id,
    )

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> dict:
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token."
        )
    user_id = payload.get("sub")
    user = db.query(UserAccount).filter(
        UserAccount.id == user_id,
        UserAccount.is_active.is_(True),
    ).first()
    if user:
        membership = db.query(ClinicMembership).filter(
            ClinicMembership.user_id == user.id,
            ClinicMembership.is_active.is_(True),
        ).first()
        return {
            "id": user.id,
            "phone": user.phone,
            "email": user.email,
            "password_hash": user.password_hash,
            "full_name": user.full_name,
            "role": membership.role if membership else user.role,
            "clinic_id": membership.clinic_id if membership else payload.get("clinic_id"),
            "is_verified": user.is_verified,
        }
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

@router.get("/me", response_model=UserProfile)
def get_me(current_user: dict = Depends(get_current_user)):
    return UserProfile(
        id=current_user["id"],
        phone=current_user["phone"],
        email=current_user.get("email"),
        full_name=current_user["full_name"],
        role=current_user["role"],
        is_verified=current_user["is_verified"],
        clinic_id=current_user.get("clinic_id"),
        membership_role=current_user.get("role"),
    )
    
def require_roles(*allowed_roles: str):
    def role_dependency(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action."
            )
        return current_user
    return role_dependency


def require_active_tenant(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    clinic_id = current_user.get("clinic_id")
    if not clinic_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="A clinic membership is required for this operation.",
        )

    clinic = db.query(Clinic).filter(Clinic.id == clinic_id).first()
    if not clinic or clinic.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This clinic tenant is not active.")
    if clinic.subscription_status not in {"trial", "active"}:
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="This clinic subscription is not active.")
    current_user["tenant"] = clinic
    return current_user
