---
description: How to host and deploy the backend server
---

For your Node.js + Firebase backend, I recommend two main paths. **Render** is the simplest for standard servers, while **Firebase Functions** is best if you want to keep everything in the Google/Firebase ecosystem.

### Option 1: Render (Recommended for Simplicity)

Render is a modern cloud platform that is very easy to link to a GitHub repository.

1.  **Create a Account**: Go to [render.com](https://render.com) and sign up.
2.  **New Web Service**: Click **"New +"** and select **"Web Service"**.
3.  **Connect Repo**: Connect your `do-it-daily` GitHub repository.
4.  **Configure Build**:
    - **Runtime**: `Node`
    - **Build Command**: `npm install && npm run build`
    - **Start Command**: `npm start`
5.  **Environment Variables**:
    - Add your `.env` variables from your local machine.
    - **CRITICAL**: Since `serviceAccountKey.json` is usually git-ignored, you should add the JSON content as an environment variable (e.g., `FIREBASE_SERVICE_ACCOUNT`) and update `firebase.ts` to read from the variable if the file is missing.
6.  **Deploy**: Click "Create Web Service".

### Option 2: Firebase Functions (Serverless)

If you want to stay strictly in the Firebase family, you can convert the Express app to a Cloud Function.

1.  **Install CLI**: `npm install -g firebase-tools`
2.  **Login & Init**: `firebase login` then `firebase init functions` in the backend folder.
3.  **Wrap Express**: Use `firebase-functions/v2` to wrap your existing Express app.
4.  **Deploy**: `firebase deploy --only functions`

### General Production Prep

Regardless of where you host, you should:

1.  **Fix Service Account**: Ensure your backend can initialize Firebase without needing a physical `serviceAccountKey.json` file (use Env Vars instead).
2.  **CORS**: Update your `cors()` middleware to only allow your hosted frontend URL (once deployed) instead of `*`.
3.  **Public URL**: Once your backend is live, you'll need to update the `backendUrl` in your `vscode-extension` settings and your Frontend's API calls.

If you let me know which one you prefer, I can help you modify the code to make it "Production Ready"!
