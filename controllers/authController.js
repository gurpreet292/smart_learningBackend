const User = require('../models/User');
const jwt = require('jsonwebtoken');

class AuthController {
  /**
   * Register new user
   */
  static async register(req, res, next) {
    try {
      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
        });
      }

      // Create new user
      const user = await User.create({
        username,
        email,
        password
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            preferences: user.preferences
          },
          token
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user with password field
      const user = await User.findOne({ email }).select('+password');
      
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid email or password'
        });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid email or password'
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            preferences: user.preferences,
            lastLogin: user.lastLogin
          },
          token
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.user._id)
        .populate({
          path: 'learningHistory',
          options: { sort: { createdAt: -1 }, limit: 10 }
        });

      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            preferences: user.preferences,
            learningHistory: user.learningHistory,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(req, res, next) {
    try {
      const { theme, language } = req.body;

      const user = await User.findByIdAndUpdate(
        req.user._id,
        {
          $set: {
            'preferences.theme': theme,
            'preferences.language': language
          }
        },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        status: 'success',
        message: 'Preferences updated successfully',
        data: {
          preferences: user.preferences
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
