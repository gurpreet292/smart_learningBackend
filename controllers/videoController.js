const Video = require('../models/Video');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const TranscriptService = require('../services/transcriptService');
const AIService = require('../services/aiService');

class VideoController {
  /**
   * Process new video URL
   */
  static async processVideo(req, res, next) {
    const startTime = Date.now();
    
    try {
      const { videoUrl } = req.body;
      const userId = req.user._id;

      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('placeholder') || process.env.OPENAI_API_KEY.includes('your-actual')) {
        return res.status(500).json({
          status: 'error',
          message: '🔑 OpenAI API Key Required\n\nThe app needs an OpenAI API key to generate summaries and quizzes.\n\nSetup:\n1. Get API key from: https://platform.openai.com/api-keys\n2. Add to backend/.env: OPENAI_API_KEY=sk-...\n3. Restart backend server\n\nNote: OpenAI offers free trial credits for new accounts.'
        });
      }

      // Step 1: Fetch transcript
      const transcriptData = await TranscriptService.fetchTranscript(videoUrl);
      
      // Step 2: Clean transcript
      const cleanedTranscript = TranscriptService.cleanTranscript(transcriptData.raw);
      
      // Validate transcript
      TranscriptService.validateTranscript(cleanedTranscript);

      // Step 3: Generate AI content in parallel
      const [summary, keyPoints, quizQuestions] = await Promise.all([
        AIService.generateSummary(cleanedTranscript),
        AIService.generateKeyPoints(cleanedTranscript),
        AIService.generateQuiz(cleanedTranscript)
      ]);

      // Step 4: Create video record
      const video = await Video.create({
        userId,
        videoUrl,
        videoId: transcriptData.videoId,
        transcript: {
          raw: transcriptData.raw,
          cleaned: cleanedTranscript
        },
        aiContent: {
          summary,
          keyPoints,
          generatedAt: new Date()
        },
        metadata: {
          processingTime: Date.now() - startTime,
          transcriptLength: cleanedTranscript.length,
          language: 'en'
        },
        status: 'completed'
      });

      // Step 5: Create quiz
      const quiz = await Quiz.create({
        videoId: video._id,
        userId,
        questions: quizQuestions,
        totalQuestions: quizQuestions.length
      });

      // Update video with quiz reference
      video.quiz = quiz._id;
      await video.save();

      // Update user learning history
      await User.findByIdAndUpdate(userId, {
        $addToSet: { learningHistory: video._id }
      });

      res.status(201).json({
        status: 'success',
        message: 'Video processed successfully',
        data: {
          video: {
            id: video._id,
            videoId: video.videoId,
            videoUrl: video.videoUrl,
            summary: video.aiContent.summary,
            keyPoints: video.aiContent.keyPoints,
            processingTime: video.metadata.processingTime
          },
          quiz: {
            id: quiz._id,
            totalQuestions: quiz.totalQuestions
          }
        }
      });
    } catch (error) {
      // Create failed video record for tracking
      if (error.message.includes('transcript')) {
        try {
          await Video.create({
            userId: req.user._id,
            videoUrl: req.body.videoUrl,
            videoId: 'unknown',
            transcript: { raw: '', cleaned: '' },
            aiContent: { summary: '', keyPoints: [] },
            status: 'failed',
            error: {
              message: error.message,
              timestamp: new Date()
            }
          });
        } catch (dbError) {
          console.error('Failed to create error record:', dbError);
        }
      }
      
      next(error);
    }
  }

  /**
   * Get video details by ID
   */
  static async getVideoById(req, res, next) {
    try {
      const { videoId } = req.params;
      const userId = req.user._id;

      const video = await Video.findOne({
        _id: videoId,
        userId
      });

      if (!video) {
        return res.status(404).json({
          status: 'error',
          message: 'Video not found'
        });
      }

      // Fetch quiz separately since it's in a different collection
      const Quiz = require('../models/Quiz');
      const quiz = await Quiz.findOne({ videoId: video._id, userId });

      res.status(200).json({
        status: 'success',
        data: {
          video: {
            id: video._id,
            videoId: video.videoId,
            videoUrl: video.videoUrl,
            title: video.title,
            thumbnail: video.thumbnail,
            summary: video.aiContent.summary,
            keyPoints: video.aiContent.keyPoints,
            quiz: quiz ? {
              id: quiz._id,
              questions: quiz.questions,
              totalQuestions: quiz.totalQuestions,
              attempts: quiz.attempts
            } : null,
            createdAt: video.createdAt,
            status: video.status
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's learning history
   */
  static async getLearningHistory(req, res, next) {
    try {
      const userId = req.user._id;
      const { page = 1, limit = 10 } = req.query;

      const videos = await Video.find({ userId, status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('-transcript.raw -transcript.cleaned')
        .populate('quiz', 'totalQuestions attempts');

      const total = await Video.countDocuments({ userId, status: 'completed' });

      res.status(200).json({
        status: 'success',
        data: {
          videos,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalVideos: total,
            hasMore: page * limit < total
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete video from history
   */
  static async deleteVideo(req, res, next) {
    try {
      const { videoId } = req.params;
      const userId = req.user._id;

      const video = await Video.findOneAndDelete({
        _id: videoId,
        userId
      });

      if (!video) {
        return res.status(404).json({
          status: 'error',
          message: 'Video not found'
        });
      }

      // Delete associated quiz
      await Quiz.deleteOne({ videoId: video._id });

      // Remove from user's learning history
      await User.findByIdAndUpdate(userId, {
        $pull: { learningHistory: video._id }
      });

      res.status(200).json({
        status: 'success',
        message: 'Video deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = VideoController;
