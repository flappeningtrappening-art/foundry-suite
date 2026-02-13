-- FIX: CASE DOCUMENTS RLS POLICIES
-- Run this in Supabase SQL Editor to allow direct uploads from Realty/Outreach.

-- 1. Ensure RLS is enabled
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can insert their own documents" ON case_documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON case_documents;

-- 3. Create permissive but secure policies
-- Allow users to see any document they own
CREATE POLICY "Users can view their own documents"
    ON case_documents FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert documents they own (even if case_id is null)
CREATE POLICY "Users can insert their own documents"
    ON case_documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow deletion
CREATE POLICY "Users can delete their own documents"
    ON case_documents FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Enable Service Role (for the background agents)
CREATE POLICY "Service role can do everything"
    ON case_documents FOR ALL
    USING (auth.role() = 'service_role');
