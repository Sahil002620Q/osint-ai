#!/bin/bash

echo "Starting OSINT Orchestration Engine Backend"

# Install dependencies if needed
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
fi

source venv/bin/activate

# Start Redis (if not running)
if ! pgrep -x "redis-server" > /dev/null; then
    echo "Starting Redis..."
    redis-server &
    sleep 2
fi

# Run database initialization
echo "Initializing database..."
python3 -c "from database import init_db; init_db()"

# Start FastAPI server and Celery workers in parallel
echo "Starting FastAPI server..."
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &

echo "Starting Celery worker..."
celery -A celery_app worker --loglevel=info &

# Wait for all background jobs
wait
