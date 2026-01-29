# Render Deployment Guide (Recommended)

Render is the easiest way to host your backend. It handles SSL, scaling, and GitHub deployments automatically.

### 1. Account Setup

1.  Go to [render.com](https://render.com) and sign up for a free account.
2.  Connect your GitHub account.

### 2. Create the Web Service

1.  Click **"New +"** and select **"Web Service"**.
2.  Choose your **`do-it-daily`** repository.
3.  Set the following configuration:
    - **Name**: `productivity-backend`
    - **Runtime**: `Node`
    - **Build Command**: `cd backend && npm install && npm run build`
    - **Start Command**: `cd backend && npm start`

### 3. Setup Environment Variables

Click on the **"Environment"** tab in Render and add the following:

1.  `JWT_SECRET`: (Your secret key)
2.  `FIREBASE_SERVICE_ACCOUNT`: **CRITICAL**
    - Copy the **ENTIRE CONTENT** of your `backend/serviceAccountKey.json` file.
    - Paste it into this field as one long string.
3.  `PORT`: `10000` (Render default)

### 4. Updating the Frontend

Once live, update your API URL to `https://your-app.onrender.com` in:

- **VS Code Settings**
- **React Frontend** (Dashboard)
