export type Language = 'ne' | 'en';

export type UserRole = 'public' | 'responder' | 'admin';

export type Qualification =
  | 'doctor'
  | 'nurse'
  | 'medical_student'
  | 'anm'
  | 'first_aid_trained'
  | 'none';

export type IncidentType = 'health' | 'police' | 'fire' | 'earthquake';

export type IncidentStatus = 'active' | 'resolved' | 'cancelled';

export type AlertType = 'fight' | 'theft' | 'harassment' | 'suspicious' | 'other';

export type SituationType =
  | 'unconscious'
  | 'chest_pain'
  | 'accident'
  | 'choking'
  | 'seizure'
  | 'other';

export interface User {
  id: string;
  phone: string;
  full_name: string;
  role: UserRole;
  qualification: Qualification;
  is_active_responder: boolean;
  current_lat: number | null;
  current_lng: number | null;
  last_seen: string;
  language_preference: Language;
  created_at: string;
}

export interface Incident {
  id: string;
  type: IncidentType;
  reported_by: string;
  lat: number;
  lng: number;
  landmark_description: string;
  situation_summary: string;
  status: IncidentStatus;
  responder_count: number;
  created_at: string;
  resolved_at: string | null;
}

export interface Response {
  id: string;
  incident_id: string;
  responder_id: string;
  status: 'accepted' | 'rejected' | 'completed';
  accepted_at: string;
  arrived_at: string | null;
}

export interface PoliceAlert {
  id: string;
  incident_id: string;
  reporter_id: string;
  lat: number;
  lng: number;
  alert_type: AlertType;
  is_live_tracking: boolean;
  tracking_token: string;
  created_at: string;
  ended_at: string | null;
}

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface BloodDonor {
  id: string;
  user_id: string | null;
  blood_type: BloodType;
  lat: number;
  lng: number;
  is_available: boolean;
  last_donated_at: string | null;
  phone: string;
  full_name: string;
  created_at: string;
}

export interface Hospital {
  id: string;
  name_en: string;
  name_ne: string;
  phone: string;
  speciality: string;
  speciality_ne: string;
  lat: number;
  lng: number;
  address_en: string;
  address_ne: string;
}

export type HospitalType = 'government' | 'private' | 'ngo';

export interface HospitalRecord {
  id: string;
  name_en: string;
  name_ne: string;
  phone: string;
  emergency_phone: string | null;
  hospital_type: HospitalType;
  specialities: string[];
  lat: number;
  lng: number;
  address_en: string;
  address_ne: string;
  opd_hours_en: string;
  opd_hours_ne: string;
  is_24hr_emergency: boolean;
  consultation_fee_min: number | null;
  consultation_fee_max: number | null;
  rating: number;
  review_count: number;
  created_at: string;
}

export interface HospitalPrice {
  id: string;
  hospital_id: string;
  service_en: string;
  service_ne: string;
  price_min: number;
  price_max: number;
  reported_by: string | null;
  verified: boolean;
  created_at: string;
}

export interface HospitalReview {
  id: string;
  hospital_id: string;
  reviewer_id: string | null;
  rating: number;
  comment_en: string;
  comment_ne: string;
  created_at: string;
}

export interface WebhookPayload {
  type: 'police_alert' | 'health_emergency' | 'fire';
  situation: string;
  landmark: string;
  lat: number;
  lng: number;
  maps_url: string;
  tracking_url: string;
  time: string;
  reporter_phone?: string;
}
