import StudentTeacher from "../models/StudentTeacher.js";
import ParentChild from "../models/ParentChild.js";
import User from "../models/User.js";

/* =====================
   ADMIN: Link Teacher ↔ Student
===================== */
export const linkTeacherStudent = async (req, res) => {
  const { teacherId, studentId } = req.body;

  const teacher = await User.findById(teacherId);
  const student = await User.findById(studentId);

  if (!teacher || teacher.role !== "teacher") {
    return res.status(400).json({ message: "Invalid teacher" });
  }

  if (!student || student.role !== "student") {
    return res.status(400).json({ message: "Invalid student" });
  }

  try {
    const link = await StudentTeacher.create({ teacherId, studentId });
    res.status(201).json(link);
  } catch (err) {
    res.status(400).json({ message: "Link already exists" });
  }
};

/* =====================
   ADMIN: Link Parent ↔ Child
===================== */
export const linkParentChild = async (req, res) => {
  const { parentId, childId } = req.body;

  const parent = await User.findById(parentId);
  const child = await User.findById(childId);

  if (!parent || parent.role !== "parent") {
    return res.status(400).json({ message: "Invalid parent" });
  }

  if (!child || child.role !== "student") {
    return res.status(400).json({ message: "Invalid child" });
  }

  try {
    const link = await ParentChild.create({ parentId, childId });
    res.status(201).json(link);
  } catch (err) {
    res.status(400).json({ message: "Link already exists" });
  }
};

/* =====================
   TEACHER: Get My Students
===================== */
export const getMyStudents = async (req, res) => {
  const links = await StudentTeacher.find({
    teacherId: req.user._id,
  }).populate("studentId", "name email");

  res.json(links.map((l) => l.studentId));
};

/* =====================
   PARENT: Get My Children
===================== */
export const getMyChildren = async (req, res) => {
  const links = await ParentChild.find({
    parentId: req.user._id,
  }).populate("childId", "name email");

  res.json(links.map((l) => l.childId));
};
