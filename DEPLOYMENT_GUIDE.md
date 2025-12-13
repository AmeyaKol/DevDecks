# DevDecks Deployment Guide

This guide covers deploying the DevDecks application to production using MongoDB Atlas, Railway (backend), and Vercel (frontend).

## Table of Contents
1. [MongoDB Atlas Setup](#1-mongodb-atlas-setup)
2. [Railway Backend Deployment](#2-railway-backend-deployment)
3. [Vercel Frontend Deployment](#3-vercel-frontend-deployment)
4. [Environment Variables Reference](#4-environment-variables-reference)
5. [Data Migration](#5-data-migration)
6. [Post-Deployment Checklist](#6-post-deployment-checklist)

---

## 1. MongoDB Atlas Setup

### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free" and create an account
3. Verify your email address

### Step 2: Create a Free Cluster
1. Click "Build a Database"
2. Select **M0 Sandbox** (FREE tier)
3. Choose your preferred cloud provider (AWS recommended)
4. Select a region closest to your users
5. Name your cluster (e.g., "devdecks-cluster")
6. Click "Create Cluster"

### Step 3: Configure Database Access
1. Go to **Database Access** in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username (e.g., `devdecks_admin`)
5. Generate a secure password (save this!)
6. Set privileges to "Read and write to any database"
7. Click "Add User"

### Step 4: Configure Network Access
1. Go to **Network Access** in the left sidebar
2. Click "Add IP Address"
3. For development: Add your current IP
4. For production: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Note: Railway and Vercel use dynamic IPs
5. Click "Confirm"

### Step 5: Get Connection String
1. Go to **Database** in the left sidebar
2. Click "Connect" on your cluster
3. Select "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `myFirstDatabase` with `devdecks`

Example connection string:
```
mongodb+srv://devdecks_admin:<password>@devdecks-cluster.xxxxx.mongodb.net/devdecks?retryWrites=true&w=majority
```

---

## 2. Railway Backend Deployment

### Step 1: Create Railway Account
1. Go to [Railway](https://railway.app/)
2. Sign up with GitHub (recommended for easy deployments)

### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your GitHub account if not already connected
4. Select your DevDecks repository

### Step 3: Configure Service
1. Railway will detect the project structure
2. Click on the created service
3. Go to "Settings" tab
4. Set **Root Directory** to `server`
5. Set **Start Command** to `npm start`

### Step 4: Add Environment Variables
Go to "Variables" tab and add:

```
MONGO_URI=mongodb+srv://devdecks_admin:<password>@devdecks-cluster.xxxxx.mongodb.net/devdecks?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-jwt-secret-key-min-32-chars
NODE_ENV=production
FRONTEND_URL=https://your-vercel-domain.vercel.app
DICTIONARY_API_KEY=your-dictionary-api-key
YOUTUBE_API_KEY=your-youtube-api-key
```

### Step 5: Deploy
1. Railway will automatically deploy when you push to main branch
2. Note your Railway URL (e.g., `https://devdecks-production.up.railway.app`)

### Step 6: Generate Domain
1. Go to "Settings" → "Networking"
2. Click "Generate Domain"
3. Note your public URL

---

## 3. Vercel Frontend Deployment

### Step 1: Create Vercel Account
1. Go to [Vercel](https://vercel.com/)
2. Sign up with GitHub (recommended)

### Step 2: Import Project
1. Click "Add New" → "Project"
2. Import your DevDecks repository
3. Configure project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### Step 3: Add Environment Variables
Add the following environment variable:

```
REACT_APP_API_URL=https://your-railway-domain.up.railway.app/api
```

### Step 4: Deploy
1. Click "Deploy"
2. Vercel will build and deploy your frontend
3. Note your Vercel URL

### Step 5: Update Backend CORS
After getting your Vercel URL, update Railway environment variables:
```
FRONTEND_URL=https://your-vercel-domain.vercel.app
```

---

## 4. Environment Variables Reference

### Backend (Railway)

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URI` | MongoDB Atlas connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | Yes |
| `NODE_ENV` | Set to `production` | Yes |
| `FRONTEND_URL` | Your Vercel frontend URL | Yes |
| `PORT` | Server port (Railway sets automatically) | No |
| `DICTIONARY_API_KEY` | Merriam-Webster API key | Optional |
| `YOUTUBE_API_KEY` | YouTube Data API key | Optional |

### Frontend (Vercel)

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_API_URL` | Your Railway backend URL + `/api` | Yes |

---

## 5. Data Migration

### Export from Current MongoDB

```bash
# Install MongoDB Database Tools if not installed
# https://www.mongodb.com/try/download/database-tools

# Export from current database
mongodump --uri="mongodb://localhost:27017/flashcard-app" --out=./backup

# Or from current hosted database
mongodump --uri="your-current-mongodb-uri" --out=./backup
```

### Import to MongoDB Atlas

```bash
# Import to Atlas
mongorestore --uri="mongodb+srv://devdecks_admin:<password>@devdecks-cluster.xxxxx.mongodb.net/devdecks" ./backup/flashcard-app
```

### Alternative: Use MongoDB Compass
1. Download [MongoDB Compass](https://www.mongodb.com/try/download/compass)
2. Connect to your source database
3. Export collections as JSON
4. Connect to Atlas
5. Import JSON files

---

## 6. Post-Deployment Checklist

### Security
- [ ] JWT_SECRET is unique and at least 32 characters
- [ ] MongoDB Atlas IP whitelist is configured
- [ ] HTTPS is enabled (automatic on Railway/Vercel)
- [ ] Environment variables are not committed to git

### Functionality
- [ ] User registration works
- [ ] User login works
- [ ] Flashcards CRUD operations work
- [ ] Decks CRUD operations work
- [ ] Folders CRUD operations work

### Performance
- [ ] Health check endpoint responds: `GET /api/health`
- [ ] Pagination is working for large datasets
- [ ] Rate limiting is active (test with rapid requests)

### Monitoring (Optional)
- [ ] Set up Railway logs monitoring
- [ ] Set up Vercel analytics
- [ ] Configure MongoDB Atlas alerts

---

## Estimated Monthly Costs

| Service | Tier | Cost |
|---------|------|------|
| MongoDB Atlas | M0 (Free) | $0 |
| Railway | Hobby | $5 |
| Vercel | Hobby | $0 |
| **Total** | | **$5/month** |

---

## Troubleshooting

### Common Issues

**CORS Errors**
- Ensure `FRONTEND_URL` in Railway matches your Vercel domain exactly
- Check for trailing slashes

**MongoDB Connection Failed**
- Verify IP whitelist includes 0.0.0.0/0 for Railway
- Check connection string format
- Ensure password doesn't have special characters that need encoding

**Build Failures on Vercel**
- Check that `client` is set as root directory
- Verify all dependencies are in `package.json`
- Check for ESLint errors in build logs

**Rate Limiting Issues**
- If testing, wait 15 minutes between bursts
- Check Railway logs for rate limit messages

