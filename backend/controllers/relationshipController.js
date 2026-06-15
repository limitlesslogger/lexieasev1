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
    return res.status(400).json({ message: "Invalid therapist" });
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
    return res.status(400).json({ message: "Invalid guardian" });
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

export const getAvailableStudentsForLinking = async (req, res) => {
  try {
    if (!["teacher", "parent"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const linkModel = req.user.role === "teacher" ? StudentTeacher : ParentChild;
    const linkField = req.user.role === "teacher" ? "teacherId" : "parentId";
    const studentField = req.user.role === "teacher" ? "studentId" : "childId";

    const links = await linkModel.find({ [linkField]: req.user._id }).select(studentField);
    const linkedIds = links.map((link) => link[studentField]);

    const ownershipFilter =
      req.user.role === "teacher"
        ? { createdBy: req.user._id, createdByRole: "teacher" }
        : { createdBy: req.user._id, createdByRole: "parent" };

    const students = await User.find({
      role: "student",
      ...ownershipFilter,
      _id: { $nin: linkedIds },
    })
      .sort({ createdAt: -1 })
      .select("name email createdAt");

    return res.json(students);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load available students" });
  }
};

export const linkStudentToCurrentUser = async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ message: "Student is required" });
    }

    const student = await User.findById(studentId).select(
      "name email role createdBy createdByRole"
    );
    if (!student || student.role !== "student") {
      return res.status(400).json({ message: "Invalid student" });
    }

    if (
      String(student.createdBy || "") !== String(req.user._id) ||
      student.createdByRole !== req.user.role
    ) {
      return res.status(403).json({
        message: "You can only link by student chooser for students created under your own account. Use student email and temporary password for private linking.",
      });
    }

    if (req.user.role === "teacher") {
      await StudentTeacher.create({ teacherId: req.user._id, studentId });
    } else if (req.user.role === "parent") {
      await ParentChild.create({ parentId: req.user._id, childId: studentId });
    } else {
      return res.status(403).json({ message: "Not allowed" });
    }

    return res.status(201).json({
      success: true,
      student,
      message:
        req.user.role === "teacher"
          ? "Student linked successfully to this therapist."
          : "Child linked successfully to this guardian.",
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: "Link already exists" });
    }
    return res.status(500).json({ message: "Failed to create link" });
  }
};

export const linkStudentWithCredentials = async (req, res) => {
  try {
    if (!["teacher", "parent"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Student email and temporary password are required" });
    }

    const student = await User.findOne({
      email: String(email).toLowerCase().trim(),
      role: "student",
    }).select("+password name email role");

    if (!student) {
      return res.status(400).json({ message: "Student account not found" });
    }

    const matches = await student.matchPassword(String(password));
    if (!matches) {
      return res.status(400).json({ message: "Student email or temporary password is incorrect" });
    }

    if (req.user.role === "teacher") {
      await StudentTeacher.create({ teacherId: req.user._id, studentId: student._id });
    } else {
      await ParentChild.create({ parentId: req.user._id, childId: student._id });
    }

    return res.status(201).json({
      success: true,
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
      },
      message:
        req.user.role === "teacher"
          ? "Student linked successfully using student credentials."
          : "Child linked successfully using student credentials.",
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: "This student is already linked to your account" });
    }
    return res.status(500).json({ message: "Failed to link student with credentials" });
  }
};

export const createStudentAndLink = async (req, res) => {
  try {
    if (!["teacher", "parent"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email: String(email).toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "A user with this email already exists" });
    }

    const student = await User.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      password,
      role: "student",
      createdBy: req.user._id,
      createdByRole: req.user.role,
    });

    return res.status(201).json({
      success: true,
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
      },
      message:
        req.user.role === "teacher"
          ? "New student created. You can now link them from the therapist chooser."
          : "New child account created. You can now link them from the guardian chooser.",
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create student account" });
  }
};

export const unlinkStudentFromCurrentUser = async (req, res) => {
  try {
    if (!["teacher", "parent"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ message: "Student is required" });
    }

    if (req.user.role === "teacher") {
      await StudentTeacher.deleteOne({ teacherId: req.user._id, studentId });
      return res.json({ success: true, message: "Student unlinked successfully." });
    }

    await ParentChild.deleteOne({ parentId: req.user._id, childId: studentId });
    return res.json({ success: true, message: "Child unlinked successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to unlink student" });
  }
};
