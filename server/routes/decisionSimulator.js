const express = require("express");
const router = express.Router();

const {
  startDecisionSession,
  playDecisionYear
} = require("../controllers/decisionSimulatorController");

router.post("/start", startDecisionSession);
router.post("/play-year", playDecisionYear);

module.exports = router;
