const authService = require("../services/authService");

const signup = async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await authService.signup(email, password);

  if (error) return res.status(400).json({ error: error.message });

  res.status(201).json({ user: data.user });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await authService.login(email, password);

  if (error) return res.status(400).json({ error: error.message });

  res.status(200).json({
    user: data.user,
    session: data.session,
  });
};

module.exports = {
  signup,
  login,
};
