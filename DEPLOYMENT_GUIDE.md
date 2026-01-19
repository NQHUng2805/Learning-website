# Deployment Guide

## Quick Setup for Production

### Backend (Render)

1. **Deploy to Render** at https://dashboard.render.com
2. **Set Environment Variables** in Render dashboard:
   ```
   FRONTEND_URL=https://your-vercel-app.vercel.app
   MONGODB_URI=your-mongodb-atlas-connection-string
   ACCESS_TOKEN_SECRET=your-secret-key
   REFRESH_TOKEN_SECRET=your-secret-key
   REGISTRATION_TOKEN_SECRET=your-secret-key
   GOOGLE_CLIENT_ID=389805458687-dcf8t9fgck02h53u1hmfjk64oeuhth5s.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=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
   GOOGLE_REDIRECT_URI=https://your-vercel-app.vercel.app/auth/callback
   EMAIL_USER=hungnq2805@gmail.com
   EMAIL_PASS=ykbs zvdz zlox abzi
   RECAPTCHA_SECRET_KEY=6LeZ-kQsAAAAAB7rtjD-EHyBDZVQI-EMCUAo6jvR
   PORT=5000
   NODE_ENV=production
   ```

### Frontend (Vercel)

1. **Deploy to Vercel** at https://vercel.com
2. **Set Environment Variables** in Vercel dashboard:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   VITE_FRONTEND_URL=https://your-vercel-app.vercel.app
   VITE_GOOGLE_CLIENT_ID=389805458687-dcf8t9fgck02h53u1hmfjk64oeuhth5s.apps.googleusercontent.com
   VITE_GOOGLE_REDIRECT_URI=https://your-vercel-app.vercel.app/auth/callback
   VITE_SITE_KEY=6LeZ-kQsAAAAAFtB8ahgXqAZOdJpnwJIMBfl9rFb
   VITE_FIREBASE_API_KEY=AIzaSyD9b2Z6YJ1k1eX4YlY6u0n0k3F3x8Xz8Q4
   ```

### Important: Update Google OAuth

After deploying, update your Google OAuth credentials:
1. Go to https://console.cloud.google.com/apis/credentials
2. Update **Authorized redirect URIs** to include:
   - `https://your-vercel-app.vercel.app/auth/callback`
3. Update **Authorized JavaScript origins** to include:
   - `https://your-vercel-app.vercel.app`

## Step-by-Step Deployment

### 1. Backend Deployment (Render)

**A. Create New Web Service**
- Go to https://dashboard.render.com
- Click "New +" → "Web Service"
- Connect your GitHub repository
- Select the backend folder/branch

**B. Configure Service**
- **Name**: `your-app-backend`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your production branch)
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start` or `node src/index.js`

**C. Add Environment Variables** (click "Advanced" → "Add Environment Variable")

Copy all the variables listed above.

**D. Deploy**
- Click "Create Web Service"
- Wait for deployment to complete
- Copy your backend URL (e.g., `https://your-app-backend.onrender.com`)

### 2. Frontend Deployment (Vercel)

**A. Deploy from GitHub**
- Go to https://vercel.com
- Click "Add New" → "Project"
- Import your GitHub repository
- Select the frontend folder

**B. Configure Project**
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

**C. Add Environment Variables**

Click "Environment Variables" and add all the variables listed above.

⚠️ **IMPORTANT**: Replace `VITE_API_URL` with your Render backend URL from step 1D.

**D. Deploy**
- Click "Deploy"
- Wait for deployment
- Copy your frontend URL (e.g., `https://your-app.vercel.app`)

### 3. Update Backend with Frontend URL

Go back to Render dashboard:
1. Select your backend service
2. Go to "Environment"
3. Update `FRONTEND_URL` with your Vercel URL from step 2D
4. Update `GOOGLE_REDIRECT_URI` with `https://your-app.vercel.app/auth/callback`
5. Click "Save Changes"
6. Service will automatically redeploy

### 4. Update Google OAuth Settings

1. Go to https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Add to **Authorized JavaScript origins**:
   - `https://your-vercel-app.vercel.app`
4. Add to **Authorized redirect URIs**:
   - `https://your-vercel-app.vercel.app/auth/callback`
5. Click "Save"

### 5. Test Your Deployment

1. Visit your Vercel URL
2. Test:
   - Login/Registration
   - Google OAuth login
   - Creating courses/exams
   - Taking quizzes/exams
   - Email notifications

## Troubleshooting

### "Can't reach this page" or CORS errors
- Check that `FRONTEND_URL` in Render matches your Vercel URL exactly
- Check that `VITE_API_URL` in Vercel matches your Render URL exactly
- Ensure both URLs use `https://` (no trailing slash)

### Google OAuth not working
- Verify Google OAuth redirect URIs are updated
- Check `GOOGLE_REDIRECT_URI` in both frontend and backend
- Make sure URLs match exactly (case-sensitive)

### Database connection issues
- Verify MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- Or add Render's IP addresses to MongoDB whitelist

### Email notifications not sending
- Check `EMAIL_USER` and `EMAIL_PASS` are correct
- For Gmail, use App-Specific Password (not regular password)

## Environment Variables Reference

### Backend (Render)
| Variable | Description | Example |
|----------|-------------|---------|
| FRONTEND_URL | Your Vercel deployment URL | https://app.vercel.app |
| MONGODB_URI | MongoDB connection string | mongodb+srv://... |
| ACCESS_TOKEN_SECRET | JWT secret for access tokens | random-string |
| GOOGLE_REDIRECT_URI | OAuth callback URL | https://app.vercel.app/auth/callback |

### Frontend (Vercel)
| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_URL | Your Render backend URL | https://backend.onrender.com |
| VITE_FRONTEND_URL | Your Vercel URL | https://app.vercel.app |
| VITE_GOOGLE_REDIRECT_URI | OAuth callback | https://app.vercel.app/auth/callback |

## Notes

- Render free tier may take 30-60 seconds to wake up from sleep
- Vercel deployments are instant on git push
- Always use `https://` in production URLs
- Keep your secrets secure and never commit them to git
