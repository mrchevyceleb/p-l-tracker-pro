import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dkaogxskwflaycwxogyi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYW9neHNrd2ZsYXljd3hvZ3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMjM3MzAsImV4cCI6MjA3NzU5OTczMH0.PTUhZXeN7cDrL4YWQnD53iH4RGzZkSXubRxKjYKRwN8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
