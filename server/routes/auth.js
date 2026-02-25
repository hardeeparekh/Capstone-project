const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { validateLogin, validateSignup } = require("../middleware/validateAuth");
const { authLimiter } = require("../middleware/rateLimiter");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/signup", authLimiter, validateSignup, authController.signup);
router.post("/login", authLimiter, validateLogin, authController.login);
router.get("/me", verifyToken, (req, res) => {
  res.json({
    status: "success",
    user: req.user,
  });
});
router.post("/logout", verifyToken, authController.logout);

module.exports = router;
