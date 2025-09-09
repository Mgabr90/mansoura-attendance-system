-- Database initialization script for Mansoura CIH Telegram Attendance System
-- This script sets up the database with proper permissions and extensions

-- Set timezone for the database
SET timezone = 'Africa/Cairo';

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Grant permissions to the database user
GRANT USAGE ON SCHEMA public TO postgres;
GRANT CREATE ON SCHEMA public TO postgres;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO postgres;

-- Create indexes that might be useful but aren't created by Prisma
-- Note: Most indexes will be created by Prisma migrations, but these are additional ones for performance

-- Index for efficient telegram ID lookups
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_telegram_id_active ON employees(telegram_id) WHERE is_active = true;

-- Index for attendance records by date
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_records_date ON attendance_records(date);

-- Index for attendance records by employee and date (for quick employee lookups)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_records_employee_date ON attendance_records(employee_id, date);

-- Composite index for invitation status and expiration
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_invitations_status_expires ON employee_invitations(status, expires_at) WHERE status = 'PENDING';

-- Notification logs by date for cleanup
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);

-- Server activity logs by timestamp
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_server_activities_timestamp ON server_activities(timestamp);

-- Conversation states by expiration for cleanup
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_states_expires ON conversation_states(expires_at);

-- Comment to indicate this script has run
COMMENT ON SCHEMA public IS 'Mansoura CIH Telegram Attendance System - Database initialized';

-- Log the initialization
INSERT INTO server_activities (type, message, metadata, timestamp)
VALUES (
    'database',
    'Database initialization script executed',
    '{"script": "init-db.sql", "version": "2.0.0"}',
    CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;