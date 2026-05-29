from sqlalchemy import create_engine, Column, String, Integer, DateTime, JSON, Text, ForeignKey, Enum, Float, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import enum
import uuid
from config import settings

engine = create_engine(settings.database_url, echo=settings.debug)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class ScanStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class NodeType(str, enum.Enum):
    EMAIL = "email"
    PHONE = "phone"
    SOCIAL = "social"
    PERSON = "person"
    LOCATION = "location"
    CREDENTIAL = "credential"
    IMAGE = "image"
    DOMAIN = "domain"


class EntityScan(Base):
    __tablename__ = "entity_scans"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    status = Column(Enum(ScanStatus), default=ScanStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    seed_inputs = Column(JSON, default=list)
    metadata = Column(JSON, default=dict)

    nodes = relationship("GraphNode", back_populates="scan", cascade="all, delete-orphan")
    edges = relationship("GraphEdge", back_populates="scan", cascade="all, delete-orphan")
    tasks = relationship("TaskLog", back_populates="scan", cascade="all, delete-orphan")
    profile = relationship("TargetProfile", back_populates="scan", uselist=False, cascade="all, delete-orphan")


class GraphNode(Base):
    __tablename__ = "graph_nodes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_id = Column(String, ForeignKey("entity_scans.id"), nullable=False)
    node_type = Column(Enum(NodeType), nullable=False)
    label = Column(String, nullable=False)
    attributes = Column(JSON, default=dict)
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    scan = relationship("EntityScan", back_populates="nodes")
    outgoing_edges = relationship("GraphEdge", foreign_keys="GraphEdge.source_id", back_populates="source_node")
    incoming_edges = relationship("GraphEdge", foreign_keys="GraphEdge.target_id", back_populates="target_node")


class GraphEdge(Base):
    __tablename__ = "graph_edges"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_id = Column(String, ForeignKey("entity_scans.id"), nullable=False)
    source_id = Column(String, ForeignKey("graph_nodes.id"), nullable=False)
    target_id = Column(String, ForeignKey("graph_nodes.id"), nullable=False)
    relationship_type = Column(String, nullable=False)
    metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    scan = relationship("EntityScan", back_populates="edges")
    source_node = relationship("GraphNode", foreign_keys=[source_id], back_populates="outgoing_edges")
    target_node = relationship("GraphNode", foreign_keys=[target_id], back_populates="incoming_edges")


class TaskLog(Base):
    __tablename__ = "task_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_id = Column(String, ForeignKey("entity_scans.id"), nullable=False)
    module_name = Column(String, nullable=False)
    status = Column(String, default="queued")
    message = Column(String)
    progress = Column(Integer, default=0)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    scan = relationship("EntityScan", back_populates="tasks")


class TargetProfile(Base):
    __tablename__ = "target_profiles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_id = Column(String, ForeignKey("entity_scans.id"), unique=True, nullable=False)
    primary_name = Column(String)
    aliases = Column(JSON, default=list)
    emails = Column(JSON, default=list)
    phones = Column(JSON, default=list)
    social_profiles = Column(JSON, default=list)
    locations = Column(JSON, default=list)
    credentials = Column(JSON, default=list)
    images = Column(JSON, default=list)
    demographics = Column(JSON, default=dict)
    confidence_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    scan = relationship("EntityScan", back_populates="profile")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
