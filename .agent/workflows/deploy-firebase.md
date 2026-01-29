---
description: How to host your backend on Firebase Functions
---

To run your backend on Firebase Functions, follow these steps.

### 1. Preparation (Blaze Plan)

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. Click **"Upgrade"** in the bottom left and switch to the **Blaze Plan**.
   - _Note: You'll need a credit card, but you get 2 million free requests per month—so it's $0 for your usage._

### 2. Prepare the Code

I will help you modify your `index.ts` to export your Express app. This allows Firebase to trigger your backend whenever its URL is visited.

### 3. Initialize & Deploy

Run these commands in your `backend/` folder:

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```
2. **Login**:
   ```bash
   firebase login
   ```
3. **Deploy**:
   ```bash
   firebase deploy --only functions
   ```

### 4. Updating the Frontend

Once deployed, Firebase will give you a public URL (e.g., `https://your-project.cloudfunctions.net/api`).
You'll need to swap this URL in your:

- **VS Code Extension** configuration.
- **Frontend Dashboard** API calls.

I'm ready to start preparing your code for this conversion!
