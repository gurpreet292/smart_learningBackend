const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();

// Connect DB
connectDB();


// ✅ CORS Configuration - Allow both production and local development
const allowedOrigins = [
  "https://smart-learning-frontend-red.vercel.app",
  "http://localhost:3000"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

// IMPORTANT — handle preflight
app.options("*", cors());


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/videos', require('./routes/videoRoutes'));
app.use('/api/quiz', require('./routes/quizRoutes'));
app.use('/api/user', require('./routes/userRoutes'));


// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
    time: new Date().toISOString()
  });
});


// Error handler
app.use(errorHandler);


// ✅ EXPORT ONLY (NO app.listen)
module.exports = app;
