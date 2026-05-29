from celery_app import celery_app
from database import SessionLocal, GraphNode, GraphEdge, TaskLog, TargetProfile, NodeType, EntityScan
import asyncio
from real_osint_modules import run_osint_analysis
from datetime import datetime
from typing import List, Dict, Any
import json
import logging

logger = logging.getLogger(__name__)


def update_task_log(db, scan_id: str, module_name: str, status: str, message: str, progress: int):
    task_log = db.query(TaskLog).filter(
        TaskLog.scan_id == scan_id,
        TaskLog.module_name == module_name
    ).first()

    if task_log:
        task_log.status = status
        task_log.message = message
        task_log.progress = progress
        if status == "running" and task_log.started_at is None:
            task_log.started_at = datetime.utcnow()
        if status == "completed":
            task_log.completed_at = datetime.utcnow()
        db.commit()


def add_node(db, scan_id: str, node_type: str, label: str, attributes: Dict, confidence: float = 1.0) -> GraphNode:
    node = GraphNode(
        scan_id=scan_id,
        node_type=NodeType[node_type.upper()],
        label=label,
        attributes=attributes,
        confidence=confidence
    )
    db.add(node)
    db.commit()
    return node


def add_edge(db, scan_id: str, source_id: str, target_id: str, relationship: str, metadata: Dict = None):
    edge = GraphEdge(
        scan_id=scan_id,
        source_id=source_id,
        target_id=target_id,
        relationship_type=relationship,
        metadata=metadata or {}
    )
    db.add(edge)
    db.commit()
    return edge


@celery_app.task(bind=True, name="tasks.email_analyzer")
def analyze_email(self, scan_id: str, email: str):
    db = SessionLocal()
    try:
        module_name = "Email Breach Aggregator"
        update_task_log(db, scan_id, module_name, "running", "Querying breach databases...", 25)

        # Run async OSINT analysis
        result = asyncio.run(run_osint_analysis("email", email))

        if "error" not in result:
            # Create email node
            email_node = add_node(db, scan_id, "EMAIL", email, {
                "breaches": result.get("breach_count", 0),
                "valid": result.get("is_valid", False),
                "domain": result.get("domain", "")
            })

            # Add breach nodes
            for breach in result.get("breaches", []):
                breach_node = add_node(
                    db, scan_id, "CREDENTIAL",
                    f"Breach: {breach.get('name', 'Unknown')}",
                    {"breach": breach.get('name'), "date": breach.get('date')}
                )
                add_edge(db, scan_id, email_node.id, breach_node.id, "COMPROMISED_IN", {"date": breach.get('date')})

            # Add social account nodes
            for social in result.get("social_accounts", []):
                social_node = add_node(
                    db, scan_id, "SOCIAL",
                    f"@{social['username']} ({social['platform']})",
                    {"platform": social['platform'], "url": social['url']}
                )
                add_edge(db, scan_id, email_node.id, social_node.id, "LINKED_TO")

        update_task_log(db, scan_id, module_name, "completed", f"Found {len(result.get('breaches', []))} breaches", 100)
        logger.info(f"Email analysis complete for {email}")

    except Exception as e:
        logger.error(f"Email analysis failed: {str(e)}")
        update_task_log(db, scan_id, "Email Breach Aggregator", "failed", str(e), 0)
    finally:
        db.close()


@celery_app.task(bind=True, name="tasks.phone_lookup")
def lookup_phone(self, scan_id: str, phone: str):
    db = SessionLocal()
    try:
        module_name = "Phone Number OSINT Lookup"
        update_task_log(db, scan_id, module_name, "running", "Looking up phone details...", 30)

        # Run async OSINT analysis
        result = asyncio.run(run_osint_analysis("phone", phone))

        if "error" not in result:
            # Create phone node
            phone_node = add_node(db, scan_id, "PHONE", result.get("normalized", phone), {
                "carrier": result.get("carrier", "Unknown"),
                "country": result.get("country", "Unknown"),
                "type": result.get("type", "unknown")
            })

        update_task_log(db, scan_id, module_name, "completed", "Phone lookup complete", 100)
        logger.info(f"Phone lookup complete for {phone}")

    except Exception as e:
        logger.error(f"Phone lookup failed: {str(e)}")
        update_task_log(db, scan_id, "Phone Number OSINT Lookup", "failed", str(e), 0)
    finally:
        db.close()


@celery_app.task(bind=True, name="tasks.social_scanner")
def scan_social_footprint(self, scan_id: str, username: str):
    db = SessionLocal()
    try:
        module_name = "Social Username Enumerator"
        update_task_log(db, scan_id, module_name, "running", "Scanning social platforms...", 40)

        # Run async OSINT analysis
        result = asyncio.run(run_osint_analysis("username", username))

        if "error" not in result:
            # Create social nodes for each platform found
            for platform in result.get("platforms", []):
                social_node = add_node(
                    db, scan_id, "SOCIAL",
                    f"@{username} ({platform['name']})",
                    {
                        "platform": platform["name"],
                        "url": platform.get("url", ""),
                        "found": platform.get("found", True)
                    }
                )

            # Create person node
            person_node = add_node(
                db, scan_id, "PERSON",
                username,
                {"source": "social_scan", "platforms_found": result.get("platforms_found", 0)}
            )

        update_task_log(db, scan_id, module_name, "completed", f"Found on {result.get('platforms_found', 0)} platforms", 100)
        logger.info(f"Social scan complete for {username}")

    except Exception as e:
        logger.error(f"Social scan failed: {str(e)}")
        update_task_log(db, scan_id, "Social Username Enumerator", "failed", str(e), 0)
    finally:
        db.close()


@celery_app.task(bind=True, name="tasks.breach_querier")
def query_breach_database(self, scan_id: str, email: str):
    db = SessionLocal()
    try:
        module_name = "Breach Database Querier"
        update_task_log(db, scan_id, module_name, "running", "Querying breach archives...", 50)

        querier = BreachDatabaseQuerier()
        result = querier.query(email)

        for breach_record in result["records"]:
            breach_node = add_node(
                db, scan_id, "CREDENTIAL",
                f"{breach_record['source']}",
                breach_record
            )

        update_task_log(db, scan_id, module_name, "completed", "Completed", 100)
        logger.info(f"Breach database query complete for {email}")

    except Exception as e:
        logger.error(f"Breach query failed: {str(e)}")
        update_task_log(db, scan_id, "Breach Database Querier", "failed", str(e), 0)
    finally:
        db.close()


@celery_app.task(bind=True, name="tasks.facial_matcher")
def match_facial_recognition(self, scan_id: str, image_url: str):
    db = SessionLocal()
    try:
        module_name = "Facial Recognition Matcher"
        update_task_log(db, scan_id, module_name, "running", "Analyzing facial features...", 60)

        matcher = FacialRecognitionMatcher()
        result = matcher.match(image_url)

        image_node = add_node(
            db, scan_id, "IMAGE",
            f"Profile Photo",
            {"url": image_url, "confidence": result["confidence"], "source": result["source"]}
        )

        update_task_log(db, scan_id, module_name, "completed", "Completed", 100)
        logger.info(f"Facial matching complete")

    except Exception as e:
        logger.error(f"Facial matching failed: {str(e)}")
        update_task_log(db, scan_id, "Facial Recognition Matcher", "failed", str(e), 0)
    finally:
        db.close()


@celery_app.task(bind=True, name="tasks.build_target_profile")
def build_target_profile(self, scan_id: str):
    db = SessionLocal()
    try:
        scan = db.query(EntityScan).filter(EntityScan.id == scan_id).first()
        if not scan:
            return

        # Aggregate data from all nodes
        nodes = db.query(GraphNode).filter(GraphNode.scan_id == scan_id).all()
        edges = db.query(GraphEdge).filter(GraphEdge.scan_id == scan_id).all()

        emails = [n.label for n in nodes if n.node_type == NodeType.EMAIL]
        phones = [n.label for n in nodes if n.node_type == NodeType.PHONE]
        social_profiles = [
            {"platform": n.attributes.get("platform"), "username": n.label, "url": n.attributes.get("url")}
            for n in nodes if n.node_type == NodeType.SOCIAL
        ]
        images = [
            {"url": n.attributes.get("url"), "source": n.attributes.get("source"), "confidence": n.confidence}
            for n in nodes if n.node_type == NodeType.IMAGE
        ]

        # Find primary name
        person_nodes = [n for n in nodes if n.node_type == NodeType.PERSON]
        primary_name = person_nodes[0].label if person_nodes else "Unknown"

        profile = TargetProfile(
            scan_id=scan_id,
            primary_name=primary_name,
            aliases=[],
            emails=emails,
            phones=phones,
            social_profiles=social_profiles,
            images=images,
            demographics={"age": None, "gender": None, "nationality": None},
            confidence_score=0.85
        )

        # Check if profile already exists
        existing = db.query(TargetProfile).filter(TargetProfile.scan_id == scan_id).first()
        if existing:
            db.delete(existing)

        db.add(profile)
        db.commit()

        logger.info(f"Target profile built for scan {scan_id}")

    except Exception as e:
        logger.error(f"Profile building failed: {str(e)}")
    finally:
        db.close()
