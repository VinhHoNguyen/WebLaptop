const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());
app.use(cors({ origin: (process.env.CORS_ORIGIN || "*").split(",") }));

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/chat_db")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

const messageSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ChatHistory = mongoose.model("ChatHistory", messageSchema);

app.get("/api/chat/:userId", async (req, res) => {
  try {
    const messages = await ChatHistory.find({ userId: req.params.userId }).sort({ createdAt: 1 }).limit(100);
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/chat/:userId", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0)
      return res.status(400).json({ success: false, error: "messages required" });
    await ChatHistory.insertMany(messages.map(m => ({ userId: req.params.userId, role: m.role, content: m.content })));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/api/chat/:userId", async (req, res) => {
  try {
    await ChatHistory.deleteMany({ userId: req.params.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/health", (req, res) => res.json({ status: "UP" }));

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`Chat service running on port ${PORT}`));
