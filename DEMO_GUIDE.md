# Demo & Testing Guide

## Features That Work Without Backend

The frontend now has **automatic fallback to demo mode** if the backend is unavailable. You can fully test the UI without running the Python backend!

## Quick Test (No Backend Needed)

```bash
npm run dev
# Opens http://localhost:5173
```

### Test Scenario 1: Simple Demo
1. **Enter seed data:**
   - Email: `test@example.com`
   - Phone: `+1-555-123-4567`
   - Username: `testuser`

2. **Click "Initialize Intelligence Scan"**

3. **Observe:**
   - ✅ TaskStatusLog populates with 8 modules
   - ✅ Tasks complete one-by-one with progress bars
   - ✅ NodeGraph shows 5 demo entities
   - ✅ IntelligenceDossier builds with profile data
   - ✅ Real-time animations and transitions

### Features Demonstrated
- Multi-input seed interface
- Real-time task tracking
- Interactive node graph
- Entity relationship visualization
- Consolidated intelligence profile
- Glassmorphic dark theme
- Smooth animations throughout

---

## Full Stack Testing (With Backend)

If you want to test with the actual backend:

### Prerequisites
- Redis running on `localhost:6379`
- PostgreSQL/Supabase available
- Python 3.9+

### Terminal 1: Frontend
```bash
npm install
npm run dev
# http://localhost:5173
```

### Terminal 2: Redis
```bash
redis-server
```

### Terminal 3: Backend API
```bash
cd backend
pip install -r requirements.txt
python3 -m uvicorn main:app --reload
# http://localhost:8000
```

### Terminal 4: Celery Worker
```bash
cd backend
celery -A celery_app worker --loglevel=info
```

---

## Demo vs Real Backend

### Demo Mode (Auto-Fallback)
- ✅ Works without backend
- ✅ Shows pre-generated data
- ✅ ~30 seconds to complete
- ✅ Perfect for UI testing
- ✅ No configuration needed

### Real Backend Mode
- ✅ Connects to actual API
- ✅ Mock OSINT modules execute
- ✅ Real WebSocket streaming
- ✅ Database persistence
- ✅ Requires all services running

---

## Testing Checklist

### UI Components
- [ ] InputPanel accepts multiple seeds
- [ ] Entity type dropdown works
- [ ] Seed tags display and remove correctly
- [ ] Scan button enables/disables appropriately
- [ ] TaskStatusLog shows live progress
- [ ] NodeGraph renders entities
- [ ] Clicking nodes shows inspection panel
- [ ] Profile dossier displays all data
- [ ] Animations are smooth
- [ ] Responsive on mobile

### Functionality
- [ ] Scan completes in ~30 seconds
- [ ] Tasks update in real-time
- [ ] Nodes appear progressively
- [ ] Graph zooms and pans smoothly
- [ ] WebSocket connects (if backend running)
- [ ] Error handling works gracefully
- [ ] Dossier shows correct profile data

### Edge Cases
- [ ] Empty input rejected
- [ ] Multiple scans work
- [ ] Scan cancellation works
- [ ] Rapid clicking doesn't break
- [ ] Errors display clearly

---

## API Testing

### Health Check
```bash
curl http://localhost:8000/health
```

### Initialize Scan
```bash
curl -X POST http://localhost:8000/api/v1/scan/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "seeds": [
      {"value": "test@example.com", "entity_type": "email"}
    ]
  }'
```

### Get Results
```bash
curl http://localhost:8000/api/v1/scan/{scan_id}/results
```

### WebSocket (Browser Console)
```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/scan/stream/{scan_id}');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

---

## Troubleshooting

### Issue: Scan doesn't start
**Solution:** 
- Check browser console for errors
- Verify at least one seed is entered
- Try refreshing the page

### Issue: No graph appearing
**Solution:**
- Wait for tasks to complete (showing progress bars)
- Check that scan status says "processing"
- Graph should appear as tasks execute

### Issue: WebSocket connection error
**Solution:**
- This is normal if backend isn't running
- Frontend automatically falls back to demo mode
- Check browser console to see fallback message

### Issue: Slow performance
**Solution:**
- Close other tabs
- Clear browser cache
- Restart frontend server
- Check CPU usage

---

## Performance Tips

### Frontend
- Built with Vite (fast dev server)
- React Flow optimized for 100+ nodes
- Framer Motion animations are GPU-accelerated
- Production build is ~160KB gzipped

### Backend
- FastAPI async/await for non-blocking
- Celery for distributed tasks
- Redis message broker
- PostgreSQL with indexes

---

## Mobile Testing

The app is fully responsive:

```bash
# Open on phone/tablet
# http://192.168.1.X:5173
# (replace X with your computer's IP)
```

- Collapsible input panel saves space
- Touch-friendly buttons
- Readable font sizes
- Pinch-to-zoom graph

---

## Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Android)

---

## What's Working

### Frontend ✅
- React 18 with hooks
- TypeScript strict mode
- Tailwind CSS responsive
- Framer Motion animations
- React Flow graph
- WebSocket integration
- Error boundaries
- Loading states

### Backend ✅
- FastAPI endpoints
- Celery tasks
- WebSocket streaming
- SQLAlchemy ORM
- Pydantic validation
- Error handling
- Logging

### Database ✅
- SQLAlchemy models
- Auto-initialization
- Relationship management
- JSON fields for flexible data

---

## Next Steps

1. **Explore the UI** - Try different inputs and interactions
2. **Check the Code** - Review components and services
3. **Test API** - Use curl/Postman to test endpoints
4. **Deploy** - Follow BACKEND_SETUP.md for production

---

## Support

- **Frontend Issues:** Check browser console
- **Backend Issues:** Check terminal logs
- **Database Issues:** Verify PostgreSQL connection
- **Performance Issues:** Check CPU/memory usage

For detailed documentation, see:
- README.md - Main overview
- QUICK_START.md - Quick setup
- BACKEND_SETUP.md - Deployment
- SYSTEM_ARCHITECTURE.md - Architecture details
