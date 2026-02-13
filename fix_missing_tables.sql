-- FIX: MISSING FORENSIC TABLES
-- Run this in the Supabase SQL Editor to enable the audit trail.

-- 1. Create the Forensic Audit Logs Table
CREATE TABLE IF NOT EXISTS forensic_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    case_id UUID REFERENCES analysis_cases(id) ON DELETE CASCADE,
    query TEXT,
    prosecutor_findings TEXT,
    skeptic_critique TEXT,
    final_report TEXT,
    citations JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE forensic_audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Allows users to see their own logs
DROP POLICY IF EXISTS "Users can view their own audit logs" ON forensic_audit_logs;
CREATE POLICY "Users can view their own audit logs"
    ON forensic_audit_logs FOR SELECT
    USING (auth.uid() = user_id);

-- Allows the system/app to save logs (including via service role)
DROP POLICY IF EXISTS "Users can insert their own audit logs" ON forensic_audit_logs;
CREATE POLICY "Users can insert their own audit logs"
    ON forensic_audit_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id OR (auth.role() = 'service_role'));

-- 4. Verify/Fix Shared Intelligence Vault (Double check)
CREATE TABLE IF NOT EXISTS shared_intelligence_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES analysis_cases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    finding_type TEXT NOT NULL,
    source_agent TEXT NOT NULL,
    content TEXT NOT NULL,
    confidence_score FLOAT DEFAULT 1.0,
    citations JSONB DEFAULT '[]',
    tags TEXT[] DEFAULT '{}',
    muda_flag BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shared_intelligence_vault ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own case intelligence" ON shared_intelligence_vault;
CREATE POLICY "Users can view their own case intelligence" 
    ON shared_intelligence_vault FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own case intelligence" ON shared_intelligence_vault;
CREATE POLICY "Users can insert their own case intelligence" 
    ON shared_intelligence_vault FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR (auth.role() = 'service_role'));
