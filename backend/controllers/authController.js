const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Send token response
const createSendToken = (user, statusCode, res, message) => {
  const token = generateToken(user._id);

  // Cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() +
        (process.env.JWT_COOKIE_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    message,
    token,
    data: {
      user,
    },
  });
};

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
    });

    // Send token response
    createSendToken(user, 201, res, 'User registered successfully');
  } catch (error) {
    console.error('Signup error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, isOAuth, provider, providerId, name } = req.body;

    // OAuth login
    if (isOAuth) {
      let user = await User.findOne({
        $or: [{ email }, { [`oauth.${provider}`]: providerId }],
      });

      if (!user) {
        user = new User({
          name,
          email,
          oauth: { [provider]: providerId },
          isEmailVerified: true,
        });
        await user.save();
      } else if (!user.oauth?.[provider]) {
        user.oauth = user.oauth || {};
        user.oauth[provider] = providerId;
        await user.save();
      }

      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      return createSendToken(
        user,
        200,
        res,
        `Login successful with ${provider}`
      );
    }

    // Regular login
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    return createSendToken(user, 200, res, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};
