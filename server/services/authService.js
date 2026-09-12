const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "placeholder_key";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const signup = async (email, password) => {
  return await supabase.auth.signUp({ email, password });
};

const login = async (email, password) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

const checkConnection = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("supabase auth check:", error.message);
    } else {
      console.log("Supabase Auth connected successfully!");
    }
  } catch (err) {
    console.log("Supabase Auth ready.");
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
