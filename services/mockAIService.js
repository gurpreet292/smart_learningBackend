/**
 * Mock AI Service - For testing without OpenAI API credits
 * Returns realistic dummy data instead of calling OpenAI
 */

class MockAIService {
  /**
   * Generate mock summary from transcript
   */
  static async generateSummary(transcript) {
    // Simulate API delay
    await this.delay(1000);

    const wordCount = transcript.split(' ').length;
    
    return `This educational content covers key concepts in the field. The material presents ${wordCount} words of comprehensive information, exploring fundamental principles and practical applications. Key topics are discussed in detail, providing learners with essential knowledge and understanding. The content is structured to facilitate learning and comprehension, making complex ideas accessible. This summary captures the main themes and important points covered in the original material.`;
  }

  /**
   * Extract mock key learning points
   */
  static async generateKeyPoints(transcript) {
    await this.delay(800);

    return [
      {
        point: "Understanding the fundamental concepts and definitions",
        timestamp: "general"
      },
      {
        point: "Key principles and how they apply in practice",
        timestamp: "general"
      },
      {
        point: "Real-world applications and use cases",
        timestamp: "general"
      },
      {
        point: "Important terminology and technical vocabulary",
        timestamp: "general"
      },
      {
        point: "Best practices and recommendations",
        timestamp: "general"
      },
      {
        point: "Common challenges and how to overcome them",
        timestamp: "general"
      },
      {
        point: "Future trends and developments in the field",
        timestamp: "general"
      }
    ];
  }

  /**
   * Generate mock quiz questions based on transcript content
   */
  static async generateQuiz(transcript) {
    await this.delay(1200);

    // Extract key terms and concepts from transcript
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const words = transcript.toLowerCase().split(/\s+/);
    
    // Find important terms (words that appear multiple times and are longer)
    const wordFrequency = {};
    words.forEach(word => {
      const cleaned = word.replace(/[^a-z]/g, '');
      if (cleaned.length > 5) {
        wordFrequency[cleaned] = (wordFrequency[cleaned] || 0) + 1;
      }
    });
    
    const importantTerms = Object.entries(wordFrequency)
      .filter(([word, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    const questions = [];

    // Question 1: Main topic identification
    const firstSentence = sentences[0] || "the subject matter";
    questions.push({
      question: `What is the primary focus of this educational content?`,
      options: [
        firstSentence.trim().replace(/^\w/, c => c.toUpperCase()).substring(0, 100),
        "Historical events and chronological developments",
        "Mathematical calculations and formulas",
        "Literary analysis and creative writing"
      ],
      correctAnswer: 0,
      explanation: "The opening statement clearly establishes the main topic and scope of the content."
    });

    // Question 2: Key concept understanding
    const keyTerm1 = importantTerms[0] || "concepts";
    questions.push({
      question: `Which term appears most frequently and represents a core concept?`,
      options: [
        keyTerm1.charAt(0).toUpperCase() + keyTerm1.slice(1),
        "Methodology",
        "Infrastructure",
        "Philosophy"
      ],
      correctAnswer: 0,
      explanation: `The term "${keyTerm1}" is central to understanding the material and appears throughout the content.`
    });

    // Question 3: Definition/Description
    const midSentence = sentences[Math.floor(sentences.length / 2)] || "key information";
    questions.push({
      question: `According to the content, what is emphasized in the middle section?`,
      options: [
        midSentence.trim().substring(0, 100),
        "Theoretical frameworks without practical application",
        "Historical context only",
        "Biographical information"
      ],
      correctAnswer: 0,
      explanation: "This section provides crucial information that builds upon earlier concepts."
    });

    // Question 4: Application/Use case
    questions.push({
      question: `What type of applications or uses are discussed in this content?`,
      options: [
        transcript.includes('application') || transcript.includes('use') ? 
          "Practical applications and real-world implementations" : "Fundamental concepts and theoretical foundations",
        "Purely theoretical models",
        "Historical documentation",
        "Personal opinions and anecdotes"
      ],
      correctAnswer: 0,
      explanation: "The content discusses both theoretical understanding and practical implementation."
    });

    // Question 5: Technical depth
    const keyTerm2 = importantTerms[1] || "systems";
    questions.push({
      question: `What secondary concept is explored in relation to the main topic?`,
      options: [
        keyTerm2.charAt(0).toUpperCase() + keyTerm2.slice(1) + " and their role in the subject",
        "Unrelated side topics",
        "Marketing strategies",
        "Financial considerations only"
      ],
      correctAnswer: 0,
      explanation: `Understanding ${keyTerm2} is essential to grasping the complete picture of the subject.`
    });

    // Question 6: Process/Methodology
    questions.push({
      question: `How does the content structure the learning progression?`,
      options: [
        sentences.length > 5 ? "From fundamental concepts to advanced applications" : "Comprehensive overview of key topics",
        "Random unconnected facts",
        "Only advanced concepts for experts",
        "Historical timeline exclusively"
      ],
      correctAnswer: 0,
      explanation: "The content is structured to build understanding progressively from basics to complex ideas."
    });

    // Question 7: Important relationship
    const keyTerm3 = importantTerms[2] || "processes";
    questions.push({
      question: `What relationship is highlighted between different concepts?`,
      options: [
        `The interconnection between ${keyTerm1} and ${keyTerm3}`,
        "No relationships are established",
        "Contradictory viewpoints only",
        "Independent unrelated topics"
      ],
      correctAnswer: 0,
      explanation: "The content demonstrates how various concepts work together and influence each other."
    });

    // Question 8: Critical understanding
    const lastSentence = sentences[sentences.length - 1] || "understanding the topic";
    questions.push({
      question: `What conclusion or key takeaway does the content emphasize?`,
      options: [
        lastSentence.trim().substring(0, 100),
        "No conclusions are presented",
        "Contradictory results",
        "Incomplete analysis"
      ],
      correctAnswer: 0,
      explanation: "This represents the culmination of ideas presented throughout the content."
    });

    // Question 9: Scope and importance
    questions.push({
      question: `Why is understanding this topic considered important?`,
      options: [
        transcript.includes('important') || transcript.includes('essential') ? 
          "It's essential for modern understanding and application" : 
          "It provides foundational knowledge in the field",
        "It's only useful for historians",
        "It has no practical relevance",
        "It's purely for academic discussion"
      ],
      correctAnswer: 0,
      explanation: "The content establishes the significance and real-world relevance of the topic."
    });

    // Question 10: Advanced synthesis
    const wordCount = words.length;
    questions.push({
      question: `What level of depth does this content provide?`,
      options: [
        wordCount > 200 ? 
          "Comprehensive coverage with detailed explanations" : 
          "Concise overview of key concepts",
        "Surface-level introduction only",
        "Expert-level technical jargon exclusively",
        "Incomplete and fragmented information"
      ],
      correctAnswer: 0,
      explanation: `With ${wordCount} words of content, this provides substantial depth on the subject matter.`
    });

    return { questions };
  }

  /**
   * Utility: Simulate API delay
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = MockAIService;
