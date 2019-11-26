const mongoose = require("mongoose");

let QuestionSchema = new mongoose.Schema({
  title: String, 
  answer: String,
  isSolved: {type: Boolean, default: false},
  student: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "student"
  },
  staff: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "staff"
  },
});

module.exports = mongoose.model("question", QuestionSchema);