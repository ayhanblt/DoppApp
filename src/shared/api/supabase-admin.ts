import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
  console.warn("SUPABASE_SERVICE_ROLE_KEY is not defined. Admin actions will fail.");
}

// Create a Supabase client with the Service Role Key.
// This client bypasses RLS policies and should ONLY be used in Server Actions or API Routes.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || "", {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
