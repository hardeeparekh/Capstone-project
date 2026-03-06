require("dotenv").config();

console.log( process.env.GEMINI_API_KEY);

const chatRoutes = require("./routes/chat");
const express = require("express");
const cors = require("cors");

const app = express();
app.use("/api/chat", chatRoutes);

app.use(cors());
app.use(express.json());

const sipSimulationRoutes = require("./routes/sipsimulation");
app.use("/api/sipsimulation", sipSimulationRoutes);



app.get("/", (req, res) => {
  res.send("Backend running");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
