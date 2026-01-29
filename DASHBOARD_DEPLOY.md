# Dashboard Deployment Guide (Render)

Follow these steps to host your Productivity Tracker Dashboard for free on Render.

## 1. Create a New Static Site

1. Log in to [Render](https://dashboard.render.com).
2. Click **New +** and select **Static Site**.
3. Connect your GitHub repository.

## 2. Configure Build Settings

- **Name**: `productivity-dashboard` (or any name you like)
- **Root Directory**: `dashboard`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

## 3. Configure SPA Routing (CRITICAL)

Since this is a React Single Page Application, you need to tell Render to handle client-side routing:

1. Go to the **Redirects/Rewrites** tab in your Render dashboard.
2. Click **Add Rule**.
3. **Source**: `/*`
4. **Destination**: `/index.html`
5. **Action**: `Rewrite`

## 4. Environment Variables

If you want to use different API URLs for staging/production without changing code, you can use Vite environment variables (e.g., `VITE_API_URL`):

- For now, the dashboard is hardcoded to use `https://productivity-backend-31s3.onrender.com` via `config.js`.

## 5. Deploy!

Render will now build and deploy your dashboard. Once finished, it will provide a URL like `https://productivity-dashboard.onrender.com`.

---

### Important: Update Backend CORS

Once your dashboard is live, you should update the backend's `cors()` configuration in `backend/src/index.ts` to only allow requests from your new dashboard URL for better security.
