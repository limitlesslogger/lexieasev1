import User from "../models/User.js";
import jwt from "jsonwebtoken";

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const sendTokenResponse = (user, res) => {
  const token = generateToken(user);

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // true in production (HTTPS)
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    sendTokenResponse(user, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    sendTokenResponse(user, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const logout = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.json({ message: "Logged out" });
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const matches = await user.matchPassword(currentPassword);
    if (!matches) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = String(newPassword);
    await user.save();

    return res.json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to update password" });
  }
};
