# OSINT Orchestration Engine - Full Stack Setup Guide

Complete guide to set up and deploy the full OSINT backend + frontend application.

## Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│                   React Frontend (Vite)                    │
│  - Multi-Input Ingestion Panel                             │
│  - Interactive Node Graph Visualization                    │
│  - Real-Time Task Status Monitoring                        │
│  - Target Intelligence Dossier                             │
└────────────────────────────────────────────────────────────┘
                            ↓↑
            WebSocket + REST API (HTTP)
                            ↓↑
┌────────────────────────────────────────────────────────────┐
│              FastAPI Backend (Python 3.9+)                 │
├────────────────────────────────────────────────────────────┤
│  - POST   /api/v1/scan/initialize                          │
│  - GET    /api/v1/scan/results/{scan_id}                   │
│  - GET    /api/v1/scan/{scan_id}/status                    │
│  - WS     /api/v1/scan/stream/{scan_id}                    │
└────────────────────────────────────────────────────────────┘
                            ↓↑
        ┌─────────────────────────────────────┐
        │   Celery Task Queue + Redis         │
        │   - Email Breach Analyzer           │
        │   - Phone Number Lookup             │
        │   - Social Footprint Scanner        │
        │   - Breach Database Querier         │
        │   - And 3 more modules              │
        └─────────────────────────────────────┘
                            ↓↑
        ┌─────────────────────────────────────┐
        │  PostgreSQL (Supabase)              │
        │  - Entity Scans                     │
        │  - Graph Nodes & Edges              │
        │  - Task Logs                        │
        │  - Target Profiles                  │
        └─────────────────────────────────────┘
```

## Prerequisites

- Node.js 18+ (Frontend)
- Python 3.9+ (Backend)
- Redis 7+ (Task Queue)
- PostgreSQL 13+ (Supabase)
- Git

## Quick Start (Local Development)

### 1. Clone & Setup Frontend

```bash
cd /path/to/project

# Install dependencies
npm install

# Update .env with API URL
cat > .env << EOF
VITE_API_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
EOF

# Start development server (runs on http://localhost:5173)
npm run dev
```

### 2. Setup Backend

```bash
cd backend

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 3. Configure Database

The database will auto-initialize on first run. No manual migrations needed!

### 4. Start Backend Services

**Terminal 1: Redis**
```bash
redis-server
# Should see: Ready to accept connections on port 6379
```

**Terminal 2: FastAPI Server**
```bash
cd backend
source venv/bin/activate
python3 -m uvicorn main:app --reload
# Should see: Uvicorn running on http://0.0.0.0:8000
```

**Terminal 3: Celery Worker**
```bash
cd backend
source venv/bin/activate
celery -A celery_app worker --loglevel=info
# Should see: [*] Ready to accept tasks
```

### 5. Test the Application

**Frontend:**
```bash
# Open browser
open http://localhost:5173
```

**API Health Check:**
```bash
curl http://localhost:8000/health
# Response: {"status":"ok","timestamp":"2024-05-28T..."}
```

**Initialize a Scan:**
```bash
curl -X POST http://localhost:8000/api/v1/scan/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "seeds": [
      {"value": "john.smith@gmail.com", "entity_type": "email"},
      {"value": "+1-555-123-4567", "entity_type": "phone"},
      {"value": "johnsmith", "entity_type": "username"}
    ]
  }'
```

**Monitor WebSocket (in browser console):**
```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/scan/stream/SCAN_ID_HERE');
ws.onmessage = (event) => {
  console.log('Update:', JSON.parse(event.data));
};
```

## Production Deployment

### Option A: Docker Compose (Recommended)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: secure-password
      POSTGRES_DB: osint_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://postgres:secure-password@postgres:5432/osint_db
      REDIS_URL: redis://redis:6379/0
      DEBUG: "false"
    depends_on:
      - postgres
      - redis
    command: uvicorn main:app --host 0.0.0.0 --port 8000

  celery:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://postgres:secure-password@postgres:5432/osint_db
      REDIS_URL: redis://redis:6379/0
      DEBUG: "false"
    depends_on:
      - postgres
      - redis
    command: celery -A celery_app worker --loglevel=info

  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:3000"
    environment:
      VITE_API_URL: http://api.example.com/api/v1

volumes:
  postgres_data:
  redis_data:
```

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Create `Dockerfile` (frontend):

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
```

Run:
```bash
docker-compose up -d
```

### Option B: Kubernetes Deployment

Create `k8s/backend-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: osint-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: osint-backend
  template:
    metadata:
      labels:
        app: osint-backend
    spec:
      containers:
      - name: backend
        image: osint-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: osint-secrets
              key: database-url
        - name: REDIS_URL
          value: "redis://redis-service:6379/0"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: osint-backend-service
spec:
  selector:
    app: osint-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: LoadBalancer
```

Deploy:
```bash
kubectl create secret generic osint-secrets \
  --from-literal=database-url=postgresql://...

kubectl apply -f k8s/backend-deployment.yaml
```

## Supabase PostgreSQL Setup

1. **Create Supabase Project:**
   - Go to https://app.supabase.com
   - Create new project
   - Note the database URL and credentials

2. **Update Backend .env:**
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
   ```

3. **Database auto-initializes** on first API call

## Environment Variables Reference

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (backend/.env)
```
# Database
DATABASE_URL=postgresql://user:pass@host:5432/osint_db

# Redis
REDIS_URL=redis://localhost:6379/0

# API
API_HOST=0.0.0.0
API_PORT=8000
API_WORKERS=4

# Security
SECRET_KEY=change-in-production
DEBUG=false

# OSINT
MOCK_MODE=true (for development)
```

## Monitoring & Logging

### Backend Logs
```bash
# FastAPI logs
tail -f /var/log/osint/api.log

# Celery logs
tail -f /var/log/osint/celery.log

# Database logs
tail -f /var/log/postgresql/postgresql.log
```

### Health Checks
```bash
# API health
curl http://localhost:8000/health

# Celery health
celery -A celery_app inspect active

# Redis health
redis-cli ping
```

### Performance Metrics
- **Response time:** Monitor API latency
- **Task queue depth:** Monitor pending Celery tasks
- **Database queries:** Monitor slow queries
- **Memory usage:** Monitor Redis and PostgreSQL memory

## Troubleshooting

### Issue: WebSocket Connection Refused
**Solution:** Ensure backend is running and firewall allows port 8000

### Issue: Database Connection Failed
**Solution:** Check DATABASE_URL, ensure PostgreSQL is running

### Issue: Celery Tasks Not Processing
**Solution:** Ensure Redis is running and `REDIS_URL` is correct

### Issue: CORS Errors
**Solution:** Backend already has CORS enabled for all origins. Check browser console for specific errors.

### Issue: Tasks Hanging
**Solution:** Check Celery worker logs, increase timeout in `celery_app.py`

## Performance Optimization

### Scale Celery Workers
```bash
# Run multiple workers
celery -A celery_app worker --concurrency=4 --loglevel=info
```

### Enable Caching
```python
# In tasks.py
from functools import lru_cache

@lru_cache(maxsize=1000)
def expensive_operation(email):
    ...
```

### Database Optimization
```sql
-- Add indexes for faster queries
CREATE INDEX idx_scan_status ON entity_scans(status);
CREATE INDEX idx_node_type ON graph_nodes(node_type);
CREATE INDEX idx_task_status ON task_logs(status);
```

## Security Hardening

### Production Checklist
- [ ] Set `DEBUG=false`
- [ ] Use strong `SECRET_KEY`
- [ ] Enable HTTPS/WSS
- [ ] Implement rate limiting
- [ ] Add authentication (JWT)
- [ ] Use environment-specific credentials
- [ ] Enable database encryption
- [ ] Set up audit logging
- [ ] Implement input validation
- [ ] Use VPC/private networking

## Support & Documentation

- **API Docs:** http://localhost:8000/docs
- **Alternative Docs:** http://localhost:8000/redoc
- **Backend README:** See `backend/README.md`
- **Frontend Components:** See `src/components/`

---

For issues or questions, check the logs and ensure all services are running.
