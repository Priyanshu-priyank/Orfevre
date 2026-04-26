import os
from pathlib import Path
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

PROJECT_ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = PROJECT_ROOT / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)


def _clean_env_value(value: str | None) -> str | None:
    if not value:
        return None
    return value.strip().strip('"').strip("'")


def _resolve_env_path(value: str | None) -> str | None:
    cleaned = _clean_env_value(value)
    if not cleaned:
        return None
    path = Path(cleaned)
    if not path.is_absolute():
        path = (PROJECT_ROOT / path).resolve()
    return str(path)

def get_pg_connection():
    """
    Returns a psycopg2 connection with RealDictCursor so all rows
    come back as dicts — directly JSON-serialisable in FastAPI.
    """
    return psycopg2.connect(
        os.getenv("DATABASE_URL"),
        cursor_factory=RealDictCursor
    )

if not firebase_admin._apps:
    cert_path = _resolve_env_path(
        os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH") or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    )

    if cert_path and os.path.exists(cert_path):
        # We always initialize with the certificate if found.
        # If FIRESTORE_EMULATOR_HOST is set in .env, traffic will 
        # automatically redirect to the local emulator.
        cred = credentials.Certificate(cert_path)
        firebase_admin.initialize_app(cred)
        
        if os.getenv("FIRESTORE_EMULATOR_HOST"):
            print(f"OK Connected to Firestore Emulator at {os.getenv('FIRESTORE_EMULATOR_HOST')}")
        else:
            print("OK Connected to Production Firestore")
    else:
        # Fallback error if no certificate is found
        raise FileNotFoundError(
            f"Firebase Service Account key not found at: {os.path.abspath(cert_path if cert_path else 'EMPTY')}. "
            "Please check your .env file."
        )

db = firestore.client()
