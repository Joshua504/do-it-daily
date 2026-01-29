# Authentication & API Key API Documentation

## Overview

The backend provides complete user authentication and API key management:
- User registration and login
- JWT token-based authentication
- API key generation and validation
- Secure password hashing with bcrypt

## Authentication Flow

```
1. User registers → Password hashed with bcrypt
2. User created in Firestore
3. JWT token generated (7 day expiration)
4. Token returned to client
5. Client includes token in Authorization header for protected routes
```

## API Key Flow

```
1. Authenticated user requests API key
2. Raw key generated (pk_xxx)
3. Key hashed with bcrypt for storage
4. Raw key returned once (shown only once!)
5. VSCode extension uses raw key in X-API-Key header
6. Server validates key against stored hash
```

---

## Authentication Endpoints

### POST /api/auth/signup
Register a new user

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ugly_josh",
    "email": "josh@example.com",
    "password": "securepassword123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "user": {
    "username": "ugly_josh",
    "email": "josh@example.com"
  }
}
```

**Errors:**
- `400` - Missing fields or email already registered
- `500` - Server error

---

### POST /api/auth/login
Login user

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "josh@example.com",
    "password": "securepassword123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "user": {
    "username": "ugly_josh",
    "email": "josh@example.com"
  }
}
```

**Errors:**
- `400` - Missing email or password
- `401` - Invalid email or password
- `500` - Server error

---

### POST /api/auth/validate
Validate JWT token

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/validate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "success": true,
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Errors:**
- `401` - No token or invalid token
- `500` - Server error

---

### GET /api/auth/user
Get current user info (requires JWT token)

**Request:**
```bash
curl http://localhost:3000/api/auth/user \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "ugly_josh",
  "email": "josh@example.com",
  "createdAt": "2025-01-28T10:30:00Z",
  "updatedAt": "2025-01-28T10:30:00Z"
}
```

**Errors:**
- `401` - No token or invalid token
- `404` - User not found
- `500` - Server error

---

## API Key Endpoints

### POST /api/keys/generate
Generate new API key (requires JWT token)

**Request:**
```bash
curl -X POST http://localhost:3000/api/keys/generate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "VSCode Extension"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "API key generated successfully",
  "key": "pk_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p",
  "warning": "⚠️ Save this key securely. You will not see it again."
}
```

**Important:** The API key is only shown once! Save it immediately.

**Errors:**
- `401` - No token or invalid token
- `500` - Server error

---

### POST /api/keys/validate
Validate API key (no authentication required)

**Request:**
```bash
curl -X POST http://localhost:3000/api/keys/validate \
  -H "Content-Type: application/json" \
  -d '{
    "key": "pk_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "API key is valid",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Errors:**
- `400` - Missing API key
- `401` - Invalid or inactive API key
- `500` - Server error

---

### GET /api/keys
List all API keys for user (requires JWT token)

**Request:**
```bash
curl http://localhost:3000/api/keys \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "success": true,
  "keys": [
    {
      "displayName": "VSCode Extension",
      "createdAt": "2025-01-28T10:30:00Z",
      "lastUsed": "2025-01-28T12:45:00Z",
      "active": true
    },
    {
      "displayName": "CI/CD Pipeline",
      "createdAt": "2025-01-27T08:00:00Z",
      "lastUsed": "2025-01-28T14:20:00Z",
      "active": true
    }
  ]
}
```

**Errors:**
- `401` - No token or invalid token
- `500` - Server error

---

### DELETE /api/keys/:keyId
Revoke API key (requires JWT token)

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/keys/pk_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "success": true,
  "message": "API key revoked"
}
```

**Errors:**
- `401` - No token or invalid token
- `500` - Server error

---

## Using API Keys with VSCode Extension

Once you have an API key, use it in the VSCode extension:

```typescript
// In VSCode extension
const apiKey = 'pk_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p'

const response = await fetch('http://localhost:3000/api/productivity', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
  },
  body: JSON.stringify({
    date: '2025-01-28',
    source: 'vscode',
    activity: {
      filesEdited: 5,
      linesChanged: 127,
      timeSpent: 180,
    },
    score: 45,
  }),
})
```

---

## Security Notes

### Passwords
- Hashed with bcrypt (10 salt rounds)
- Never stored in plain text
- Never returned in API responses

### JWT Tokens
- Signed with JWT_SECRET
- 7 day expiration
- Includes userId claim
- Change JWT_SECRET in production!

### API Keys
- Hashed with bcrypt before storage
- Raw key shown only once
- Can be revoked by user
- Last used timestamp tracked

### Best Practices
1. Never expose JWT_SECRET
2. Use HTTPS in production
3. Store API keys securely
4. Regenerate API keys if compromised
5. Use short-lived tokens (7 days)

---

## Testing the API

### 1. Create Account
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the `token` from response.

### 2. Generate API Key
```bash
curl -X POST http://localhost:3000/api/keys/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayName": "Test Key"}'
```

Save the `key` from response.

### 3. Post Productivity Data
```bash
curl -X POST http://localhost:3000/api/productivity \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-01-28",
    "source": "vscode",
    "activity": {
      "filesEdited": 5,
      "linesChanged": 127,
      "timeSpent": 180,
      "commits": 0
    },
    "score": 45
  }'
```

### 4. Fetch Stats
```bash
curl http://localhost:3000/api/productivity/stats?days=30 \
  -H "X-API-Key: YOUR_API_KEY"
```

---

## Environment Variables

Create `.env` file:

```
PORT=3000
NODE_ENV=development
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
JWT_SECRET=your-secret-key-here
```

**Important:** Never commit `.env` or `serviceAccountKey.json` to version control!
