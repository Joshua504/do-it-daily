---
description: How to host and deploy the frontend dashboard to Render
---

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Static Site**.
3. Select your repository.
4. Set the following configurations:
   - **Name**: `productivity-dashboard`
   - **Root Directory**: `dashboard`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
5. Click **Create Static Site**.
6. **Important**: Go to **Redirects/Rewrites** and add a rule:
   - Source: `/*`
   - Destination: `/index.html`
   - Action: `Rewrite`
7. Once deployed, copy your dashboard URL.
8. (Optional) Provide the URL to the AI assistant to update the backend CORS settings.
