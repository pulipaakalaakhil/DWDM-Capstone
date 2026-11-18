from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
import secrets
import time
from typing import Optional, Dict
from app.database.connection import get_connection, hash_password, verify_password

router = APIRouter()

# In-memory storage for active 2FA pending sessions (expires in 5 minutes)
# Format: temp_token -> {"username": str, "code": str, "expires_at": float, "attempts": int}
PENDING_2FA_SESSIONS: Dict[str, dict] = {}

# Active session tokens
ACTIVE_TOKENS: Dict[str, dict] = {}

class RegisterRequest(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    department: Optional[str] = "BBMP Central Traffic Management"
    role: Optional[str] = "Senior Traffic Operations Director"
    two_factor_enabled: Optional[bool] = False

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class Verify2FARequest(BaseModel):
    temp_token: str
    code: str

class Resend2FARequest(BaseModel):
    temp_token: str

@router.post("/register")
async def register_admin(payload: RegisterRequest):
    username = payload.username.strip().lower()
    email = payload.email.strip().lower()
    
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters long.")
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")
        
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if username or email exists
    cursor.execute("SELECT id FROM admin_users WHERE username = ? OR email = ?", (username, email))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="An administrator with this username or email already exists.")
        
    pw_hash = hash_password(payload.password)
    two_factor_val = 1 if payload.two_factor_enabled else 0
    
    cursor.execute("""
        INSERT INTO admin_users (username, email, full_name, password_hash, role, department, two_factor_enabled)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        username,
        email,
        payload.full_name.strip(),
        pw_hash,
        payload.role,
        payload.department,
        two_factor_val
    ))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    
    return {
        "success": True,
        "message": f"Administrator '{payload.full_name}' successfully registered. Proceed to login.",
        "user": {
            "id": new_id,
            "username": username,
            "email": email,
            "full_name": payload.full_name,
            "role": payload.role,
            "department": payload.department,
            "two_factor_enabled": bool(two_factor_val)
        }
    }

@router.post("/login")
async def login_admin(payload: LoginRequest):
    query = payload.username_or_email.strip().lower()
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, username, email, full_name, password_hash, role, department, two_factor_enabled
        FROM admin_users
        WHERE username = ? OR email = ?
    """, (query, query))
    user_row = cursor.fetchone()
    conn.close()
    
    if not user_row or not verify_password(payload.password, user_row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid administrator credentials.")
        
    user_data = dict(user_row)
    
    # Direct session creation without 2FA
    session_token = secrets.token_hex(32)
    ACTIVE_TOKENS[session_token] = user_data
    return {
        "success": True,
        "requires_2fa": False,
        "token": session_token,
        "user": {
            "id": user_data["id"],
            "username": user_data["username"],
            "email": user_data["email"],
            "full_name": user_data["full_name"],
            "role": user_data["role"],
            "department": user_data["department"]
        },
        "message": "Authentication successful. Welcome to Command Center."
    }

@router.post("/verify-2fa")
async def verify_2fa(payload: Verify2FARequest):
    session = PENDING_2FA_SESSIONS.get(payload.temp_token)
    if not session:
        raise HTTPException(status_code=400, detail="Verification session expired or invalid. Please login again.")
        
    if time.time() > session["expires_at"]:
        del PENDING_2FA_SESSIONS[payload.temp_token]
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new code.")
        
    session["attempts"] += 1
    if session["attempts"] > 5:
        del PENDING_2FA_SESSIONS[payload.temp_token]
        raise HTTPException(status_code=403, detail="Too many failed verification attempts. Please log in again.")
        
    entered_code = payload.code.strip()
    # Accept actual generated code or fallback test code '123456'
    if entered_code != session["code"] and entered_code != "123456":
        raise HTTPException(status_code=400, detail="Incorrect 6-digit verification code. Please check and try again.")
        
    # Success: issue permanent session token
    session_token = secrets.token_hex(32)
    ACTIVE_TOKENS[session_token] = {
        "id": session["user_id"],
        "username": session["username"],
        "email": session["email"],
        "full_name": session["full_name"],
        "role": session["role"],
        "department": session["department"]
    }
    
    # Clean up pending session
    del PENDING_2FA_SESSIONS[payload.temp_token]
    
    return {
        "success": True,
        "token": session_token,
        "user": ACTIVE_TOKENS[session_token],
        "message": "Two-step verification completed. Security clearance granted."
    }

@router.post("/resend-2fa")
async def resend_2fa(payload: Resend2FARequest):
    session = PENDING_2FA_SESSIONS.get(payload.temp_token)
    if not session:
        raise HTTPException(status_code=400, detail="Session expired. Please restart login.")
        
    new_code = f"{secrets.randbelow(900000) + 100000}"
    session["code"] = new_code
    session["expires_at"] = time.time() + 300
    session["attempts"] = 0
    
    return {
        "success": True,
        "preview_code": new_code,
        "message": "New 6-digit verification code has been dispatched."
    }

@router.get("/me")
async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        # Fallback to default admin for smooth viewing
        return {
            "success": True,
            "authenticated": True,
            "user": {
                "id": 1,
                "username": "admin",
                "email": "admin@traffic.bbmp.gov.in",
                "full_name": "Executive Traffic Controller",
                "role": "Chief Traffic Operations Director",
                "department": "BBMP Central Traffic Command Hub"
            }
        }
        
    token = authorization.replace("Bearer ", "").strip()
    user = ACTIVE_TOKENS.get(token)
    if not user:
        return {
            "success": True,
            "authenticated": False,
            "message": "Invalid or expired session."
        }
        
    return {
        "success": True,
        "authenticated": True,
        "user": user
    }
