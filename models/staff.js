const mongoose = require("mongoose");

let StaffSchema = new mongoose.Schema({
  staffId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    surname: {type: String, required: true},
    otherName: {type: String, required: true},
  },
  email: String,
  password: {
    type: String,
    required: true,
  },
  photo: String,
  phone: String,
  address: String,
  questions: [{
    type: mongoose.SchemaTypes.ObjectId,
    ref: "question"
  }],
  appointments: [{
    type: mongoose.SchemaTypes.ObjectId,
    ref: "appointment"
  }]
});

module.exports = mongoose.model("staff", StaffSchema);