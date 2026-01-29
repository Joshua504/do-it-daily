# Productivity Tracker Backend

Firebase-based backend for the Productivity Tracker VSCode extension.

## Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the wizard
3. Enable Firestore Database
4. Create a service account:
   - Project Settings → Service Accounts → Generate new private key
   - Download the JSON file

### 2. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Set GOOGLE_APPLICATION_CREDENTIALS to your service account key path
export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

Or set individual Firebase variables in `.env`:
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

### 3. Install & Run

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build
npm run build

# Production
npm start
```

Server will run on `http://localhost:3000`

## API Endpoints

### Save Productivity Data
```
POST /api/productivity
Header: x-user-id: your-user-id
Content-Type: application/json

{
  "date": "2025-01-28",
  "source": "vscode",
  "activity": {
    "filesEdited": 5,
    "linesChanged": 127,
    "timeSpent": 180,
    "commits": 0
  },
  "score": 45
}
```

### Get Data for Specific Date
```
GET /api/productivity?date=2025-01-28&userId=your-user-id
```

Response:
```json
{
  "userId": "your-user-id",
  "date": "2025-01-28",
  "source": "vscode",
  "activity": {...},
  "score": 45,
  "synced": true,
  "createdAt": "2025-01-28T10:30:00Z"
}
```

### Get Date Range
```
GET /api/productivity/range?startDate=2025-01-01&endDate=2025-01-31&userId=your-user-id
```

### Get Statistics
```
GET /api/productivity/stats?days=30&userId=your-user-id
```

Response:
```json
{
  "userId": "your-user-id",
  "period": "last 30 days",
  "totalDays": 25,
  "averageScore": 65,
  "totalTimeSpent": 4500,
  "totalFilesEdited": 142,
  "totalLinesChanged": 3250,
  "bestScore": 92,
  "recentData": [...]
}
```

### Health Check
```
GET /api/health
```

## Database Schema (Firestore)

```
users/
  {userId}/
    productivity/
      {date} → {
        userId: string,
        date: string,
        source: string,
        activity: {
          filesEdited: number,
          linesChanged: number,
          timeSpent: number,
          commits: number
        },
        score: number,
        synced: boolean,
        syncedAt: string,
        createdAt: string,
        updatedAt: string
      }
```

## Testing with cURL

```bash
# Health check
curl http://localhost:3000/api/health

# Send productivity data
curl -X POST http://localhost:3000/api/productivity \
  -H "x-user-id: test-user" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-01-28",
    "source": "vscode",
    "activity": {
      "filesEdited": 5,
      "linesChanged": 127,
      "timeSpent": 180
    },
    "score": 45
  }'

# Get data for date
curl http://localhost:3000/api/productivity?date=2025-01-28&userId=test-user

# Get stats
curl http://localhost:3000/api/productivity/stats?days=30&userId=test-user
```

## Deployment

### Firebase Functions (Recommended)

```bash
npm install -g firebase-tools
firebase init functions
# Copy src files to functions/src
firebase deploy --only functions
```

### Heroku

```bash
heroku create productivity-tracker-backend
git push heroku main
```

### Google Cloud Run

```bash
gcloud builds submit --tag gcr.io/PROJECT-ID/productivity-tracker
gcloud run deploy productivity-tracker \
  --image gcr.io/PROJECT-ID/productivity-tracker \
  --set-env-vars=GOOGLE_APPLICATION_CREDENTIALS=/etc/config/serviceAccountKey.json
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment |
| `GOOGLE_APPLICATION_CREDENTIALS` | - | Path to Firebase service account JSON |

## Troubleshooting

### "Could not load the default credentials"
- Ensure `GOOGLE_APPLICATION_CREDENTIALS` points to valid service account JSON
- Or set individual Firebase env variables

### "Permission denied" on Firestore
- Check Firebase Firestore rules allow write/read
- Default rule: Allow authenticated + testing (not production safe)

### CORS errors
- CORS is enabled by default for all origins in development
- Restrict in production by modifying `cors()` configuration
