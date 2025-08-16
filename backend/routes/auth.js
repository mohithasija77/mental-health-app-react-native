const express = require('express');
const router = express.Router();
const { validateGoogleAuth } = require('../middleware/validation');

// Import controllers and middleware
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateSignup, validateLogin } = require('../middleware/validation');

// Public routes
router.post('/signup', validateSignup, authController.signup);
router.post('/login', validateLogin, authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOtp);
router.post('/reset-password', authController.resetPassword);

// Google OAuth Signup Route
router.post('/google-signup', authController.googleSignup);

// Google OAuth Login Route
router.post('/google-login', validateGoogleAuth, authController.googleLogin);

// Protected routes
router.use(protect); // All routes after this middleware are protected

router.get('/me', authController.getMe);
router.post('/logout', authController.logout);

module.exports = router;
