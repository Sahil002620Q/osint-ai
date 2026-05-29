#!/usr/bin/env python3
"""
Quick start script for the OSINT backend
Handles all service initialization in one script
"""
import subprocess
import sys
import time
import os
from pathlib import Path

def check_redis():
    """Check if Redis is running"""
    try:
        import redis
        r = redis.Redis(host='localhost', port=6379, db=0)
        r.ping()
        print("✅ Redis is running")
        return True
    except:
        print("❌ Redis is not running. Start with: redis-server")
        return False

def check_postgres():
    """Check if PostgreSQL is available"""
    try:
        import psycopg2
        conn = psycopg2.connect("dbname=osint_db user=postgres password=postgres host=localhost")
        conn.close()
        print("✅ PostgreSQL is running")
        return True
    except:
        print("⚠️  PostgreSQL not available. Using SQLite for demo.")
        return False

def install_dependencies():
    """Install Python dependencies"""
    print("\n📦 Installing dependencies...")
    result = subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt", "-q"],
                          capture_output=True)
    if result.returncode == 0:
        print("✅ Dependencies installed")
    else:
        print("❌ Failed to install dependencies")
        return False
    return True

def start_services():
    """Start FastAPI server and Celery worker"""
    print("\n🚀 Starting services...")
    print("  - FastAPI: http://localhost:8000")
    print("  - API Docs: http://localhost:8000/docs")
    print("  - Frontend: http://localhost:5173 (run 'npm run dev' separately)")

    # Start FastAPI
    print("\n▶️  Starting FastAPI server...")
    subprocess.Popen([sys.executable, "-m", "uvicorn", "main:app", "--reload"])
    time.sleep(2)

    # Start Celery
    print("▶️  Starting Celery worker...")
    subprocess.Popen(["celery", "-A", "celery_app", "worker", "--loglevel=info"])

    print("\n✅ Services started!")
    print("\nBackend endpoints:")
    print("  POST  /api/v1/scan/initialize  - Start new OSINT scan")
    print("  GET   /api/v1/scan/{id}/status - Get scan status")
    print("  GET   /api/v1/scan/results/{id} - Get scan results")
    print("  WS    /api/v1/scan/stream/{id} - WebSocket stream")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n👋 Shutting down...")

if __name__ == "__main__":
    print("🔬 OSINT Orchestration Engine - Backend Startup\n")

    # Check environment
    redis_ok = check_redis()
    postgres_ok = check_postgres()

    if not redis_ok:
        print("\n❌ Redis is required. Please start Redis server first.")
        sys.exit(1)

    # Install dependencies
    if not install_dependencies():
        sys.exit(1)

    # Start services
    start_services()
