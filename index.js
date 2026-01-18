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

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
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

// Socket.io Connection Logic
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Users should emit 'join' with their userId after logging in on frontend
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