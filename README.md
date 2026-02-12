# Smart Video Learning Backend

Node.js + Express.js backend server for AI-powered video learning platform.

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart_video_learning
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
CLIENT_URL=http://localhost:3000
```

## Running

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## API Endpoints

- **POST** `/api/auth/register` - Register new user
- **POST** `/api/auth/login` - Login user
- **GET** `/api/auth/profile` - Get user profile
- **POST** `/api/videos/process` - Process YouTube video
- **GET** `/api/videos/:id` - Get video details
- **GET** `/api/videos` - Get learning history
- **DELETE** `/api/videos/:id` - Delete video
- **GET** `/api/quiz/video/:videoId` - Get quiz
- **POST** `/api/quiz/:quizId/submit` - Submit quiz
- **GET** `/api/user/dashboard` - Get dashboard stats

## Technology Stack

- Express.js
- MongoDB + Mongoose
- OpenAI GPT-4
- JWT Authentication
- youtube-transcript
