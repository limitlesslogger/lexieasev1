import mongoose from "mongoose";

const letterStateSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    letter: {
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
  },
  { timestamps: true }
);

letterStateSchema.index({ studentId: 1, letter: 1 }, { unique: true });

export default mongoose.model("LetterState", letterStateSchema);
