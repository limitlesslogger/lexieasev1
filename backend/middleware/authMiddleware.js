import jwt from "jsonwebtoken";
import User from "../models/User.js";
import StudentTeacher from "../models/StudentTeacher.js";
import ParentChild from "../models/ParentChild.js";

export const protect = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalid" });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

export const canAccessStudent = async (req, res, next) => {
  const requester = req.user;
  const studentId = req.params.studentId;

  if (requester.role === "admin") return next();

  if (requester.role === "student" && requester._id.toString() === studentId) {
    return next();
  }

  if (requester.role === "teacher") {
    const link = await StudentTeacher.findOne({
      teacherId: requester._id,
      studentId,
    });
    if (link) return next();
  }

  if (requester.role === "parent") {
    const link = await ParentChild.findOne({
      parentId: requester._id,
      childId: studentId,
    });
    if (link) return next();
  }

  return res.status(403).json({ message: "Access denied to student data" });
};
