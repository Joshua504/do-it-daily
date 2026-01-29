# Productivity Tracker Dashboard

React + Vite dashboard for the Productivity Tracker system.

## Features

- User Authentication (Login/Signup)
- GitHub OAuth Integration
- API Key Generation & Management
- Productivity Statistics
- 90-Day Contribution Graph
- Real-time Activity Display

## Design

Dark theme inspired by developer tools:
- **Color scheme**: Dark with green accents (#4ec9b0)
- **Typography**: Monospace font (Courier New)
- **Style**: Retro terminal aesthetic

## Setup

### Install Dependencies
```bash
npm install
```

### Development
```bash
npm run dev
```

Runs on `http://localhost:5173`

### Build
```bash
npm run build
```

Outputs to `dist/` directory

## Project Structure

```
src/
├── pages/
│   ├── Login.jsx           # Login page
│   ├── Signup.jsx          # Signup page
│   ├── Dashboard.jsx       # Main dashboard
│   └── Auth.css            # Auth styles
├── components/
│   ├── ContributionGraph.jsx    # GitHub-style graph
│   ├── ApiKeyModal.jsx          # API key generation modal
│   └── [component].css
├── App.jsx                 # Main app component
├── main.jsx               # Entry point
└── index.css              # Global styles
```

## Pages

### Login (`/login`)
- Email/password authentication
- GitHub OAuth option
- Link to signup

### Signup (`/signup`)
- Create account with username, email, password
- GitHub OAuth option
- Link back to login

### Dashboard (`/dashboard`)
- Welcome message
- Activity statistics (4 cards)
- 90-day contribution graph
- Recent activity list
- API key management

## Components

### ContributionGraph
GitHub-style productivity heatmap:
- Shows 90 days of activity
- Color-coded by productivity score
- Hover tooltips with details
- Responsive grid layout

### ApiKeyModal
API key management modal:
- Generate new keys
- Copy key to clipboard
- Display usage instructions
- One-time display warning

## Authentication Flow

1. User visits `/login`
2. Enters credentials or uses GitHub OAuth
3. Backend returns auth token
4. Token stored in localStorage
5. Redirected to dashboard
6. Dashboard fetches user data using token

## API Integration

Dashboard expects these backend endpoints:

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - New account
- `GET /api/auth/github` - GitHub OAuth
- `GET /api/user/:userId` - Fetch user data
- `GET /api/productivity/stats` - Get statistics
- `POST /api/keys/generate` - Generate API key

## Environment Variables

Create `.env` file:
```
VITE_API_URL=http://localhost:3000
```

## Styling

All styles use vanilla CSS with:
- Dark theme (#0a0a0a, #1a1a1a)
- Green accents (#4ec9b0, #3aa88a)
- Red for alerts (#d43535)
- Monospace typography

No CSS framework - pure CSS for lightweight bundle.

## Responsive Design

- Mobile first approach
- Breakpoints at 800px
- Grid layouts with auto-fit
- Touch-friendly buttons
- Scrollable graphs on small screens

## Performance

- Code splitting with React Router
- Lazy loading components
- Minimal dependencies
- CSS animations for smooth UX

## Deployment

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Drag dist/ to Netlify
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

## Future Features

- Dark/Light theme toggle
- Custom dashboard widgets
- Export productivity reports
- Team/shared dashboards
- Detailed analytics
- Productivity goals/targets
