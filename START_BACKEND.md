# 🚀 Start the Backend with Real OSINT

## Quick Start (2 minutes)

### Prerequisites
- Python 3.9+
- Redis
- Git Bash / Terminal

### Step 1: Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Start Redis
```bash
redis-server
# Or on macOS with Homebrew:
# brew services start redis
```

### Step 3: Start FastAPI Server (Terminal 1)
```bash
cd backend
python -m uvicorn main:app --reload
# API runs on http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Step 4: Start Celery Worker (Terminal 2)
```bash
cd backend
celery -A celery_app worker --loglevel=info
# Worker will show: [*] Ready to accept tasks
```

### Step 5: Start Frontend (Terminal 3)
```bash
npm install  # If not done already
npm run dev
# Frontend runs on http://localhost:5173
```

---

## What's Different Now

### ✅ Real Web Scraping OSINT
The backend now includes **real OSINT modules** that:

1. **Email Analyzer**
   - Queries Have I Been Pwned API for breaches
   - Validates email format
   - Finds associated social accounts
   - Real data from public sources

2. **Social Media Scanner**
   - Enumerates multiple platforms (Twitter, GitHub, LinkedIn, Instagram, etc.)
   - Checks profile existence via HTTP requests
   - Returns real profile data

3. **Domain Analyzer**
   - Gets DNS records via socket lookups
   - Queries certificate databases (crt.sh)
   - Finds subdomains from public sources
   - Real WHOIS-like data

4. **Phone Lookup**
   - Normalizes phone numbers to E.164
   - Returns carrier information
   - Public phone directory queries

5. **IP Analyzer**
   - Uses ipapi.co for geolocation
   - Gets real geographic data
   - Returns ISP information

---

## API Usage

### Initialize Scan
```bash
curl -X POST http://localhost:8000/api/v1/scan/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "seeds": [
      {"value": "your-email@example.com", "entity_type": "email"},
      {"value": "your_username", "entity_type": "username"},
      {"value": "+1-555-123-4567", "entity_type": "phone"}
    ]
  }'
```

Response:
```json
{
  "scan_id": "12345678-1234-5678-1234-567812345678",
  "status": "processing",
  "message": "Scan initialized. Processing started."
}
```

### Monitor Progress
```bash
curl http://localhost:8000/api/v1/scan/{scan_id}/status
```

Response:
```json
{
  "scan_id": "12345678...",
  "status": "processing",
  "progress": 45,
  "tasks_completed": 3,
  "total_tasks": 8,
  "nodes_discovered": 8,
  "edges_discovered": 6,
  "profile_ready": false
}
```

### Get Results
```bash
curl http://localhost:8000/api/v1/scan/{scan_id}/results
```

Returns complete scan with nodes, edges, tasks, and profile!

---

## How It Works

### Data Flow
```
Frontend Input
    ↓
POST /scan/initialize
    ↓
Backend validates input
    ↓
Creates scan record
    ↓
Queues 8 Celery tasks
    ↓ (Celery Worker)
├─ Email Analyzer → HIBP API → Real breaches
├─ Social Scanner → HTTP requests → Real profiles
├─ Domain Analyzer → crt.sh → Real subdomains
├─ Phone Lookup → Carrier info
└─ IP Analyzer → ipapi.co → Real geolocation
    ↓
Results stored in DB
    ↓
WebSocket/Polling updates frontend
    ↓
Intelligence Dossier displays results
```

---

## Real API Calls

The backend makes actual HTTP requests to:

1. **Have I Been Pwned API** - Breach database queries
   - Rate limited: 1 request per second
   - Free tier available
   - No API key required for basic queries

2. **crt.sh** - Certificate transparency search
   - Finds subdomains from SSL certificates
   - Rate limited but reasonable
   - No authentication needed

3. **ipapi.co** - IP geolocation
   - Free tier: 1000 requests/month
   - No API key required
   - Public data

4. **HTTP HEAD Requests** - Profile verification
   - Checks if username exists on platforms
   - Via HTTP status codes
   - No API key needed

---

## Troubleshooting

### Redis Connection Error
```
error: Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Fix:** Start Redis first
```bash
redis-server
```

### Celery Worker Not Starting
```
ImportError: cannot import name 'run_osint_analysis'
```
**Fix:** Make sure you're in the `backend/` directory
```bash
cd backend
celery -A celery_app worker --loglevel=info
```

### HIBP API Rate Limit
```
Error: Too many requests
```
**Fix:** Requests are rate-limited (1/sec). Wait and retry. The app handles this automatically.

### No Modules Match Task
```
Traceback (most recent call last):
...
celery.exceptions.NotRegistered: 'tasks.email_analyzer'
```
**Fix:** Celery worker crashed. Restart it:
```bash
celery -A celery_app worker --loglevel=info
```

### Port Already in Use
```
error: Address already in use
```
**Fix:** Change port or kill existing process
```bash
# Kill existing process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use different port
python -m uvicorn main:app --reload --port 8001
```

---

## Testing the Real Backend

### Test 1: Email with Real Breaches
```bash
# Use an email you don't mind checking
# The app will query Have I Been Pwned
```

Input: `test@gmail.com`

Expected: 
- Query HIBP for breaches
- Show real breach names and dates
- Find associated social accounts

### Test 2: Username on Real Platforms
```bash
# Any username (try your own GitHub username)
```

Input: `octocat` (GitHub user)

Expected:
- Check Twitter, GitHub, LinkedIn, Instagram, etc.
- Show which platforms have the profile
- Return real URLs

### Test 3: IP Geolocation
```bash
# Any public IP address
```

Input: `8.8.8.8` (Google's public DNS)

Expected:
- Get country, city, coordinates
- Return ISP information
- Show real geolocation data

### Test 4: Domain Analysis
```bash
# Any domain
```

Input: `github.com`

Expected:
- Get DNS records (A, AAAA, MX, NS)
- Find subdomains from crt.sh
- Show real domain information

---

## Performance Tips

1. **Batch requests** - Add multiple seeds to process in parallel
2. **Cache results** - Save scans to avoid re-querying
3. **Rate limiting** - Some APIs limit free tier requests
4. **Async operations** - All tasks run asynchronously
5. **Database indexing** - Already optimized for fast queries

---

## Environment Variables

### .env
```
DATABASE_URL=postgresql://localhost/osint_db
REDIS_URL=redis://localhost:6379/0
API_PORT=8000
DEBUG=false
MOCK_MODE=false  # Set to false for real OSINT!
```

---

## Production Considerations

For production deployment:

1. **Use strong credentials** for PostgreSQL
2. **Rate limit API calls** to public services
3. **Implement caching** for HIBP results
4. **Monitor API quotas** (especially for paid services)
5. **Use VPN/proxy** if making many requests
6. **Add retry logic** for failed requests
7. **Log all activity** for compliance

---

## Next Steps

1. ✅ Start backend with real OSINT
2. ✅ Run frontend with `npm run dev`
3. ✅ Try demo scan on homepage
4. ✅ Use real email/username in input
5. ✅ Check results in Intelligence Dossier
6. ✅ Inspect nodes in graph
7. ✅ Monitor tasks in real-time

---

## API Documentation

Full API documentation available at:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI Schema:** http://localhost:8000/openapi.json

---

## Support

If something's not working:

1. Check that all services are running (Redis, FastAPI, Celery)
2. Check logs in each terminal
3. Verify .env file has correct database URL
4. Make sure you're in the correct directory
5. Check that dependencies are installed

---

**Ready to orchestrate?** Start the services and open http://localhost:5173!

---

**Build Status:** ✅ Full OSINT Backend Ready  
**Date:** 2024-05-28  
**Version:** 2.0.0
