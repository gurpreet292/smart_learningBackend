const openai = require('../config/openai');

class AIService {
  /**
   * Generate comprehensive summary from transcript
   */
  static async generateSummary(transcript) {
    try {
      const prompt = `You are an expert educational content analyst. Analyze the following video transcript and create a comprehensive, well-structured summary.

Transcript:
${transcript.substring(0, 12000)} ${transcript.length > 12000 ? '...(truncated)' : ''}

Instructions:
- Create a clear, concise summary (200-300 words)
- Organize into logical sections or paragraphs
- Focus on main concepts and key takeaways
- Use professional, academic language
- Make it exam-ready and study-friendly

Summary:`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content summarizer. Create clear, comprehensive, and exam-oriented summaries.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Summary generation error:', error);
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
  }

  /**
   * Extract key learning points from transcript
   */
  static async generateKeyPoints(transcript) {
    try {
      const prompt = `Analyze this educational video transcript and extract the most important learning points.

Transcript:
${transcript.substring(0, 12000)} ${transcript.length > 12000 ? '...(truncated)' : ''}

Instructions:
- Extract 5-8 key learning points
- Each point should be clear and actionable
- Focus on concepts, definitions, and important facts
- Make them exam-oriented and memorable
- Format as a JSON array with structure: [{"point": "...", "timestamp": "general"}]

Key Points:`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting key educational points. Return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      const content = response.choices[0].message.content.trim();
      
      // Parse JSON response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback: manual parsing if JSON not found
      return this.parseKeyPointsManually(content);
    } catch (error) {
      console.error('Key points generation error:', error);
      throw new Error(`Failed to generate key points: ${error.message}`);
    }
  }

  /**
   * Generate quiz questions based on transcript
   */
  static async generateQuiz(transcript) {
    try {
      const prompt = `Create exactly 10 multiple-choice quiz questions based STRICTLY on the content from this video transcript.

Transcript:
${transcript.substring(0, 12000)} ${transcript.length > 12000 ? '...(truncated)' : ''}

Requirements:
- Create EXACTLY 10 questions
- Each question must have 4 options (A, B, C, D)
- Questions must be based ONLY on content from the transcript
- Include a mix of difficulty levels (3 easy, 5 medium, 2 hard)
- Provide correct answer index (0-3) and brief explanation
- Make questions exam-oriented and educational

Format as JSON:
{
  "questions": [
    {
      "question": "What is...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation",
      "difficulty": "medium"
    }
  ]
}

Quiz:`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert quiz creator. Generate educational, accurate questions based strictly on provided content. Return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 2500
      });

      const content = response.choices[0].message.content.trim();
      
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const quizData = JSON.parse(jsonMatch[0]);
        
        // Validate we have exactly 10 questions
        if (quizData.questions && quizData.questions.length === 10) {
          return quizData.questions;
        }
      }

      throw new Error('Failed to generate valid quiz structure');
    } catch (error) {
      console.error('Quiz generation error:', error);
      throw new Error(`Failed to generate quiz: ${error.message}`);
    }
  }

  /**
   * Fallback parser for key points
   */
  static parseKeyPointsManually(content) {
    const lines = content.split('\n').filter(line => line.trim());
    const points = [];

    for (const line of lines) {
      const cleaned = line.replace(/^[-*•]\s*/, '').trim();
      if (cleaned.length > 10) {
        points.push({
          point: cleaned,
          timestamp: 'general'
        });
      }
    }

    return points.slice(0, 8);
  }
}

module.exports = AIService;
