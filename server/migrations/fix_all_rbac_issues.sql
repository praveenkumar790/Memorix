-- COMPREHENSIVE RBAC FIX MIGRATION
-- Run this SINGLE migration in Supabase SQL Editor to fix all RBAC issues
-- This script is idempotent (safe to run multiple times)

-- ============================================
-- 1. FIX PROFILES TABLE: Remove old role constraint
-- ============================================
-- The old profiles.role column has a CHECK constraint that blocks profile creation
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ALTER COLUMN role DROP NOT NULL;

-- ============================================
-- 2. FIX ROLES TABLE: Allow role creation during signup
-- ============================================
-- The existing INSERT policy blocks role creation because user has no profile yet
DROP POLICY IF EXISTS "Users can create roles in their company" ON roles;
DROP POLICY IF EXISTS "Authenticated users can create roles" ON roles;

-- Create a permissive policy for role creation during signup
CREATE POLICY "Authenticated users can create roles" 
  ON roles FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Keep the SELECT policy restrictive (users can only view their company's roles)
-- But first ensure it exists
DROP POLICY IF EXISTS "Users can view roles in their company" ON roles;
CREATE POLICY "Users can view roles in their company" 
  ON roles FOR SELECT 
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
    OR
    -- Allow users without profile yet (during signup) to still look up roles
    NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
  );

-- ============================================
-- 3. FIX COMPANIES TABLE: Ensure authenticated users can create companies
-- ============================================
DROP POLICY IF EXISTS "Allow all authenticated operations" ON companies;
CREATE POLICY "Allow all authenticated operations" ON companies 
  FOR ALL 
  TO authenticated
  USING (true) 
  WITH CHECK (true);

-- ============================================
-- 4. FIX PROFILES TABLE: Ensure profile creation works
-- ============================================
DROP POLICY IF EXISTS "Allow all authenticated operations" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Allow users to insert their own profile (id must match auth.uid())
CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT 
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT 
  TO authenticated
  USING (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE 
  TO authenticated
  USING (id = auth.uid());

-- ============================================
-- 5. VERIFY: Check that roles table exists
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, name)
);

-- Ensure RLS is enabled
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. ENSURE role_id column exists on profiles
-- ============================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id);

-- ============================================
-- 7. FIX DOCUMENTS TABLE: Enforce role-based visibility
-- ============================================
-- Ensure role_id column exists on documents
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id);

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all authenticated operations" ON documents;
DROP POLICY IF EXISTS "Users can view company documents" ON documents;
DROP POLICY IF EXISTS "Users can view documents from their role" ON documents;
DROP POLICY IF EXISTS "Users can insert documents in their role" ON documents;

-- Create policy: Users can only VIEW documents that match their role_id
CREATE POLICY "Users can view documents from their role" 
  ON documents FOR SELECT 
  TO authenticated
  USING (
    -- Check if user belongs to the same company
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
    AND (
      -- Check if document's role matches user's role
      role_id IN (
        SELECT role_id FROM profiles WHERE id = auth.uid()
      )
      OR role_id IS NULL  -- Allow access to documents without role (legacy)
    )
  );

-- Create policy: Users can INSERT documents (role_id set by backend)
CREATE POLICY "Users can insert documents in their role" 
  ON documents FOR INSERT 
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================
-- 8. FIX DECISIONS TABLE: Add role_id and enforce role-based visibility
-- ============================================
-- Ensure role_id column exists on decisions
ALTER TABLE decisions 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id);

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all authenticated operations" ON decisions;
DROP POLICY IF EXISTS "Users can view decisions from their role" ON decisions;
DROP POLICY IF EXISTS "Users can insert decisions in their role" ON decisions;

-- Enable RLS on decisions
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only VIEW decisions that match their role_id
CREATE POLICY "Users can view decisions from their role" 
  ON decisions FOR SELECT 
  TO authenticated
  USING (
    -- Check if user belongs to the same company
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
    AND (
      -- Check if decision's role matches user's role
      role_id IN (
        SELECT role_id FROM profiles WHERE id = auth.uid()
      )
      OR role_id IS NULL  -- Allow access to decisions without role (legacy)
    )
  );

-- Create policy: Users can INSERT decisions (role_id set by backend)
CREATE POLICY "Users can insert decisions in their role" 
  ON decisions FOR INSERT 
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================
-- DONE! You can now sign up users with roles.
-- ============================================
