const express = require('express');
const router = express.Router();

// Import controllers and middleware
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateSignup, validateLogin } = require('../middleware/validation');

// Public routes
router.post('/signup', validateSignup, authController.signup);
router.post('/login', validateLogin, authController.login);

// Protected routes
router.use(protect); // All routes after this middleware are protected

router.get('/me', authController.getMe);
router.post('/logout', authController.logout);

module.exports = router;
