# Quick Netlify Deployment Setup

## 🚨 CRITICAL: Fix the Mixed Content Error

Your app is currently failing because it's trying to make HTTP requests from an HTTPS site. Here's the immediate fix:

### Step 1: Deploy Your Backend First
Choose one of these platforms and deploy your backend:

#### Option A: Railway (Recommended)
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Select the backend service
4. Add environment variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_PHONE_NUMBER=your_twilio_phone
   NODE_ENV=production
   ```
5. Your app will be available at: `https://your-app-name.up.railway.app`

#### Option B: Render
1. Go to [render.com](https://render.com)
2. Connect your GitHub repository
3. Create a new Web Service
4. Use the `render.yaml` configuration included in this project
5. Your app will be available at: `https://your-app-name.onrender.com`

### Step 2: Update Netlify Environment Variables
1. Go to your Netlify dashboard
2. Go to Site Settings → Environment Variables
3. Add this variable:
   ```
   VITE_API_URL=https://your-actual-backend-url.com
   ```
   
   **Replace with your real URL from Step 1!**

### Step 3: Redeploy on Netlify
1. Go to your Netlify dashboard
2. Click "Trigger deploy" → "Deploy site"
3. Your app should now work correctly!

## ✅ What Was Fixed
- All API calls now use the `VITE_API_URL` environment variable
- HTTPS compatibility for production deployment
- Independent frontend/backend deployment
- Proper environment variable configuration

## 🔧 Troubleshooting
- **Still getting mixed content errors?** Check that your `VITE_API_URL` starts with `https://`
- **API calls failing?** Verify your backend is running and the URL is correct
- **Environment variable not working?** Make sure you redeployed after adding the variable

## 📁 Files Modified
- Created `client/src/config/api.ts` for API URL management
- Updated all API calls to use the configurable URL
- Updated query keys to be consistent
- Created deployment configurations for multiple platforms