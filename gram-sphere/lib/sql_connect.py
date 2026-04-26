import os
import sqlalchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from google.cloud.sql.connector import Connector, IPTypes
from google.oauth2 import service_account
import pg8000

load_dotenv()

# Configuration
INSTANCE_CONNECTION_NAME = os.getenv("INSTANCE_CONNECTION_NAME") # e.g. "project:region:instance"
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME", "gramsphere")
DB_URL = os.getenv("DATABASE_URL")
SERVICE_ACCOUNT_PATH = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")

# Initialize credentials if available
credentials = None
if SERVICE_ACCOUNT_PATH and os.path.exists(SERVICE_ACCOUNT_PATH):
    credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_PATH)

# Initialize Connector with explicit credentials to avoid ADC issues
connector = Connector(credentials=credentials)

def get_conn():
    """Helper function to create a connection object."""
    if INSTANCE_CONNECTION_NAME:
        # Use Cloud SQL Connector (Managed SQL Connect)
        return connector.connect(
            INSTANCE_CONNECTION_NAME,
            "pg8000",
            user=DB_USER,
            password=DB_PASS,
            db=DB_NAME,
            ip_type=IPTypes.PUBLIC  # Or IPTypes.PRIVATE if in VPC
        )
    else:
        # Fallback to local/direct connection string
        return pg8000.connect(
            user=DB_USER,
            password=DB_PASS,
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", 5432)),
            database=DB_NAME
        )

def get_db_url():
    """Returns the database URL for SQLAlchemy."""
    if DB_URL and not INSTANCE_CONNECTION_NAME:
        return DB_URL
    # For Cloud SQL Connector, we use a creator function instead of a URL string
    return "postgresql+pg8000://"

# Create SQLAlchemy engine
if INSTANCE_CONNECTION_NAME:
    engine = create_engine(
        "postgresql+pg8000://",
        creator=get_conn,
    )
else:
    engine = create_engine(DB_URL or "postgresql://user:password@localhost:5432/gramsphere")

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_sql_session():
    """Dependency for getting a database session."""
    db_session = SessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()

def execute_query(query, params=None):
    """Utility to execute a raw SQL query and return results."""
    with engine.connect() as connection:
        result = connection.execute(sqlalchemy.text(query), params or {})
        if result.returns_rows:
            return [dict(row._mapping) for row in result]
        return None
