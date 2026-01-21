import mongoose from "mongoose";

const wordStateSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  wordId: {
    type: String,
    required: true,
  },

  pulls: {
    type: Number,
    default: 0,
  },

  totalReward: {
    type: Number,
    default: 0,
  },

  avgReward: {
    type: Number,
    default: 0,
  },

  isActive: {
    type: Boolean,
    default: false,
  },

  lastShownAt: {
    type: Date,
    default: null,
  },
});

export default mongoose.model("WordState", wordStateSchema);
