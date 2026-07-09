-- Migration to fix integrations table column collision
-- The 'integrations' table already had a 'workspace_id' column (text) used for the external provider's workspace ID.
-- We need to rename that to 'external_workspace_id' and add the proper 'workspace_id' for Memorix workspaces.

-- 1. Rename the existing workspace_id column
ALTER TABLE integrations RENAME COLUMN workspace_id TO external_workspace_id;

-- 2. Add the proper workspace_id referencing Memorix workspaces
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- 3. Update the RLS policies to use the correct workspace_id
DROP POLICY IF EXISTS "Users can view integrations in their workspace" ON integrations;
CREATE POLICY "Users can view integrations in their workspace"
  ON integrations FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert integrations in their workspace" ON integrations;
CREATE POLICY "Users can insert integrations in their workspace"
  ON integrations FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update integrations in their workspace" ON integrations;
CREATE POLICY "Users can update integrations in their workspace"
  ON integrations FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- 4. Recreate the index
DROP INDEX IF EXISTS idx_integrations_workspace;
CREATE INDEX idx_integrations_workspace ON integrations(workspace_id);
