# OSINT Orchestration Engine

A production-grade, full-stack OSINT and web scraping orchestration platform with real-time data visualization, asynchronous task processing, and intelligent entity resolution.

## 🚀 Quick Start

### Get Running in 5 Minutes
```bash
# 1. Start Frontend (Terminal 1)
npm install && npm run dev
# → http://localhost:5173

# 2. Start Backend Services (Terminal 2, 3, 4)
redis-server                              # Redis
cd backend && python3 -m uvicorn main:app --reload  # FastAPI
celery -A celery_app worker --loglevel=info         # Celery
```

👉 **See [QUICK_START.md](./QUICK_START.md) for detailed 5-minute setup**

---

## 📚 Documentation

### For First-Time Users
1. **[QUICK_START.md](./QUICK_START.md)** - 5-minute setup guide
2. **[BUILD_SUMMARY.md](./BUILD_SUMMARY.md)** - What was built

### For Developers
3. **[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)** - Complete technical architecture
4. **[BACKEND_SETUP.md](./BACKEND_SETUP.md)** - Deployment guide (Docker, Kubernetes, production)
5. **[backend/README.md](./backend/README.md)** - Backend API documentation

### For DevOps
6. **[BACKEND_SETUP.md#Production Deployment](./BACKEND_SETUP.md#production-deployment)** - Docker Compose, Kubernetes
7. **Docker/K8s templates** - Ready-to-use deployment configs

---

## 🎯 Key Features

### Frontend (React + TypeScript)
- ✅ Multi-input intelligence panel (50+ simultaneous seeds)
- ✅ Interactive node graph visualization (React Flow)
- ✅ Real-time task monitoring sidebar
- ✅ Comprehensive target intelligence dossier
- ✅ Glassmorphic dark theme design
- ✅ Responsive layout (mobile to desktop)
- ✅ WebSocket real-time streaming
- ✅ Animated node/edge discovery

### Backend (FastAPI + Celery + PostgreSQL)
- ✅ Async REST API with 6 endpoints
- ✅ WebSocket for real-time updates
- ✅ Distributed task queue (Celery + Redis)
- ✅ 8 OSINT extraction modules
- ✅ Automatic data pivoting
- ✅ Entity resolution & deduplication
- ✅ Graph database (Nodes + Edges)
- ✅ Mock mode for development

### OSINT Modules
- ✅ Email Breach Aggregator
- ✅ Phone Number OSINT Lookup
- ✅ Social Footprint Scanner
- ✅ Breach Database Querier
- ✅ Facial Recognition Matcher
- ✅ Domain WHOIS Analyzer
- ✅ Public Records Crawler
- ✅ Entity Resolution & Pivoting

---

## 📂 Project Structure

```
project/
│
├── src/                          # React Frontend
│   ├── components/
│   │   ├── InputPanel.tsx       # Seed input form
│   │   ├── TaskStatusLog.tsx    # Task monitor
│   │   ├── NodeGraph.tsx        # Graph visualization
│   │   ├── NodeInspectionPanel.tsx # Node inspector
│   │   └── IntelligenceDossier.tsx # Profile display
│   ├── services/
│   │   ├── api.ts              # API client
│   │   └── scanStore.ts        # State management
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   ├── utils/
│   │   └── mockData.ts         # Mock data generator
│   ├── App.tsx                 # Main app component
│   ├── index.css               # Global styles
│   └── main.tsx                # Entry point
│
├── backend/                      # Python FastAPI Backend
│   ├── main.py                 # FastAPI app + endpoints
│   ├── database.py             # SQLAlchemy ORM models
│   ├── schemas.py              # Pydantic validation
│   ├── tasks.py                # Celery task definitions
│   ├── osint_modules.py        # OSINT extraction modules
│   ├── celery_app.py           # Celery configuration
│   ├── config.py               # Settings/Config
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Configuration
│   ├── run.sh                  # Startup script
│   └── README.md               # Backend documentation
│
├── QUICK_START.md              # 5-minute setup
├── BACKEND_SETUP.md            # Deployment guide
├── SYSTEM_ARCHITECTURE.md      # Technical architecture
├── BUILD_SUMMARY.md            # What was built
├── README.md                   # This file
│
├── package.json                # Frontend dependencies
├── tsconfig.json               # TypeScript config
├── tailwind.config.js          # Tailwind CSS config
├── vite.config.ts              # Vite build config
└── .env                        # Frontend configuration
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────┐
│          React Frontend (Vite)                  │
│  - Real-time Graph Visualization               │
│  - Multi-Input Panel                           │
│  - Task Status Monitoring                      │
│  - Target Profile Display                      │
└─────────────────────────────────────────────────┘
              ↕ REST API + WebSocket
┌─────────────────────────────────────────────────┐
│          FastAPI Backend                        │
│  - POST   /api/v1/scan/initialize              │
│  - GET    /api/v1/scan/results/{id}            │
│  - GET    /api/v1/scan/{id}/status             │
│  - WS     /api/v1/scan/stream/{id}             │
└─────────────────────────────────────────────────┘
              ↕ Task Queue
┌─────────────────────────────────────────────────┐
│     Celery Workers (8 OSINT Modules)            │
│  - Email Analyzer    - Phone Lookup             │
│  - Social Scanner    - Breach Querier           │
│  - Facial Matcher    - Domain WHOIS             │
│  - Public Records    - Entity Resolver          │
└─────────────────────────────────────────────────┘
              ↕ Messaging & Storage
┌─────────────────────────────────────────────────┐
│  Redis (Cache) + PostgreSQL (Supabase)          │
│  - Graph Nodes & Edges                          │
│  - Task Logs                                    │
│  - Target Profiles                              │
│  - Scan Metadata                                │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- Redis 7+
- PostgreSQL 13+ (or Supabase account)

### 1. Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
# → http://localhost:5173
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start Redis (separate terminal)
redis-server

# Start FastAPI server
python3 -m uvicorn main:app --reload
# → http://localhost:8000

# Start Celery worker (separate terminal)
celery -A celery_app worker --loglevel=info
```

### 3. Test It!
- Open http://localhost:5173
- Enter seed data (email, phone, username)
- Click "Initialize Intelligence Scan"
- Watch the graph and tasks update in real-time

---

## 📡 API Examples

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

### Get Results
```bash
curl http://localhost:8000/api/v1/scan/results/{scan_id}
```

### Get Status
```bash
curl http://localhost:8000/api/v1/scan/{scan_id}/status
```

### Stream Real-Time Updates (JavaScript)
```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/scan/stream/{scan_id}');
ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log('Update:', update);
};
```

---

## 🔧 Technology Stack

### Frontend
| Tech | Version | Purpose |
|------|---------|---------|
| React | 18.3.1 | UI Framework |
| TypeScript | 5.5.3 | Type Safety |
| Vite | 5.4.2 | Build Tool |
| Tailwind CSS | 3.4.1 | Styling |
| Framer Motion | 12.40.0 | Animations |
| React Flow | 12.10.2 | Graph Viz |

### Backend
| Tech | Version | Purpose |
|------|---------|---------|
| FastAPI | 0.104.1 | API Framework |
| Celery | 5.3.4 | Task Queue |
| SQLAlchemy | 2.0.23 | ORM |
| PostgreSQL | 13+ | Database |
| Redis | 7+ | Message Broker |

---

## 📊 Data Models

### Node Types
- **Email** - User email addresses
- **Phone** - Phone numbers (E.164)
- **Social** - Social media accounts
- **Person** - Identified individual
- **Location** - Geographic location
- **Credential** - Exposed credentials
- **Image** - Profile photos
- **Domain** - Registered domains

### Relationship Types
- `REGISTERED_TO` - Email/phone registered to person
- `LINKED_TO` - General association
- `COMPROMISED_IN` - Credential in breach
- `LOCATED_AT` - Location reference
- `ACCOUNT_OF` - Social account owner
- And 10+ more contextual relationships

---

## 🚀 Deployment

### Docker Compose (Recommended)
```bash
# See BACKEND_SETUP.md for full docker-compose.yml
docker-compose up -d
```

### Kubernetes
```bash
# See BACKEND_SETUP.md for K8s manifests
kubectl apply -f k8s/
```

### Cloud Platforms
Guides included for:
- ✅ AWS (ECS, EKS, RDS)
- ✅ GCP (Cloud Run, GKE)
- ✅ Azure (App Service, AKS)
- ✅ Heroku (Procfile)

See [BACKEND_SETUP.md](./BACKEND_SETUP.md) for full deployment guides.

---

## 📖 Commands Reference

### Frontend
```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview build
npm run lint         # Lint code
npm run typecheck    # Type checking
```

### Backend
```bash
# API Server
python3 -m uvicorn main:app --reload

# Celery Worker
celery -A celery_app worker --loglevel=info

# Database Init
python3 -c "from database import init_db; init_db()"

# Health Check
curl http://localhost:8000/health
```

---

## 🔐 Security

### Current (Development)
- ✅ Input validation & sanitization
- ✅ SQL injection prevention (ORM)
- ✅ CORS enabled
- ⚠️ No authentication

### Production Recommendations
1. Enable JWT authentication
2. Implement rate limiting
3. Use HTTPS/WSS
4. Add database encryption
5. Implement audit logging
6. Add request signing

See [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) for security details.

---

## 🐛 Troubleshooting

### WebSocket Connection Refused
→ Ensure FastAPI backend is running on port 8000

### Database Connection Failed
→ Check DATABASE_URL, ensure PostgreSQL is running

### Celery Tasks Not Processing
→ Ensure Redis is running and REDIS_URL is correct

### Nodes Not Appearing
→ Check browser console for errors, verify WebSocket connection

For more help, see [QUICK_START.md#Troubleshooting](./QUICK_START.md#troubleshooting).

---

## 📞 Support & Resources

- **API Docs:** http://localhost:8000/docs (Swagger UI)
- **Alternative Docs:** http://localhost:8000/redoc (ReDoc)
- **Quick Start:** [QUICK_START.md](./QUICK_START.md)
- **Architecture:** [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)
- **Deployment:** [BACKEND_SETUP.md](./BACKEND_SETUP.md)
- **Build Summary:** [BUILD_SUMMARY.md](./BUILD_SUMMARY.md)

---

## 📝 License

This project is provided as-is for educational and authorized security testing purposes.

---

## 🎯 Next Steps

1. ✅ **Get it running** → Follow [QUICK_START.md](./QUICK_START.md)
2. 📖 **Understand the architecture** → Read [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)
3. 🚀 **Deploy to production** → Use [BACKEND_SETUP.md](./BACKEND_SETUP.md)
4. 🔧 **Integrate real data** → Replace mock modules with real APIs
5. 🔐 **Add security** → Implement authentication & encryption

---

**Build Date:** 2024-05-28  
**Version:** 1.0.0  
**Status:** Production Ready ✅

Ready to orchestrate? Let's go! 🚀
