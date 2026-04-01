import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { supabase, TABLES } from '../lib/supabase';
import { haversineDistance, formatDistance } from '../lib/geo';
import { useLanguage } from '../hooks/useLanguage';
import { HospitalRecord, HospitalType } from '../types';
import { colors, fontSizes, spacing, borderRadius } from '../constants/theme';

// ── Static fallback (offline) ─────────────────────────────────────────────────
// Matches the seed_hospitals.sql data; used when Supabase is unavailable.
const STATIC_HOSPITALS: HospitalRecord[] = [
  {
    id: 's1', name_en: 'Tribhuvan University Teaching Hospital',
    name_ne: 'त्रिभुवन विश्वविद्यालय शिक्षण अस्पताल',
    phone: '01-4412303', emergency_phone: '01-4412404',
    hospital_type: 'government',
    specialities: ['general', 'trauma', 'neurology', 'orthopedic', 'gynecology', 'pediatric'],
    lat: 27.7321, lng: 85.3319,
    address_en: 'Maharajgunj, Kathmandu', address_ne: 'महाराजगञ्ज, काठमाडौं',
    opd_hours_en: 'Sun–Fri 9am–5pm', opd_hours_ne: 'आइत–शुक्र बिहान ९–साँझ ५',
    is_24hr_emergency: true, consultation_fee_min: 100, consultation_fee_max: 500,
    rating: 0, review_count: 0, created_at: '',
  },
  {
    id: 's2', name_en: 'Bir Hospital', name_ne: 'वीर अस्पताल',
    phone: '01-4221119', emergency_phone: '01-4221119',
    hospital_type: 'government',
    specialities: ['general', 'trauma', 'neurology', 'oncology'],
    lat: 27.7041, lng: 85.3131,
    address_en: 'Kanti Path, Kathmandu', address_ne: 'कान्ति पथ, काठमाडौं',
    opd_hours_en: 'Sun–Fri 9am–4pm', opd_hours_ne: 'आइत–शुक्र बिहान ९–साँझ ४',
    is_24hr_emergency: true, consultation_fee_min: 50, consultation_fee_max: 300,
    rating: 0, review_count: 0, created_at: '',
  },
  {
    id: 's3', name_en: 'Patan Hospital', name_ne: 'पाटन अस्पताल',
    phone: '01-5522278', emergency_phone: '01-5522728',
    hospital_type: 'ngo',
    specialities: ['general', 'pediatric', 'gynecology', 'orthopedic'],
    lat: 27.6723, lng: 85.3194,
    address_en: 'Lagankhel, Lalitpur', address_ne: 'लगनखेल, ललितपुर',
    opd_hours_en: 'Sun–Fri 8am–5pm', opd_hours_ne: 'आइत–शुक्र बिहान ८–साँझ ५',
    is_24hr_emergency: true, consultation_fee_min: 200, consultation_fee_max: 800,
    rating: 0, review_count: 0, created_at: '',
  },
  {
    id: 's4', name_en: 'Grande International Hospital', name_ne: 'ग्रान्डे इन्टरनेशनल अस्पताल',
    phone: '01-5159266', emergency_phone: '01-5159266',
    hospital_type: 'private',
    specialities: ['general', 'cardiac', 'neurology', 'orthopedic', 'oncology', 'gynecology', 'pediatric', 'multiSpecialty'],
    lat: 27.7361, lng: 85.3469,
    address_en: 'Tokha Chowk, Kathmandu', address_ne: 'टोखा चोक, काठमाडौं',
    opd_hours_en: 'Open 24 hours', opd_hours_ne: 'सधैं खुला',
    is_24hr_emergency: true, consultation_fee_min: 800, consultation_fee_max: 3000,
    rating: 0, review_count: 0, created_at: '',
  },
  {
    id: 's5', name_en: 'Norvic International Hospital', name_ne: 'नोर्भिक इन्टरनेशनल अस्पताल',
    phone: '01-4258554', emergency_phone: '01-4258554',
    hospital_type: 'private',
    specialities: ['cardiac', 'neurology', 'orthopedic', 'multiSpecialty'],
    lat: 27.7058, lng: 85.3202,
    address_en: 'Thapathali, Kathmandu', address_ne: 'थापाथली, काठमाडौं',
    opd_hours_en: 'Open 24 hours', opd_hours_ne: 'सधैं खुला',
    is_24hr_emergency: true, consultation_fee_min: 1000, consultation_fee_max: 4000,
    rating: 0, review_count: 0, created_at: '',
  },
  {
    id: 's6', name_en: 'Nepal Medical College', name_ne: 'नेपाल मेडिकल कलेज',
    phone: '01-4911008', emergency_phone: '01-4911006',
    hospital_type: 'private',
    specialities: ['general', 'orthopedic', 'gynecology', 'pediatric', 'dermatology'],
    lat: 27.7450, lng: 85.3730,
    address_en: 'Jorpati, Kathmandu', address_ne: 'जोरपाटी, काठमाडौं',
    opd_hours_en: 'Sun–Fri 9am–5pm', opd_hours_ne: 'आइत–शुक्र बिहान ९–साँझ ५',
    is_24hr_emergency: true, consultation_fee_min: 600, consultation_fee_max: 2000,
    rating: 0, review_count: 0, created_at: '',
  },
  {
    id: 's7', name_en: "Kanti Children's Hospital", name_ne: 'कान्ति बाल अस्पताल',
    phone: '01-4412798', emergency_phone: '01-4412798',
    hospital_type: 'government',
    specialities: ['pediatric'],
    lat: 27.7378, lng: 85.3207,
    address_en: 'Maharajgunj, Kathmandu', address_ne: 'महाराजगञ्ज, काठमाडौं',
    opd_hours_en: 'Sun–Fri 9am–5pm', opd_hours_ne: 'आइत–शुक्र बिहान ९–साँझ ५',
    is_24hr_emergency: true, consultation_fee_min: 50, consultation_fee_max: 200,
    rating: 0, review_count: 0, created_at: '',
  },
  {
    id: 's8', name_en: 'Shahid Gangalal National Heart Centre', name_ne: 'शहीद गंगालाल राष्ट्रिय हृदय केन्द्र',
    phone: '01-4371322', emergency_phone: '01-4371327',
    hospital_type: 'government',
    specialities: ['cardiac'],
    lat: 27.7365, lng: 85.3226,
    address_en: 'Bansbari, Kathmandu', address_ne: 'बाँसबारी, काठमाडौं',
    opd_hours_en: 'Sun–Fri 9am–4pm', opd_hours_ne: 'आइत–शुक्र बिहान ९–साँझ ४',
    is_24hr_emergency: true, consultation_fee_min: 100, consultation_fee_max: 500,
    rating: 0, review_count: 0, created_at: '',
  },
  {
    id: 's9', name_en: 'National Trauma Centre', name_ne: 'राष्ट्रिय ट्रमा केन्द्र',
    phone: '01-4412505', emergency_phone: '01-4412505',
    hospital_type: 'government',
    specialities: ['trauma', 'orthopedic', 'neurology'],
    lat: 27.7350, lng: 85.3310,
    address_en: 'Maharajgunj, Kathmandu', address_ne: 'महाराजगञ्ज, काठमाडौं',
    opd_hours_en: 'Open 24 hours', opd_hours_ne: 'सधैं खुला',
    is_24hr_emergency: true, consultation_fee_min: 100, consultation_fee_max: 400,
    rating: 0, review_count: 0, created_at: '',
  },
  {
    id: 's10', name_en: 'Kathmandu Model Hospital', name_ne: 'काठमाडौं मोडल अस्पताल',
    phone: '01-4217766', emergency_phone: null,
    hospital_type: 'private',
    specialities: ['general', 'eye', 'ent', 'dentistry', 'dermatology', 'psychiatry'],
    lat: 27.6940, lng: 85.3167,
    address_en: 'Kathmandu', address_ne: 'काठमाडौं',
    opd_hours_en: 'Sun–Fri 9am–6pm', opd_hours_ne: 'आइत–शुक्र बिहान ९–साँझ ६',
    is_24hr_emergency: false, consultation_fee_min: 500, consultation_fee_max: 1500,
    rating: 0, review_count: 0, created_at: '',
  },
];

// ── Speciality grid ───────────────────────────────────────────────────────────
const SPECIALITY_TILES = [
  { key: 'general',      icon: '🩺' },
  { key: 'cardiac',      icon: '❤️' },
  { key: 'pediatric',    icon: '👶' },
  { key: 'orthopedic',   icon: '🦴' },
  { key: 'neurology',    icon: '🧠' },
  { key: 'gynecology',   icon: '🌸' },
  { key: 'dentistry',    icon: '🦷' },
  { key: 'eye',          icon: '👁️' },
  { key: 'ent',          icon: '👂' },
  { key: 'oncology',     icon: '🎗️' },
  { key: 'psychiatry',   icon: '🧘' },
  { key: 'dermatology',  icon: '🧴' },
];

type FilterType = HospitalType | 'all' | 'nearby' | 'affordable' | 'top_rated';

const FILTERS: { key: FilterType; labelEn: string; labelNe: string }[] = [
  { key: 'all',        labelEn: 'All',        labelNe: 'सबै' },
  { key: 'government', labelEn: 'Government', labelNe: 'सरकारी' },
  { key: 'private',    labelEn: 'Private',    labelNe: 'निजी' },
  { key: 'ngo',        labelEn: 'NGO',        labelNe: 'NGO' },
  { key: 'nearby',     labelEn: 'Nearby',     labelNe: 'नजिकै' },
  { key: 'affordable', labelEn: 'Affordable', labelNe: 'किफायती' },
  { key: 'top_rated',  labelEn: 'Top Rated',  labelNe: 'उत्कृष्ट' },
];

const TYPE_BADGE: Record<HospitalType, { label: string; labelNe: string; color: string }> = {
  government: { label: 'Govt',    labelNe: 'सरकारी', color: '#1565C0' },
  private:    { label: 'Private', labelNe: 'निजी',   color: '#6A1B9A' },
  ngo:        { label: 'NGO',     labelNe: 'NGO',     color: '#2E7D32' },
};

// ── Component ─────────────────────────────────────────────────────────────────
interface Props { navigation: any; }

type HospitalWithDist = HospitalRecord & { distance: number | null };

export default function HospitalFinderScreen({ navigation }: Props) {
  const { language, t } = useLanguage();
  const isNe = language === 'ne';

  const [query, setQuery]             = useState('');
  const [filter, setFilter]           = useState<FilterType>('all');
  const [speciality, setSpeciality]   = useState<string | null>(null);
  const [hospitals, setHospitals]     = useState<HospitalWithDist[]>([]);
  const [loading, setLoading]         = useState(true);
  const [userLat, setUserLat]         = useState<number | null>(null);
  const [userLng, setUserLng]         = useState<number | null>(null);

  // Attach distance to hospitals
  const withDistance = useCallback(
    (list: HospitalRecord[]): HospitalWithDist[] =>
      list.map((h) => ({
        ...h,
        distance:
          userLat != null && userLng != null
            ? haversineDistance(userLat, userLng, h.lat, h.lng)
            : null,
      })),
    [userLat, userLng],
  );

  // Load hospitals (Supabase → static fallback)
  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(TABLES.HOSPITAL_FINDER)
      .select('*')
      .order('name_en');

    if (error || !data || data.length === 0) {
      setHospitals(withDistance(STATIC_HOSPITALS));
    } else {
      setHospitals(withDistance(data as HospitalRecord[]));
    }
    setLoading(false);
  }, [withDistance]);

  // Get user location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLat(loc.coords.latitude);
        setUserLng(loc.coords.longitude);
      }
    })();
  }, []);

  useEffect(() => { load(); }, [load]);

  // Re-attach distance when location arrives
  useEffect(() => {
    if (userLat != null) {
      setHospitals((prev) => withDistance(prev));
    }
  }, [userLat, userLng, withDistance]);

  // ── Derived filtered list ──
  const filtered = (() => {
    let list = [...hospitals];

    // Speciality filter (from grid tile tap)
    if (speciality) {
      list = list.filter((h) => h.specialities.includes(speciality));
    }

    // Type / meta filters
    if (filter === 'government' || filter === 'private' || filter === 'ngo') {
      list = list.filter((h) => h.hospital_type === filter);
    } else if (filter === 'nearby') {
      list = list
        .filter((h) => h.distance != null && h.distance < 5000)
        .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    } else if (filter === 'affordable') {
      list = list
        .filter((h) => h.consultation_fee_min != null)
        .sort((a, b) => (a.consultation_fee_min ?? 0) - (b.consultation_fee_min ?? 0));
    } else if (filter === 'top_rated') {
      list = list.sort((a, b) => b.rating - a.rating);
    }

    // Text search
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (h) =>
          h.name_en.toLowerCase().includes(q) ||
          h.name_ne.includes(q) ||
          h.address_en.toLowerCase().includes(q) ||
          h.address_ne.includes(q) ||
          h.specialities.some((s) => s.includes(q)),
      );
    }

    return list;
  })();

  const showGrid = !query.trim() && !speciality;

  // ── Render helpers ──────────────────────────────────────────────────────────

  function isOpen(h: HospitalRecord): boolean {
    // Simple heuristic: 24hr always open; otherwise check OPD hours text
    if (h.is_24hr_emergency) return true;
    return h.opd_hours_en.toLowerCase().includes('24');
  }

  function feeLabel(h: HospitalRecord): string {
    if (h.consultation_fee_min != null && h.consultation_fee_max != null) {
      return `NPR ${h.consultation_fee_min}–${h.consultation_fee_max}`;
    }
    return isNe ? 'शुल्क उपलब्ध छैन' : 'Fee unavailable';
  }

  function renderStars(rating: number) {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(Math.max(0, 5 - full));
  }

  function renderHospitalCard({ item: h }: { item: HospitalWithDist }) {
    const badge = TYPE_BADGE[h.hospital_type];
    const open  = isOpen(h);

    return (
      <View style={styles.card}>
        {/* Top row: name + type badge */}
        <View style={styles.cardHeader}>
          <View style={styles.cardNameWrap}>
            <Text style={styles.cardName} numberOfLines={2}>
              {isNe ? h.name_ne : h.name_en}
            </Text>
            <Text style={styles.cardNameSub} numberOfLines={1}>
              {isNe ? h.name_en : h.name_ne}
            </Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: badge.color }]}>
            <Text style={styles.typeBadgeText}>
              {isNe ? badge.labelNe : badge.label}
            </Text>
          </View>
        </View>

        {/* Meta row: open/closed, distance, rating */}
        <View style={styles.metaRow}>
          <View style={[styles.openBadge, { backgroundColor: open ? '#E8F5E9' : '#FFEBEE' }]}>
            <Text style={[styles.openText, { color: open ? colors.safeGreen : colors.emergencyRed }]}>
              {open ? (isNe ? 'खुला' : 'Open') : (isNe ? 'बन्द' : 'Closed')}
            </Text>
          </View>
          {h.distance != null && (
            <Text style={styles.metaText}>
              📍 {formatDistance(h.distance)}
            </Text>
          )}
          {h.review_count > 0 && (
            <Text style={styles.metaText}>
              {renderStars(h.rating)} ({h.review_count})
            </Text>
          )}
          {h.is_24hr_emergency && (
            <Text style={[styles.metaText, { color: colors.emergencyRed, fontWeight: '700' }]}>
              {isNe ? '२४ घण्टा' : '24hr ER'}
            </Text>
          )}
        </View>

        {/* OPD + fee */}
        <View style={styles.infoRow}>
          <Text style={styles.infoText} numberOfLines={1}>
            🕐 {isNe ? h.opd_hours_ne : h.opd_hours_en}
          </Text>
          <Text style={styles.infoText}>💰 {feeLabel(h)}</Text>
        </View>

        {/* Address */}
        <Text style={styles.addressText} numberOfLines={1}>
          📍 {isNe ? h.address_ne : h.address_en}
        </Text>

        {/* Action buttons */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.safeGreen }]}
            onPress={() => Linking.openURL(`tel:${h.phone}`)}
          >
            <Text style={styles.actionBtnText}>📞 {isNe ? 'फोन' : 'Call'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.policeBlue }]}
            onPress={() => {
              const url = Platform.OS === 'ios'
                ? `maps://maps.apple.com/?daddr=${h.lat},${h.lng}`
                : `geo:${h.lat},${h.lng}?q=${encodeURIComponent(isNe ? h.name_ne : h.name_en)}`;
              Linking.openURL(url).catch(() =>
                Linking.openURL(`https://maps.google.com/?q=${h.lat},${h.lng}`)
              );
            }}
          >
            <Text style={styles.actionBtnText}>🗺️ {isNe ? 'दिशा' : 'Directions'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.detailsBtn]}
            onPress={() =>
              navigation.navigate('HospitalDetail', {
                hospitalId: h.id,
                hospitalName: isNe ? h.name_ne : h.name_en,
              })
            }
          >
            <Text style={[styles.actionBtnText, { color: colors.darkText }]}>
              ℹ️ {isNe ? 'विवरण' : 'Details'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isNe ? 'अस्पताल खोज्नुहोस्' : 'Find a Hospital'}
        </Text>
        <Text style={styles.headerSub}>
          {isNe ? 'Kathmandu Valley' : 'Kathmandu Valley'}
        </Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={isNe ? 'अस्पताल वा विशेषज्ञता खोज्नुहोस्...' : 'Search hospitals or speciality...'}
          placeholderTextColor="#9E9E9E"
          value={query}
          onChangeText={(t) => { setQuery(t); setSpeciality(null); }}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterScrollContent}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
              {isNe ? f.labelNe : f.labelEn}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.emergencyRed} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(h) => h.id}
          renderItem={renderHospitalCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            showGrid ? (
              <>
                {/* Speciality grid */}
                <Text style={styles.sectionLabel}>
                  {isNe ? 'विशेषज्ञताद्वारा हेर्नुहोस्' : 'Browse by Speciality'}
                </Text>
                <View style={styles.specialityGrid}>
                  {SPECIALITY_TILES.map((tile) => {
                    const label = t(`hospitalFinder.specialities.${tile.key}`);
                    return (
                      <TouchableOpacity
                        key={tile.key}
                        style={[
                          styles.specialityTile,
                          speciality === tile.key && styles.specialityTileActive,
                        ]}
                        onPress={() =>
                          setSpeciality(speciality === tile.key ? null : tile.key)
                        }
                      >
                        <Text style={styles.specialityIcon}>{tile.icon}</Text>
                        <Text style={styles.specialityLabel} numberOfLines={2}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.sectionLabel}>
                  {isNe ? `${filtered.length} अस्पतालहरू` : `${filtered.length} Hospitals`}
                </Text>
              </>
            ) : (
              <Text style={styles.sectionLabel}>
                {isNe ? `${filtered.length} नतिजाहरू` : `${filtered.length} results`}
              </Text>
            )
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>🏥</Text>
              <Text style={styles.emptyText}>
                {isNe ? 'अस्पताल भेटिएन' : 'No hospitals found'}
              </Text>
              <Text style={styles.emptySubText}>
                {isNe ? 'अर्को खोज वा फिल्टर प्रयास गर्नुहोस्' : 'Try a different search or filter'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F6FA' },

  header: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  headerTitle: { fontSize: fontSizes.xl, fontWeight: '900', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 48,
    gap: spacing.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: fontSizes.md, color: colors.darkText },

  filterScroll: { maxHeight: 48 },
  filterScrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  chipActive: {
    backgroundColor: colors.emergencyRed,
    borderColor: colors.emergencyRed,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.darkText },
  chipTextActive: { color: '#FFFFFF' },

  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  listContent: { padding: spacing.md, gap: spacing.sm, paddingBottom: 40 },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.lightText,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Speciality grid — 3 columns
  specialityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  specialityTile: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    gap: 4,
  },
  specialityTileActive: {
    borderColor: colors.emergencyRed,
    backgroundColor: '#FFF5F5',
  },
  specialityIcon: { fontSize: 24 },
  specialityLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.darkText,
    textAlign: 'center',
    lineHeight: 14,
  },

  // Hospital card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cardNameWrap: { flex: 1 },
  cardName: { fontSize: fontSizes.md, fontWeight: '800', color: colors.darkText, lineHeight: 22 },
  cardNameSub: { fontSize: 12, color: colors.lightText, marginTop: 1 },

  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.sm },
  typeBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },

  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  openBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: borderRadius.sm },
  openText: { fontSize: 11, fontWeight: '700' },
  metaText: { fontSize: 12, color: colors.lightText },

  infoRow: { gap: 2 },
  infoText: { fontSize: 12, color: colors.lightText },
  addressText: { fontSize: 12, color: colors.lightText },

  cardActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsBtn: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: spacing.sm },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.darkText },
  emptySubText: { fontSize: fontSizes.sm, color: colors.lightText, textAlign: 'center' },
});
