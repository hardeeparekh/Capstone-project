require("dotenv").config();

console.log("Gemini Key:", process.env.GEMINI_API_KEY);

const express = require("express");
const cors = require("cors");

const app = express();

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
