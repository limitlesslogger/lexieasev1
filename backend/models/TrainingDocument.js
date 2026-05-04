import mongoose from "mongoose";

const trainingDocumentSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ownerRole: {
      type: String,
      enum: ["student", "teacher", "parent"],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    previewText: {
      type: String,
      default: "",
    },
    rawText: {
      type: String,
      required: true,
    },
    extractedWordCount: {
      type: Number,
      default: 0,
    },
    extractedSentenceCount: {
      type: Number,
      default: 0,
    },
    shareMode: {
      type: String,
      enum: ["private", "all-linked", "selected"],
      default: "private",
    },
    targetType: {
      type: String,
      enum: ["private", "group", "individual"],
      default: "private",
      index: true,
    },
    sharedWithAll: {
      type: Boolean,
      default: false,
      index: true,
    },
    assignedStudentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    targetStudentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isEnabledForTraining: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

trainingDocumentSchema.index({
  ownerId: 1,
  ownerRole: 1,
  isEnabledForTraining: 1,
  shareMode: 1,
});

trainingDocumentSchema.index({
  assignedStudentIds: 1,
  isEnabledForTraining: 1,
  shareMode: 1,
});

trainingDocumentSchema.index({
  targetStudentIds: 1,
  sharedWithAll: 1,
  isEnabledForTraining: 1,
});

const TrainingDocument = mongoose.model("TrainingDocument", trainingDocumentSchema);

export default TrainingDocument;
