import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseKey, {
    async accessToken() {
        return ((await auth()).getToken())
    }
  });
};