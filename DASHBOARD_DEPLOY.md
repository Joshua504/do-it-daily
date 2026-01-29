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

## 3. Configure SPA Routing (AFTER CREATION)

> [!IMPORTANT]
> This tab only appears **after** you click "Deploy Static Site" and the service is created.

1. Once the site is created, click on your service (e.g., `do it daily`) in the Render dashboard.
2. Look at the left-hand sidebar and click the **Redirects/Rewrites** tab.
3. Click **Add Rule**.
4. **Source**: `/*`
5. **Destination**: `/index.html`
6. **Action**: `Rewrite`

## 4. Environment Variables

If you want to use different API URLs for staging/production without changing code, you can use Vite environment variables (e.g., `VITE_API_URL`):

- For now, the dashboard is hardcoded to use `https://productivity-backend-31s3.onrender.com` via `config.js`.

## 5. Deploy!

Render will now build and deploy your dashboard. Once finished, it will provide a URL like `https://productivity-dashboard.onrender.com`.

---

### Important: Update Backend CORS

Once your dashboard is live, you should update the backend's `cors()` configuration in `backend/src/index.ts` to only allow requests from your new dashboard URL for better security.
