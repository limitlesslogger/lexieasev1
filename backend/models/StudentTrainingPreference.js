import mongoose from "mongoose";

const studentTrainingPreferenceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ["all", "selected"],
      default: "all",
    },
    selectedDocumentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TrainingDocument",
      },
    ],
  },
  { timestamps: true }
);

const StudentTrainingPreference = mongoose.model(
  "StudentTrainingPreference",
  studentTrainingPreferenceSchema
);

export default StudentTrainingPreference;
