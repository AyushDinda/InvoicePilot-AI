import os
import shutil
import tempfile
from pathlib import Path
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from backend.database.session import Base, get_db
import backend.services.storage_service as storage_service
import backend.services.ai_service as ai_service
from backend.main import app

# Ensure mock mode is active by default in tests so no Ollama live server is required
ai_service.MOCK_AI_ENV = True


@pytest.fixture(scope="session")
def test_temp_dir():
    temp_dir = tempfile.mkdtemp(prefix="invoicepilot_test_")
    storage_service.STORAGE_DIR = temp_dir
    yield temp_dir
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture(scope="function")
def db_session(test_temp_dir):
    test_db_path = Path(test_temp_dir) / "test.db"
    engine = create_engine(
        f"sqlite:///{test_db_path}",
        connect_args={"check_same_thread": False},
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
