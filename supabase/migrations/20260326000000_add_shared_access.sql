-- Shared access table for view-only users (e.g. accountants)
CREATE TABLE IF NOT EXISTS shared_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewer_email TEXT NOT NULL,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'view' CHECK (role IN ('view')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shared_access ADD CONSTRAINT unique_share UNIQUE (owner_id, viewer_email);

-- RLS on shared_access
ALTER TABLE shared_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their shares" ON shared_access
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Viewers can see their access" ON shared_access
  FOR SELECT USING (
    auth.uid() = viewer_id
    OR viewer_email = (auth.jwt() ->> 'email')
  );

-- Allow shared viewers to SELECT transactions of the owner
CREATE POLICY "Shared viewers can view owner transactions" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shared_access
      WHERE shared_access.owner_id = transactions.user_id
        AND shared_access.role = 'view'
        AND (
          shared_access.viewer_id = auth.uid()
          OR shared_access.viewer_email = (auth.jwt() ->> 'email')
        )
    )
  );

-- Allow shared viewers to SELECT categories of the owner
CREATE POLICY "Shared viewers can view owner categories" ON categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shared_access
      WHERE shared_access.owner_id = categories.user_id
        AND shared_access.role = 'view'
        AND (
          shared_access.viewer_id = auth.uid()
          OR shared_access.viewer_email = (auth.jwt() ->> 'email')
        )
    )
  );

-- Auto-link viewer_id when a user signs up with a matching email
CREATE OR REPLACE FUNCTION link_shared_access_viewer()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE shared_access
  SET viewer_id = NEW.id
  WHERE viewer_email = NEW.email AND viewer_id IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_link_share ON auth.users;
CREATE TRIGGER on_auth_user_created_link_share
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION link_shared_access_viewer();
