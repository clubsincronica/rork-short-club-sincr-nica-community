# Club Sincrónica Backend

Real-time messaging and profile discovery server for Club Sincrónica mobile app.

## Features

- 🔐 User authentication (JWT)
- 👤 User profiles with location data
- 💬 Real-time messaging (Socket.IO)
- 📍 Nearby user discovery
- 🔍 User search
- 💾 SQLite database

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Initialize database:
```bash
npm run db:init
```

3. Start development server:
```bash
npm run dev
```

Server will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth` - Register or login user

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `GET /api/users/nearby/:lat/:lng` - Get nearby users (radius in km)
- `GET /api/users/search/:query` - Search users

### Conversations
- `GET /api/conversations/user/:userId` - Get user's conversations
- `POST /api/conversations` - Create or get conversation
- `GET /api/conversations/:id/messages` - Get conversation messages
- `POST /api/conversations/:id/read` - Mark messages as read
- `GET /api/messages/unread/:userId` - Get unread message count

## Socket.IO Events

### Client → Server
- `user:join` - Connect user to their room
- `message:send` - Send a message
- `conversation:start` - Start new conversation
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `messages:read` - Mark messages as read

### Server → Client
- `message:new` - New message received
- `conversation:created` - New conversation created
- `typing:start` - Other user typing
- `typing:stop` - Other user stopped typing
- `messages:read` - Messages marked as read

## Production Build

```bash
npm run build
npm start
```

## Environment Variables

Create `.env` file (see `.env.example`):
- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Secret for JWT tokens
- `DATABASE_PATH` - SQLite database file path
- `NODE_ENV` - development/production
