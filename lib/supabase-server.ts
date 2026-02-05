import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";

// Server-side client with service role for admin operations (bypasses RLS)
// Placeholder values allow build without .env; set real values for runtime
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
