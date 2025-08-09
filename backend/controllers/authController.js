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

    // Debug: Log user object before save
    console.log('User before save:', {
      email: user.email,
      resetPasswordOtp: user.resetPasswordOtp,
      resetPasswordExpires: user.resetPasswordExpires,
    });

    const savedUser = await user.save({ validateBeforeSave: false });

    // Debug: Log user object after save
    console.log('User after save:', {
      email: savedUser.email,
      resetPasswordOtp: savedUser.resetPasswordOtp,
      resetPasswordExpires: savedUser.resetPasswordExpires,
    });

    // Double check by fetching from database
    const verifyUser = await User.findOne({ email });
    console.log('User verified from DB:', {
      email: verifyUser.email,
      resetPasswordOtp: verifyUser.resetPasswordOtp,
      resetPasswordExpires: verifyUser.resetPasswordExpires,
    });

    const message = `Your password reset OTP is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.`;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset OTP',
      text: message,
    });

    console.log('Reset OTP sent to:', user.email);

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
    console.log('Verifying OTP request:', { email, otp, otpType: typeof otp });

    if (!email || !otp) {
      console.log('Missing email or OTP');
      return res
        .status(400)
        .json({ success: false, message: 'Email and OTP are required' });
    }

    // Convert OTP to string and trim any whitespace
    const otpString = otp.toString().trim();
    console.log('OTP after string conversion and trim:', otpString);

    // Hash the provided OTP
    const hashedOtp = crypto
      .createHash('sha256')
      .update(otpString)
      .digest('hex');
    console.log('Hashed provided OTP:', hashedOtp);

    const user = await User.findOne({
      email,
      resetPasswordExpires: { $gt: Date.now() },
    });

    console.log('User found for email:', user ? user.email : 'No user found');

    if (!user) {
      console.log('No user found with email or OTP expired');
      return res
        .status(400)
        .json({ success: false, message: 'Invalid email or OTP expired' });
    }

    // Debug: Check all possible OTP field names
    console.log('All user OTP-related fields:', {
      resetPasswordOtp: user.resetPasswordOtp,
      resetPasswordToken: user.resetPasswordToken, // Check if you accidentally used the old field
      passwordResetOtp: user.passwordResetOtp, // Alternative naming
      otp: user.otp, // Simple naming
    });

    console.log('Stored hashed OTP:', user.resetPasswordOtp);
    console.log('Current time:', new Date(Date.now()));
    console.log('OTP expires at:', new Date(user.resetPasswordExpires));
    console.log('OTP valid?', Date.now() < user.resetPasswordExpires);
    console.log('Hashes match?', user.resetPasswordOtp === hashedOtp);

    // Check if OTP matches
    if (user.resetPasswordOtp !== hashedOtp) {
      console.log('OTP does not match');
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    console.log('OTP verified successfully for user:', user.email);

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
    console.log('Reset password request:', {
      email,
      otp: !!otp,
      newPassword: !!newPassword,
    });

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
    console.log('Hashed OTP for reset:', hashedOtp);

    const user = await User.findOne({
      email,
      resetPasswordOtp: hashedOtp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    console.log('User found for reset:', user ? user.email : 'No user found');

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
    console.log('Password updated for user:', user.email);

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
