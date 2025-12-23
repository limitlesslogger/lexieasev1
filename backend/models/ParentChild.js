import mongoose from "mongoose";

const parentChildSchema = new mongoose.Schema(
  {
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate links
parentChildSchema.index({ parentId: 1, childId: 1 }, { unique: true });

const ParentChild = mongoose.model("ParentChild", parentChildSchema);

export default ParentChild;
