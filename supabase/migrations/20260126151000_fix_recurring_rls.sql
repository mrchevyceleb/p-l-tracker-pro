-- Check if recurring_series exists and fix RLS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recurring_series') THEN
    -- Enable RLS
    ALTER TABLE recurring_series ENABLE ROW LEVEL SECURITY;
    ALTER TABLE recurring_series FORCE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "recurring_select" ON recurring_series;
    DROP POLICY IF EXISTS "recurring_insert" ON recurring_series;
    DROP POLICY IF EXISTS "recurring_update" ON recurring_series;
    DROP POLICY IF EXISTS "recurring_delete" ON recurring_series;
    
    -- Create policies
    CREATE POLICY "recurring_select" ON recurring_series FOR SELECT TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "recurring_insert" ON recurring_series FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "recurring_update" ON recurring_series FOR UPDATE TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "recurring_delete" ON recurring_series FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- Also grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
