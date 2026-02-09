const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// Route imports
const userRoutes = require("./routes/userRoutes");
const connectionRoutes = require("./routes/connectionRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const hackathonRoutes = require("./routes/hackathonRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Make io accessible in controllers
app.set("socketio", io);

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/hackathons", hackathonRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

// Socket.io Connection Logic
io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  // Setup: User joins their own room
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    console.log(`User ${userData._id} connected`);
    socket.emit("connected");
  });

  // Join a specific chat room
  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User joined Room: " + room);
  });

  // Typing indicators
  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  // New Message
  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message received", newMessageRecieved);
    });
  });

  // Basic join for notifications (backward compatibility)
  socket.on("join", (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} joined their private room.`);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));