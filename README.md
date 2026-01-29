# Productivity Tracker Extensions

A VSCode and Figma extension system that automatically records your daily productivity, visualized as a contribution graph similar to GitHub's.

## What This Does

- **VSCode Extension**: Tracks coding activity (file edits, time spent, commits)
- **Figma Extension**: Tracks design activity (file edits, component creation, time spent)
- **Dashboard/Visualization**: Displays productivity contribution graph over time
- **Automatic Sync**: Data syncs daily to a backend storage

## Architecture Overview

```
VSCode Extension ─┐
                  ├──> Local Storage (SQLite/IndexedDB) ──> Backend API ──> Dashboard
Figma Extension ──┤
                  └──> Aggregated daily productivity scores
```

## Setup & Build Guide

### Prerequisites
- Node.js 16+ and npm
- VSCode installed
- Figma account and plugin development access
- A simple backend (Firebase, Supabase, or Node.js + database)

---

## 1. VSCode Extension

### Create VSCode Extension
```bash
npm install -g yo generator-code
yo code

# When prompted:
# - Extension name: productivity-tracker-vscode
# - Identifier: productivity-tracker-vscode
# - Type: TypeScript
```

### Core Features (src/extension.ts)
```typescript
- Listen to file save events (vscode.workspace.onDidSaveTextDocument)
- Track active editor time using setInterval
- Record metrics: files edited, lines changed, time spent
- Store data locally in extension storage
- Sync to backend daily
```

### Key Files
- `src/extension.ts` - Main extension logic
- `src/tracker.ts` - Activity tracking
- `src/storage.ts` - Local data persistence
- `src/sync.ts` - Backend sync logic
- `package.json` - Extension manifest

### Run Locally
```bash
cd vscode-extension
npm install
npm run compile
Press F5 in VSCode (launches Extension Development Host)
```

---

## 2. Figma Extension

### Create Figma Plugin
```bash
npm init -y
npm install @figma/plugin-typings typescript

# Create manifest.json
{
  "name": "Productivity Tracker",
  "id": "YOUR_PLUGIN_ID",
  "api": "1.0.0",
  "main": "dist/code.js",
  "ui": "dist/ui.html"
}
```

### Core Features (src/code.ts)
```typescript
- Listen to document changes (figma.on('documentchange'))
- Track: nodes created/modified, time spent in editor
- Aggregate design activity metrics
- Store locally and sync to backend
```

### Key Files
- `src/code.ts` - Plugin backend logic
- `src/ui.ts` - UI (optional dashboard preview)
- `manifest.json` - Plugin metadata

### Run Locally
```bash
cd figma-extension
npm install
npm run build
In Figma: Plugins > Development > Import plugin from manifest
Select your manifest.json
```

---

## 3. Data Storage & Sync

### Local Storage Schema
```javascript
{
  date: "2025-01-28",
  source: "vscode" | "figma",
  activity: {
    filesEdited: 5,
    linesChanged: 127,
    timeSpent: 180, // minutes
    commits: 2,
    nodesCreated: 3,
    componentsModified: 1
  },
  score: 45 // calculated productivity score (0-100)
}
```

### Backend Sync
```typescript
// Daily sync at 11:59 PM (or manually triggered)
const syncData = async () => {
  const todayData = await getLocalData(new Date());
  
  await fetch('https://your-api.com/api/productivity', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(todayData)
  });
};
```

### Backend Options
1. **Firebase Firestore** - Easiest, free tier available
   ```typescript
   firebase.firestore().collection('users').doc(userId)
     .collection('productivity').add(todayData);
   ```

2. **Supabase** - PostgreSQL with easy auth
   ```typescript
   const { data, error } = await supabase
     .from('productivity')
     .insert([{ user_id, date, score, details }]);
   ```

3. **Custom Node.js API** - Full control
   ```bash
   npx create-express-app backend
   Use Express + SQLite/PostgreSQL
   ```

---

## 4. Dashboard/Visualization

### Simple HTML Dashboard
```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <div id="contribution-graph"></div>
  <script>
    // Fetch data from backend
    // Render GitHub-style contribution grid
    // Show stats: total hours, days active, streaks
  </script>
</body>
</html>
```

### Contribution Graph Library
- Use `@uiw/react-heat-map` (React)
- Or build custom CSS Grid with heatmap colors
- Color intensity based on productivity score (0-100)

---

## 5. Implementation Roadmap

### Phase 1: VSCode Extension
- [ ] Track file edits and time
- [ ] Local SQLite storage
- [ ] Daily data aggregation
- [ ] Manual upload to backend

### Phase 2: Figma Extension
- [ ] Track design activity
- [ ] Integrate with VSCode data
- [ ] Unified daily score

### Phase 3: Backend & Auth
- [ ] Set up Supabase/Firebase project
- [ ] User authentication
- [ ] API endpoints for data sync

### Phase 4: Dashboard
- [ ] Contribution graph visualization
- [ ] Statistics and trends
- [ ] Export reports

### Phase 5: Polish
- [ ] Settings panel in extensions
- [ ] Offline sync queue
- [ ] Privacy controls

---

## Config Files

### .env Template
```
BACKEND_URL=https://your-api.com
API_KEY=your_api_key
USER_ID=your_user_id
SYNC_TIME=23:59
```

### package.json (both extensions)
```json
{
  "name": "productivity-tracker-vscode",
  "version": "1.0.0",
  "engines": { "vscode": "^1.70.0" },
  "activationEvents": ["onStartupFinished"],
  "contributes": {
    "commands": [{
      "command": "productivity.syncNow",
      "title": "Sync Productivity Data"
    }]
  }
}
```

---

## Development Tips

1. **Debug VSCode Extension**: Use Output panel to view logs
2. **Debug Figma Plugin**: Use Figma's built-in console
3. **Test Data Collection**: Create test files, monitor in extension storage
4. **Verify Sync**: Check backend logs to confirm data arrival
5. **Privacy**: Store data locally, only send aggregated daily scores

---

## Key Libraries

| Tool | Purpose |
|------|---------|
| `vscode` API | VSCode extension hooks |
| `@figma/plugin-typings` | Figma plugin types |
| `sqlite3` / `better-sqlite3` | Local storage |
| `node-fetch` | HTTP requests |
| `date-fns` | Date manipulation |
| `chart.js` | Dashboard charts |

---

## Deployment

### VSCode Extension
```bash
npm install -g vsce
vsce package
# Upload to VSCode Marketplace
```

### Figma Plugin
- Publish to Figma Community (or keep private)
- Share manifest URL with collaborators

### Dashboard
```bash
Deploy to Vercel/Netlify (if using React)
Or host on GitHub Pages (static HTML)
```

---

## Next Steps

1. Clone/init the project directories
2. Start with VSCode extension (Phase 1)
3. Test local data collection for 1 week
4. Add Figma extension once VSCode is stable
5. Build backend once both extensions work
6. Create dashboard for visualization
