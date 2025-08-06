const mongoose = require('mongoose');

const CheckinStatusSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    // add other fields like mood, note etc.
  },
  { timestamps: true }
); // adds createdAt and updatedAt

module.exports = mongoose.model('CheckInStatus', CheckinStatusSchema);
