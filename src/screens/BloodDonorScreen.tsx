import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
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
import { BloodType, BloodDonor } from '../types';

type DonorWithDistance = BloodDonor & { distance: number };

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const BLOOD_RED = '#C62828';
const SEARCH_RADIUS_M = 10000;

function BloodTypeGrid({
  selected,
  onSelect,
}: {
  selected: BloodType | null;
  onSelect: (t: BloodType) => void;
}) {
  return (
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
}

interface Props {
  navigation: any;
}

export default function BloodDonorScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { location, error: locError } = useLocation();

  const [activeTab, setActiveTab] = useState<'find' | 'register'>('find');

  // null = haven't searched yet; [] = searched, no results; [...] = results
  const [donors, setDonors] = useState<DonorWithDistance[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [selectedType, setSelectedType] = useState<BloodType | null>(null);

  const [regName, setRegName] = useState(user?.full_name ?? '');
  const [regPhone, setRegPhone] = useState(user?.phone ?? '');
  const [regBloodType, setRegBloodType] = useState<BloodType | null>(null);
  const [regAvailable, setRegAvailable] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [existingDonorId, setExistingDonorId] = useState<string | null>(null);

  const checkExistingRegistration = useCallback(async () => {
    if (!user?.id || user.id === 'guest') return;
    const { data, error } = await supabase
      .from('blood_donors')
      .select('id, blood_type, is_available')
      .eq('user_id', user.id)
      .single();
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found (expected); anything else is a real error
      Alert.alert(t('common.error'), error.message);
      return;
    }
    if (data) {
      setAlreadyRegistered(true);
      setExistingDonorId(data.id);
      setRegBloodType(data.blood_type as BloodType);
      setRegAvailable(data.is_available);
    }
  }, [user?.id, t]);

  useEffect(() => {
    if (activeTab === 'register') {
      checkExistingRegistration();
    }
  }, [activeTab, checkExistingRegistration]);

  const searchDonors = async () => {
    if (!selectedType) return;
    if (!location) {
      Alert.alert(
        t('common.error'),
        t('fallback.locationError')
      );
      return;
    }
    setSearching(true);

    const { data, error } = await supabase
      .from('blood_donors')
      .select('id, user_id, full_name, blood_type, lat, lng, is_available, phone, last_donated_at, created_at')
      .eq('blood_type', selectedType)
      .eq('is_available', true);

    if (error) {
      Alert.alert(t('common.error'), error.message);
      setSearching(false);
      return;
    }

    const nearby = (data as BloodDonor[])
      .map((d) => ({
        ...d,
        distance: haversineDistance(location.lat, location.lng, d.lat, d.lng),
      }))
      .filter((d) => d.distance <= SEARCH_RADIUS_M)
      .sort((a, b) => a.distance - b.distance);

    setDonors(nearby);
    setSearching(false);
  };

  const registerDonor = async () => {
    if (!regBloodType) {
      Alert.alert('', t('common.error'));
      return;
    }
    if (!regName.trim() || !regPhone.trim()) {
      Alert.alert('', t('common.error'));
      return;
    }
    if (!location) {
      Alert.alert(t('common.error'), t('fallback.locationError'));
      return;
    }
    setRegistering(true);

    let error;
    if (alreadyRegistered && existingDonorId) {
      ({ error } = await supabase
        .from('blood_donors')
        .update({ is_available: regAvailable, lat: location.lat, lng: location.lng })
        .eq('id', existingDonorId));
    } else {
      ({ error } = await supabase.from('blood_donors').insert({
        user_id: user?.id !== 'guest' ? user?.id : null,
        blood_type: regBloodType,
        lat: location.lat,
        lng: location.lng,
        is_available: regAvailable,
        phone: regPhone.trim(),
        full_name: regName.trim(),
      }));
    }

    setRegistering(false);
    if (error) {
      Alert.alert(t('common.error'), error.message);
    } else {
      setAlreadyRegistered(true);
      Alert.alert(t('common.done'), alreadyRegistered ? t('common.save') : t('bloodDonor.registerAsDonor'));
    }
  };

  const hasSearched = donors !== null;
  const noResults = hasSearched && donors!.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🩸 {t('bloodDonor.title')}</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'find' && styles.tabActive]}
          onPress={() => setActiveTab('find')}
        >
          <Text style={[styles.tabText, activeTab === 'find' && styles.tabTextActive]}>
            {t('bloodDonor.findDonor')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'register' && styles.tabActive]}
          onPress={() => setActiveTab('register')}
        >
          <Text style={[styles.tabText, activeTab === 'register' && styles.tabTextActive]}>
            {t('bloodDonor.becomeDonor')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {activeTab === 'find' && (
          <View>
            {locError && (
              <View style={styles.locWarning}>
                <Text style={styles.locWarningText}>
                  ⚠️ {t('fallback.locationError')}
                </Text>
              </View>
            )}

            <Text style={styles.sectionLabel}>{t('bloodDonor.bloodTypeNeeded')}</Text>
            <BloodTypeGrid selected={selectedType} onSelect={setSelectedType} />

            <TouchableOpacity
              style={[styles.primaryBtn, (!selectedType || searching) && styles.disabledBtn]}
              onPress={searchDonors}
              disabled={!selectedType || searching}
            >
              {searching ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>{t('bloodDonor.searchDonors')}</Text>
              )}
            </TouchableOpacity>

            {noResults && (
              <View style={styles.noDonorsCard}>
                <Text style={styles.noDonorsText}>{t('bloodDonor.noDonorsFound')}</Text>
                <Text style={styles.redCrossLabel}>{t('bloodDonor.redCrossContact')}</Text>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => Linking.openURL('tel:014228094')}
                >
                  <Text style={styles.callBtnText}>📞 01-4228094</Text>
                </TouchableOpacity>
              </View>
            )}

            {donors?.map((donor) => (
              <View key={donor.id} style={styles.donorCard}>
                <View style={styles.donorInfo}>
                  <View style={styles.donorRow}>
                    <View style={styles.bloodBadge}>
                      <Text style={styles.bloodBadgeText}>{donor.blood_type}</Text>
                    </View>
                    <Text style={styles.donorName}>{donor.full_name.split(' ')[0]}</Text>
                    <View style={[styles.availBadge, { backgroundColor: donor.is_available ? colors.safeGreen : '#9E9E9E' }]}>
                      <Text style={styles.availText}>
                        {donor.is_available ? t('bloodDonor.available') : t('bloodDonor.unavailable')}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.distanceText}>📍 {formatDistance(donor.distance)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => Linking.openURL(`tel:${donor.phone}`)}
                >
                  <Text style={styles.callBtnText}>📞 {t('bloodDonor.callDonor')}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'register' && (
          <View>
            {alreadyRegistered && (
              <View style={styles.registeredBanner}>
                <Text style={styles.registeredText}>✅ {t('bloodDonor.registerAsDonor')}</Text>
              </View>
            )}

            <Text style={styles.fieldLabel}>{t('onboarding.fullName')}</Text>
            <TextInput
              style={styles.input}
              value={regName}
              onChangeText={setRegName}
              placeholder={t('onboarding.namePlaceholder')}
              editable={!alreadyRegistered}
            />

            <Text style={styles.fieldLabel}>{t('settings.phoneNumber')}</Text>
            <TextInput
              style={styles.input}
              value={regPhone}
              onChangeText={setRegPhone}
              placeholder="98XXXXXXXX"
              keyboardType="phone-pad"
              editable={!alreadyRegistered}
            />

            <Text style={styles.fieldLabel}>{t('settings.qualification')}</Text>
            <BloodTypeGrid selected={regBloodType} onSelect={setRegBloodType} />

            <View style={styles.availableRow}>
              <View style={styles.availableInfo}>
                <Text style={styles.availableLabel}>{t('bloodDonor.iAmAvailable')}</Text>
              </View>
              <Switch
                value={regAvailable}
                onValueChange={setRegAvailable}
                trackColor={{ false: '#ccc', true: BLOOD_RED }}
                thumbColor={regAvailable ? BLOOD_RED : '#f4f3f4'}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, registering && styles.disabledBtn]}
              onPress={registerDonor}
              disabled={registering}
            >
              {registering ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {alreadyRegistered ? t('common.save') : t('bloodDonor.registerAsDonor')}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>
                {t('bloodDonor.lastDonated')}: 90 {t('common.optional')}{'\n'}
                • {t('fallback.callDirectly')}
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
    backgroundColor: BLOOD_RED,
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
  tabActive: { borderBottomColor: BLOOD_RED },
  tabText: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.lightText },
  tabTextActive: { color: BLOOD_RED },
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
  bloodTypeBtnSelected: { borderColor: BLOOD_RED, backgroundColor: '#FFF0F0' },
  bloodTypeBtnText: { fontSize: fontSizes.lg, fontWeight: '800', color: colors.lightText },
  bloodTypeBtnTextSelected: { color: BLOOD_RED },
  primaryBtn: {
    backgroundColor: BLOOD_RED,
    borderRadius: borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: minTouchTarget,
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: BLOOD_RED,
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
    backgroundColor: BLOOD_RED,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  bloodBadgeText: { color: colors.white, fontSize: fontSizes.sm, fontWeight: '800' },
  donorName: { fontSize: fontSizes.md, fontWeight: '700', color: colors.darkText },
  availBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: borderRadius.full },
  availText: { color: colors.white, fontSize: fontSizes.xs, fontWeight: '600' },
  distanceText: { fontSize: fontSizes.sm, color: colors.lightText },
  callBtn: {
    backgroundColor: BLOOD_RED,
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
  disclaimer: {
    backgroundColor: '#F5F5F5',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  disclaimerText: { fontSize: fontSizes.xs, color: colors.lightText, lineHeight: 18 },
});
