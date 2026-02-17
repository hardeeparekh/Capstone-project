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

module.exports = { signup, login };
