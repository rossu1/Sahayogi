import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../hooks/useLanguage';
import { useShakeDetect } from '../hooks/useShakeDetect';
import { useResponder } from '../hooks/useResponder';
import { LanguageToggle } from '../components/LanguageToggle';
import { colors, fontSizes, spacing, borderRadius } from '../constants/theme';

// Minimum touch targets — primary: 96px, secondary: 72px, utility: 64px
const H_PRIMARY = 112;
const H_SECONDARY = 80;
const H_UTILITY = 64;

interface HomeScreenProps {
  navigation: any;
}

interface EmergencyAction {
  labelNe: string;
  labelEn: string;
  color: string;
  route: string;
  routeParams?: object;
  icon: string;
}

const PRIMARY_ACTION: EmergencyAction = {
  labelNe: 'स्वास्थ्य आपतकाल',
  labelEn: 'Health Emergency',
  color: colors.emergencyRed,
  route: 'HealthEmergency',
  icon: '🚨',
};

const ROW_ACTIONS: EmergencyAction[] = [
  {
    labelNe: 'प्रहरी सूचना',
    labelEn: 'Police Alert',
    color: colors.policeBlue,
    route: 'PoliceAlert',
    icon: '🚔',
  },
  {
    labelNe: 'आगो / अन्य',
    labelEn: 'Fire / Other',
    color: colors.fireOrange,
    route: 'HealthEmergency',
    routeParams: { type: 'fire' },
    icon: '🔥',
  },
];

const BLOOD_ACTION: EmergencyAction = {
  labelNe: 'रगत दाता',
  labelEn: 'Blood Donor',
  color: '#C62828',
  route: 'BloodDonor',
  icon: '🩸',
};

const QUICK_DIAL = [
  { number: '102', labelNe: 'एम्बुलेन्स', labelEn: 'Ambulance', icon: '🚑', color: colors.emergencyRed },
  { number: '100', labelNe: 'प्रहरी', labelEn: 'Police', icon: '🚔', color: colors.policeBlue },
  { number: '101', labelNe: 'दमकल', labelEn: 'Fire', icon: '🚒', color: colors.fireOrange },
];

const UTILITIES = [
  { icon: '🏥', labelNe: 'अस्पताल', labelEn: 'Hospitals', route: 'Hospitals' },
  { icon: '🩺', labelNe: 'प्राथमिक उपचार', labelEn: 'First Aid', route: 'FirstAid' },
  { icon: '⚙️', labelNe: 'सेटिङ', labelEn: 'Settings', route: 'Settings' },
];

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { user, refreshUser } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { toggleDuty } = useResponder(user?.id);
  const [onDuty, setOnDuty] = useState(user?.is_active_responder ?? false);
  const [shakeEnabled] = useState(false);
  const [shakeCountdown, setShakeCountdown] = useState<number | null>(null);

  const isNe = language === 'ne';
  const isResponder = user?.role === 'responder' || user?.role === 'admin';

  const handleShake = useCallback(() => {
    let count = 5;
    setShakeCountdown(count);
    const interval = setInterval(() => {
      count -= 1;
      setShakeCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        setShakeCountdown(null);
        navigation.navigate('PoliceAlert', { preselect: 'fight' });
      }
    }, 1000);
  }, [navigation]);

  useShakeDetect(shakeEnabled, handleShake);

  const toggleResponderDuty = async (val: boolean) => {
    setOnDuty(val);
    await toggleDuty(val);
    await refreshUser();
  };

  const navigate = (route: string, params?: object) =>
    navigation.navigate(route, params);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />

      {/* ── Fixed header ── */}
      <SafeAreaView edges={['top']} style={styles.headerWrap}>
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>{isNe ? 'सहायोगी' : 'Sahayogi'}</Text>
            <Text style={styles.appSub}>{isNe ? 'आपतकालीन प्रतिक्रिया' : 'Emergency Response'}</Text>
          </View>
          <LanguageToggle language={language} onToggle={setLanguage} />
        </View>

        {/* On-duty badge — only shown when active */}
        {isResponder && onDuty && (
          <View style={styles.onDutyStrip}>
            <View style={styles.pulseDot} />
            <Text style={styles.onDutyText}>
              {isNe ? 'ड्युटीमा — सक्रिय' : 'On duty — Active'}
            </Text>
          </View>
        )}
      </SafeAreaView>

      {/* ── Scrollable body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Primary: Health Emergency */}
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: PRIMARY_ACTION.color }]}
          onPress={() => navigate(PRIMARY_ACTION.route)}
          activeOpacity={0.85}
        >
          <Text style={styles.btnIcon}>{PRIMARY_ACTION.icon}</Text>
          <View style={styles.btnLabels}>
            <Text style={styles.btnLabelPrimary}>
              {isNe ? PRIMARY_ACTION.labelNe : PRIMARY_ACTION.labelEn}
            </Text>
            <Text style={styles.btnLabelSecondary}>
              {isNe ? PRIMARY_ACTION.labelEn : PRIMARY_ACTION.labelNe}
            </Text>
          </View>
          <View style={styles.chevron}>
            <Text style={styles.chevronText}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Police + Fire row */}
        <View style={styles.row}>
          {ROW_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.route + (action.routeParams ? JSON.stringify(action.routeParams) : '')}
              style={[styles.rowBtn, { backgroundColor: action.color }]}
              onPress={() => navigate(action.route, action.routeParams)}
              activeOpacity={0.85}
            >
              <Text style={styles.rowBtnIcon}>{action.icon}</Text>
              <Text style={styles.rowBtnLabelPrimary}>
                {isNe ? action.labelNe : action.labelEn}
              </Text>
              <Text style={styles.rowBtnLabelSecondary}>
                {isNe ? action.labelEn : action.labelNe}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Blood Donor */}
        <TouchableOpacity
          style={[styles.bloodBtn, { backgroundColor: BLOOD_ACTION.color }]}
          onPress={() => navigate(BLOOD_ACTION.route)}
          activeOpacity={0.85}
        >
          <Text style={styles.rowBtnIcon}>{BLOOD_ACTION.icon}</Text>
          <View style={styles.btnLabels}>
            <Text style={styles.btnLabelPrimary}>
              {isNe ? BLOOD_ACTION.labelNe : BLOOD_ACTION.labelEn}
            </Text>
            <Text style={styles.btnLabelSecondary}>
              {isNe ? BLOOD_ACTION.labelEn : BLOOD_ACTION.labelNe}
            </Text>
          </View>
          <View style={styles.chevron}>
            <Text style={styles.chevronText}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Responder duty toggle */}
        {isResponder && (
          <View style={[styles.dutyCard, onDuty && styles.dutyCardActive]}>
            <View style={styles.dutyInfo}>
              <Text style={[styles.dutyTitle, onDuty && styles.dutyTitleActive]}>
                {isNe ? 'म प्रतिक्रियाकर्ता हुँ' : 'I am a Responder'}
              </Text>
              <Text style={styles.dutyStatus}>
                {onDuty
                  ? (isNe ? 'अहिले ड्युटीमा छु' : 'Currently on duty')
                  : (isNe ? 'ड्युटी सुरु गर्नुहोस्' : 'Go on duty')}
              </Text>
            </View>
            <Switch
              value={onDuty}
              onValueChange={toggleResponderDuty}
              trackColor={{ false: '#D0D0D0', true: colors.safeGreen }}
              thumbColor={onDuty ? '#FFFFFF' : '#FFFFFF'}
              ios_backgroundColor="#D0D0D0"
            />
          </View>
        )}

        {/* Utility row */}
        <View style={styles.utilRow}>
          {UTILITIES.map((u) => (
            <TouchableOpacity
              key={u.route}
              style={styles.utilBtn}
              onPress={() => navigate(u.route)}
              activeOpacity={0.75}
            >
              <View style={styles.utilIconWrap}>
                <Text style={styles.utilIcon}>{u.icon}</Text>
              </View>
              <Text style={styles.utilLabel} numberOfLines={2}>
                {isNe ? u.labelNe : u.labelEn}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* ── Fixed bottom quick-dial bar ── */}
      <SafeAreaView edges={['bottom']} style={styles.quickDialWrap}>
        <View style={styles.quickDialBar}>
          {QUICK_DIAL.map((d) => (
            <TouchableOpacity
              key={d.number}
              style={styles.quickDialBtn}
              onPress={() => Linking.openURL(`tel:${d.number}`)}
              activeOpacity={0.8}
            >
              <Text style={styles.quickDialIcon}>{d.icon}</Text>
              <Text style={[styles.quickDialNumber, { color: d.color }]}>{d.number}</Text>
              <Text style={styles.quickDialLabel}>
                {isNe ? d.labelNe : d.labelEn}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {/* ── Shake countdown overlay ── */}
      {shakeCountdown !== null && (
        <View style={styles.shakeOverlay}>
          <Text style={styles.shakeCount}>{shakeCountdown}</Text>
          <Text style={styles.shakeLabel}>
            {isNe ? 'प्रहरी सूचना पठाइँदैछ' : 'Sending police alert…'}
          </Text>
          <TouchableOpacity
            style={styles.shakeCancelBtn}
            onPress={() => setShakeCountdown(null)}
          >
            <Text style={styles.shakeCancelText}>
              {isNe ? 'रद्द गर्नुहोस्' : 'Cancel'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#121212' },

  // ── Header ──
  headerWrap: { backgroundColor: '#1A1A1A' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  appName: {
    fontSize: fontSizes.xl,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  appSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  onDutyStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.safeGreen,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    gap: 8,
  },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  onDutyText: { fontSize: 13, color: '#FFFFFF', fontWeight: '700', letterSpacing: 0.3 },

  // ── Scroll body ──
  scroll: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },

  // ── Primary health button ──
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: H_PRIMARY,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    shadowColor: colors.emergencyRed,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  btnIcon: { fontSize: 36 },
  btnLabels: { flex: 1 },
  btnLabelPrimary: {
    fontSize: fontSizes.xl,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 26,
  },
  btnLabelSecondary: {
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronText: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', lineHeight: 26 },

  // ── Police + Fire row ──
  row: { flexDirection: 'row', gap: spacing.sm },
  rowBtn: {
    flex: 1,
    minHeight: H_SECONDARY,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  rowBtnIcon: { fontSize: 28, marginBottom: 4 },
  rowBtnLabelPrimary: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  rowBtnLabelSecondary: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 1,
  },

  // ── Blood donor button ──
  bloodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: H_UTILITY + 8,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
    shadowColor: '#C62828',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  divider: { height: 1, backgroundColor: '#E8E8E8', marginVertical: spacing.xs },

  // ── Responder duty card ──
  dutyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    gap: spacing.md,
  },
  dutyCardActive: {
    borderColor: colors.safeGreen,
    backgroundColor: '#F1FBF4',
  },
  dutyInfo: { flex: 1 },
  dutyTitle: { fontSize: fontSizes.md, fontWeight: '700', color: colors.darkText },
  dutyTitleActive: { color: colors.safeGreen },
  dutyStatus: { fontSize: fontSizes.sm, color: colors.lightText, marginTop: 2 },

  // ── Utility row ──
  utilRow: { flexDirection: 'row', gap: spacing.sm },
  utilBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: H_UTILITY,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    gap: 4,
  },
  utilIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  utilIcon: { fontSize: 20 },
  utilLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.darkText,
    textAlign: 'center',
    lineHeight: 14,
  },

  // ── Quick-dial bottom bar ──
  quickDialWrap: { backgroundColor: '#1A1A1A' },
  quickDialBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  quickDialBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
    backgroundColor: '#2A2A2A',
    minHeight: H_UTILITY,
    justifyContent: 'center',
    gap: 2,
  },
  quickDialIcon: { fontSize: 18 },
  quickDialNumber: {
    fontSize: fontSizes.lg,
    fontWeight: '900',
    lineHeight: 22,
  },
  quickDialLabel: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '500' },

  // ── Shake overlay ──
  shakeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(21,101,192,0.97)',
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  shakeCount: { fontSize: 120, fontWeight: '900', color: '#FFFFFF', lineHeight: 130 },
  shakeLabel: {
    fontSize: fontSizes.lg,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  shakeCancelBtn: {
    marginTop: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.full,
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  shakeCancelText: { color: colors.policeBlue, fontSize: fontSizes.md, fontWeight: '800' },
});
