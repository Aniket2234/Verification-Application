# Netlify Deployment Instructions

## Prerequisites
1. MongoDB Atlas account with a database
2. Netlify account

## Steps

### 1. Set up MongoDB Atlas
1. Create a MongoDB Atlas cluster
2. Get the connection string (MONGODB_URI)

### 2. Deploy to Netlify
1. Connect your GitHub repository to Netlify
2. Set build command to: `vite build`  
3. Set publish directory to: `dist/public`

### 3. Configure Environment Variables
Add these environment variables in Netlify dashboard:
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `TWILIO_ACCOUNT_SID`: (Optional) For SMS functionality
- `TWILIO_AUTH_TOKEN`: (Optional) For SMS functionality  
- `TWILIO_PHONE_NUMBER`: (Optional) For SMS functionality

### 4. Build Settings
The application will automatically:
- Deploy Netlify Functions from `netlify/functions/`
- Handle API routes through redirects configured in `_redirects`
- Serve the React frontend as a SPA

### 5. Features
✅ Candidate registration and management
✅ OTP verification (with demo mode fallback)
✅ Aadhar card verification
✅ Excel bulk import
✅ Search functionality
✅ MongoDB persistent storage
✅ Serverless functions architecture

The application is now fully independent and ready for deployment on Netlify!