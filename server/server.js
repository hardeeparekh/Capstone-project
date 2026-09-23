require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { checkConnection } = require("./services/authService");

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://worthwise-web.onrender.com",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json());

const sipSimulationRoutes = require("./routes/sipsimulation");
const snapShotRoutes = require("./routes/snapshot");
const authRoutes = require("./routes/auth");
const decisionSimulatorRoutes = require("./routes/decisionSimulator");
const chatRoutes = require("./routes/chat");

app.use("/api/sipsimulation", sipSimulationRoutes);
app.use("/api/snapshot", snapShotRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/decision-simulator", decisionSimulatorRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
  res.send("Backend running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await checkConnection();
});

setInterval(() => {}, 1000000);

