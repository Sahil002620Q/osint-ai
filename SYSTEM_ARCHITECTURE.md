# OSINT Orchestration Engine - Complete System Architecture

## Executive Summary

A production-grade, full-stack OSINT (Open Source Intelligence) platform featuring:
- **Frontend:** React/TypeScript with Tailwind CSS + React Flow (dark glassmorphism design)
- **Backend:** FastAPI + Celery + PostgreSQL (Supabase) + Redis
- **Real-Time Updates:** WebSocket streaming + REST API
- **Scalability:** Horizontally scalable task queue architecture
- **Mock OSINT Modules:** 8 extraction modules with automatic pivoting logic

---

## Frontend Architecture

### Tech Stack
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + Framer Motion
- **Graph Visualization:** React Flow (@xyflow/react)
- **Icons:** Lucide React
- **State Management:** React Hooks + Context Store

### Component Hierarchy
```
App.tsx (Main Container)
├── Header (Title, Build Version)
├── Main Content Area (flex row)
│   ├── TaskStatusLog (Sidebar - Left)
│   │   ├── Active Module Counter
│   │   └── Task List (Animated)
│   │
│   ├── Center Workspace
│   │   ├── InputPanel (Collapse-able)
│   │   │   ├── Entity Type Dropdown
│   │   │   ├── Input Field with Validation
│   │   │   ├── Seed Tags Display
│   │   │   └── Scan Button (with Loading Animation)
│   │   │
│   │   └── NodeGraph (Interactive Visualization)
│   │       ├── React Flow Canvas
│   │       ├── Custom Node Components (Glassmorphic)
│   │       ├── Edge Relationships (Animated)
│   │       ├── Background Grid
│   │       └── Controls (Zoom, Pan, Fit)
│   │
│   ├── NodeInspectionPanel (Right - Slide-in)
│   │   ├── Node Details
│   │   ├── Attributes Table
│   │   ├── Confidence Score
│   │   └── Quick Actions
│   │
│   └── IntelligenceDossier (Right - Full Profile)
│       ├── Face Verification (Image Carousel)
│       ├── Primary Identity Card
│       ├── Demographics Grid
│       ├── Contact Information
│       ├── Social Profiles
│       ├── Location History
│       └── Exposed Credentials Alert
│
└── Footer (Stats & Status Indicator)
```

### Key Features
- **Multi-Input Panel:** Support 50+ seeds per scan
- **Real-Time Graph:** 100+ nodes/edges rendering with smooth animations
- **Entity Colors:** Color-coded by type (Cyan=Email, Green=Phone, Rose=Social, etc.)
- **Glassmorphic Design:** Backdrop blur + semi-transparent backgrounds
- **Responsive Layout:** Collapsible panels for space optimization
- **Progress Tracking:** Live module execution with percentage bars

### Data Flow
```
User Input → InputPanel.tsx
    ↓
State Update (seeds array)
    ↓
handleScan() triggered
    ↓
scanStore.initializeScan(seeds)
    ↓
API Call: POST /api/v1/scan/initialize
    ↓
WebSocket Connection: WS /api/v1/scan/stream/{scan_id}
    ↓
Real-Time Updates
    ├── TaskStatusLog updates
    ├── NodeGraph refreshes
    └── IntelligenceDossier populates
```

---

## Backend Architecture

### Tech Stack
- **API Framework:** FastAPI (async Python web framework)
- **Task Queue:** Celery + Redis (distributed task execution)
- **Database:** PostgreSQL (Supabase)
- **Real-Time:** WebSockets
- **Validation:** Pydantic
- **ORM:** SQLAlchemy

### API Layer (main.py)

#### Endpoints
```
GET  /health
     Returns server status

POST /api/v1/scan/initialize
     Accepts: {seeds: [{value, entity_type}]}
     Returns: {scan_id, status, message}
     Async: Queues extraction tasks, returns 202 Accepted

GET  /api/v1/scan/results/{scan_id}
     Returns: Complete scan results with nodes, edges, profile

GET  /api/v1/scan/{scan_id}/status
     Returns: Progress, task count, discovery stats

WS   /api/v1/scan/stream/{scan_id}
     Sends: Real-time updates (task logs, nodes, edges, profile)
```

#### CORS & Middleware
- ✅ CORS enabled for all origins (configurable)
- ✅ Automatic request logging
- ✅ Exception handling with detailed errors
- ✅ Request validation via Pydantic

### Task Queue Layer (Celery)

#### Architecture
```
User Request → FastAPI
    ↓
Create EntityScan record
    ↓
Queue Celery Tasks → Redis
    ↓
Worker Pool (Processes Messages)
│
├─ Email Analyzer
│   └─ Queries breach databases
│   └─ Discovers associated emails
│   └─ Triggers pivot tasks
│
├─ Phone Lookup
│   └─ Reverse phone lookup
│   └─ Discovers email/location
│   └─ Auto-pivots to email analyzer
│
├─ Social Footprint Scanner
│   └─ Enumerates platforms
│   └─ Discovers person identities
│   └─ Creates person node
│
├─ Breach Database Querier
│   └─ Cross-references leaks
│   └─ Creates credential nodes
│
├─ Facial Recognition Matcher
│   └─ Analyzes images
│   └─ Creates image nodes
│
└─ Entity Resolver (Final)
    └─ Aggregates all data
    └─ Builds target profile
```

#### Task Execution Flow
```
initialize_scan(seeds)
    ├─ For each email seed:
    │   ├─ analyze_email.delay()
    │   └─ query_breach_database.delay()
    │
    ├─ For each phone seed:
    │   └─ lookup_phone.delay()
    │
    └─ For each username seed:
        └─ scan_social_footprint.delay()

        After discovery (auto-pivoting):
        ├─ Email discovery → analyze_email.delay()
        └─ Phone discovery → lookup_phone.delay()

        After all tasks (15 second delay):
        └─ build_target_profile.delay()
```

### Database Layer (SQLAlchemy + PostgreSQL)

#### Tables & Relationships
```
entity_scans (Parent)
├── id (UUID)
├── status (ENUM: pending, processing, completed, failed)
├── seed_inputs (JSON)
├── metadata (JSON)
└── created_at, updated_at

    ├─ graph_nodes
    │  ├── id (UUID)
    │  ├── scan_id (FK)
    │  ├── node_type (ENUM: email, phone, social, person, location, credential, image, domain)
    │  ├── label (String)
    │  ├── attributes (JSONB)
    │  ├── confidence (Float 0-1)
    │  └── created_at
    │
    ├─ graph_edges
    │  ├── id (UUID)
    │  ├── scan_id (FK)
    │  ├── source_id (FK → graph_nodes)
    │  ├── target_id (FK → graph_nodes)
    │  ├── relationship_type (String)
    │  ├── metadata (JSONB)
    │  └── created_at
    │
    ├─ task_logs
    │  ├── id (UUID)
    │  ├── scan_id (FK)
    │  ├── module_name (String)
    │  ├── status (String: queued, running, completed, failed)
    │  ├── message (String)
    │  ├── progress (Integer 0-100)
    │  ├── started_at, completed_at
    │  └── created_at
    │
    └─ target_profiles
       ├── id (UUID)
       ├── scan_id (FK, unique)
       ├── primary_name (String)
       ├── aliases (JSON array)
       ├── emails (JSON array)
       ├── phones (JSON array)
       ├── social_profiles (JSON array)
       ├── locations (JSON array)
       ├── credentials (JSON array)
       ├── images (JSON array)
       ├── demographics (JSONB)
       ├── confidence_score (Float)
       └── created_at
```

#### Indexes for Performance
```sql
CREATE INDEX idx_scan_status ON entity_scans(status);
CREATE INDEX idx_node_type ON graph_nodes(node_type);
CREATE INDEX idx_edge_source ON graph_edges(source_id);
CREATE INDEX idx_edge_target ON graph_edges(target_id);
CREATE INDEX idx_task_status ON task_logs(status);
```

### OSINT Modules (osint_modules.py)

#### EmailAnalyzer
```python
analyze(email: str) → {
  email, breaches: [{name, date}], verified, last_seen
}
```
**Purpose:** Detect breaches, verify email validity
**Pivoting:** Queries breach DB for related emails

#### PhoneLookup
```python
lookup(phone: str) → {
  phone, attributes: {carrier, country, type, verified},
  related_email, confidence
}
```
**Purpose:** Reverse phone lookup, discover email
**Pivoting:** Auto-triggers email analysis on discovery

#### SocialFootprintScanner
```python
scan(username: str) → {
  username, platforms: [{name, confidence, followers, url}],
  profiles_found
}
```
**Purpose:** Enumerate social media presence
**Pivoting:** Creates person node, links social accounts

#### BreachDatabaseQuerier
```python
query(email: str) → {
  email, records: [{source, date, password_hashed, other_fields}],
  total_breaches
}
```
**Purpose:** Query aggregated breach archives
**Pivoting:** None (terminal module)

#### FacialRecognitionMatcher
```python
match(image_url: str) → {
  image_url, confidence, source, matches
}
```
**Purpose:** Facial recognition across images (mocked)

#### DomainWhoisAnalyzer
```python
analyze(domain: str) → {
  domain, registrar, registered_date, expires_date,
  admin_email, name_servers
}
```
**Purpose:** Extract WHOIS data

### WebSocket Message Protocol

#### Task Log Update
```json
{
  "type": "task_log",
  "task_id": "uuid",
  "module_name": "Email Breach Aggregator",
  "status": "running|completed|failed",
  "message": "Querying breach database...",
  "progress": 50
}
```

#### Node Discovery
```json
{
  "type": "node_discovered",
  "node": {
    "id": "uuid",
    "node_type": "email|phone|social|person|...",
    "label": "user@example.com",
    "attributes": {"key": "value"},
    "confidence": 0.95
  }
}
```

#### Edge Discovery
```json
{
  "type": "edge_discovered",
  "edge": {
    "id": "uuid",
    "source_id": "node-id",
    "target_id": "node-id",
    "relationship_type": "REGISTERED_TO|LINKED_TO|OWNED_BY|...",
    "metadata": {}
  }
}
```

#### Profile Updated
```json
{
  "type": "profile_updated",
  "profile": {
    "id": "uuid",
    "primary_name": "John Smith",
    "emails": ["john@gmail.com"],
    "phones": ["+1-555-123-4567"],
    "social_profiles": [...],
    "images": [...],
    "confidence_score": 0.85
  }
}
```

---

## Data Flow Diagrams

### User Initiates Scan
```
Frontend (InputPanel)
    ↓ User enters seeds
    ↓ Click "Initialize Scan"
    ↓ scanStore.initializeScan(seeds)
    ↓ API POST /scan/initialize
Backend (main.py)
    ↓ Validate seeds
    ↓ Create EntityScan record
    ↓ Create TaskLog entries (8 modules)
    ↓ Queue Celery tasks
    ↓ Return 202 Accepted + scan_id
Frontend
    ↓ Receive scan_id
    ↓ Connect WebSocket
    ↓ Start status polling
    ↓ Render InputPanel → Loading state
    ↓ Render TaskStatusLog → Empty tasks
```

### Task Execution & Real-Time Updates
```
Celery Worker
    ↓ Dequeue email_analyzer task
    ↓ Update TaskLog: status=running, progress=25
    ↓ Execute EmailAnalyzer.analyze(email)
    ↓ Create GraphNode: email
    ↓ Query breaches
    ↓ Create GraphNode: credential (for each breach)
    ↓ Create GraphEdge: email → breach
    ↓ Update TaskLog: status=completed, progress=100
    ↓
Backend (WebSocket)
    ↓ Poll database for new nodes/edges
    ↓ Send "node_discovered" for each new node
    ↓ Send "edge_discovered" for each new edge
    ↓ Send "task_log" updates
    ↓
Frontend (WebSocket Handler)
    ↓ Receive messages
    ↓ Update scanStore
    ↓ Re-render NodeGraph with new nodes
    ↓ Update TaskStatusLog with progress
    ↓ Show animations
```

### Pivoting Logic
```
Phone lookup discovers email
    ↓ Create GraphNode: email
    ↓ Celery: analyze_email.delay(scan_id, email)
    ↓
Email analyzer discovers breach
    ↓ Create GraphNode: credential
    ↓ (Optional: Auto-trigger pivot task)
    ↓
After N seconds, build_target_profile
    ↓ Aggregate all nodes
    ↓ Create TargetProfile record
    ↓ Send "profile_updated" message
```

---

## Performance Characteristics

### Throughput
- **Max concurrent scans:** 100+ (limited by Redis)
- **Nodes per scan:** 100-1000+
- **Edges per scan:** 50-500+
- **Task execution:** 1-2 seconds per module (mock mode)

### Latency
- **API response:** <50ms (local)
- **WebSocket push:** <100ms
- **Node rendering:** <200ms (frontend)
- **Full scan completion:** 15-30 seconds (8 modules)

### Scalability
- **Horizontal scaling:** Add more Celery workers
- **Database scaling:** PostgreSQL replication + read replicas
- **Cache layer:** Redis caching for frequent queries
- **Load balancing:** Nginx reverse proxy (production)

---

## Security Considerations

### Input Validation
- ✅ Email format validation (RFC 5322)
- ✅ Phone number normalization (E.164)
- ✅ Username sanitization (alphanumeric + underscore)
- ✅ Domain validation
- ✅ SQL injection prevention (SQLAlchemy ORM)

### Authentication & Authorization
- ⚠️ Not implemented (add JWT in production)
- ⚠️ CORS enabled for all origins (restrict in production)
- ⚠️ No rate limiting (add rate limiter middleware)

### Data Protection
- ✅ Password hashes stored (never plain text)
- ⚠️ No encryption at rest (add PG encryption)
- ⚠️ No HTTPS (add reverse proxy with SSL)
- ⚠️ No audit logging (add audit trail)

### Recommendations for Production
1. Enable database encryption (Supabase has native support)
2. Add JWT authentication + authorization
3. Implement rate limiting per IP/user
4. Add HTTPS/WSS with valid certificates
5. Implement request signing for sensitive endpoints
6. Add comprehensive audit logging
7. Regular security audits and penetration testing

---

## Deployment Topology

### Development
```
localhost:5173 (Frontend) → localhost:8000 (FastAPI)
                         → localhost:6379 (Redis)
                         → localhost:5432 (PostgreSQL)
```

### Production
```
CloudFront CDN
    ↓
   ALB (Application Load Balancer)
    ├─ Frontend (CloudFront + S3)
    └─ Backend (ECS/EKS cluster)
        ├─ FastAPI (3+ instances)
        ├─ Celery Workers (auto-scaled 5-50)
        ├─ Redis Cluster (HA)
        └─ RDS PostgreSQL (Multi-AZ)
```

---

## Monitoring & Observability

### Key Metrics
- API response time (p50, p95, p99)
- Celery task execution time
- Queue depth (pending tasks)
- WebSocket connection count
- Database query latency
- Error rates

### Logging
- Structured JSON logging
- Log aggregation (CloudWatch, DataDog, etc.)
- Performance traces (APM)
- Error tracking (Sentry)

### Alerts
- High queue depth (>1000 tasks)
- Database connection errors
- Worker failures
- Memory/CPU threshold exceeded

---

## Future Enhancements

1. **Real OSINT Modules**
   - Integration with Shodan API
   - Threat Intelligence feeds
   - Public data API aggregation

2. **Advanced Entity Resolution**
   - Machine learning confidence scoring
   - Probabilistic entity linking
   - Graph-based deduplication

3. **Export & Reporting**
   - PDF report generation
   - CSV/JSON export
   - Custom report templates

4. **UI Enhancements**
   - Timeline view
   - Network clustering
   - Threat scoring dashboard

5. **Advanced Features**
   - Saved scans/reports
   - Comparison tool
   - Bulk scan API
   - Custom extraction rules

---

## Documentation

- **Frontend README:** See `src/components/` comments
- **Backend README:** See `backend/README.md`
- **API Docs:** http://localhost:8000/docs (Swagger UI)
- **Setup Guide:** See `BACKEND_SETUP.md`

---

Last Updated: 2024-05-28
Version: 1.0.0
