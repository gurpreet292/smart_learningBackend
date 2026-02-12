const Quiz = require('../models/Quiz');
const Video = require('../models/Video');

class QuizController {
  /**
   * Get quiz by video ID
   */
  static async getQuizByVideoId(req, res, next) {
    try {
      const { videoId } = req.params;
      const userId = req.user._id;

      // Verify video ownership
      const video = await Video.findOne({ _id: videoId, userId });
      
      if (!video) {
        return res.status(404).json({
          status: 'error',
          message: 'Video not found'
        });
      }

      const quiz = await Quiz.findOne({ videoId, userId });

      if (!quiz) {
        return res.status(404).json({
          status: 'error',
          message: 'Quiz not found'
        });
      }

      // Return quiz without correct answers for initial attempt
      const quizData = {
        id: quiz._id,
        videoId: quiz.videoId,
        totalQuestions: quiz.totalQuestions,
        questions: quiz.questions.map((q, index) => ({
          questionIndex: index,
          question: q.question,
          options: q.options,
          difficulty: q.difficulty
        })),
        attempts: quiz.attempts.length
      };

      res.status(200).json({
        status: 'success',
        data: { quiz: quizData }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit quiz attempt
   */
  static async submitQuiz(req, res, next) {
    try {
      const { quizId } = req.params;
      const { answers, timeTaken } = req.body;
      const userId = req.user._id;

      const quiz = await Quiz.findOne({ _id: quizId, userId });

      if (!quiz) {
        return res.status(404).json({
          status: 'error',
          message: 'Quiz not found'
        });
      }

      // Calculate score
      let correctCount = 0;
      const processedAnswers = answers.map(answer => {
        const question = quiz.questions[answer.questionIndex];
        const isCorrect = question.correctAnswer === answer.selectedAnswer;
        
        if (isCorrect) correctCount++;

        return {
          questionIndex: answer.questionIndex,
          selectedAnswer: answer.selectedAnswer,
          isCorrect,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation
        };
      });

      const score = Math.round((correctCount / quiz.totalQuestions) * 100);

      // Save attempt
      quiz.attempts.push({
        attemptedAt: new Date(),
        answers: processedAnswers,
        score,
        timeTaken: timeTaken || 0
      });

      await quiz.save();

      res.status(200).json({
        status: 'success',
        message: 'Quiz submitted successfully',
        data: {
          score,
          correctAnswers: correctCount,
          totalQuestions: quiz.totalQuestions,
          percentage: score,
          answers: processedAnswers,
          attemptNumber: quiz.attempts.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get quiz attempt history
   */
  static async getAttemptHistory(req, res, next) {
    try {
      const { quizId } = req.params;
      const userId = req.user._id;

      const quiz = await Quiz.findOne({ _id: quizId, userId })
        .select('attempts totalQuestions');

      if (!quiz) {
        return res.status(404).json({
          status: 'error',
          message: 'Quiz not found'
        });
      }

      const history = quiz.attempts.map((attempt, index) => ({
        attemptNumber: index + 1,
        score: attempt.score,
        attemptedAt: attempt.attemptedAt,
        timeTaken: attempt.timeTaken,
        correctAnswers: attempt.answers.filter(a => a.isCorrect).length,
        totalQuestions: quiz.totalQuestions
      }));

      res.status(200).json({
        status: 'success',
        data: {
          quizId: quiz._id,
          totalAttempts: quiz.attempts.length,
          history: history.reverse() // Most recent first
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get detailed attempt results
   */
  static async getAttemptDetails(req, res, next) {
    try {
      const { quizId, attemptNumber } = req.params;
      const userId = req.user._id;

      const quiz = await Quiz.findOne({ _id: quizId, userId });

      if (!quiz) {
        return res.status(404).json({
          status: 'error',
          message: 'Quiz not found'
        });
      }

      const attemptIndex = parseInt(attemptNumber) - 1;
      
      if (attemptIndex < 0 || attemptIndex >= quiz.attempts.length) {
        return res.status(404).json({
          status: 'error',
          message: 'Attempt not found'
        });
      }

      const attempt = quiz.attempts[attemptIndex];

      res.status(200).json({
        status: 'success',
        data: {
          attemptNumber: parseInt(attemptNumber),
          score: attempt.score,
          attemptedAt: attempt.attemptedAt,
          timeTaken: attempt.timeTaken,
          answers: attempt.answers,
          totalQuestions: quiz.totalQuestions
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = QuizController;
