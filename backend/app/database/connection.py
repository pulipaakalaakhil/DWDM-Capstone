import sqlite3
import os
import hashlib
import secrets

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "traffic.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

# Password hashing utilities using standard library hashlib
def hash_password(password: str, salt: str = None) -> str:
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode('utf-8')).hexdigest()
    return f"{salt}${hashed}"

def verify_password(plain_password: str, stored_hash: str) -> bool:
    try:
        salt, hashed = stored_hash.split('$', 1)
        expected = hashlib.sha256((salt + plain_password).encode('utf-8')).hexdigest()
        return secrets.compare_digest(hashed, expected)
    except Exception:
        return False

# Stubs for compatibility
class Base:
    metadata = type('obj', (object,), {'create_all': lambda self, bind=None: None})()

engine = None

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Prediction results table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS prediction_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            model_name TEXT,
            target_variable TEXT,
            mae REAL,
            rmse REAL,
            r2_score REAL,
            accuracy REAL,
            f1_score REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 2. Admin users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'Traffic Operations Director',
            department TEXT DEFAULT 'BBMP Central Traffic Management',
            two_factor_enabled INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Check if default admin exists, if not seed it
    cursor.execute("SELECT id FROM admin_users WHERE username = 'admin'")
    if not cursor.fetchone():
        default_pw_hash = hash_password("admin123")
        cursor.execute("""
            INSERT INTO admin_users (username, email, full_name, password_hash, role, department, two_factor_enabled)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            "admin",
            "admin@traffic.bbmp.gov.in",
            "Executive Traffic Controller",
            default_pw_hash,
            "Chief Traffic Operations Director",
            "BBMP Central Traffic Command Hub",
            1
        ))
    
    conn.commit()
    conn.close()

init_db()
