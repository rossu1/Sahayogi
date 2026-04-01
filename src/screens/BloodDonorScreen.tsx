import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  FlatList,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../hooks/useLanguage';
import { useLocation } from '../hooks/useLocation';
import { supabase } from '../lib/supabase';
import { haversineDistance, formatDistance } from '../lib/geo';
import { colors, fontSizes, spacing, borderRadius, minTouchTarget } from '../constants/theme';

type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const BLOOD_RED = '#C62828';
const SEARCH_RADIUS_M = 10000; // 10 km
const DONOR_COOLDOWN_DAYS = 90;

interface Donor {
  id: string;
  full_name: string;
  blood_type: BloodType;
  lat: number;
  lng: number;
  is_available: boolean;
  phone: string;
  last_donated_at: string | null;
  distance?: number;
}

interface Props {
  navigation: any;
}

export default function BloodDonorScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { location, error: locError } = useLocation();

  const [activeTab, setActiveTab] = useState<'find' | 'register'>('find');

  // Find tab state
  const [selectedType, setSelectedType] = useState<BloodType | null>(null);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  // Register tab state
  const [regName, setRegName] = useState(user?.full_name ?? '');
  const [regPhone, setRegPhone] = useState(user?.phone ?? '');
  const [regBloodType, setRegBloodType] = useState<BloodType | null>(null);
  const [regAvailable, setRegAvailable] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [existingDonorId, setExistingDonorId] = useState<string | null>(null);

  const isNe = language === 'ne';

  // Check if user is already registered on tab switch
  const checkExistingRegistration = useCallback(async () => {
    if (!user?.id || user.id === 'guest') return;
    const { data } = await supabase
      .from('blood_donors')
      .select('id, blood_type, is_available')
      .eq('user_id', user.id)
      .single();
    if (data) {
      setAlreadyRegistered(true);
      setExistingDonorId(data.id);
      setRegBloodType(data.blood_type as BloodType);
      setRegAvailable(data.is_available);
    }
  }, [user?.id]);

  const searchDonors = async () => {
    if (!selectedType) return;
    if (!location) {
      Alert.alert(
        isNe ? 'स्थान आवश्यक' : 'Location required',
        isNe ? 'दाता खोज्न GPS सक्षम गर्नुहोस्' : 'Please enable GPS to find nearby donors'
      );
      return;
    }
    setSearching(true);
    setSearched(false);

    const { data, error } = await supabase
      .from('blood_donors')
      .select('id, full_name, blood_type, lat, lng, is_available, phone, last_donated_at')
      .eq('blood_type', selectedType)
      .eq('is_available', true);

    if (error) {
      Alert.alert(isNe ? 'त्रुटि' : 'Error', error.message);
      setSearching(false);
      return;
    }

    const nearby = (data ?? [])
      .map((d: Donor) => ({
        ...d,
        distance: haversineDistance(location.lat, location.lng, d.lat, d.lng),
      }))
      .filter((d) => d.distance! <= SEARCH_RADIUS_M)
      .sort((a, b) => a.distance! - b.distance!);

    setDonors(nearby);
    setSearched(true);
    setSearching(false);
  };

  const registerDonor = async () => {
    if (!regBloodType) {
      Alert.alert('', isNe ? 'रगत समूह छान्नुहोस्' : 'Please select a blood type');
      return;
    }
    if (!regName.trim() || !regPhone.trim()) {
      Alert.alert('', isNe ? 'नाम र फोन नम्बर आवश्यक छ' : 'Name and phone are required');
      return;
    }
    if (!location) {
      Alert.alert(
        isNe ? 'स्थान आवश्यक' : 'Location required',
        isNe ? 'दर्ता गर्न GPS सक्षम गर्नुहोस्' : 'Please enable GPS to register'
      );
      return;
    }
    setRegistering(true);

    const payload = {
      user_id: user?.id !== 'guest' ? user?.id : null,
      blood_type: regBloodType,
      lat: location.lat,
      lng: location.lng,
      is_available: regAvailable,
      phone: regPhone.trim(),
      full_name: regName.trim(),
    };

    let error;
    if (alreadyRegistered && existingDonorId) {
      ({ error } = await supabase
        .from('blood_donors')
        .update({ is_available: regAvailable, lat: location.lat, lng: location.lng })
        .eq('id', existingDonorId));
    } else {
      ({ error } = await supabase.from('blood_donors').insert(payload));
    }

    setRegistering(false);
    if (error) {
      Alert.alert(isNe ? 'त्रुटि' : 'Error', error.message);
    } else {
      setAlreadyRegistered(true);
      Alert.alert(
        isNe ? 'सफल!' : 'Success!',
        alreadyRegistered
          ? isNe ? 'तपाईंको जानकारी अपडेट गरियो' : 'Your information has been updated'
          : isNe ? 'तपाईं रगत दाताको रूपमा दर्ता हुनुभयो' : 'You are now registered as a blood donor'
      );
    }
  };

  const BloodTypeGrid = ({
    selected,
    onSelect,
  }: {
    selected: BloodType | null;
    onSelect: (t: BloodType) => void;
  }) => (
    <View style={styles.bloodTypeGrid}>
      {BLOOD_TYPES.map((bt) => (
        <TouchableOpacity
          key={bt}
          style={[styles.bloodTypeBtn, selected === bt && styles.bloodTypeBtnSelected]}
          onPress={() => onSelect(bt)}
        >
          <Text style={[styles.bloodTypeBtnText, selected === bt && styles.bloodTypeBtnTextSelected]}>
            {bt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>🩸 {isNe ? t('bloodDonor.title') : t('bloodDonor.titleEn')}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'find' && styles.tabActive]}
          onPress={() => setActiveTab('find')}
        >
          <Text style={[styles.tabText, activeTab === 'find' && styles.tabTextActive]}>
            {isNe ? t('bloodDonor.findDonor') : t('bloodDonor.findDonorEn')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'register' && styles.tabActive]}
          onPress={() => { setActiveTab('register'); checkExistingRegistration(); }}
        >
          <Text style={[styles.tabText, activeTab === 'register' && styles.tabTextActive]}>
            {isNe ? t('bloodDonor.becomeDonor') : t('bloodDonor.becomeDonorEn')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* ── FIND TAB ── */}
        {activeTab === 'find' && (
          <View>
            {locError && (
              <View style={styles.locWarning}>
                <Text style={styles.locWarningText}>
                  ⚠️ {isNe ? 'GPS उपलब्ध छैन — स्थान सेटिङ जाँच गर्नुहोस्' : 'GPS unavailable — check location settings'}
                </Text>
              </View>
            )}

            <Text style={styles.sectionLabel}>
              {isNe ? t('bloodDonor.bloodTypeNeeded') : t('bloodDonor.bloodTypeNeededEn')}
            </Text>
            <BloodTypeGrid selected={selectedType} onSelect={setSelectedType} />

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: BLOOD_RED }, (!selectedType || searching) && styles.disabledBtn]}
              onPress={searchDonors}
              disabled={!selectedType || searching}
            >
              {searching ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {isNe ? t('bloodDonor.searchDonors') : t('bloodDonor.searchDonorsEn')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Results */}
            {searched && donors.length === 0 && (
              <View style={styles.noDonorsCard}>
                <Text style={styles.noDonorsText}>
                  {isNe ? t('bloodDonor.noDonorsFound') : t('bloodDonor.noDonorsFoundEn')}
                </Text>
                <Text style={styles.redCrossLabel}>
                  {isNe ? t('bloodDonor.redCrossContact') : t('bloodDonor.redCrossContactEn')}
                </Text>
                <TouchableOpacity
                  style={[styles.callBtn, { backgroundColor: BLOOD_RED }]}
                  onPress={() => Linking.openURL('tel:014228094')}
                >
                  <Text style={styles.callBtnText}>📞 01-4228094</Text>
                </TouchableOpacity>
              </View>
            )}

            {donors.map((donor) => (
              <View key={donor.id} style={styles.donorCard}>
                <View style={styles.donorInfo}>
                  <View style={styles.donorRow}>
                    <View style={[styles.bloodBadge, { backgroundColor: BLOOD_RED }]}>
                      <Text style={styles.bloodBadgeText}>{donor.blood_type}</Text>
                    </View>
                    <Text style={styles.donorName}>
                      {donor.full_name.split(' ')[0]}
                    </Text>
                    <View style={[styles.availBadge, { backgroundColor: donor.is_available ? colors.safeGreen : '#9E9E9E' }]}>
                      <Text style={styles.availText}>
                        {donor.is_available
                          ? (isNe ? t('bloodDonor.available') : t('bloodDonor.availableEn'))
                          : (isNe ? t('bloodDonor.unavailable') : t('bloodDonor.unavailableEn'))}
                      </Text>
                    </View>
                  </View>
                  {donor.distance !== undefined && (
                    <Text style={styles.distanceText}>
                      📍 {formatDistance(donor.distance)}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.callBtn, { backgroundColor: BLOOD_RED }]}
                  onPress={() => Linking.openURL(`tel:${donor.phone}`)}
                >
                  <Text style={styles.callBtnText}>
                    📞 {isNe ? t('bloodDonor.callDonor') : t('bloodDonor.callDonorEn')}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ── REGISTER TAB ── */}
        {activeTab === 'register' && (
          <View>
            {alreadyRegistered && (
              <View style={styles.registeredBanner}>
                <Text style={styles.registeredText}>
                  ✅ {isNe ? 'तपाईं पहिले नै दर्ता हुनुभएको छ' : 'You are already registered'}
                </Text>
              </View>
            )}

            <Text style={styles.fieldLabel}>
              {isNe ? 'पूरा नाम' : 'Full name'}
            </Text>
            <TextInput
              style={styles.input}
              value={regName}
              onChangeText={setRegName}
              placeholder={isNe ? 'तपाईंको नाम' : 'Your name'}
              editable={!alreadyRegistered}
            />

            <Text style={styles.fieldLabel}>
              {isNe ? 'फोन नम्बर' : 'Phone number'}
            </Text>
            <TextInput
              style={styles.input}
              value={regPhone}
              onChangeText={setRegPhone}
              placeholder="98XXXXXXXX"
              keyboardType="phone-pad"
              editable={!alreadyRegistered}
            />

            <Text style={styles.fieldLabel}>
              {isNe ? 'रगत समूह' : 'Blood type'}
            </Text>
            <BloodTypeGrid selected={regBloodType} onSelect={setRegBloodType} />

            <View style={styles.availableRow}>
              <View style={styles.availableInfo}>
                <Text style={styles.availableLabel}>
                  {isNe ? t('bloodDonor.iAmAvailable') : t('bloodDonor.iAmAvailableEn')}
                </Text>
                <Text style={styles.availableHint}>
                  {isNe ? 'अहिले रगत दिन तयार छु' : 'I am ready to donate now'}
                </Text>
              </View>
              <Switch
                value={regAvailable}
                onValueChange={setRegAvailable}
                trackColor={{ false: '#ccc', true: BLOOD_RED }}
                thumbColor={regAvailable ? BLOOD_RED : '#f4f3f4'}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: BLOOD_RED }, registering && styles.disabledBtn]}
              onPress={registerDonor}
              disabled={registering}
            >
              {registering ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {alreadyRegistered
                    ? (isNe ? 'अपडेट गर्नुहोस्' : 'Update Registration')
                    : (isNe ? t('bloodDonor.registerAsDonor') : t('bloodDonor.registerAsDonorEn'))}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>
                {isNe
                  ? '• ९० दिनभित्र रगत दिएकाले अनुपलब्ध देखिनेछन्\n• तपाईंको फोन नम्बर सूचीमा देखिँदैन'
                  : '• Donors within 90 days of last donation will appear unavailable\n• Your phone number is never shown in the list'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C62828',
    paddingTop: 48,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  backBtn: { paddingRight: spacing.xs },
  backText: { color: colors.white, fontSize: fontSizes.xl },
  headerTitle: { color: colors.white, fontSize: fontSizes.xl, fontWeight: '800' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#C62828' },
  tabText: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.lightText },
  tabTextActive: { color: '#C62828' },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  locWarning: {
    backgroundColor: '#FFF3CD',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  locWarningText: { fontSize: fontSizes.sm, color: '#856404' },
  sectionLabel: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.darkText,
    marginBottom: spacing.sm,
  },
  bloodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  bloodTypeBtn: {
    width: '22%',
    aspectRatio: 1.2,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloodTypeBtnSelected: { borderColor: '#C62828', backgroundColor: '#FFF0F0' },
  bloodTypeBtnText: { fontSize: fontSizes.lg, fontWeight: '800', color: colors.lightText },
  bloodTypeBtnTextSelected: { color: '#C62828' },
  primaryBtn: {
    borderRadius: borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: minTouchTarget,
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: '#C62828',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  disabledBtn: { backgroundColor: '#9E9E9E', shadowOpacity: 0 },
  primaryBtnText: { color: colors.white, fontSize: fontSizes.lg, fontWeight: '700' },
  noDonorsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  noDonorsText: { fontSize: fontSizes.md, color: colors.darkText, textAlign: 'center', fontWeight: '600' },
  redCrossLabel: { fontSize: fontSizes.sm, color: colors.lightText, textAlign: 'center' },
  donorCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    gap: spacing.sm,
  },
  donorInfo: { flex: 1 },
  donorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap', marginBottom: 4 },
  bloodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  bloodBadgeText: { color: colors.white, fontSize: fontSizes.sm, fontWeight: '800' },
  donorName: { fontSize: fontSizes.md, fontWeight: '700', color: colors.darkText },
  availBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  availText: { color: colors.white, fontSize: fontSizes.xs, fontWeight: '600' },
  distanceText: { fontSize: fontSizes.sm, color: colors.lightText },
  callBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    minHeight: minTouchTarget,
    justifyContent: 'center',
  },
  callBtnText: { color: colors.white, fontSize: fontSizes.sm, fontWeight: '700' },
  registeredBanner: {
    backgroundColor: '#E8F5E9',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  registeredText: { color: colors.safeGreen, fontSize: fontSizes.sm, fontWeight: '600' },
  fieldLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.lightText,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: fontSizes.md,
    color: colors.darkText,
    backgroundColor: colors.white,
    minHeight: minTouchTarget,
    marginBottom: spacing.xs,
  },
  availableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  availableInfo: { flex: 1, marginRight: spacing.sm },
  availableLabel: { fontSize: fontSizes.md, fontWeight: '700', color: colors.darkText },
  availableHint: { fontSize: fontSizes.xs, color: colors.lightText, marginTop: 2 },
  disclaimer: {
    backgroundColor: '#F5F5F5',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  disclaimerText: { fontSize: fontSizes.xs, color: colors.lightText, lineHeight: 18 },
});
