const Video = require('../models/Video');
const Quiz = require('../models/Quiz');
const AIService = require('../services/aiService');
const MockAIService = require('../services/mockAIService');

// Use mock mode if OpenAI API has quota issues
const USE_MOCK_MODE = process.env.USE_MOCK_AI === 'true';

class ManualTranscriptController {
  /**
   * Process manually provided transcript
   */
  static async processManualTranscript(req, res, next) {
    try {
      const { title, transcript, videoUrl } = req.body;
      const userId = req.user._id;

      console.log('\n📝 Processing manual transcript');
      console.log('📌 Title:', title);
      console.log('👤 User ID:', userId);

      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('placeholder') || process.env.OPENAI_API_KEY.includes('your-actual')) {
        return res.status(500).json({
          status: 'error',
          message: '🔑 OpenAI API Key Required\n\nThe app needs an OpenAI API key to generate summaries and quizzes.\n\nSetup:\n1. Get API key from: https://platform.openai.com/api-keys\n2. Add to backend/.env: OPENAI_API_KEY=sk-...\n3. Restart backend server\n\nNote: OpenAI offers free trial credits for new accounts.'
        });
      }

      // Validate inputs
      if (!title || !transcript) {
        return res.status(400).json({
          status: 'error',
          message: 'Title and transcript are required'
        });
      }

      // Clean and validate transcript
      const cleanedTranscript = transcript.trim();
      if (cleanedTranscript.length < 50) {
        return res.status(400).json({
          status: 'error',
          message: 'Transcript is too short. Please provide at least 50 characters.'
        });
      }

      console.log('📊 Transcript length:', cleanedTranscript.length, 'characters');

      // Generate AI content (use mock if enabled)
      const aiService = USE_MOCK_MODE ? MockAIService : AIService;
      console.log(USE_MOCK_MODE ? '🎭 Using MOCK AI (demo mode)' : '🤖 Using OpenAI');
      
      console.log('🤖 Generating AI summary...');
      const summary = await aiService.generateSummary(cleanedTranscript);
      
      console.log('🔑 Generating key points...');
      const keyPoints = await aiService.generateKeyPoints(cleanedTranscript);
      
      console.log('❓ Generating quiz...');
      const quizData = await aiService.generateQuiz(cleanedTranscript);

      // Create video record
      const video = new Video({
        userId: userId,
        title: title.trim(),
        videoUrl: videoUrl && videoUrl.trim() ? videoUrl.trim() : 'manual-input',
        videoId: 'manual-' + Date.now(),
        transcript: {
          raw: cleanedTranscript,
          cleaned: cleanedTranscript
        },
        aiContent: {
          summary: summary,
          keyPoints: keyPoints.map(point => ({
            point: typeof point === 'string' ? point : point.point,
            timestamp: ''
          })),
          generatedAt: new Date()
        },
        metadata: {
          transcriptLength: cleanedTranscript.length,
          language: 'en'
        },
        status: 'completed'
      });

      await video.save();
      console.log('💾 Video saved:', video._id);

      // Create quiz
      const quiz = new Quiz({
        videoId: video._id,
        userId: userId,
        questions: quizData.questions
      });

      await quiz.save();
      console.log('✅ Quiz created:', quiz._id);

      // Link quiz to video
      video.quiz = quiz._id;
      await video.save();
      console.log('🔗 Quiz linked to video');

      res.status(201).json({
        status: 'success',
        message: 'Content processed successfully',
        data: {
          video: {
            id: video._id,
            title: video.title,
            summary: video.aiContent.summary,
            keyPoints: video.aiContent.keyPoints
          },
          quiz: {
            id: quiz._id,
            questionCount: quiz.questions.length
          }
        }
      });
    } catch (error) {
      console.error('❌ Manual transcript processing error:', error);
      next(error);
    }
  }
}

module.exports = ManualTranscriptController;
