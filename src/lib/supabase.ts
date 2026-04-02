import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const TABLES = {
  USERS: 'users',
  INCIDENTS: 'incidents',
  RESPONSES: 'responses',
  POLICE_ALERTS: 'police_alerts',
  HOSPITAL_FINDER: 'hospital_finder',
  HOSPITAL_PRICES: 'hospital_prices',
  HOSPITAL_REVIEWS: 'hospital_reviews',
} as const;
