# Smart Study Assistant - Backend API

RESTful API backend for the Smart Study Assistant application, providing AI-powered study material generation, user authentication, and study history management.

**Live API:** [https://study-assistant-backend.onrender.com](https://study-assistant-backend.onrender.com)

---

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Google Gemini API** - AI content generation
- **Wikipedia API** - Educational content

---

## Quick Start

### Prerequisites
- Node.js v16+
- MongoDB (local or Atlas)
- Google Gemini API key

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev
```

Server runs on `http://localhost:3001`

---

## Environment Variables

Create a `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb://localhost:27017/study_assistant
JWT_SECRET=your_secure_random_string
PORT=3001
NODE_ENV=development
```

**Get Gemini API Key:** [Google AI Studio](https://makersuite.google.com/app/apikey)

---

## API Endpoints

### Authentication

**POST** `/auth/signup`
```json
Request: { "email": "user@example.com", "password": "password123", "name": "John Doe" }
Response: { "user": {...}, "token": "jwt_token" }
```

**POST** `/auth/login`
```json
Request: { "email": "user@example.com", "password": "password123" }
Response: { "user": {...}, "token": "jwt_token" }
```

**GET** `/auth/me`
```
Headers: Authorization: Bearer <token>
Response: { "user": {...} }
```

### Study Material

**GET** `/study?topic=<topic>&mode=<normal|math>`
```
Headers: Authorization: Bearer <token>
Query: topic (required), mode (optional: normal|math)
Response: {
  "topic": "Topic Name",
  "wikipediaUrl": "https://...",
  "summary": ["point1", "point2", "point3"],
  "quiz": [{ "question": "...", "options": [...], "correctAnswer": "A" }],
  "studyTip": "...",
  "mathQuestion": { "question": "...", "answer": "...", "explanation": "..." }
}
```

**GET** `/study/history`
```
Headers: Authorization: Bearer <token>
Response: { "history": [...] }
```

**DELETE** `/study/history`
```
Headers: Authorization: Bearer <token>
Response: { "message": "History cleared successfully" }
```

---

## Project Structure

```
backend/
├── config/
│   └── database.js              # MongoDB connection
├── controllers/
│   ├── authController.js        # Auth logic
│   └── studyController.js       # Study material logic
├── middleware/
│   └── auth.js                  # JWT verification
├── models/
│   ├── User.js                  # User schema
│   └── StudyHistory.js          # History schema
├── routes/
│   ├── auth.js                  # Auth routes
│   └── study.js                 # Study routes
├── services/
│   ├── openaiService.js         # Gemini AI integration
│   ├── wikipediaService.js      # Wikipedia API
│   └── mathSolverService.js     # Math solver
├── tests/
│   └── study.test.js            # API tests
├── .env                         # Environment variables
├── server.js                    # Express server
└── package.json
```

---

## Features

### AI Content Generation
- Google Gemini API integration
- Automatic fallback to Wikipedia-only mode
- Retry logic with exponential backoff
- Math problem detection and solving

### Authentication
- JWT-based authentication
- Password encryption with bcrypt
- Email domain validation
- Session management

### Database
- MongoDB with Mongoose ODM
- User management
- Study history tracking
- Automatic timestamps

### Error Handling
- Graceful error responses
- Detailed error logging
- Fallback mechanisms
- User-friendly error messages

---

## Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon

---


**Backend API for Smart Study Assistant**
