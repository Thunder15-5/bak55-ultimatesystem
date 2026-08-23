-- Session Management Tables
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  device_info jsonb,
  ip_address text,
  user_agent text,
  status text DEFAULT 'active',
  created_at timestamp DEFAULT now(),
  last_activity timestamp DEFAULT now(),
  expires_at timestamp,
  revoked_at timestamp
);

-- Role Management Tables
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  role text NOT NULL,
  permissions text[] DEFAULT ARRAY[]::text[],
  assigned_at timestamp DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Account Suspension Tables
CREATE TABLE IF NOT EXISTS account_suspensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  reason text NOT NULL,
  suspended_at timestamp DEFAULT now(),
  resume_date timestamp,
  resumed_at timestamp,
  notes text,
  suspended_by text,
  UNIQUE(user_id) WHERE resumed_at IS NULL
);

-- Notification Tables
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id),
  email_on_follow boolean DEFAULT true,
  email_on_message boolean DEFAULT true,
  email_on_like boolean DEFAULT true,
  email_on_comment boolean DEFAULT true,
  email_marketing boolean DEFAULT false,
  push_notifications boolean DEFAULT true,
  notification_frequency text DEFAULT 'immediate',
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  type text NOT NULL,
  title text NOT NULL,
  message text,
  related_user_id uuid REFERENCES auth.users(id),
  related_entity_id uuid,
  read boolean DEFAULT false,
  read_at timestamp,
  created_at timestamp DEFAULT now(),
  expires_at timestamp DEFAULT now() + interval '30 days'
);

-- Audit Logging Tables
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  changes jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  event_type text NOT NULL,
  ip_address text,
  user_agent text,
  success boolean DEFAULT true,
  metadata jsonb,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id text NOT NULL,
  action text NOT NULL,
  target_user_id uuid REFERENCES auth.users(id),
  metadata jsonb,
  created_at timestamp DEFAULT now()
);

-- GDPR Compliance Tables
CREATE TABLE IF NOT EXISTS data_export_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  data_types text[] NOT NULL,
  format text DEFAULT 'json',
  status text DEFAULT 'pending',
  file_url text,
  requested_at timestamp DEFAULT now(),
  completed_at timestamp,
  expires_at timestamp
);

CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  status text DEFAULT 'pending',
  requested_at timestamp DEFAULT now(),
  grace_period_ends_at timestamp,
  executed_at timestamp
);

CREATE TABLE IF NOT EXISTS compliance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  event_type text NOT NULL,
  metadata jsonb,
  created_at timestamp DEFAULT now()
);

-- Security Monitoring Tables
CREATE TABLE IF NOT EXISTS security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  event_type text NOT NULL,
  severity text NOT NULL,
  description text,
  ip_address text,
  user_agent text,
  metadata jsonb,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS security_vulnerabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  severity text NOT NULL,
  status text DEFAULT 'active',
  remediation text,
  discovered_at timestamp DEFAULT now(),
  resolved_at timestamp
);

CREATE TABLE IF NOT EXISTS user_security_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id),
  email_verified boolean DEFAULT false,
  two_factor_enabled boolean DEFAULT false,
  suspicious_login_attempts integer DEFAULT 0,
  inactive_sessions integer DEFAULT 0,
  password_last_changed_days integer DEFAULT 0,
  updated_at timestamp DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_status ON user_sessions(status);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_account_suspensions_user_id ON account_suspensions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_user_id ON auth_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);

-- Enable RLS (Row Level Security)
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own export requests" ON data_export_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own deletion requests" ON data_deletion_requests
  FOR SELECT USING (auth.uid() = user_id);
