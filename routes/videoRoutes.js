const express = require('express');
const router = express.Router();
const VideoController = require('../controllers/videoController');
const ManualTranscriptController = require('../controllers/manualTranscriptController');
const authMiddleware = require('../middleware/authMiddleware');
const { videoUrlValidation } = require('../middleware/validation');

// All routes require authentication
router.use(authMiddleware);

// Video processing
router.post('/process', videoUrlValidation, VideoController.processVideo);

// Manual transcript processing
router.post('/process-text', ManualTranscriptController.processManualTranscript);

// Get video details
router.get('/:videoId', VideoController.getVideoById);

// Learning history
router.get('/', VideoController.getLearningHistory);

// Delete video
router.delete('/:videoId', VideoController.deleteVideo);

module.exports = router;
