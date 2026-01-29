import express from 'express'
import cors from 'cors'
import * as dotenv from 'dotenv'
import { initializeFirebase } from './firebase'
import routes from './routes'
import authRoutes from './authRoutes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// Initialize Firebase
try {
  initializeFirebase()
} catch (error) {
  console.error('Failed to initialize Firebase. Make sure GOOGLE_APPLICATION_CREDENTIALS is set.')
  process.exit(1)
}

// Routes
app.use(authRoutes)
app.use(routes)

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   Productivity Tracker Backend         ║
║   Server running on port ${PORT}          ║
║   http://localhost:${PORT}               ║
║   Auth: /api/auth/*                    ║
║   Productivity: /api/productivity      ║
║   API Keys: /api/keys/*                ║
╚════════════════════════════════════════╝
  `)
})
