-- YOKOTEN: SHARED TRUTH VAULT
-- This table enables horizontal intelligence deployment across all THE FOUNDRY and SPECTRE agents.
-- Once a fact is verified by one agent, it is accessible to all others, eliminating Muda (waste).

CREATE TABLE IF NOT EXISTS shared_intelligence_vault (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES analysis_cases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    -- Metadata on the finding
    finding_type TEXT NOT NULL, -- e.g., 'fact', 'contradiction', 'anomaly', 'entity_profile'
    source_agent TEXT NOT NULL, -- e.g., 'INTEL', 'X', 'REALTY', 'OUTREACH'
    
    -- The Core Finding
    content TEXT NOT NULL,
    confidence_score FLOAT DEFAULT 1.0, -- Normalized 0.0 to 1.0
    
    -- Evidence & Grounding (Yokoten context)
    citations JSONB DEFAULT '[]', -- List of {file_name, page, snippet}
    tags TEXT[] DEFAULT '{}', -- e.g., {'financial', 'timeline', 'high-risk'}
    
    -- 3M Optimization Tracking
    muda_flag BOOLEAN DEFAULT FALSE, -- Flagged for review as redundant
    is_verified BOOLEAN DEFAULT FALSE, -- Verified by Jidoka (human-in-the-loop)
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FORENSIC AUDIT LOGS
-- This table stores the complete agentic debate (Prosecutor/Skeptic/Judge)
CREATE TABLE IF NOT EXISTS forensic_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Enable RLS
ALTER TABLE shared_intelligence_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE forensic_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies (Shared Intelligence Vault)
CREATE POLICY "Users can view their own case intelligence" 
    ON shared_intelligence_vault FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own case intelligence" 
    ON shared_intelligence_vault FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR (auth.role() = 'service_role'));

-- Policies (Forensic Audit Logs)
CREATE POLICY "Users can view their own audit logs"
    ON forensic_audit_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own audit logs"
    ON forensic_audit_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id OR (auth.role() = 'service_role'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shared_intel_case_id ON shared_intelligence_vault(case_id);
CREATE INDEX IF NOT EXISTS idx_shared_intel_tags ON shared_intelligence_vault USING GIN(tags);
