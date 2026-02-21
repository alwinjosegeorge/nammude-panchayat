-- ============================================================
-- NAMMUDE PANCHAYAT — AUTOMATION UPGRADE MIGRATION
-- ============================================================
-- SAFE FOR PRODUCTION: Uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
-- Does NOT modify or delete any existing columns
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ============================================================
-- PART 1: NEW COLUMNS ON report_issue
-- ============================================================

-- 1A. Timestamp fields for automatic status tracking
ALTER TABLE report_issue ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE report_issue ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE report_issue ADD COLUMN IF NOT EXISTS last_status_update_at TIMESTAMPTZ DEFAULT NOW();

-- 1B. Escalation fields
ALTER TABLE report_issue ADD COLUMN IF NOT EXISTS is_delayed BOOLEAN DEFAULT FALSE;
ALTER TABLE report_issue ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT FALSE;

-- 1C. Priority fields (auto-calculated, replaces manual urgency)
ALTER TABLE report_issue ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0;
ALTER TABLE report_issue ADD COLUMN IF NOT EXISTS priority_level TEXT DEFAULT 'Low';

-- 1D. Duplicate detection / support count
ALTER TABLE report_issue ADD COLUMN IF NOT EXISTS support_count INTEGER DEFAULT 0;

-- 1E. Resolution time
ALTER TABLE report_issue ADD COLUMN IF NOT EXISTS resolution_time_hours NUMERIC;

-- 1F. Worker assignment (FK added after workers table is created)
ALTER TABLE report_issue ADD COLUMN IF NOT EXISTS assigned_worker_id UUID;

-- Backfill last_status_update_at for existing records
UPDATE report_issue 
SET last_status_update_at = updated_at 
WHERE last_status_update_at IS NULL;

-- ============================================================
-- PART 2: WORKERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    ward TEXT,
    category_specialization TEXT NOT NULL,  -- matches report category e.g. 'brokenRoad', 'waterLeak'
    workload_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on workers table
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

-- Admin can read/write workers
CREATE POLICY IF NOT EXISTS "Admins can manage workers" 
ON workers FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
    )
);

-- Teams can view workers
CREATE POLICY IF NOT EXISTS "Teams can view workers" 
ON workers FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM teams WHERE teams.user_id = auth.uid()
    )
);

-- ============================================================
-- PART 3: FOREIGN KEY (safe, ON DELETE SET NULL)
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_report_issue_worker'
    ) THEN
        ALTER TABLE report_issue 
        ADD CONSTRAINT fk_report_issue_worker 
        FOREIGN KEY (assigned_worker_id) 
        REFERENCES workers(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================
-- PART 4: INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_report_issue_status ON report_issue(status);
CREATE INDEX IF NOT EXISTS idx_report_issue_category ON report_issue(category);
CREATE INDEX IF NOT EXISTS idx_report_issue_priority ON report_issue(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_report_issue_escalation ON report_issue(is_delayed, is_critical);
CREATE INDEX IF NOT EXISTS idx_report_issue_location ON report_issue(lat, lng);
CREATE INDEX IF NOT EXISTS idx_report_issue_last_update ON report_issue(last_status_update_at);
CREATE INDEX IF NOT EXISTS idx_report_issue_worker ON report_issue(assigned_worker_id);
CREATE INDEX IF NOT EXISTS idx_workers_ward_category ON workers(ward, category_specialization);
CREATE INDEX IF NOT EXISTS idx_workers_workload ON workers(workload_count);

-- ============================================================
-- PART 5: DATABASE FUNCTIONS
-- ============================================================

-- 5A. ESCALATION CHECK
-- Marks complaints as delayed (>48h) or critical (>7 days)
-- Can be called by pg_cron or from the client
CREATE OR REPLACE FUNCTION check_escalation()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    affected_count INTEGER := 0;
    now_ts TIMESTAMPTZ := NOW();
BEGIN
    -- Mark as delayed: no update in 48 hours, not yet resolved/closed/completed
    UPDATE report_issue
    SET 
        is_delayed = TRUE,
        updated_at = now_ts
    WHERE 
        is_delayed = FALSE
        AND status NOT IN ('resolved', 'closed', 'completed')
        AND last_status_update_at < now_ts - INTERVAL '48 hours';
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;

    -- Mark as critical: no update in 7 days
    UPDATE report_issue
    SET 
        is_critical = TRUE,
        updated_at = now_ts
    WHERE 
        is_critical = FALSE
        AND status NOT IN ('resolved', 'closed', 'completed')
        AND last_status_update_at < now_ts - INTERVAL '7 days';

    RETURN affected_count;
END;
$$;

-- 5B. PRIORITY CALCULATION
-- Score = category_weight + severity_weight + (support_count * 2) + (days_pending * 1.5)
CREATE OR REPLACE FUNCTION calculate_priority(report_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rec RECORD;
    cat_weight INTEGER;
    sev_weight INTEGER;
    days_pending NUMERIC;
    score NUMERIC;
    level TEXT;
BEGIN
    SELECT * INTO rec FROM report_issue WHERE id = report_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Report not found');
    END IF;

    -- Category weights
    cat_weight := CASE rec.category
        WHEN 'waterLeak' THEN 5
        WHEN 'electricity' THEN 5
        WHEN 'drainage' THEN 4
        WHEN 'brokenRoad' THEN 4
        WHEN 'streetlight' THEN 3
        WHEN 'garbage' THEN 3
        WHEN 'publicProperty' THEN 2
        WHEN 'other' THEN 1
        ELSE 1
    END;

    -- Severity/urgency weight
    sev_weight := CASE rec.urgency
        WHEN 'urgent' THEN 5
        WHEN 'high' THEN 3
        WHEN 'normal' THEN 1
        ELSE 1
    END;

    -- Days since creation
    days_pending := EXTRACT(EPOCH FROM (NOW() - rec.created_at)) / 86400.0;

    -- Calculate score
    score := cat_weight + sev_weight + (COALESCE(rec.support_count, 0) * 2) + (days_pending * 1.5);

    -- Determine level
    level := CASE
        WHEN score >= 13 THEN 'High'
        WHEN score >= 6 THEN 'Medium'
        ELSE 'Low'
    END;

    -- Update the record
    UPDATE report_issue 
    SET 
        priority_score = ROUND(score),
        priority_level = level,
        updated_at = NOW()
    WHERE id = report_id;

    RETURN jsonb_build_object(
        'score', ROUND(score),
        'level', level,
        'category_weight', cat_weight,
        'severity_weight', sev_weight,
        'support_count', COALESCE(rec.support_count, 0),
        'days_pending', ROUND(days_pending::numeric, 1)
    );
END;
$$;

-- 5C. DUPLICATE DETECTION (Haversine formula)
-- Returns the existing record if a duplicate is found within 100m, same category, still open
CREATE OR REPLACE FUNCTION find_duplicate(
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_category TEXT
)
RETURNS TABLE(
    duplicate_id UUID,
    duplicate_tracking_id TEXT,
    duplicate_title TEXT,
    distance_meters DOUBLE PRECISION,
    current_support_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ri.id,
        ri.tracking_id,
        ri.title,
        (
            6371000 * ACOS(
                LEAST(1.0, 
                    COS(RADIANS(p_lat)) * COS(RADIANS(ri.lat)) *
                    COS(RADIANS(ri.lng) - RADIANS(p_lng)) +
                    SIN(RADIANS(p_lat)) * SIN(RADIANS(ri.lat))
                )
            )
        ) AS distance_meters,
        COALESCE(ri.support_count, 0) AS current_support_count
    FROM report_issue ri
    WHERE 
        ri.category = p_category
        AND ri.status NOT IN ('resolved', 'closed', 'completed')
        AND ri.lat IS NOT NULL 
        AND ri.lng IS NOT NULL
        AND (
            6371000 * ACOS(
                LEAST(1.0, 
                    COS(RADIANS(p_lat)) * COS(RADIANS(ri.lat)) *
                    COS(RADIANS(ri.lng) - RADIANS(p_lng)) +
                    SIN(RADIANS(p_lat)) * SIN(RADIANS(ri.lat))
                )
            )
        ) <= 100  -- within 100 meters
    ORDER BY distance_meters ASC
    LIMIT 1;
END;
$$;

-- 5D. INCREMENT SUPPORT COUNT (for duplicate support)
CREATE OR REPLACE FUNCTION increment_support(p_report_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE report_issue
    SET 
        support_count = COALESCE(support_count, 0) + 1,
        updated_at = NOW()
    WHERE id = p_report_id;

    -- Recalculate priority after support count changes
    PERFORM calculate_priority(p_report_id);
END;
$$;

-- 5E. AUTO ASSIGN WORKER
-- Finds the best worker: same ward, same category, lowest workload
CREATE OR REPLACE FUNCTION auto_assign_worker(p_report_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rec RECORD;
    worker_rec RECORD;
    report_ward TEXT;
BEGIN
    SELECT * INTO rec FROM report_issue WHERE id = p_report_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Report not found');
    END IF;

    -- Extract ward from panchayat (use panchayat as ward identifier)
    report_ward := rec.panchayat;

    -- Find best matching worker
    -- Priority: 1. Same ward + same category (lowest workload)
    --           2. Same category only (lowest workload)
    SELECT * INTO worker_rec
    FROM workers
    WHERE 
        is_active = TRUE
        AND category_specialization = rec.category
    ORDER BY 
        (CASE WHEN ward = report_ward THEN 0 ELSE 1 END),
        workload_count ASC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'No available worker found for this category');
    END IF;

    -- Assign the worker
    UPDATE report_issue
    SET 
        assigned_worker_id = worker_rec.id,
        assigned_at = NOW(),
        last_status_update_at = NOW(),
        status = 'inProgress',
        updated_at = NOW()
    WHERE id = p_report_id;

    -- Increment worker workload
    UPDATE workers
    SET 
        workload_count = workload_count + 1,
        updated_at = NOW()
    WHERE id = worker_rec.id;

    -- Recalculate priority
    PERFORM calculate_priority(p_report_id);

    RETURN jsonb_build_object(
        'worker_id', worker_rec.id,
        'worker_name', worker_rec.name,
        'worker_email', worker_rec.email,
        'status', 'assigned'
    );
END;
$$;

-- 5F. CALCULATE RESOLUTION TIME
-- Called when status becomes 'completed' or 'resolved'
CREATE OR REPLACE FUNCTION calculate_resolution_time(p_report_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rec RECORD;
    hours NUMERIC;
BEGIN
    SELECT * INTO rec FROM report_issue WHERE id = p_report_id;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    hours := EXTRACT(EPOCH FROM (COALESCE(rec.completed_at, NOW()) - rec.created_at)) / 3600.0;

    UPDATE report_issue
    SET 
        resolution_time_hours = ROUND(hours, 2),
        updated_at = NOW()
    WHERE id = p_report_id;

    RETURN ROUND(hours, 2);
END;
$$;

-- 5G. BATCH PRIORITY RECALCULATION
-- Recalculates priority for all open complaints (for scheduled runs)
CREATE OR REPLACE FUNCTION recalculate_all_priorities()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rec RECORD;
    count INTEGER := 0;
BEGIN
    FOR rec IN 
        SELECT id FROM report_issue 
        WHERE status NOT IN ('resolved', 'closed', 'completed')
    LOOP
        PERFORM calculate_priority(rec.id);
        count := count + 1;
    END LOOP;
    
    RETURN count;
END;
$$;

-- ============================================================
-- PART 6: OPTIONAL pg_cron SCHEDULING
-- ============================================================
-- Uncomment and run these ONLY if pg_cron extension is available:
--
-- SELECT cron.schedule(
--     'escalation-check',      -- job name
--     '0 */6 * * *',           -- every 6 hours
--     'SELECT check_escalation()'
-- );
--
-- SELECT cron.schedule(
--     'priority-recalc',       -- job name
--     '0 */12 * * *',          -- every 12 hours
--     'SELECT recalculate_all_priorities()'
-- );

-- ============================================================
-- PART 7: GRANT EXECUTE PERMISSIONS FOR RPC
-- ============================================================
-- These allow anon/authenticated users to call the functions via supabase.rpc(...)

GRANT EXECUTE ON FUNCTION check_escalation TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_priority(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION find_duplicate(DOUBLE PRECISION, DOUBLE PRECISION, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_support(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auto_assign_worker(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_resolution_time(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_all_priorities TO authenticated;

-- ============================================================
-- DONE! Migration complete.
-- ============================================================
