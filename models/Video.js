const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  videoUrl: {
    type: String,
    required: [true, 'Video URL is required'],
    trim: true
  },
  videoId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    trim: true
  },
  thumbnail: {
    type: String
  },
  duration: {
    type: Number // in seconds
  },
  transcript: {
    raw: {
      type: String,
      required: true
    },
    cleaned: {
      type: String,
      required: true
    }
  },
  aiContent: {
    summary: {
      type: String,
      required: true
    },
    keyPoints: [{
      point: String,
      timestamp: String
    }],
    generatedAt: {
      type: Date,
      default: Date.now
    }
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  },
  metadata: {
    processingTime: Number, // in milliseconds
    transcriptLength: Number,
    language: {
      type: String,
      default: 'en'
    }
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  error: {
    message: String,
    timestamp: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
videoSchema.index({ userId: 1, createdAt: -1 });
videoSchema.index({ videoId: 1, userId: 1 });

module.exports = mongoose.model('Video', videoSchema);
