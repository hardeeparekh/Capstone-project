const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Authorization token required",
      });
    }

    const token = authHeader.split(" ")[1];

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired token",
      });
    }

    req.user = {
      id: data.user.id,
      email: data.user.email,
    };

    next();
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Authentication failed",
    });
  }
};

module.exports = { verifyToken };