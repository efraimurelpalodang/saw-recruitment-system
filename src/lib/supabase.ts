import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase environment variables are missing. Please check your .env file.");
}

// Standard client for use in the browser
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);

// Admin client - SHOULD ONLY BE USED ON THE SERVER
export const supabaseAdmin = typeof window === 'undefined' 
  ? createClient(
      supabaseUrl || "https://placeholder.supabase.co",
      supabaseServiceRoleKey || "placeholder-key",
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    )
  : null as any; // Cast to any to avoid type issues in browser-only imports
