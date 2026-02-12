const User = require('../models/User');
const Video = require('../models/Video');
const Quiz = require('../models/Quiz');

class UserController {
  /**
   * Get user dashboard statistics
   */
  static async getDashboardStats(req, res, next) {
    try {
      const userId = req.user._id;

      // Get statistics
      const [totalVideos, totalQuizzes, recentVideos] = await Promise.all([
        Video.countDocuments({ userId, status: 'completed' }),
        Quiz.countDocuments({ userId }),
        Video.find({ userId, status: 'completed' })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('-transcript.raw -transcript.cleaned')
      ]);

      // Calculate quiz statistics
      const quizzes = await Quiz.find({ userId }).select('attempts totalQuestions');
      
      let totalAttempts = 0;
      let totalScore = 0;
      let highestScore = 0;

      quizzes.forEach(quiz => {
        totalAttempts += quiz.attempts.length;
        quiz.attempts.forEach(attempt => {
          totalScore += attempt.score;
          if (attempt.score > highestScore) {
            highestScore = attempt.score;
          }
        });
      });

      const averageScore = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;

      res.status(200).json({
        status: 'success',
        data: {
          statistics: {
            totalVideosProcessed: totalVideos,
            totalQuizzes,
            totalQuizAttempts: totalAttempts,
            averageQuizScore: averageScore,
            highestQuizScore: highestScore
          },
          recentVideos
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req, res, next) {
    try {
      const userId = req.user._id;
      const { username } = req.body;

      // Check if username is already taken
      if (username) {
        const existingUser = await User.findOne({ 
          username, 
          _id: { $ne: userId } 
        });

        if (existingUser) {
          return res.status(400).json({
            status: 'error',
            message: 'Username already taken'
          });
        }
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { username },
        { new: true, runValidators: true }
      ).select('-password');

      res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully',
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get learning progress analytics
   */
  static async getLearningProgress(req, res, next) {
    try {
      const userId = req.user._id;
      const { period = '7d' } = req.query;

      // Calculate date range
      const now = new Date();
      let startDate;

      switch (period) {
        case '7d':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case '30d':
          startDate = new Date(now.setDate(now.getDate() - 30));
          break;
        case '90d':
          startDate = new Date(now.setDate(now.getDate() - 90));
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 7));
      }

      // Get videos in period
      const videos = await Video.find({
        userId,
        status: 'completed',
        createdAt: { $gte: startDate }
      }).sort({ createdAt: 1 });

      // Get quiz performance in period
      const quizzes = await Quiz.find({
        userId,
        createdAt: { $gte: startDate }
      }).select('attempts createdAt');

      const progressData = videos.map(video => ({
        date: video.createdAt.toISOString().split('T')[0],
        videosProcessed: 1
      }));

      const quizPerformance = quizzes.flatMap(quiz =>
        quiz.attempts.map(attempt => ({
          date: attempt.attemptedAt.toISOString().split('T')[0],
          score: attempt.score
        }))
      );

      res.status(200).json({
        status: 'success',
        data: {
          period,
          videosProgress: progressData,
          quizPerformance,
          summary: {
            totalVideos: videos.length,
            totalQuizAttempts: quizPerformance.length
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
