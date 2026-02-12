const express = require('express');
const router = express.Router();
const QuizController = require('../controllers/quizController');
const authMiddleware = require('../middleware/authMiddleware');
const { quizSubmissionValidation } = require('../middleware/validation');

// All routes require authentication
router.use(authMiddleware);

// Get quiz by video ID
router.get('/video/:videoId', QuizController.getQuizByVideoId);

// Submit quiz attempt
router.post('/:quizId/submit', quizSubmissionValidation, QuizController.submitQuiz);

// Get attempt history
router.get('/:quizId/attempts', QuizController.getAttemptHistory);

// Get specific attempt details
router.get('/:quizId/attempts/:attemptNumber', QuizController.getAttemptDetails);

module.exports = router;
