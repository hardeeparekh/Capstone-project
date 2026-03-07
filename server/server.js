require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { checkConnection } = require("./services/authService");

const app = express();

app.use(cors());
app.use(express.json());

const sipSimulationRoutes = require("./routes/sipsimulation");
const snapShotRoutes = require("./routes/snapshot");
const authRoutes = require("./routes/auth");

app.use("/api/sipsimulation", sipSimulationRoutes);
app.use("/api/snapshot", snapShotRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.listen(process.env.PORT, async () => {
  console.log(`Server running on port ${process.env.PORT}`);
  await checkConnection();
});
