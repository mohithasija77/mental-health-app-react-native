const express = require('express');
const router = express.Router();
const { checkTodayCheckin } = require('../controllers/checkinStatusController');

// GET /api/mental-health/check-today/:userId
router.get('/check-today/:userId', checkTodayCheckin);

module.exports = router;
