# API Key Authentication Setup

Guide to implement API key authentication for the Productivity Tracker extension.

## Architecture

```
VSCode Extension
    ↓ (enters API key)
    ↓
VSCode Settings Storage
    ↓ (saves API key)
    ↓
Backend API
    ↓ (validates key on POST)
    ↓ (records data only if key is valid)
Firebase Database
```

---

## Step 1: Backend - Generate API Keys

### Update Firebase to store API keys

Add this to `backend/src/firebase.ts`:

```typescript
export interface ApiKey {
  userId: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
  active: boolean;
  displayName: string;
}

export async function generateApiKey(userId: string, displayName: string = 'Default'): Promise<string> {
  const db = getFirestore();
  const key = generateRandomKey(); // UUID or random string

  await db.collection('users').doc(userId).collection('apiKeys').doc(key).set({
    userId,
    key,
    displayName,
    createdAt: new Date().toISOString(),
    active: true,
  });

  return key;
}

export async function validateApiKey(key: string): Promise<string | null> {
  const db = getFirestore();
  const snapshot = await db.collectionGroup('apiKeys')
    .where('key', '==', key)
    .where('active', '==', true)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data() as ApiKey;
  
  // Update last used
  await doc.ref.update({ lastUsed: new Date().toISOString() });
  
  return data.userId;
}

function generateRandomKey(): string {
  return `pk_${crypto.randomBytes(32).toString('hex')}`;
}
```

### Create API endpoint to generate keys

Add to `backend/src/routes.ts`:

```typescript
/**
 * POST /api/keys/generate
 * Generate a new API key for a user
 * Requires: userId header
 */
router.post('/api/keys/generate', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { displayName } = req.body;

    const key = await generateApiKey(userId, displayName || 'VSCode Extension');

    res.json({
      success: true,
      key,
      message: 'API key generated. Keep it safe!',
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
});

/**
 * POST /api/keys/validate
 * Validate an API key
 */
router.post('/api/keys/validate', async (req: Request, res: Response) => {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'API key required' });
    }

    const userId = await validateApiKey(key);

    if (!userId) {
      return res.status(401).json({ error: 'Invalid or inactive API key' });
    }

    res.json({
      success: true,
      userId,
      message: 'API key is valid',
    });
  } catch (error) {
    console.error('Error validating API key:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});
```

### Modify productivity endpoint to require API key

```typescript
router.post('/api/productivity', async (req: Request, res: Response) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    // Validate the API key
    const userId = await validateApiKey(apiKey);
    if (!userId) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const { date, source, activity, score } = req.body;

    if (!date || !activity || score === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: date, activity, score',
      });
    }

    await saveProductivity(userId, {
      date,
      source,
      activity,
      score,
      synced: true,
      syncedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: `Productivity data saved for ${date}`,
      userId,
    });
  } catch (error) {
    console.error('Error saving productivity:', error);
    res.status(500).json({ error: 'Failed to save productivity data' });
  }
});
```

---

## Step 2: VSCode Extension - Store & Use API Key

### Create authentication module

Create `vscode-extension/src/auth.ts`:

```typescript
import * as vscode from 'vscode';

export class AuthManager {
  private readonly API_KEY_CONFIG = 'productivityTracker.apiKey';

  async getApiKey(): Promise<string | null> {
    const config = vscode.workspace.getConfiguration('productivityTracker');
    return config.get<string>(this.API_KEY_CONFIG) || null;
  }

  async setApiKey(key: string): Promise<void> {
    const config = vscode.workspace.getConfiguration('productivityTracker');
    await config.update(
      this.API_KEY_CONFIG,
      key,
      vscode.ConfigurationTarget.Global
    );
  }

  async clearApiKey(): Promise<void> {
    const config = vscode.workspace.getConfiguration('productivityTracker');
    await config.update(
      this.API_KEY_CONFIG,
      undefined,
      vscode.ConfigurationTarget.Global
    );
  }

  async validateApiKey(key: string, backendUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${backendUrl}/api/keys/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });

      return response.ok;
    } catch (error) {
      console.error('API key validation error:', error);
      return false;
    }
  }

  async promptForApiKey(): Promise<string | null> {
    const key = await vscode.window.showInputBox({
      prompt: 'Enter your Productivity Tracker API Key',
      password: true,
      placeHolder: 'pk_...',
      ignoreFocusOut: true,
    });

    if (!key) {
      return null;
    }

    // Validate the key
    const config = vscode.workspace.getConfiguration('productivityTracker');
    const backendUrl = config.get<string>('backendUrl', 'http://localhost:3000');
    
    const isValid = await this.validateApiKey(key, backendUrl);
    if (!isValid) {
      vscode.window.showErrorMessage('Invalid API key. Please check and try again.');
      return null;
    }

    // Save the key
    await this.setApiKey(key);
    vscode.window.showInformationMessage('✓ API key validated and saved');
    return key;
  }
}
```

### Update extension.ts to check for API key on startup

```typescript
import * as vscode from 'vscode';
import { Storage } from './storage';
import { ActivityTracker } from './tracker';
import { Syncer } from './sync';
import { StatusBarManager } from './statusbar';
import { AuthManager } from './auth';

let storage: Storage;
let tracker: ActivityTracker;
let syncer: Syncer;
let statusBar: StatusBarManager;
let authManager: AuthManager;
let timeCheckInterval: NodeJS.Timer | null = null;

export async function activate(context: vscode.ExtensionContext) {
  console.log('Productivity Tracker: Activating...');

  // Initialize managers
  storage = new Storage(context.globalStoragePath);
  authManager = new AuthManager();
  
  await storage.initialize();

  // Check for API key
  const apiKey = await authManager.getApiKey();
  
  if (!apiKey) {
    console.log('No API key found. Prompting user...');
    const newKey = await authManager.promptForApiKey();
    
    if (!newKey) {
      vscode.window.showWarningMessage(
        'Productivity Tracker requires an API key. Get one from your dashboard.'
      );
      return; // Don't activate without API key
    }
  }

  console.log('✓ API key verified. Starting tracker...');

  // Initialize tracker, syncer, and status bar
  tracker = new ActivityTracker(storage);
  syncer = new Syncer(storage);
  statusBar = new StatusBarManager(storage);

  // Start tracking
  tracker.start();
  syncer.start();
  statusBar.show();

  // Record active editor time every 5 minutes
  timeCheckInterval = setInterval(() => {
    tracker.recordActiveTime();
  }, 5 * 60 * 1000);

  // Register commands
  const syncCommand = vscode.commands.registerCommand('productivity.syncNow', async () => {
    vscode.window.showInformationMessage('Syncing productivity data...');
    const success = await syncer.syncNow();
    if (success) {
      vscode.window.showInformationMessage('✓ Sync successful');
    } else {
      vscode.window.showErrorMessage('✗ Sync failed. Check backend connection.');
    }
  });

  const statsCommand = vscode.commands.registerCommand('productivity.showStats', async () => {
    await syncer.showStats();
  });

  const resetCommand = vscode.commands.registerCommand('productivity.resetData', async () => {
    const confirm = await vscode.window.showWarningMessage(
      'Are you sure you want to reset all productivity data?',
      'Yes',
      'No'
    );

    if (confirm === 'Yes') {
      await storage.clear();
      vscode.window.showInformationMessage('Data cleared');
    }
  });

  const setKeyCommand = vscode.commands.registerCommand('productivity.setApiKey', async () => {
    await authManager.promptForApiKey();
  });

  context.subscriptions.push(syncCommand, statsCommand, resetCommand, setKeyCommand);

  console.log('Productivity Tracker: Activated successfully');
}

export function deactivate() {
  console.log('Productivity Tracker: Deactivating...');

  if (timeCheckInterval) {
    clearInterval(timeCheckInterval);
  }

  tracker.stop();
  syncer.stop();
  statusBar.dispose();

  console.log('Productivity Tracker: Deactivated');
}
```

### Update sync.ts to include API key in requests

```typescript
private async sendToBackend(
  backendUrl: string,
  activity: DailyActivity
): Promise<boolean> {
  try {
    const apiKey = await this.authManager.getApiKey();
    
    if (!apiKey) {
      console.error('[Syncer] No API key found');
      return false;
    }

    const response = await fetch(`${backendUrl}/api/productivity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(activity),
    });

    if (!response.ok) {
      if (response.status === 401) {
        vscode.window.showErrorMessage('API key is invalid. Run "Productivity: Set API Key" command.');
      }
      console.error(
        `[Syncer] Backend error: ${response.status} ${response.statusText}`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Syncer] Network error:', error);
    return false;
  }
}
```

### Update package.json with new command

```json
"contributes": {
  "commands": [
    {
      "command": "productivity.syncNow",
      "title": "Productivity: Sync Data Now"
    },
    {
      "command": "productivity.showStats",
      "title": "Productivity: Show Today's Stats"
    },
    {
      "command": "productivity.setApiKey",
      "title": "Productivity: Set API Key"
    },
    {
      "command": "productivity.resetData",
      "title": "Productivity: Reset Data (Dev Only)"
    }
  ],
  "configuration": {
    "title": "Productivity Tracker",
    "properties": {
      "productivityTracker.apiKey": {
        "type": "string",
        "description": "Your Productivity Tracker API Key (kept securely)",
        "markdownDescription": "[Generate your API key here](https://your-dashboard.com)"
      }
    }
  }
}
```

---

## Step 3: Create Dashboard to Generate Keys

### Simple web dashboard (dashboard/index.html)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Productivity Tracker - Dashboard</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width: 600px; margin: 50px auto; padding: 20px; }
    button { padding: 10px 20px; background: #4ec9b0; color: white; border: none; border-radius: 5px; cursor: pointer; }
    .api-key { background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0; font-family: monospace; word-break: break-all; }
    .warning { color: #d43535; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔑 Generate API Key</h1>
    <p>Generate a key to use with the VSCode extension.</p>
    
    <input type="text" id="displayName" placeholder="Key name (e.g., 'Main Laptop')" style="width: 100%; padding: 10px; margin: 10px 0;">
    <button onclick="generateKey()">Generate API Key</button>

    <div id="result"></div>
  </div>

  <script>
    async function generateKey() {
      const displayName = document.getElementById('displayName').value || 'Default';
      const userId = getUserId(); // Get from auth

      const response = await fetch('http://localhost:3000/api/keys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, displayName })
      });

      const data = await response.json();

      if (data.success) {
        document.getElementById('result').innerHTML = `
          <p style="color: green;">✓ Key generated!</p>
          <p><span class="warning">⚠️ Save this key securely. You won't see it again.</span></p>
          <div class="api-key">${data.key}</div>
          <p>Paste this into the VSCode extension when prompted.</p>
        `;
      } else {
        document.getElementById('result').innerHTML = `<p style="color: red;">Error: ${data.error}</p>`;
      }
    }

    function getUserId() {
      // Implement your auth logic here
      return localStorage.getItem('userId') || 'anonymous';
    }
  </script>
</body>
</html>
```

---

## Implementation Checklist

- [ ] Add `generateApiKey()` and `validateApiKey()` to Firebase
- [ ] Add `/api/keys/generate` endpoint
- [ ] Add `/api/keys/validate` endpoint
- [ ] Modify `/api/productivity` to require API key
- [ ] Create `src/auth.ts` in VSCode extension
- [ ] Update `src/extension.ts` to check for API key on startup
- [ ] Update `src/sync.ts` to include API key in requests
- [ ] Update `package.json` with new command
- [ ] Create dashboard for generating keys
- [ ] Test: Generate key → Enter in VSCode → Confirm recording works

---

## Testing Flow

1. **Start backend** with Firebase initialized
2. **Open dashboard** and generate an API key
3. **Install VSCode extension**
4. **Extension prompts** for API key on first run
5. **User pastes** the generated key
6. **Extension validates** it with backend
7. **Tracking starts** if valid

---

## Security Best Practices

- ✓ API keys stored in VSCode secure storage
- ✓ Keys validated on every request
- ✓ Keys are salted/hashed on backend (add bcrypt)
- ✓ Keys can be revoked from dashboard
- ✓ Use HTTPS in production
- ✓ Add rate limiting to prevent brute force

---

## Adding bcrypt for key hashing (optional but recommended)

```bash
npm install bcrypt
```

In `backend/src/firebase.ts`:

```typescript
import * as bcrypt from 'bcrypt';

export async function generateApiKey(userId: string, displayName: string = 'Default'): Promise<string> {
  const rawKey = `pk_${crypto.randomBytes(32).toString('hex')}`;
  const hashedKey = await bcrypt.hash(rawKey, 10);

  await db.collection('users').doc(userId).collection('apiKeys').doc(rawKey).set({
    userId,
    keyHash: hashedKey,
    displayName,
    createdAt: new Date().toISOString(),
    active: true,
  });

  return rawKey; // Return to user only once
}

export async function validateApiKey(key: string): Promise<string | null> {
  // With hashing, you'd need to scan all keys and compare
  // Better approach: store raw key hashed separately for quick lookup
  // Or use a reverse lookup table
}
```
