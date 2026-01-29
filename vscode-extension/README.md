# VSCode Productivity Tracker Extension

Automatically tracks your coding activity and productivity score throughout the day.

## Features

- ✅ Tracks files edited
- ✅ Counts lines changed
- ✅ Records time spent coding
- ✅ Calculates daily productivity score (0-100)
- ✅ Syncs data to backend API
- ✅ Local data persistence

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Build
```bash
npm run compile
```

### 3. Run in Development
Press `F5` in VSCode to launch the Extension Development Host.

### 4. Test Commands
- `Cmd/Ctrl + Shift + P` → "Productivity: Show Today's Stats"
- `Cmd/Ctrl + Shift + P` → "Productivity: Sync Data Now"

## Configuration

Open VSCode Settings and search for "Productivity Tracker":

- **Backend URL**: Where your API server is running (default: `http://localhost:3000`)
- **Sync Interval**: How often to sync data in seconds (default: 3600 = 1 hour)
- **Tracking Enabled**: Toggle tracking on/off (default: true)

## How Scoring Works

Your daily productivity score (0-100) is calculated as:

- **Files Edited**: 1 point per file (max 20)
- **Lines Changed**: 1 point per 10 lines (max 30)
- **Time Spent**: 1 point per 2 minutes (max 50)

Example: 15 files + 200 lines + 60 minutes = 15 + 20 + 30 = 65/100

## Data Format

Tracked data is stored locally and synced to backend:

```json
{
  "date": "2025-01-28",
  "source": "vscode",
  "activity": {
    "filesEdited": 5,
    "linesChanged": 127,
    "timeSpent": 180,
    "commits": 0
  },
  "score": 45,
  "synced": false,
  "syncedAt": null
}
```

## Backend API

The extension expects your backend to have this endpoint:

```
POST /api/productivity
Content-Type: application/json

{
  "date": "2025-01-28",
  "source": "vscode",
  "activity": {...},
  "score": 45
}
```

## Troubleshooting

- **No sync happening**: Check backend URL in settings and ensure it's running
- **Stats not updating**: Try reloading window (Cmd/Ctrl + Shift + P → "Reload Window")
- **View logs**: Open Output panel (View → Output) and select "Productivity Tracker"
