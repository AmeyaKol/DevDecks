# DevDecks Weekend Scale Plan

**Goal**: Ship a production-ready, observable, secure app by Monday that can handle 100+ users and costs under $10/mo. Start marketing immediately after.

---

## Deployment Architecture ($7-10/mo)

```
                    ┌─────────────────────┐
                    │   Cloudflare Pages   │  ← React build (FREE)
                    │   (static frontend)  │     Auto-deploy from GitHub
                    └─────────┬───────────┘
                              │ API calls
                              ▼
                    ┌─────────────────────┐
                    │   Render Web Svc    │  ← Express API ($7/mo starter)
                    │   (Node backend)    │     Always-on, no cold starts
                    └──┬──────────┬───────┘
                       │          │
              ┌────────▼──┐  ┌───▼──────────┐
              │ MongoDB    │  │ Upstash Redis │  ← Both FREE tier
              │ Atlas M0   │  │ (serverless)  │
              └────────────┘  └───────────────┘
```


| Service          | Plan        | Cost      | What it does                                              |
| ---------------- | ----------- | --------- | --------------------------------------------------------- |
| Cloudflare Pages | Free        | $0        | Hosts React build on global CDN, auto-deploys from GitHub |
| Render           | Starter     | $7/mo     | Always-on backend, no sleep/cold starts                   |
| MongoDB Atlas    | M0 (shared) | $0        | 512MB storage, sufficient for thousands of users          |
| Upstash Redis    | Free        | $0        | 10k commands/day — enough for caching + session tracking  |
| **Total**        |             | **$7/mo** |                                                           |


**Why split frontend/backend**: Your current Render setup serves both from one service. Splitting means the React app loads instantly from CDN worldwide regardless of backend load, and you can scale the API independently later.

**Why not stay on free Render**: The free tier sleeps after 15 min of inactivity. First request takes 30-50 seconds to wake up. That kills your first impression with new users you're marketing to.

---

## Saturday: Infrastructure & Observability

### Block 1 — Split Deployment (2 hours)

**1a. Cloudflare Pages for frontend**

```bash
# In your GitHub repo, Cloudflare Pages settings:
#   Build command:    cd client && npm install && npm run build
#   Build output dir: client/build
#   Root directory:   /  (leave empty)
#   Environment var:  REACT_APP_API_URL = https://your-api.onrender.com/api
```

Steps:

1. Sign up at dash.cloudflare.com → Pages → Connect to Git
2. Select your MERNFlashcardApp repo, branch: master
3. Set build settings as above
4. Set the environment variable for API URL
5. Deploy — takes ~2 minutes
6. You get a `*.pages.dev` domain (free) or add your custom domain

**1b. Update Render to API-only**

Your Render service currently serves both the built React app and the API. Change it to API-only:

```javascript
// server/server.js — REMOVE the static file serving block:
// DELETE these lines:
//   app.use(express.static(path.join(__dirname, '../client/build')));
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
//   });
```

Update CORS to allow your new frontend domain:

```javascript
// server/server.js
const cors = require('cors');
app.use(cors({
  origin: [
    'https://devdecks.pages.dev',       // Cloudflare Pages domain
    'https://devdecks.onrender.com',    // keep old domain working during transition
    'http://localhost:3000',             // local dev
    /^chrome-extension:\/\//             // Chrome extension
  ],
  credentials: true
}));
```

**1c. Update Chrome Extension**

Update the extension's API base URL to point to the Render backend URL (this stays the same if you keep the same Render service).

**Test it**: Visit your `*.pages.dev` URL → app loads fast → login works → create a card → card appears.

---

### Block 2 — Redis for Caching & User Tracking (2 hours)

**2a. Set up Upstash Redis**

1. Sign up at upstash.com
2. Create a Redis database (free tier, pick closest region)
3. Copy the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
4. Add to Render environment variables

```bash
# Install in server/
npm install ioredis
```

```javascript
// server/config/redis.js
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null;
    return Math.min(times * 200, 1000);
  },
  // Upstash requires TLS
  tls: process.env.NODE_ENV === 'production' ? {} : undefined
});

redis.on('error', (err) => console.error('Redis error:', err));
redis.on('connect', () => console.log('Redis connected'));

module.exports = redis;
```

**2b. Active user tracking middleware**

This is the core of "how many users are live right now":

```javascript
// server/middleware/trackActiveUser.js
const redis = require('../config/redis');

const trackActiveUser = async (req, res, next) => {
  try {
    if (req.user && req.user._id) {
      // SET with 5-min TTL — user is "active" if they made a request in last 5 min
      await redis.set(`active:${req.user._id}`, Date.now(), 'EX', 300);

      // Also track daily unique users (expires at midnight UTC)
      const today = new Date().toISOString().split('T')[0];
      await redis.sadd(`dau:${today}`, req.user._id.toString());
      await redis.expire(`dau:${today}`, 86400 * 7); // keep 7 days of DAU data
    }
  } catch (err) {
    // Don't block the request if Redis fails
    console.error('Active user tracking error:', err.message);
  }
  next();
};

module.exports = trackActiveUser;
```

**2c. Cache popular endpoints**

```javascript
// server/middleware/cache.js
const redis = require('../config/redis');

const cache = (keyPrefix, ttlSeconds = 300) => {
  return async (req, res, next) => {
    const key = `cache:${keyPrefix}:${req.originalUrl}`;
    try {
      const cached = await redis.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    } catch (err) {
      // Redis down — skip cache, serve from DB
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      redis.set(key, JSON.stringify(data), 'EX', ttlSeconds).catch(() => {});
      return originalJson(data);
    };
    next();
  };
};

const invalidateCache = async (prefix) => {
  try {
    const keys = await redis.keys(`cache:${prefix}:*`);
    if (keys.length > 0) await redis.del(...keys);
  } catch (err) {
    console.error('Cache invalidation error:', err.message);
  }
};

module.exports = { cache, invalidateCache };
```

Apply to routes:

```javascript
// server/routes/deckRoutes.js
const { cache, invalidateCache } = require('../middleware/cache');

// Cache public deck listings for 5 minutes
router.get('/', cache('decks', 300), getDeckController);

// Invalidate when decks change
router.post('/', authMiddleware, async (req, res, next) => {
  // ... create deck logic ...
  await invalidateCache('decks');
  // ...
});
```

**Test it**: Hit GET /api/decks twice → second response is faster. Check Upstash dashboard → see commands executing.

---

### Block 3 — Health Check & Metrics Endpoint (1 hour)

```javascript
// server/routes/metrics.js
const redis = require('../config/redis');
const mongoose = require('mongoose');

router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: redis.status === 'ready' ? 'connected' : redis.status
  };
  res.json(health);
});

router.get('/metrics', authMiddleware, adminOnly, async (req, res) => {
  try {
    // Active users (made a request in last 5 min)
    const activeKeys = await redis.keys('active:*');

    // Daily active users for last 7 days
    const dauData = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      const count = await redis.scard(`dau:${date}`);
      dauData[date] = count;
    }

    // Business metrics from MongoDB
    const [totalUsers, totalDecks, totalCards] = await Promise.all([
      mongoose.model('User').countDocuments(),
      mongoose.model('Deck').countDocuments(),
      mongoose.model('Flashcard').countDocuments()
    ]);

    // Cards created today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const cardsToday = await mongoose.model('Flashcard').countDocuments({
      createdAt: { $gte: todayStart }
    });

    res.json({
      activeUsersNow: activeKeys.length,
      dailyActiveUsers: dauData,
      totals: { users: totalUsers, decks: totalDecks, cards: totalCards },
      cardsCreatedToday: cardsToday
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

Add `adminOnly` middleware (check if user email matches yours):

```javascript
const adminOnly = (req, res, next) => {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',');
  if (!adminEmails.includes(req.user.email)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
```

**Test it**: Hit /api/health → see status. Login and hit /api/metrics → see active users and totals.

---

### Block 4 — Structured Logging (1 hour)

Replace scattered `console.log` with structured logs that you can actually search and analyze:

```bash
npm install winston morgan
```

```javascript
// server/config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'devdecks-api' },
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production'
        ? winston.format.json()
        : winston.format.combine(winston.format.colorize(), winston.format.simple())
    })
  ]
});

module.exports = logger;
```

```javascript
// server/middleware/requestLogger.js
const morgan = require('morgan');
const logger = require('../config/logger');

const requestLogger = morgan(
  ':method :url :status :response-time ms',
  {
    stream: {
      write: (message) => logger.info(message.trim(), { type: 'request' })
    }
  }
);

module.exports = requestLogger;
```

Then in your key route handlers, log business events:

```javascript
// In deck creation handler
logger.info('Deck created', {
  userId: req.user._id,
  deckId: newDeck._id,
  deckType: newDeck.type,
  source: req.headers['x-api-key'] ? 'extension' : 'web'
});
```

Render captures stdout/stderr — your JSON logs are searchable in the Render dashboard.

**Test it**: Create a deck → see structured log in Render logs with userId, deckType, source.

---

## Sunday: Security, Performance & Monitoring Dashboard

### Block 5 — Security Hardening (1.5 hours)

```bash
npm install helmet express-rate-limit express-mongo-sanitize hpp
```

```javascript
// server/server.js — add near the top, before routes
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

app.use(helmet());
app.use(mongoSanitize());       // prevents { "$gt": "" } in query params
app.use(hpp());                  // prevents duplicate query params

// Global rate limit: 100 req/min per IP
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, slow down' }
}));

// Strict limit on auth endpoints: 10 req/min per IP
app.use('/api/users/login', rateLimit({ windowMs: 60000, max: 10 }));
app.use('/api/users/register', rateLimit({ windowMs: 60000, max: 5 }));

// Strict limit on YouTube import: 5 req/hour per IP
app.use('/api/youtube', rateLimit({ windowMs: 3600000, max: 5 }));
```

Also add input validation to your most critical endpoints using express-validator or just manual checks. At minimum, validate and sanitize:

- Registration: email format, username length, password length
- Deck creation: name not empty, type is valid enum
- Flashcard creation: question/answer not empty, deckId is valid ObjectId

**Test it**: Hit login 11 times rapidly → get 429 "Too many requests".

---

### Block 6 — MongoDB Indexes (30 min)

Add indexes for the queries your app actually runs. This alone can 10x your response times under load:

```javascript
// server/models/Deck.js — add to schema or run once
deckSchema.index({ user: 1, isPublic: 1 });
deckSchema.index({ type: 1 });
deckSchema.index({ isPublic: 1, createdAt: -1 });
deckSchema.index({ name: 'text', description: 'text' });

// server/models/Flashcard.js
flashcardSchema.index({ deck: 1, createdAt: -1 });
flashcardSchema.index({ user: 1 });
flashcardSchema.index({ tags: 1 });
flashcardSchema.index({ question: 'text', answer: 'text' });

// server/models/User.js (email + username are probably already unique-indexed)
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
```

Also add `.lean()` to read-only queries:

```javascript
// Before (returns Mongoose documents with all methods attached)
const decks = await Deck.find({ isPublic: true });

// After (returns plain JS objects, 2-5x faster)
const decks = await Deck.find({ isPublic: true }).lean();
```

**Test it**: In Atlas console, run `db.decks.find({ isPublic: true }).explain()` → confirm it uses the index.

---

### Block 7 — Frontend Quick Wins (1.5 hours)

These don't require any architecture changes:

**7a. Code splitting by route** — biggest single performance win:

```javascript
// client/src/App.jsx
import React, { Suspense, lazy } from 'react';

const HomePage = lazy(() => import('./components/HomePage'));
const DeckView = lazy(() => import('./components/DeckView'));
const Profile = lazy(() => import('./components/Profile'));
const ProblemList = lazy(() => import('./components/ProblemList'));
const StudyView = lazy(() => import('./components/StudyView'));

// In your routes:
<Suspense fallback={<LoadingSpinner />}>
  <Route path="/home" element={<HomePage />} />
  <Route path="/deckView" element={<DeckView />} />
  {/* etc */}
</Suspense>
```

**7b. Debounce search** — prevents hammering the API on every keystroke:

```javascript
// In search components, add debounce:
import { useCallback, useRef } from 'react';

const useDebounce = (fn, delay = 300) => {
  const timeout = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
};

// Usage:
const debouncedSearch = useDebounce((query) => {
  fetchFlashcards({ search: query });
}, 300);

<input onChange={(e) => debouncedSearch(e.target.value)} />
```

**7c. Virtualize the problem list** — 3000+ items should not all be in the DOM:

```bash
cd client && npm install react-virtuoso
```

```javascript
import { Virtuoso } from 'react-virtuoso';

<Virtuoso
  style={{ height: '80vh' }}
  totalCount={problems.length}
  itemContent={(index) => <ProblemRow problem={problems[index]} />}
/>
```

**Test it**: Open DevTools → Network tab → navigate between routes → see chunks loaded lazily. Type in search → see only 1 API call after you stop typing.

---

### Block 8 — Simple Admin Dashboard (1 hour)

A quick page at `/admin` (only visible to you) that shows your metrics:

```javascript
// client/src/components/AdminDashboard.jsx
// Calls GET /api/metrics and displays:
//   - Active users right now (big number)
//   - DAU chart for last 7 days (simple bar chart)
//   - Total users / decks / cards
//   - Cards created today
//   - Source breakdown (web vs extension)
```

This doesn't need to be fancy — a simple page with numbers you can check on your phone. You can build it with just Tailwind and basic fetch calls.

**Test it**: Login → go to /admin → see your own activity reflected in metrics.

---

### Block 9 — Usage Event Tracking (1 hour)

Track what users actually do so you can analyze product-market fit:

```javascript
// server/middleware/trackEvent.js
const redis = require('../config/redis');

const trackEvent = (eventName) => {
  return async (req, res, next) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const key = `events:${today}:${eventName}`;
      await redis.incr(key);
      await redis.expire(key, 86400 * 30); // keep 30 days
    } catch (err) { /* don't block request */ }
    next();
  };
};

module.exports = trackEvent;
```

Apply to routes:

```javascript
router.post('/flashcards', authMiddleware, trackEvent('card_created'), createCard);
router.post('/decks', authMiddleware, trackEvent('deck_created'), createDeck);
router.get('/study', authMiddleware, trackEvent('study_session_started'), getStudy);
router.post('/youtube/playlist', authMiddleware, trackEvent('youtube_import'), importPlaylist);
router.get('/flashcards', trackEvent('cards_browsed'), getFlashcards);
```

Add an endpoint to retrieve event counts:

```javascript
router.get('/metrics/events', authMiddleware, adminOnly, async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const events = {};

  for (let i = 0; i < days; i++) {
    const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    const keys = await redis.keys(`events:${date}:`*);
    events[date] = {};
    for (const key of keys) {
      const eventName = key.split(':').pop();
      events[date][eventName] = parseInt(await redis.get(key)) || 0;
    }
  }
  res.json(events);
});
```

This tells you: Are people creating cards or just browsing? Is YouTube import being used? Are study sessions happening?

**Test it**: Do various actions → hit /api/metrics/events → see counts.

---

## Weekend Checklist

### Saturday

- Sign up for Cloudflare Pages, connect repo, deploy frontend
- Update Render backend: remove static serving, update CORS
- Verify frontend + backend talking correctly
- Sign up for Upstash Redis, get connection URL
- Add Redis: active user tracking + cache middleware
- Add /health and /metrics endpoints
- Add Winston logging, replace console.logs
- Push to master → verify auto-deploy on both services

### Sunday

- Add helmet, rate limiting, mongo sanitize
- Add MongoDB indexes + .lean() on queries
- Add code splitting (React.lazy) on client routes
- Add debounced search
- Add react-virtuoso to problem list
- Build simple admin dashboard page
- Add event tracking middleware
- Final test: login, create deck, create cards, study, check metrics
- Update Chrome extension API URL if needed

### Monday

- Start marketing — you now have: fast load times, metrics to watch,
event tracking to measure engagement, rate limiting to survive traffic
spikes, and an admin dashboard to monitor everything

---

## What You Defer (and why it's fine)


| Skipping for now       | Why it's okay                                                       |
| ---------------------- | ------------------------------------------------------------------- |
| TypeScript migration   | Doesn't affect users, do it incrementally later                     |
| Full test suite        | You need real users first to know what to test                      |
| Docker                 | Render/Cloudflare handle deployment fine                            |
| GitHub Actions CI      | Push directly to master for now, add CI when you have collaborators |
| Refresh tokens         | JWT with reasonable expiry works fine at this scale                 |
| API keys for extension | Current JWT approach works, upgrade when you add paid tiers         |
| Spaced repetition      | Phase 5 feature, needs usage data first                             |
| Knowledge graph        | Phase 6 feature, needs content volume first                         |


---

## Scaling Path After the Weekend

Once you have real users and usage data:

```
Week 1-2 after launch:  Watch metrics, fix what breaks
Week 3-4:               Add TypeScript + GitHub Actions CI
Week 5-6:               Add proper test suite (now you know what matters)
Week 7-8:               Spaced repetition (users will ask for it)
Week 9+:                AI features + knowledge graph
```

The order of future work should be driven by what your usage data tells you users actually want.