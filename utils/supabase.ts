import { createClient } from '@supabase/supabase-js';

// CRITICAL SECURITY FIX: Use environment variables instead of hardcoded credentials
// These must be set in .env.local file (not committed to git)
// See .env.example for required variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate that environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables. Please create a .env.local file with:\n' +
    'VITE_SUPABASE_URL=your_supabase_url\n' +
    'VITE_SUPABASE_ANON_KEY=your_supabase_anon_key'
  );
  throw new Error('Supabase environment variables not configured');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
