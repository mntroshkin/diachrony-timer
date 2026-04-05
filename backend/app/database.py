from datetime import datetime
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from .models import Base


engine = create_engine("sqlite:///diachrony.db", echo=True)

SessionLocal = sessionmaker(autoflush=False, autocommit=False, bind=engine)

def get_session() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


Base.metadata.create_all(engine)