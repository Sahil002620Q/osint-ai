# Quick Start Guide - OSINT Orchestration Engine

Get the full application running in 5 minutes.

## Prerequisites
- Node.js 18+ 
- Python 3.9+
- Redis
- PostgreSQL (or Supabase)

## Start in 3 Steps

### Step 1: Frontend Setup (1 minute)
```bash
# Install dependencies
npm install

# Already has correct .env
# Frontend runs on http://localhost:5173
npm run dev
```

### Step 2: Backend Services (2 minutes)

**Terminal 1 - Redis**
```bash
redis-server
```

**Terminal 2 - FastAPI Server**
```bash
cd backend
pip install -r requirements.txt
export DATABASE_URL=postgresql://localhost/osint_db
python3 -m uvicorn main:app --reload
# Server on http://localhost:8000
```

**Terminal 3 - Celery Worker**
```bash
cd backend
celery -A celery_app worker --loglevel=info
```

### Step 3: Test It!

Open http://localhost:5173 in browser and:

1. Enter some test data:
   - Email: `test@example.com`
   - Phone: `+1-555-123-4567`
   - Username: `testuser123`

2. Click "Initialize Intelligence Scan"

3. Watch the real-time graph and task logs populate

## File Structure

```
project/
├── src/                      # React Frontend
│   ├── components/           # UI Components
│   │   ├── InputPanel.tsx    # Seed input form
│   │   ├── TaskStatusLog.tsx # Task monitor
│   │   ├── NodeGraph.tsx     # Graph visualization
│   │   └── IntelligenceDossier.tsx # Profile display
│   ├── services/
│   │   ├── api.ts           # API client
│   │   └── scanStore.ts     # State management
│   ├── types/               # TypeScript types
│   └── utils/               # Utilities
│
└── backend/                  # Python FastAPI Server
    ├── main.py              # FastAPI app + endpoints
    ├── database.py          # SQLAlchemy models
    ├── schemas.py           # Pydantic schemas
    ├── tasks.py             # Celery tasks
    ├── osint_modules.py     # OSINT extraction logic
    ├── celery_app.py        # Celery configuration
    └── config.py            # Settings
```

## Common Commands

### Frontend
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run typecheck    # Check TypeScript
```

### Backend
```bash
# Install dependencies
pip install -r requirements.txt

# Run API server
python3 -m uvicorn main:app --reload

# Run Celery worker
celery -A celery_app worker --loglevel=info

# Initialize database
python3 -c "from database import init_db; init_db()"

# Check health
curl http://localhost:8000/health
```

## API Examples

### Initialize Scan
```bash
curl -X POST http://localhost:8000/api/v1/scan/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "seeds": [
      {"value": "john@example.com", "entity_type": "email"},
      {"value": "+1-555-123-4567", "entity_type": "phone"}
    ]
  }'
```

Returns:
```json
{
  "scan_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "message": "Scan initialized. Processing started."
}
```

### Get Results
```bash
curl http://localhost:8000/api/v1/scan/results/550e8400-e29b-41d4-a716-446655440000
```

### Get Status
```bash
curl http://localhost:8000/api/v1/scan/550e8400-e29b-41d4-a716-446655440000/status
```

### WebSocket Stream (JavaScript)
```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/scan/stream/SCAN_ID');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Update:', data);
  // Receive: task_log, node_discovered, edge_discovered, profile_updated
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};
```

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (backend/.env)
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/osint_db
REDIS_URL=redis://localhost:6379/0
API_PORT=8000
DEBUG=true
MOCK_MODE=true
```

## Troubleshooting

### Issue: "Connection refused on port 8000"
**Solution:** Ensure backend is running
```bash
cd backend && python3 -m uvicorn main:app --reload
```

### Issue: "Redis connection error"
**Solution:** Start Redis
```bash
redis-server
```

### Issue: "Database connection failed"
**Solution:** Check DATABASE_URL and ensure PostgreSQL is running

### Issue: "WebSocket connection refused"
**Solution:** Ensure backend is running and has active worker

### Issue: "Tasks not executing"
**Solution:** Ensure Celery worker is running
```bash
cd backend && celery -A celery_app worker --loglevel=info
```

## Features

### Frontend
- ✅ Multi-seed input (email, phone, username, social, etc.)
- ✅ Real-time interactive graph visualization
- ✅ Animated node/edge discovery
- ✅ Task progress monitoring
- ✅ Target profile dossier
- ✅ Glassmorphic dark theme
- ✅ Fully responsive design

### Backend
- ✅ Async FastAPI server
- ✅ Distributed Celery task queue
- ✅ 8 OSINT extraction modules
- ✅ Automatic data pivoting
- ✅ WebSocket real-time streaming
- ✅ PostgreSQL graph storage
- ✅ Mock mode for development
- ✅ Comprehensive error handling

### OSINT Modules
- ✅ Email Breach Aggregator
- ✅ Phone Number Lookup
- ✅ Social Footprint Scanner
- ✅ Breach Database Querier
- ✅ Facial Recognition Matcher
- ✅ Domain WHOIS Analyzer
- ✅ Public Records Crawler
- ✅ Entity Resolution & Pivoting

## Next Steps

1. **Explore the UI**
   - Try different input types
   - Click nodes to see details
   - Observe real-time updates

2. **Check the Logs**
   - Frontend: Browser console
   - Backend: Terminal output
   - API: http://localhost:8000/docs

3. **Scale It Up**
   - Add more Celery workers
   - Increase Redis memory
   - Deploy to production

4. **Integrate Real Data**
   - Replace mock modules with real APIs
   - Add authentication
   - Implement persistence

## Documentation

- **Full Setup Guide:** See `BACKEND_SETUP.md`
- **System Architecture:** See `SYSTEM_ARCHITECTURE.md`
- **Backend Details:** See `backend/README.md`
- **API Documentation:** http://localhost:8000/docs

## Support

For issues:
1. Check the troubleshooting section above
2. Review the logs (browser console + terminal output)
3. Verify all services are running (Redis, FastAPI, Celery, PostgreSQL)
4. Read the documentation files

---

**That's it!** You now have a fully functional OSINT orchestration engine running locally.

For production deployment, see `BACKEND_SETUP.md` and `SYSTEM_ARCHITECTURE.md`.
