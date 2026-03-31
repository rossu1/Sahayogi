-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'public' CHECK (role IN ('public', 'responder', 'admin')),
  qualification TEXT NOT NULL DEFAULT 'none' CHECK (
    qualification IN ('doctor', 'nurse', 'medical_student', 'anm', 'first_aid_trained', 'none')
  ),
  is_active_responder BOOLEAN NOT NULL DEFAULT FALSE,
  current_lat FLOAT8,
  current_lng FLOAT8,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  language_preference TEXT NOT NULL DEFAULT 'ne' CHECK (language_preference IN ('ne', 'en')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('health', 'police', 'fire', 'earthquake')),
  reported_by UUID REFERENCES users(id),
  lat FLOAT8 NOT NULL,
  lng FLOAT8 NOT NULL,
  landmark_description TEXT DEFAULT '',
  situation_summary TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
  responder_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Responses table
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id),
  responder_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted', 'rejected', 'completed')),
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  arrived_at TIMESTAMPTZ
);

-- Police alerts table
CREATE TABLE IF NOT EXISTS police_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID REFERENCES incidents(id),
  reporter_id UUID REFERENCES users(id),
  lat FLOAT8 NOT NULL,
  lng FLOAT8 NOT NULL,
  alert_type TEXT NOT NULL CHECK (
    alert_type IN ('fight', 'theft', 'harassment', 'suspicious', 'other')
  ),
  is_live_tracking BOOLEAN NOT NULL DEFAULT TRUE,
  tracking_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE police_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Allow insert on signup"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow responders to read location of other active responders
CREATE POLICY "Read active responders"
  ON users FOR SELECT
  USING (is_active_responder = TRUE);

-- RLS Policies for incidents
CREATE POLICY "Anyone can read active incidents"
  ON incidents FOR SELECT
  USING (status = 'active');

CREATE POLICY "Authenticated users can insert incidents"
  ON incidents FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Reporter can update own incident"
  ON incidents FOR UPDATE
  USING (auth.uid() = reported_by);

-- RLS Policies for responses
CREATE POLICY "Responders can read responses"
  ON responses FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Responders can insert responses"
  ON responses FOR INSERT
  WITH CHECK (auth.uid() = responder_id);

CREATE POLICY "Responders can update own responses"
  ON responses FOR UPDATE
  USING (auth.uid() = responder_id);

-- RLS Policies for police_alerts
CREATE POLICY "Anon can insert police alerts"
  ON police_alerts FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Anon can read police alerts by token"
  ON police_alerts FOR SELECT
  USING (TRUE);

CREATE POLICY "Reporter can update own alert"
  ON police_alerts FOR UPDATE
  USING (auth.uid() = reporter_id);

-- Indexes for performance
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_lat_lng ON incidents(lat, lng);
CREATE INDEX idx_users_active_responder ON users(is_active_responder) WHERE is_active_responder = TRUE;
CREATE INDEX idx_police_alerts_token ON police_alerts(tracking_token);
CREATE INDEX idx_responses_incident ON responses(incident_id);

-- Enable Realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE responses;
ALTER PUBLICATION supabase_realtime ADD TABLE police_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
