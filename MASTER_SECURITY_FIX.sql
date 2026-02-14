-- THE FOUNDRY | DATABASE SECURITY & PERFORMANCE OVERHAUL (v1.7)
-- Addressing Supabase Security Alerts and RLS Performance Bottlenecks

-- 1. MOVE EXTENSIONS TO DEDICATED SCHEMA
-- This improves security by keeping extensions out of the public schema
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 2. OPTIMIZE RLS POLICIES (Subquery Wrapper Pattern)
-- Using (select auth.uid()) prevents re-evaluation per row, drastically improving performance at scale.

-- analysis_findings
ALTER TABLE public.analysis_findings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view findings for own cases" ON public.analysis_findings;
CREATE POLICY "Users view findings for own cases" ON public.analysis_findings 
FOR SELECT USING (user_id = (select auth.uid()));

-- document_sections
ALTER TABLE public.document_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own document sections" ON public.document_sections;
CREATE POLICY "Users can view own document sections" ON public.document_sections 
FOR SELECT USING (user_id = (select auth.uid()));

-- subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users can view own subscription" ON public.subscriptions;
CREATE POLICY "users can view own subscription" ON public.subscriptions 
FOR SELECT USING (user_id = (select auth.uid()));

-- usage_logs
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_logs;
CREATE POLICY "Users can view own usage" ON public.usage_logs 
FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own usage" ON public.usage_logs;
CREATE POLICY "Users can insert own usage" ON public.usage_logs 
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- case_documents
ALTER TABLE public.case_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Foundry User Access" ON public.case_documents;
CREATE POLICY "Foundry User Access" ON public.case_documents 
FOR ALL USING (
    (user_id = (select auth.uid())) OR 
    (auth.role() = (select 'service_role'))
);

-- forensic_audit_logs
ALTER TABLE public.forensic_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.forensic_audit_logs;
CREATE POLICY "Users can view their own audit logs" ON public.forensic_audit_logs 
FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own audit logs" ON public.forensic_audit_logs;
CREATE POLICY "Users can insert their own audit logs" ON public.forensic_audit_logs 
FOR INSERT WITH CHECK (
    (user_id = (select auth.uid())) OR 
    (auth.role() = (select 'service_role'))
);

-- shared_intelligence_vault
ALTER TABLE public.shared_intelligence_vault ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own case intelligence" ON public.shared_intelligence_vault;
CREATE POLICY "Users can view their own case intelligence" ON public.shared_intelligence_vault 
FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own case intelligence" ON public.shared_intelligence_vault;
CREATE POLICY "Users can insert their own case intelligence" ON public.shared_intelligence_vault 
FOR INSERT WITH CHECK (
    (user_id = (select auth.uid())) OR 
    (auth.role() = (select 'service_role'))
);

-- 3. REMINDER: LEAKED PASSWORD PROTECTION
-- Note: 'Leaked Password Protection' must be enabled manually in the Supabase Dashboard:
-- Authentication -> Settings -> Password Protection -> Check "Prevent the use of compromised passwords"
