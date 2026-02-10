# Supabase Integration - Testing & Deployment Guide

## Quick Start - What Changed

The MindfulVoice platform now uses **Supabase** as the primary database instead of localStorage, while maintaining **Backboard.io** for AI memory. All user data is now persisted in the cloud with automatic weekly report generation.

---

## Environment Setup

### 1. Verify Environment Variables

All `.env` files should contain Supabase credentials:

```
SUPABASE_URL=https://plupzivewdzzvomfrufc.supabase.co
SUPABASE_ANON_KEY=sb_publishable_fqJVslxYA5T7NMfzDwRC3g_rRApfi3O
```

**Check all 3 locations:**
- ✅ `frontend/.env`
- ✅ `lk-google-telnyx-1/.env`
- ✅ `phone-call-backend/.env`

### 2. Install Dependencies

All dependencies are pre-installed, but verify:

```bash
# Frontend
cd frontend
npm list @supabase/supabase-js
# Should show: @supabase/supabase-js@2.95.3

# Backboard Server
cd lk-google-telnyx-1
npm list | grep -E "@supabase|node-cron|@google"
# Should have all three packages

# Phone Call Backend
cd phone-call-backend
pip list | grep supabase
# Should show: supabase installed
```

---

## Testing the Integration

### Test 1: Authentication Flow

1. **Start the frontend:**
   ```bash
   cd c:\vs code\Assistant\frontend
   npm run dev
   ```

2. **Navigate to** `http://localhost:5173/login`

3. **Test scenarios:**
   - Click "Sign in with Google" (should use Supabase OAuth)
   - Or enter email/password (Supabase email auth)
   - Check browser console for `isAuthenticated: true`

✅ **Success**: You're logged in via Supabase Auth

---

### Test 2: Questionnaire Persistence

1. **Complete questionnaire** at `/questionnaire`

2. **Verify data is saved:**
   ```bash
   # In Supabase dashboard (https://supabase.co):
   # Go to SQL Editor and run:
   SELECT * FROM questionnaire_responses 
   WHERE user_id = 'your-user-id'
   LIMIT 5;
   ```

3. **Check localStorage** (should still have backup):
   - F12 → Application → Local Storage
   - Should see `questionnaire_*` keys

✅ **Success**: Questionnaire stored to both Supabase and localStorage

---

### Test 3: Session & Message Storage

1. **Start a text chat** at `/ai`

2. **Send a few messages**

3. **Check database:**
   ```sql
   -- In Supabase SQL Editor:
   SELECT id, mode, mood_summary, duration_seconds 
   FROM sessions 
   WHERE user_id = 'your-user-id'
   ORDER BY started_at DESC 
   LIMIT 5;

   -- Check messages:
   SELECT * FROM messages 
   WHERE session_id = 'session-id-from-above'
   ORDER BY created_at;
   ```

✅ **Success**: Sessions and messages stored with emotion data

---

### Test 4: Dashboard Real-Time Data

1. **Navigate to** `/dashboard`

2. **Verify displays:**
   - ✅ Last session (time, mode, mood)
   - ✅ Session count
   - ✅ Mood trend (from weekly report)
   - ✅ Pending reminders
   - ✅ Session history count in button

✅ **Success**: Dashboard pulls real Supabase data

---

### Test 5: History Page

1. **Navigate to** `/history`

2. **Verify displays:**
   - ✅ User profile (name, email, age, support type)
   - ✅ Session list with timestamps
   - ✅ Session mode (voice/text/phone)
   - ✅ Duration and message count
   - ✅ Expandable transcript from database

✅ **Success**: History loads from Supabase

---

### Test 6: Weekly Report Generation

#### Manual Trigger (for testing):

```bash
# Make HTTP POST request:
curl -X POST http://localhost:3000/api/weekly-report/generate/{USER_ID}
```

Or use Backboard server endpoint to manually generate.

#### Automatic Trigger (production):

- Runs **every Monday at 8:00 AM** automatically
- Can also be triggered manually via endpoint above

#### Check results:

```sql
-- In Supabase SQL Editor:
SELECT * FROM weekly_reports 
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC 
LIMIT 1;
```

✅ **Success**: Report generated with summary, mood trend, recommendations

---

### Test 7: API Endpoints

**Test all new Supabase endpoints using curl or Postman:**

```bash
# 1. Get questionnaire
curl http://localhost:3000/api/questionnaire/{USER_ID}

# 2. Get sessions
curl http://localhost:3000/api/sessions/{USER_ID}?limit=10&offset=0

# 3. Get session messages
curl http://localhost:3000/api/sessions/{SESSION_ID}/messages

# 4. Get reminders
curl http://localhost:3000/api/reminders/{USER_ID}

# 5. Create reminder
curl -X POST http://localhost:3000/api/reminders/{USER_ID} \
  -H "Content-Type: application/json" \
  -d '{"content":"Take a walk","category":"wellness"}'

# 6. Get weekly report
curl http://localhost:3000/api/weekly-report/{USER_ID}

# 7. Get profile
curl http://localhost:3000/api/profile/{USER_ID}
```

✅ **Success**: All endpoints return Supabase data

---

## Deployment Checklist

### Pre-Deployment (Development)

- ✅ All `.env` files have Supabase credentials
- ✅ Frontend runs without errors: `npm run dev`
- ✅ Backboard server starts: `node src/index.js`
- ✅ Dashboard loads real data
- ✅ History page shows sessions
- ✅ Weekly report generates successfully

### Database Setup

```bash
# 1. In Supabase Dashboard:
# - Go to SQL Editor
# - Create new query
# - Copy contents of `supabase_schema.sql`
# - Run to create all tables, indexes, RLS policies, triggers

# 2. Verify tables exist:
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public';
```

Expected tables:
- ✅ profiles
- ✅ questionnaire_responses
- ✅ sessions
- ✅ messages
- ✅ reminders
- ✅ weekly_reports

### Deployment Steps

1. **Deploy Frontend**
   ```bash
   cd frontend
   npm run build
   # Deploy dist/ folder to hosting (Vercel, Netlify, etc.)
   ```

2. **Deploy Backboard Server**
   ```bash
   cd lk-google-telnyx-1
   npm run start
   # Or use PM2: pm2 start src/index.js --name "backboard-server"
   ```

3. **Deploy Phone Call Backend**
   ```bash
   cd phone-call-backend
   # Docker or direct Python deployment
   ```

### Post-Deployment Verification

- ✅ Frontend loads on production URL
- ✅ Supabase auth works
- ✅ New users can complete questionnaire
- ✅ Dashboard shows real data
- ✅ Weekly reports generate automatically
- ✅ Phone call agent can fetch reminders

---

## Troubleshooting

### Issue: "Supabase connection failed"

**Solution:**
```bash
# Check .env file has correct URL and key
echo "SUPABASE_URL=$SUPABASE_URL"
echo "SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY"

# Verify Supabase is accessible
curl https://plupzivewdzzvomfrufc.supabase.co/rest/v1/
# Should return 401 (auth error) or 200, not timeout
```

### Issue: "RLS policy blocks query"

**Solution:**
```sql
-- Run in Supabase SQL Editor:
-- Check if user is logged in
SELECT auth.uid();

-- Verify RLS policy
SELECT * FROM pg_policies 
WHERE tablename = 'sessions';

-- Temporarily disable RLS for testing (NOT production)
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
```

### Issue: "Weekly report not generating"

**Solution:**
```bash
# Check server logs
tail -f /path/to/server.log | grep -i report

# Verify Gemini API key
echo "GOOGLE_API_KEY=$GOOGLE_API_KEY"

# Check cron scheduling
# Should see "Weekly report scheduler initialized" on startup

# Manual trigger to test
curl -X POST http://localhost:3000/api/weekly-report/generate/{USER_ID}
```

### Issue: "Data not persisting"

**Solution:**
- Check browser console for errors
- Verify Supabase connection in F12 Network tab
- Check localStorage still has backup data
- Verify RLS policies allow writes for your user
- Check user_id matches in database vs frontend

---

## Data Migration (if needed)

### Migrating from localStorage to Supabase

Already handled automatically:
1. Components first try to load from Supabase
2. If not found, fall back to localStorage
3. On save, write to both Supabase + localStorage

**Manual migration script (if needed):**
```javascript
// In frontend console:
const { data, error } = await supabase
  .from('questionnaire_responses')
  .insert(JSON.parse(localStorage.getItem('questionnaire_*')));
```

---

## Performance Tuning

### Database Indexes

All indexes are automatically created by `supabase_schema.sql`:
- ✅ `sessions_user_id_idx` - For fast user session queries
- ✅ `messages_session_id_idx` - For transcript retrieval
- ✅ `reminders_user_id_idx` - For reminder lists
- ✅ RLS policies optimized for per-user queries

### Frontend Optimization

To reduce dashboard load time:
1. Limit sessions query to last 10: `LIMIT 10`
2. Use pagination: `OFFSET 0, LIMIT 50`
3. Subscribe to real-time updates (future feature):
   ```javascript
   supabase
     .from('sessions')
     .on('*', payload => { /* update UI */ })
     .subscribe()
   ```

### Weekly Report Performance

Current: ~10 seconds per user (Gemini API latency)
Optimization: Run reports in background, batch process users

---

## Security Notes

### What's Protected

- ✅ All user data isolated via RLS
- ✅ Auth tokens validated by Supabase
- ✅ API calls require Supabase client
- ✅ Cross-user access blocked at database level

### What to Monitor

- 🔍 Monitor RLS policy violations in logs
- 🔍 Check for unauthorized API calls
- 🔍 Review weekly access patterns
- 🔍 Audit user deletion/export requests

---

## Support & Next Steps

1. **Monitor the Supabase dashboard:**
   - Usage stats
   - Error logs
   - Database performance

2. **Schedule maintenance:**
   - Backup: Automatic (Supabase handles)
   - Cleanup: Old sessions (implement retention policy)
   - Analytics: Review weekly reports

3. **Future enhancements:**
   - Real-time dashboard updates
   - Mobile app support
   - Advanced analytics
   - Team/therapist features

---

## Quick Reference URLs

- **Frontend**: `http://localhost:5173`
- **Backboard Server**: `http://localhost:3000`
- **Supabase Dashboard**: `https://supabase.co/dashboard`
- **API Docs**: See phase 5 implementation in `SUPABASE_IMPLEMENTATION_COMPLETE.md`

---

**Ready to deploy!** 🚀
