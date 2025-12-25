# Bondly - Backend

A robust RESTful API server for Bondly, a dating and social matching platform. Built with Node.js and Express, providing secure authentication, real-time messaging, and comprehensive user management.

## 📋 Overview

Bondly Backend is a RESTful API server that powers the Bondly dating application. It handles user authentication, profile management, matching algorithms, real-time messaging via WebSockets, and comprehensive dashboard analytics.

## ✨ Features

- **User Authentication**: JWT-based authentication with HTTP-only cookies
- **User Management**: Registration, login, profile updates with image uploads
- **Matching System**: Connection requests (interested, accepted, rejected, ignored)
- **Real-time Messaging**: WebSocket support via Socket.io for live chat
- **Conversation Management**: Thread-based messaging with unread counts
- **Profile Discovery**: User discovery with filtering and pagination
- **Dashboard Analytics**: Statistics, recent matches, and activity tracking
- **File Upload**: Image handling with Multer
- **Database**: MongoDB with Mongoose ODM

## 🛠️ Tech Stack

### Core

- **Node.js** - Runtime environment
- **Express** 5.1.0 - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** 8.17.1 - MongoDB object modeling

### Authentication & Security

- **JSON Web Token (JWT)** 9.0.2 - Token-based authentication
- **bcrypt** 6.0.0 - Password hashing
- **Cookie Parser** 1.4.7 - Cookie handling
- **Validator** 13.15.15 - Input validation

### Real-time Communication

- **Socket.io** 4.8.3 - WebSocket server

### File Handling

- **Multer** 2.0.2 - Multipart/form-data handling

### Utilities

- **CORS** 2.8.5 - Cross-origin resource sharing
- **dotenv** 17.2.1 - Environment variable management

## 📁 Project Structure

```
backend/
├── uploads/            # User-uploaded images
├── src/
│   ├── configs/        # Configuration files
│   │   ├── database.js # MongoDB connection
│   │   └── multer.js   # File upload configuration
│   ├── controllers/    # Request handlers
│   │   ├── AuthController.js
│   │   ├── DashboardController.js
│   │   ├── DiscoverController.js
│   │   ├── MessageController.js
│   │   ├── ConversationController.js
│   │   ├── ProfileController.js
│   │   └── ConnectionController.js
│   ├── middlewares/    # Custom middleware
│   │   └── Auth.js     # JWT authentication middleware
│   ├── models/         # Database models
│   │   ├── UserModel.js
│   │   ├── ConnectionModel.js
│   │   ├── ConversationModel.js
│   │   └── MessageModel.js
│   ├── routes/         # API routes
│   │   ├── AuthRoutes.js
│   │   ├── DashboardRoutes.js
│   │   ├── DiscoverRoutes.js
│   │   ├── MessageRoutes.js
│   │   ├── ConversationRoutes.js
│   │   ├── ProfileRoutes.js
│   │   └── CRRRoutes.js
│   └── utils/          # Utility functions
├── app.js              # Application entry point
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance like MongoDB Atlas)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd Bondly/backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory:

```env
PORT=3001
MONGODB_STRING=mongodb://localhost:27017/bondly
NODE_ENV=development
JWT_SECRET=your-secret-key-here
```

4. Start MongoDB (if running locally):

```bash
# Using MongoDB service
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 mongo
```

### Running the Server

Development mode (with nodemon):

```bash
npm start
```

Production mode:

```bash
node app.js
```

The server will start on `http://localhost:3001` (or the port specified in `.env`)

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
MONGODB_STRING=mongodb://localhost:27017/bondly
# Or for MongoDB Atlas:
# MONGODB_STRING=mongodb+srv://username:password@cluster.mongodb.net/bondly

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# CORS Origin (Frontend URL)
CORS_ORIGIN=http://localhost:5173
```

## 📜 Available Scripts

- `npm start` - Start server with nodemon (development)
- `npm test` - Run tests (placeholder)

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify JWT token

### User Discovery

- `GET /api/discover` - Get discoverable users (requires auth)

### Connections & Matching

- `POST /api/request/send/interested/:userId` - Send interest request
- `GET /api/request/received` - Get received requests
- `GET /api/request/sent` - Get sent requests
- `POST /api/request/accept/:requestId` - Accept connection request
- `POST /api/request/reject/:requestId` - Reject connection request

### Dashboard

- `GET /api/dashboard` - Get dashboard data (requires auth)

### Profile

- `GET /api/profile` - Get current user profile (requires auth)
- `PUT /api/profile` - Update user profile (requires auth)

### Conversations

- `GET /api/conversation` - Get all conversations (requires auth)
- `POST /api/conversation/initiate/:userId` - Start new conversation
- `GET /api/conversation/:conversationId` - Get conversation details

### Messages

- `GET /api/message/:conversationId` - Get messages in conversation
- `POST /api/message` - Send a message
- `PUT /api/message/:messageId/read` - Mark message as read

## 🔐 Authentication

The API uses JWT-based authentication with HTTP-only cookies:

1. User logs in → Server generates JWT
2. JWT stored in HTTP-only cookie (secure, sameSite: strict)
3. Client sends cookie automatically with requests
4. Middleware validates token on protected routes

### Protected Routes

Use the `userAuth` middleware to protect routes:

```javascript
const { userAuth } = require('../middlewares/Auth');
router.get('/protected', userAuth, controllerFunction);
```

## 💾 Database Models

### User Model

- name, age, emailId, password
- location, bio, interests
- profileURL, profileImages[]
- timestamps

### Connection Model

- fromUser, toUser
- status: "ignored" | "interested" | "accepted" | "rejected"
- createdAt

### Conversation Model

- participants[]
- lastMessage, lastMessageText, lastMessageSender
- unreadCount (user1, user2)
- mutedBy[], blockedBy[], archivedBy[]
- timestamps

### Message Model

- conversationId, senderId, receiverId
- content, messageType
- read, readAt
- timestamps

## 📤 File Upload

Image uploads are handled using Multer:

- Upload directory: `./uploads`
- Accessible via: `GET /uploads/:filename`
- Supported formats: Images (jpg, png, webp, etc.)

## 🔌 WebSocket (Socket.io)

Real-time messaging is enabled via Socket.io:

```javascript
// Server setup in app.js
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true
  }
});
```

Events:

- `connection` - Client connects
- `disconnect` - Client disconnects
- Custom events for messaging (implement as needed)

## 🚢 Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Use secure JWT secret
3. Configure MongoDB connection string
4. Set up CORS for production frontend URL

### Deployment Platforms

- **Heroku**: Add `Procfile` with `web: node app.js`
- **Railway**: Connect GitHub repo
- **Render**: Deploy from GitHub
- **AWS EC2**: Use PM2 for process management
- **DigitalOcean App Platform**: Connect repo

### Production Checklist

- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS for production domain
- [ ] Set up MongoDB Atlas or production database
- [ ] Configure file storage (AWS S3, Cloudinary, etc.)
- [ ] Set up logging and monitoring
- [ ] Configure rate limiting
- [ ] Enable compression middleware
- [ ] Set up error tracking (Sentry, etc.)

## 🔮 Future Improvements

- [ ] Add input validation middleware (express-validator)
- [ ] Implement rate limiting
- [ ] Add comprehensive error handling
- [ ] Write unit and integration tests
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Implement advanced matching algorithm
- [ ] Add push notifications
- [ ] Implement image optimization
- [ ] Add caching layer (Redis)
- [ ] Set up logging system (Winston, Morgan)
- [ ] Add database indexing optimization
- [ ] Implement pagination for all list endpoints
- [ ] Add search and filtering capabilities

## 📝 License

ISC

## 👤 Author

Your Name

---

For frontend documentation, see [Frontend README](../frontend/README.md)
