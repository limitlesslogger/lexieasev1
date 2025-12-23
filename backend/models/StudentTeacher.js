import mongoose from "mongoose";

const studentTeacherSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate links
studentTeacherSchema.index({ studentId: 1, teacherId: 1 }, { unique: true });

const StudentTeacher = mongoose.model("StudentTeacher", studentTeacherSchema);

export default StudentTeacher;
