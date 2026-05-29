from celery_app import celery_app
from database import SessionLocal, GraphNode, GraphEdge, TaskLog, TargetProfile, NodeType, EntityScan
from osint_modules import (
    EmailAnalyzer,
    PhoneLookup,
    SocialFootprintScanner,
    BreachDatabaseQuerier,
    FacialRecognitionMatcher,
    DomainWhoisAnalyzer,
)
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

        analyzer = EmailAnalyzer()
        result = analyzer.analyze(email)

        # Create email node
        email_node = add_node(db, scan_id, "EMAIL", email, {"breaches": len(result["breaches"])})

        # Add breach edges
        for breach in result["breaches"]:
            breach_node = add_node(
                db, scan_id, "CREDENTIAL",
                f"Breach: {breach['name']}",
                {"breach": breach["name"], "date": breach["date"]}
            )
            add_edge(db, scan_id, email_node.id, breach_node.id, "COMPROMISED_IN", {"date": breach["date"]})

        update_task_log(db, scan_id, module_name, "completed", "Completed", 100)
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

        lookup = PhoneLookup()
        result = lookup.lookup(phone)

        # Create phone node
        phone_node = add_node(db, scan_id, "PHONE", phone, result["attributes"])

        # Add related email if discovered
        if result.get("related_email"):
            email_node = add_node(db, scan_id, "EMAIL", result["related_email"], {"source": "phone_lookup"})
            add_edge(db, scan_id, phone_node.id, email_node.id, "ASSOCIATED_WITH")

            # Pivot: Analyze the discovered email
            analyze_email.delay(scan_id, result["related_email"])

        update_task_log(db, scan_id, module_name, "completed", "Completed", 100)
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

        scanner = SocialFootprintScanner()
        result = scanner.scan(username)

        # Create social nodes for each platform
        for platform in result["platforms"]:
            social_node = add_node(
                db, scan_id, "SOCIAL",
                f"@{username} ({platform['name']})",
                {"platform": platform["name"], "followers": platform.get("followers", 0), "url": platform.get("url")}
            )

            # Add related person node
            person_node = add_node(
                db, scan_id, "PERSON",
                username,
                {"source": "social_scan", "confidence": platform.get("confidence", 0.8)}
            )
            add_edge(db, scan_id, social_node.id, person_node.id, "ACCOUNT_OF")

        update_task_log(db, scan_id, module_name, "completed", "Completed", 100)
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
