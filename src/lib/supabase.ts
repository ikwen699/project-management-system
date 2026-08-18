import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  const missing = [!supabaseUrl && "SUPABASE_URL", !supabaseServiceKey && "SUPABASE_SERVICE_KEY"]
    .filter(Boolean)
    .join(", ");
  console.error(`[supabase] Missing environment variables: ${missing}`);
}

export const supabase = createClient(supabaseUrl || "", supabaseServiceKey || "", {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
