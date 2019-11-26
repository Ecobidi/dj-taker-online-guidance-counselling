const mongoose = require("mongoose");

let appointmentSchema = new mongoose.Schema({
  title: String,
  timeApproved: Date,
  student: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "student"
  },
  staff: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "staff"
  },
  isBooked: { type: Boolean, default: false }
});

module.exports = mongoose.model("appointment", appointmentSchema);