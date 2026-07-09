-- Migration: Fix the Foundation (Data Model)
-- Shift from role-based access control to workspace-scoped isolation.
-- This script should be run in the Supabase SQL Editor.

-- 1. Create the workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('personal', 'team')),
  invite_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Update profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
-- Keep role_id for historical purposes, but we won't use it for RLS anymore.

-- 3. Update core tables to include workspace_id
ALTER TABLE documents ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
-- Handle integrations table collision: rename existing text column before adding the UUID one
DO $$ 
BEGIN
  -- Only rename if the column exists and is of type TEXT (the old Notion/Slack ID)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='integrations' AND column_name='workspace_id' AND data_type='text'
  ) THEN
    ALTER TABLE integrations RENAME COLUMN workspace_id TO external_workspace_id;
  END IF;
END $$;
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- 4. Enable RLS on workspaces
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for workspaces
DROP POLICY IF EXISTS "Users can view their workspaces" ON workspaces;
CREATE POLICY "Users can view their workspaces"
  ON workspaces FOR SELECT
  USING (
    id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()) OR
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- Allow authenticated users to insert workspaces (needed for signup)
DROP POLICY IF EXISTS "Users can create workspaces" ON workspaces;
CREATE POLICY "Users can create workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 6. Update RLS for profiles
DROP POLICY IF EXISTS "Users can view profiles in their company" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles in their company/workspace" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- 7. Update RLS for documents
DROP POLICY IF EXISTS "Users can view documents from their role" ON documents;
DROP POLICY IF EXISTS "Users can insert documents in their role" ON documents;
DROP POLICY IF EXISTS "Users can view documents from their company" ON documents;
DROP POLICY IF EXISTS "Users can view documents in their workspace" ON documents;
DROP POLICY IF EXISTS "Users can insert documents in their workspace" ON documents;

CREATE POLICY "Users can view documents in their workspace"
  ON documents FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert documents in their workspace"
  ON documents FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- 8. Update RLS for decisions
DROP POLICY IF EXISTS "Users can view decisions from their role" ON decisions;
DROP POLICY IF EXISTS "Users can insert decisions in their role" ON decisions;
DROP POLICY IF EXISTS "Users can view decisions from their company" ON decisions;
DROP POLICY IF EXISTS "Users can view decisions in their workspace" ON decisions;
DROP POLICY IF EXISTS "Users can insert decisions in their workspace" ON decisions;

CREATE POLICY "Users can view decisions in their workspace"
  ON decisions FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert decisions in their workspace"
  ON decisions FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- 9. Update RLS for chats
DROP POLICY IF EXISTS "Users can view chats from their company" ON chats;
DROP POLICY IF EXISTS "Users can insert chats" ON chats;
DROP POLICY IF EXISTS "Users can view chats in their workspace" ON chats;
DROP POLICY IF EXISTS "Users can insert chats in their workspace" ON chats;

CREATE POLICY "Users can view chats in their workspace"
  ON chats FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert chats in their workspace"
  ON chats FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- 10. Update RLS for integrations
DROP POLICY IF EXISTS "Users can view integrations in their company" ON integrations;
DROP POLICY IF EXISTS "Users can insert integrations" ON integrations;
DROP POLICY IF EXISTS "Users can view integrations in their workspace" ON integrations;
DROP POLICY IF EXISTS "Users can insert integrations in their workspace" ON integrations;

CREATE POLICY "Users can view integrations in their workspace"
  ON integrations FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert integrations in their workspace"
  ON integrations FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- 11. Create helper index for performance
CREATE INDEX IF NOT EXISTS idx_documents_workspace ON documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_decisions_workspace ON decisions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_chats_workspace ON chats(workspace_id);
CREATE INDEX IF NOT EXISTS idx_integrations_workspace ON integrations(workspace_id);
