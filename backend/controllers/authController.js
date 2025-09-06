const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

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

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Forgot password request received with email:', email);

    if (!email) {
      console.log('No email provided');
      return res
        .status(400)
        .json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    console.log('User found:', user ? user.email : 'No user found');

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Generated OTP:', otp);

    // Hash the OTP for storage
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    console.log('Hashed OTP for storage:', hashedOtp);

    // Store hashed OTP and expiry (10 minutes)
    user.resetPasswordOtp = hashedOtp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    const savedUser = await user.save({ validateBeforeSave: false });

    // Double check by fetching from database
    const verifyUser = await User.findOne({ email });

    const message = `Your password reset OTP is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.`;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset OTP',
      text: message,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to your email',
      email: user.email,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      console.log('Missing email or OTP');
      return res
        .status(400)
        .json({ success: false, message: 'Email and OTP are required' });
    }

    // Convert OTP to string and trim any whitespace
    const otpString = otp.toString().trim();

    // Hash the provided OTP
    const hashedOtp = crypto
      .createHash('sha256')
      .update(otpString)
      .digest('hex');

    const user = await User.findOne({
      email,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      console.log('No user found with email or OTP expired');
      return res
        .status(400)
        .json({ success: false, message: 'Invalid email or OTP expired' });
    }

    // Check if OTP matches
    if (user.resetPasswordOtp !== hashedOtp) {
      console.log('OTP does not match');
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      email: user.email,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required',
      });
    }

    // Convert OTP to string and trim any whitespace
    const otpString = otp.toString().trim();

    // Hash the provided OTP
    const hashedOtp = crypto
      .createHash('sha256')
      .update(otpString)
      .digest('hex');

    const user = await User.findOne({
      email,
      resetPasswordOtp: hashedOtp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Update password and clear OTP fields
    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.googleSignup = async (req, res) => {
  try {
    const { email, name, firstName, lastName, profilePicture, googleId } =
      req.body;

    // Validation
    if (!email || !googleId) {
      console.log('Validation failed - missing required fields', {
        hasEmail: !!email,
        hasGoogleId: !!googleId,
      });
      return res.status(400).json({
        success: false,
        message: 'Email and Google ID are required',
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log('User already exists with this email', {
        existingUserId: existingUser._id,
        existingUserEmail: existingUser.email,
        existingUserAuthProvider: existingUser.authProvider,
      });
      return res.status(400).json({
        success: false,
        message:
          'User with this email already exists. Please try logging in instead.',
      });
    }

    const existingGoogleUser = await User.findOne({ googleId });

    if (existingGoogleUser) {
      console.log('❌ Google account already registered', {
        existingGoogleUserId: existingGoogleUser._id,
        existingGoogleUserEmail: existingGoogleUser.email,
      });
      return res.status(400).json({
        success: false,
        message: 'This Google account is already registered.',
      });
    }

    // Create new user with Google OAuth data
    const userData = {
      email,
      name: name || `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      profilePicture,
      googleId,
      authProvider: 'google',
      isEmailVerified: true,
    };

    const newUser = new User(userData);
    const savedUser = await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: savedUser._id,
        email: savedUser.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    const userResponse = {
      id: savedUser._id,
      email: savedUser.email,
      name: savedUser.name,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      profilePicture: savedUser.profilePicture,
      authProvider: savedUser.authProvider,
      isEmailVerified: savedUser.isEmailVerified,
      createdAt: savedUser.createdAt,
    };

    res.status(201).json({
      success: true,
      message: 'Account created successfully with Google',
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.log('❌ Google signup error occurred', {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name,
    });

    res.status(500).json({
      success: false,
      message: 'Server error during Google signup',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { email, googleId } = req.body;

    // Validation
    if (!email || !googleId) {
      console.log('Validation failed - missing required fields', {
        hasEmail: !!email,
        hasGoogleId: !!googleId,
      });
      return res.status(400).json({
        success: false,
        message: 'Email and Google ID are required',
      });
    }

    // Find user by email or googleId

    const user = await User.findOne({
      $or: [
        { email, googleId },
        { email, authProvider: 'google' },
        { googleId },
      ],
    });

    if (!user) {
      console.log('No user found', {
        searchEmail: email,
        searchGoogleId: googleId,
      });
      return res.status(404).json({
        success: false,
        message:
          'No account found with this Google account. Please sign up first.',
      });
    }

    // If user exists but doesn't have googleId, link the account
    if (!user.googleId) {
      console.log('Linking Google account to existing user');
      user.googleId = googleId;
      user.authProvider = user.authProvider === 'email' ? 'both' : 'google';
      await user.save();
      console.log('Google account linked successfully');
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
      authProvider: user.authProvider,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    };

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.log('Google login error occurred', {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name,
    });

    res.status(500).json({
      success: false,
      message: 'Server error during Google login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
