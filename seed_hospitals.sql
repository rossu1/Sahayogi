-- Seed data: 10 Kathmandu hospitals for hospital_finder table
-- Run this AFTER hospital_finder_migration.sql

insert into hospital_finder (
  name_en, name_ne, phone, emergency_phone,
  hospital_type, specialities,
  lat, lng, address_en, address_ne,
  opd_hours_en, opd_hours_ne,
  is_24hr_emergency,
  consultation_fee_min, consultation_fee_max
) values

(
  'Tribhuvan University Teaching Hospital',
  'त्रिभुवन विश्वविद्यालय शिक्षण अस्पताल',
  '01-4412303', '01-4412404',
  'government', ARRAY['general','trauma','neurology','orthopedic','gynecology','pediatric'],
  27.7321, 85.3319,
  'Maharajgunj, Kathmandu', 'महाराजगञ्ज, काठमाडौं',
  'Sun–Fri 9am–5pm', 'आइत–शुक्र बिहान ९–साँझ ५',
  true, 100, 500
),

(
  'Bir Hospital',
  'वीर अस्पताल',
  '01-4221119', '01-4221119',
  'government', ARRAY['general','trauma','neurology','oncology'],
  27.7041, 85.3131,
  'Kanti Path, Kathmandu', 'कान्ति पथ, काठमाडौं',
  'Sun–Fri 9am–4pm', 'आइत–शुक्र बिहान ९–साँझ ४',
  true, 50, 300
),

(
  'Patan Hospital',
  'पाटन अस्पताल',
  '01-5522278', '01-5522728',
  'ngo', ARRAY['general','pediatric','gynecology','orthopedic'],
  27.6723, 85.3194,
  'Lagankhel, Lalitpur', 'लगनखेल, ललितपुर',
  'Sun–Fri 8am–5pm', 'आइत–शुक्र बिहान ८–साँझ ५',
  true, 200, 800
),

(
  'Grande International Hospital',
  'ग्रान्डे इन्टरनेशनल अस्पताल',
  '01-5159266', '01-5159266',
  'private', ARRAY['general','cardiac','neurology','orthopedic','oncology','gynecology','pediatric','multiSpecialty'],
  27.7361, 85.3469,
  'Tokha Chowk, Kathmandu', 'टोखा चोक, काठमाडौं',
  'Open 24 hours', 'सधैं खुला',
  true, 800, 3000
),

(
  'Norvic International Hospital',
  'नोर्भिक इन्टरनेशनल अस्पताल',
  '01-4258554', '01-4258554',
  'private', ARRAY['cardiac','neurology','orthopedic','multiSpecialty'],
  27.7058, 85.3202,
  'Thapathali, Kathmandu', 'थापाथली, काठमाडौं',
  'Open 24 hours', 'सधैं खुला',
  true, 1000, 4000
),

(
  'Nepal Medical College & Teaching Hospital',
  'नेपाल मेडिकल कलेज',
  '01-4911008', '01-4911006',
  'private', ARRAY['general','orthopedic','gynecology','pediatric','dermatology'],
  27.7450, 85.3730,
  'Jorpati, Kathmandu', 'जोरपाटी, काठमाडौं',
  'Sun–Fri 9am–5pm', 'आइत–शुक्र बिहान ९–साँझ ५',
  true, 600, 2000
),

(
  'Kanti Children''s Hospital',
  'कान्ति बाल अस्पताल',
  '01-4412798', '01-4412798',
  'government', ARRAY['pediatric'],
  27.7378, 85.3207,
  'Maharajgunj, Kathmandu', 'महाराजगञ्ज, काठमाडौं',
  'Sun–Fri 9am–5pm', 'आइत–शुक्र बिहान ९–साँझ ५',
  true, 50, 200
),

(
  'Shahid Gangalal National Heart Centre',
  'शहीद गंगालाल राष्ट्रिय हृदय केन्द्र',
  '01-4371322', '01-4371327',
  'government', ARRAY['cardiac'],
  27.7365, 85.3226,
  'Bansbari, Kathmandu', 'बाँसबारी, काठमाडौं',
  'Sun–Fri 9am–4pm', 'आइत–शुक्र बिहान ९–साँझ ४',
  true, 100, 500
),

(
  'National Trauma Centre',
  'राष्ट्रिय ट्रमा केन्द्र',
  '01-4412505', '01-4412505',
  'government', ARRAY['trauma','orthopedic','neurology'],
  27.7350, 85.3310,
  'Maharajgunj, Kathmandu', 'महाराजगञ्ज, काठमाडौं',
  'Open 24 hours', 'सधैं खुला',
  true, 100, 400
),

(
  'Kathmandu Model Hospital',
  'काठमाडौं मोडल अस्पताल',
  '01-4217766', '01-4217766',
  'private', ARRAY['general','eye','ent','dentistry','dermatology','psychiatry'],
  27.6940, 85.3167,
  'Kathmandu', 'काठमाडौं',
  'Sun–Fri 9am–6pm', 'आइत–शुक्र बिहान ९–साँझ ६',
  false, 500, 1500
);
