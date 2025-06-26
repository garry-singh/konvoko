import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client-side or user-authenticated actions
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    async accessToken() {
        return ((await auth()).getToken())
    }
  });
};

// Server-side actions that need to bypass RLS (e.g., notifications)
export const createServiceRoleSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseServiceRoleKey);
};