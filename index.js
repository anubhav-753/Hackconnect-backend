// ---------------------------------------------------------
// Import required packages
// ---------------------------------------------------------
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db.js");
const { notFound, errorHandler } = require("./middleware/errorMiddleware.js");

// ---------------------------------------------------------
// Load environment variables
// ---------------------------------------------------------
dotenv.config();

// ---------------------------------------------------------
// Connect to MongoDB
// ---------------------------------------------------------
connectDB();

// ---------------------------------------------------------
// Import route files
// ---------------------------------------------------------
const userRoutes = require("./routes/userRoutes.js");
const hackathonRoutes = require("./routes/hackathonRoutes.js");
const connectionRoutes = require("./routes/connectionRoutes.js");     // ✅ new
const notificationRoutes = require("./routes/notificationRoutes.js"); // ✅ new

// ---------------------------------------------------------
// Create Express app
// ---------------------------------------------------------
const app = express();

// ---------------------------------------------------------
// Middleware
// ---------------------------------------------------------
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));


app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/users", userRoutes);
app.use("/api/hackathons", hackathonRoutes);
app.use("/api/connections", connectionRoutes);      // ✅ integrate connections
app.use("/api/notifications", notificationRoutes);  // ✅ integrate notifications

// ---------------------------------------------------------
// Serve React build & handle SPA routing in production
// ---------------------------------------------------------
if (process.env.NODE_ENV === "production") {
  const __dirnameDir = path.resolve();
  app.use(express.static(path.join(__dirnameDir, "build")));

  // For any non‑API route, serve index.html for React Router
  app.get("*", (req, res) =>
    res.sendFile(path.join(__dirnameDir, "build", "index.html"))
  );
}

// ---------------------------------------------------------
// Error handling middleware
// ---------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

// ---------------------------------------------------------
// Start the server
// ---------------------------------------------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
  );
});