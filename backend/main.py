from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
import json
import logging
import asyncio
from contextlib import asynccontextmanager

from config import settings
from database import get_db, init_db, EntityScan, GraphNode, GraphEdge, TaskLog, ScanStatus
from schemas import (
    ScanInitRequest, ScanInitResponse, ScanResultResponse, NodeDTO, EdgeDTO, TaskLogDTO, TargetProfileDTO
)
from tasks import (
    analyze_email, lookup_phone, scan_social_footprint, query_breach_database,
    match_facial_recognition, build_target_profile, update_task_log
)
import uuid

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Store active WebSocket connections
active_connections: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    logger.info("Database initialized")
    yield
    # Shutdown
    logger.info("Application shutting down")


app = FastAPI(
    title="OSINT Orchestration Engine API",
    description="Advanced Multi-Input OSINT & Web Scraping Backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


@app.post("/api/v1/scan/initialize", response_model=ScanInitResponse)
async def initialize_scan(request: ScanInitRequest, db: Session = Depends(get_db)):
    """
    Initialize an OSINT scan with multiple seed inputs.
    Returns 202 Accepted with scan_id while queuing tasks.
    """
    try:
        scan_id = str(uuid.uuid4())

        # Create scan record
        scan = EntityScan(
            id=scan_id,
            status=ScanStatus.PROCESSING,
            seed_inputs=[{"value": seed.value, "entity_type": seed.entity_type} for seed in request.seeds],
            metadata=request.metadata or {}
        )
        db.add(scan)
        db.commit()

        # Create task logs for each module
        modules = [
            "Email Breach Aggregator",
            "Phone Number OSINT Lookup",
            "Social Username Enumerator",
            "Breach Database Querier",
            "Facial Recognition Matcher",
            "Domain WHOIS Analyzer",
            "Public Records Crawler",
            "Cross-Reference Correlator"
        ]

        for module in modules:
            task_log = TaskLog(
                scan_id=scan_id,
                module_name=module,
                status="queued",
                message="Queued"
            )
            db.add(task_log)
        db.commit()

        # Queue extraction tasks based on seed inputs
        for seed in request.seeds:
            if seed.entity_type == "email":
                analyze_email.apply_async((scan_id, seed.value), countdown=1)
                query_breach_database.apply_async((scan_id, seed.value), countdown=2)
            elif seed.entity_type == "phone":
                lookup_phone.apply_async((scan_id, seed.value), countdown=1)
            elif seed.entity_type in ["username", "social"]:
                scan_social_footprint.apply_async((scan_id, seed.value), countdown=1)
            elif seed.entity_type == "domain":
                scan_social_footprint.apply_async((scan_id, seed.value), countdown=1)  # Reuse for domain
            elif seed.entity_type == "ip":
                lookup_phone.apply_async((scan_id, seed.value), countdown=1)  # Reuse for IP

        # Queue profile builder (will run after tasks complete)
        build_target_profile.apply_async((scan_id,), countdown=20)

        logger.info(f"Scan initialized: {scan_id}")

        return ScanInitResponse(
            scan_id=scan_id,
            status="processing",
            message="Scan initialized. Processing started."
        )

    except Exception as e:
        logger.error(f"Scan initialization failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/scan/results/{scan_id}", response_model=ScanResultResponse)
async def get_scan_results(scan_id: str, db: Session = Depends(get_db)):
    """Retrieve complete scan results including nodes, edges, and profile"""
    try:
        scan = db.query(EntityScan).filter(EntityScan.id == scan_id).first()
        if not scan:
            raise HTTPException(status_code=404, detail="Scan not found")

        nodes = [
            NodeDTO(
                id=n.id,
                node_type=n.node_type.value,
                label=n.label,
                attributes=n.attributes,
                confidence=n.confidence
            )
            for n in scan.nodes
        ]

        edges = [
            EdgeDTO(
                id=e.id,
                source_id=e.source_id,
                target_id=e.target_id,
                relationship_type=e.relationship_type,
                metadata=e.metadata
            )
            for e in scan.edges
        ]

        tasks = [
            TaskLogDTO(
                id=t.id,
                module_name=t.module_name,
                status=t.status,
                message=t.message,
                progress=t.progress,
                created_at=t.created_at
            )
            for t in scan.tasks
        ]

        profile = None
        if scan.profile:
            profile = TargetProfileDTO(
                id=scan.profile.id,
                primary_name=scan.profile.primary_name,
                aliases=scan.profile.aliases,
                emails=scan.profile.emails,
                phones=scan.profile.phones,
                social_profiles=scan.profile.social_profiles,
                locations=scan.profile.locations,
                credentials=scan.profile.credentials,
                images=scan.profile.images,
                demographics=scan.profile.demographics,
                confidence_score=scan.profile.confidence_score
            )

        return ScanResultResponse(
            scan_id=scan_id,
            status=scan.status.value,
            nodes=nodes,
            edges=edges,
            tasks=tasks,
            profile=profile,
            created_at=scan.created_at
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve results: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/api/v1/scan/stream/{scan_id}")
async def websocket_endpoint(websocket: WebSocket, scan_id: str, db: Session = Depends(get_db)):
    """WebSocket endpoint for real-time scan updates"""
    await websocket.accept()
    active_connections[scan_id] = websocket

    try:
        # Send initial state
        scan = db.query(EntityScan).filter(EntityScan.id == scan_id).first()
        if scan:
            await websocket.send_json({
                "type": "connection_established",
                "scan_id": scan_id,
                "status": scan.status.value
            })

            # Send existing tasks
            for task in scan.tasks:
                await websocket.send_json({
                    "type": "task_log",
                    "task_id": task.id,
                    "module_name": task.module_name,
                    "status": task.status,
                    "message": task.message,
                    "progress": task.progress
                })

        # Keep connection open and listen for updates
        while True:
            # Poll for updates every 500ms
            await asyncio.sleep(0.5)

            # Check for new nodes
            new_nodes = db.query(GraphNode).filter(
                GraphNode.scan_id == scan_id,
                GraphNode.created_at > datetime.utcnow()
            ).all()

            for node in new_nodes:
                await websocket.send_json({
                    "type": "node_discovered",
                    "node": {
                        "id": node.id,
                        "node_type": node.node_type.value,
                        "label": node.label,
                        "attributes": node.attributes,
                        "confidence": node.confidence
                    }
                })

            # Check for updated task logs
            for task in scan.tasks:
                await websocket.send_json({
                    "type": "task_log",
                    "task_id": task.id,
                    "module_name": task.module_name,
                    "status": task.status,
                    "message": task.message or "",
                    "progress": task.progress
                })

    except WebSocketDisconnect:
        if scan_id in active_connections:
            del active_connections[scan_id]
        logger.info(f"WebSocket disconnected: {scan_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        await websocket.close(code=1000)


@app.get("/api/v1/scan/{scan_id}/status")
async def get_scan_status(scan_id: str, db: Session = Depends(get_db)):
    """Get current scan status"""
    scan = db.query(EntityScan).filter(EntityScan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    tasks = db.query(TaskLog).filter(TaskLog.scan_id == scan_id).all()
    completed_tasks = len([t for t in tasks if t.status == "completed"])
    total_tasks = len(tasks)

    return {
        "scan_id": scan_id,
        "status": scan.status.value,
        "progress": int((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0),
        "tasks_completed": completed_tasks,
        "total_tasks": total_tasks,
        "nodes_discovered": len(scan.nodes),
        "edges_discovered": len(scan.edges),
        "profile_ready": scan.profile is not None
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.api_host,
        port=settings.api_port,
        workers=settings.api_workers if not settings.debug else 1
    )
