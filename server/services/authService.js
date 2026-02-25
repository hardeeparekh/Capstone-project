const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

const signup = async (email, password) => {
  return await supabase.auth.signUp({ email, password });
};

const login = async (email, password) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

const checkConnection = async () => {
  const { data, error } = await supabase.from("profiles").select("*").limit(1);
  if (error) {
    console.error("supabase connection failed:", error.message);
  } else {
    console.log("supabase connected");
  }
};

const logout = async (token) => {
  return await supabase.auth.signOut({ scope: "global" });
};

module.exports = {
  signup,
  login,
  logout,
};

module.exports = { signup, login, checkConnection, logout};
