const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Registration validation rules
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  
  validate
];

// Login validation rules
const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  validate
];

// Video URL validation rules
const videoUrlValidation = [
  body('videoUrl')
    .trim()
    .notEmpty()
    .withMessage('Video URL is required')
    .matches(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/)
    .withMessage('Please provide a valid YouTube URL'),
  
  validate
];

// Quiz submission validation rules
const quizSubmissionValidation = [
  body('answers')
    .isArray({ min: 1 })
    .withMessage('Answers must be a non-empty array'),
  
  body('answers.*.questionIndex')
    .isInt({ min: 0 })
    .withMessage('Question index must be a valid number'),
  
  body('answers.*.selectedAnswer')
    .isInt({ min: 0, max: 3 })
    .withMessage('Selected answer must be between 0 and 3'),
  
  validate
];

module.exports = {
  registerValidation,
  loginValidation,
  videoUrlValidation,
  quizSubmissionValidation
};
