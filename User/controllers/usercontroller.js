const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const safeProjection = { password: 0 };

const updateFields = ["firstName", "lastName", "email", "age", "phone", "gender", "role", "status"];

const pickAllowedFields = (payload) => {
  return updateFields.reduce((acc, field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      acc[field] = payload[field];
    }
    return acc;
  }, {});
};

const normalizeUserResponse = (userDoc) => {
  const raw = userDoc.toObject ? userDoc.toObject() : userDoc;
  return {
    ...raw,
    role: raw.role || "User",
    status: raw.status || "Active",
  };
};

const getUsers = async (_req, res) => {
  try {
    const users = await userModel.find({}, safeProjection).sort({ createdAt: -1 });
    res.status(200).json(users.map(normalizeUserResponse));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id, { password: 0 });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(normalizeUserResponse(user));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user profile", error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id, safeProjection);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(normalizeUserResponse(user));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch user", error: error.message });
  }
};

const updateUserById = async (req, res) => {
  try {
    const payload = pickAllowedFields(req.body || {});
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: "No updatable fields were provided" });
    }

    const user = await userModel.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      {
        new: true,
        runValidators: true,
        projection: safeProjection,
      },
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(normalizeUserResponse(user));
  } catch (error) {
    return res.status(500).json({ message: "Failed to update user", error: error.message });
  }
};

const deleteUserById = async (req, res) => {
  try {
    const user = await userModel.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User deleted", id: req.params.id });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete user", error: error.message });
  }
};

const userRegister = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const foundUser = await userModel.findOne({ email: email });
    if (foundUser) {
      return res.status(400).json({ message: "user already exists" });
    }

    const user = await userModel.create({
      email,
      password: hashedPassword,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      age: req.body.age,
      phone: req.body.phone,
      gender: req.body.gender,
      role: req.body.role,
      status: req.body.status,
    });

    return res.status(201).json({
      id: user.id,
      role: user.role,
      status: user.status,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to register user", error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
  
    if (user && (await bcrypt.compare(password, user.password))) {
      const accessToken = jwt.sign(
        {
          user: {
            email: user.email,
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            age: user.age,
            phone: user.phone,
            gender: user.gender,
            role: user.role || "User",
            status: user.status || "Active",
          },
        },
        process.env.ACCESS_TOKEN,
        { expiresIn: "8h" }
      );
      res.status(200).json(accessToken);
    } else {
      res.status(401).json({ message: "Wrong email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};
  

module.exports = {
  getUsers,
  getUser,
  getUserById,
  updateUserById,
  deleteUserById,
  userRegister,
  loginUser,
};