# Netlify Deployment Guide

## Overview
This guide helps you deploy your Training Portal application to Netlify. The application is split into two parts:
- **Frontend**: React application (deployed to Netlify)
- **Backend**: Express.js API server (deployed separately)

## Prerequisites
1. Netlify account
2. GitHub repository with your code
3. Separate hosting for the backend (Railway, Render, or Vercel)

## Frontend Deployment (Netlify)

### Step 1: Deploy Backend First
Before deploying to Netlify, deploy your backend to a service like:
- **Railway**: Push your server folder to Railway
- **Render**: Deploy your Express app
- **Vercel**: Use Vercel for the backend

### Step 2: Configure Environment Variables
In your Netlify dashboard, add these environment variables:
```
VITE_API_URL=https://your-backend-url.com
```

### Step 3: Build Settings
Use these settings in Netlify:
- **Build command**: `npm run build:client` or `vite build`
- **Publish directory**: `dist/public`
- **Node version**: 20

### Step 4: Deploy to Netlify
1. Connect your GitHub repository to Netlify
2. Set the build command and publish directory
3. Add environment variables
4. Deploy

## Backend Deployment

### Railway Deployment
1. Create a new Railway project
2. Connect your GitHub repository
3. Set these environment variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_PHONE_NUMBER=your_twilio_phone
   NODE_ENV=production
   PORT=5000
   ```
4. Deploy using `npm run start:server`

### Important Notes
- Update the API URL in your frontend environment variables after backend deployment
- Ensure CORS is configured correctly in your backend for your Netlify domain
- Test all API endpoints work correctly after deployment

## Manual Build Commands
If you need to build manually:

```bash
# Build frontend for Netlify
vite build

# Build backend only  
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Build both (current setup)
npm run build
```

## Alternative Backend Deployments

### Vercel (serverless)
Use the `vercel.json` configuration file included in the project.

### Railway
Use the `railway.toml` configuration file included in the project.

### Render
Use the `render.yaml` configuration file included in the project.

## Troubleshooting
- If API calls fail, check the VITE_API_URL environment variable
- Ensure your backend URL is correct in the _redirects file
- Check CORS settings in your backend
- Verify environment variables are set correctly