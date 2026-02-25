const authService = require("../services/authService");

exports.signup = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await authService.signup(email, password);

    if (error) {
      return res.status(400).json({ status: "error", message: error.message });
    }

    return res.status(201).json({
      status: "success",
      token: data.session?.access_token,
      data: {
        user: { id: data.user.id, email: data.user.email },
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await authService.login(email, password);

    if (error) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid credentials" });
    }

    return res.status(200).json({
      status: "success",
      token: data.session.access_token,
      data: {
        user: { id: data.user.id, email: data.user.email },
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(400).json({ message: "token required" });
    }

    await authService.logout();

    return res.status(200).json({
      status: "success",
      message: "logged out successfully",
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "logout failed",
    });
  }
};
