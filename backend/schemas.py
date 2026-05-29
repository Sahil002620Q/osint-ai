from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum


class EntityTypeEnum(str, Enum):
    EMAIL = "email"
    PHONE = "phone"
    USERNAME = "username"
    FULLNAME = "fullname"
    SOCIAL = "social"
    DOMAIN = "domain"
    IP = "ip"


class SeedInput(BaseModel):
    value: str
    entity_type: EntityTypeEnum

    @validator('value')
    def validate_value(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Value cannot be empty')
        return v.strip()


class ScanInitRequest(BaseModel):
    seeds: List[SeedInput] = Field(..., min_items=1, max_items=50)
    metadata: Optional[Dict[str, Any]] = None


class ScanInitResponse(BaseModel):
    scan_id: str
    status: str
    message: str


class NodeDTO(BaseModel):
    id: str
    node_type: str
    label: str
    attributes: Dict[str, Any]
    confidence: float = 1.0

    class Config:
        from_attributes = True


class EdgeDTO(BaseModel):
    id: str
    source_id: str
    target_id: str
    relationship_type: str
    metadata: Dict[str, Any] = {}

    class Config:
        from_attributes = True


class TaskLogDTO(BaseModel):
    id: str
    module_name: str
    status: str
    message: Optional[str]
    progress: int
    created_at: datetime

    class Config:
        from_attributes = True


class TargetProfileDTO(BaseModel):
    id: str
    primary_name: Optional[str]
    aliases: List[str]
    emails: List[str]
    phones: List[str]
    social_profiles: List[Dict[str, Any]]
    locations: List[Dict[str, Any]]
    credentials: List[Dict[str, Any]]
    images: List[Dict[str, Any]]
    demographics: Dict[str, Any]
    confidence_score: float

    class Config:
        from_attributes = True


class ScanResultResponse(BaseModel):
    scan_id: str
    status: str
    nodes: List[NodeDTO]
    edges: List[EdgeDTO]
    tasks: List[TaskLogDTO]
    profile: Optional[TargetProfileDTO]
    created_at: datetime

    class Config:
        from_attributes = True


# WebSocket messages
class WSMessage(BaseModel):
    type: str
    data: Dict[str, Any]


class WSTaskLog(BaseModel):
    type: str = "task_log"
    task_id: str
    module_name: str
    status: str
    message: str
    progress: int


class WSNodeDiscovered(BaseModel):
    type: str = "node_discovered"
    node: NodeDTO
    source_task: str


class WSEdgeDiscovered(BaseModel):
    type: str = "edge_discovered"
    edge: EdgeDTO
    source_task: str


class WSProfileUpdated(BaseModel):
    type: str = "profile_updated"
    profile: TargetProfileDTO
