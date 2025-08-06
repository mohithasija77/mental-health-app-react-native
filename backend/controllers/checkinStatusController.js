const { DailyCheckinModel } = require('../models/DailyCheckinModel');

exports.checkTodayCheckin = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find if there is any document for this user and today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existingCheckin = await DailyCheckinModel.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    res.json({ hasCheckedInToday: !!existingCheckin });
  } catch (error) {
    console.error("Error checking today's checkin:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
