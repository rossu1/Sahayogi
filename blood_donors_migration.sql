-- Blood Donors table
CREATE TABLE IF NOT EXISTS blood_donors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  blood_type TEXT NOT NULL CHECK (
    blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
  ),
  lat FLOAT8 NOT NULL,
  lng FLOAT8 NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  last_donated_at TIMESTAMPTZ,
  phone TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE blood_donors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read available donors"
  ON blood_donors FOR SELECT
  USING (is_available = TRUE);

CREATE POLICY "Authenticated users can register as donor"
  ON blood_donors FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Donors can update own record"
  ON blood_donors FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_blood_donors_type ON blood_donors(blood_type);
CREATE INDEX idx_blood_donors_available ON blood_donors(is_available) WHERE is_available = TRUE;
CREATE INDEX idx_blood_donors_lat_lng ON blood_donors(lat, lng);
