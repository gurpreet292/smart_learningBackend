const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Dashboard statistics
router.get('/dashboard', UserController.getDashboardStats);

// Learning progress analytics
router.get('/progress', UserController.getLearningProgress);

// Update profile
router.patch('/profile', UserController.updateProfile);

module.exports = router;
