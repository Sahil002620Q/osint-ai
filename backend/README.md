# OSINT Orchestration Engine - Backend

A production-grade, scalable asynchronous backend for advanced multi-input OSINT & web scraping.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FastAPI Server                        │
├─────────────────────────────────────────────────────────┤
│  POST /api/v1/scan/initialize                           │
│  GET  /api/v1/scan/results/{scan_id}                    │
│  GET  /api/v1/scan/{scan_id}/status                     │
│  WS   /api/v1/scan/stream/{scan_id}                     │
└─────────────────────────────────────────────────────────┘
                          ↓
        ┌──────────────────────────────────────┐
        │      Task Queue (Celery + Redis)     │
        ├──────────────────────────────────────┤
        │ - Email Breach Analyzer              │
        │ - Phone Number OSINT Lookup          │
        │ - Social Footprint Scanner           │
        │ - Breach Database Querier            │
        │ - Facial Recognition Matcher         │
        │ - Domain WHOIS Analyzer              │
        │ - Public Records Crawler             │
        │ - Entity Resolution & Pivoting       │
        └──────────────────────────────────────┘
                          ↓
        ┌──────────────────────────────────────┐
        │   PostgreSQL (Supabase)              │
        ├──────────────────────────────────────┤
        │ - Entity Scans                       │
        │ - Graph Nodes & Edges                │
        │ - Task Logs                          │
        │ - Target Profiles                    │
        └──────────────────────────────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 3. Database Setup

The database is automatically initialized on first run. No manual migrations needed.

### 4. Start Services

**Option A: Run all services**
```bash
bash run.sh
```

**Option B: Run individually**

Terminal 1 - Redis:
```bash
redis-server
```

Terminal 2 - FastAPI:
```bash
python3 -m uvicorn main:app --reload
```

Terminal 3 - Celery Worker:
```bash
celery -A celery_app worker --loglevel=info
```

## API Endpoints

### Initialize Scan
```bash
curl -X POST http://localhost:8000/api/v1/scan/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "seeds": [
      {"value": "john.smith@gmail.com", "entity_type": "email"},
      {"value": "+1-555-123-4567", "entity_type": "phone"},
      {"value": "@johnsmith", "entity_type": "social"}
    ]
  }'
```

Response:
```json
{
  "scan_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "message": "Scan initialized. Processing started."
}
```

### Get Scan Results
```bash
curl http://localhost:8000/api/v1/scan/results/550e8400-e29b-41d4-a716-446655440000
```

### Get Scan Status
```bash
curl http://localhost:8000/api/v1/scan/550e8400-e29b-41d4-a716-446655440000/status
```

### WebSocket Stream
```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/scan/stream/550e8400-e29b-41d4-a716-446655440000');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Update:', data);
  // Handle: task_log, node_discovered, edge_discovered, profile_updated
};
```

## Message Formats

### Task Log Update
```json
{
  "type": "task_log",
  "task_id": "task-id",
  "module_name": "Email Breach Aggregator",
  "status": "running",
  "message": "Querying breach database...",
  "progress": 50
}
```

### Node Discovered
```json
{
  "type": "node_discovered",
  "node": {
    "id": "n-123",
    "node_type": "email",
    "label": "user@example.com",
    "attributes": {"verified": true},
    "confidence": 0.95
  }
}
```

### Edge Discovered
```json
{
  "type": "edge_discovered",
  "edge": {
    "id": "e-456",
    "source_id": "n-123",
    "target_id": "n-789",
    "relationship_type": "REGISTERED_TO",
    "metadata": {}
  }
}
```

### Profile Updated
```json
{
  "type": "profile_updated",
  "profile": {
    "id": "p-001",
    "primary_name": "John Smith",
    "emails": ["john@gmail.com"],
    "phones": ["+1-555-123-4567"],
    "social_profiles": [...]
  }
}
```

## Data Models

### GraphNode
- `id`: Unique identifier
- `scan_id`: Reference to parent scan
- `node_type`: email | phone | social | person | location | credential | image | domain
- `label`: Display label
- `attributes`: Key-value metadata (JSON)
- `confidence`: Confidence score (0-1)

### GraphEdge
- `id`: Unique identifier
- `source_id`: Source node ID
- `target_id`: Target node ID
- `relationship_type`: Type of relationship (e.g., "REGISTERED_TO", "LINKED_TO")
- `metadata`: Additional edge data (JSON)

### TaskLog
- `id`: Unique identifier
- `scan_id`: Reference to scan
- `module_name`: OSINT module name
- `status`: queued | running | completed | failed
- `message`: Status message
- `progress`: 0-100

### TargetProfile
- `id`: Profile identifier
- `scan_id`: Reference to scan
- `primary_name`: Main identified name
- `aliases`: Alternative names
- `emails`: Discovered emails
- `phones`: Discovered phone numbers
- `social_profiles`: Social media accounts
- `locations`: Geographic locations
- `credentials`: Exposed credentials
- `images`: Profile images with confidence
- `demographics`: Age, gender, occupation, etc.

## OSINT Modules

### Email Analyzer
Queries breach databases for exposed emails and cross-references with data breaches.

### Phone Lookup
Performs reverse phone lookups to discover associated identities and email addresses.

### Social Footprint Scanner
Enumerates social media presence across major platforms.

### Breach Database Querier
Queries aggregated breach archives for compromised credentials.

### Facial Recognition Matcher
Analyzes profile images for facial recognition matching (mocked).

### Domain WHOIS Analyzer
Extracts WHOIS data and domain registration details.

### Public Records Crawler
Searches public records databases for legal and business filings.

### Entity Resolver
Cross-references and resolves multiple data points to build unified person profiles.

## Pivoting Logic

The backend implements automatic data pivoting:
1. Email analysis discovers associated phone
2. Phone lookup is queued automatically
3. Phone lookup discovers new email
4. New email is analyzed automatically
5. Process continues until no new assets discovered

## Mock Mode

For development and testing, set `MOCK_MODE=true` in `.env`. This enables:
- Simulated breach database responses
- Randomized social profile discovery
- Mock facial recognition matching
- Fast task execution without external API calls

## Production Deployment

1. Use PostgreSQL instead of SQLite
2. Deploy Redis with persistence
3. Scale Celery workers horizontally
4. Implement rate limiting and authentication
5. Add monitoring and logging
6. Use environment-specific configs
7. Enable HTTPS/WSS

## Performance Considerations

- **Async I/O**: FastAPI + Celery for non-blocking operations
- **Graph Database**: Consider Neo4j for complex relationship queries
- **Caching**: Redis caching for frequently queried entities
- **Batching**: Batch multiple seed inputs for efficiency
- **Timeouts**: 25-minute soft limits on long-running tasks

## Security Notes

- Always validate and sanitize input
- Implement rate limiting on API endpoints
- Use JWT tokens for authentication in production
- Encrypt sensitive data at rest
- Audit all data access
- Comply with data privacy regulations (GDPR, CCPA)
