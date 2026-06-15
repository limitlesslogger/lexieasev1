import mongoose from "mongoose";

const sentenceStateSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    sentenceId: {
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

    attempts: [{
      spoken: String,
      expected: String,
      accuracy: Number,
      responseTime: Number,
      visualScore: Number,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  { timestamps: true }
);

export default mongoose.model("SentenceState", sentenceStateSchema);
