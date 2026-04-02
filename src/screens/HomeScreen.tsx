import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../hooks/useLanguage';
import { useShakeDetect } from '../hooks/useShakeDetect';
import { supabase, TABLES } from '../lib/supabase';
import { EmergencyContact } from '../types';
import { colors, fontSizes, spacing, borderRadius } from '../constants/theme';

interface HomeScreenProps { navigation: any; }

// ── Emergency action data ─────────────────────────────────────────────────────
interface ActionCard {
  labelNe: string;
  labelEn: string;
  accentColor: string;
  icon: string;
  route: string;
  routeParams?: object;
}

const MAIN_ACTIONS: ActionCard[] = [
  {
    labelNe: 'स्वास्थ्य आपतकाल',
    labelEn: 'Health Emergency',
    accentColor: colors.emergencyRed,
    icon: '♥',
    route: 'HealthEmergency',
  },
  {
    labelNe: 'प्रहरी सूचना',
    labelEn: 'Police Alert',
    accentColor: colors.policeBlue,
    icon: '⛨',
    route: 'PoliceAlert',
  },
  {
    labelNe: 'आगो / अन्य',
    labelEn: 'Fire / Other',
    accentColor: colors.fireOrange,
    icon: '🔥',
    route: 'HealthEmergency',
    routeParams: { type: 'fire' },
  },
];

const SECONDARY_ACTIONS: ActionCard[] = [
  {
    labelNe: 'रगत दाता',
    labelEn: 'Blood Donor',
    accentColor: colors.bloodRed,
    icon: '💧',
    route: 'BloodDonor',
  },
  {
    labelNe: 'अस्पताल',
    labelEn: 'Hospital',
    accentColor: colors.safeGreen,
    icon: '🏥',
    route: 'HospitalFinder',
  },
];

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [shakeEnabled] = useState(false);
  const [shakeCountdown, setShakeCountdown] = useState<number | null>(null);
  const [trainedCount, setTrainedCount] = useState<number | null>(null);

  const isNe = language === 'ne';
  const contacts: EmergencyContact[] = (user?.emergency_contacts as EmergencyContact[]) ?? [];

  useEffect(() => {
    (async () => {
      const { count, error } = await supabase
        .from(TABLES.USERS)
        .select('*', { count: 'exact', head: true })
        .neq('qualification', 'none');
      if (!error && count != null) setTrainedCount(count);
    })();
  }, []);

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

  const navigate = (route: string, params?: object) =>
    navigation.navigate(route, params);

  const initials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  // ── Render action card ──────────────────────────────────────────────────────
  function renderCard(action: ActionCard, key: string) {
    return (
      <TouchableOpacity
        key={key}
        style={[styles.actionCard, { borderLeftColor: action.accentColor }]}
        onPress={() => navigate(action.route, action.routeParams)}
        activeOpacity={0.7}
      >
        <View style={[styles.cardIcon, { backgroundColor: `${action.accentColor}20` }]}>
          <Text style={[styles.cardIconText, { color: action.accentColor }]}>
            {action.icon}
          </Text>
        </View>
        <View style={styles.cardLabels}>
          <Text style={styles.cardTitle}>
            {isNe ? action.labelNe : action.labelEn}
          </Text>
          <Text style={styles.cardSubtitle}>
            {isNe ? action.labelEn : action.labelNe}
          </Text>
        </View>
        <Text style={styles.cardChevron}>›</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />

      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerWrap}>
        <View style={styles.header}>
          <Text style={styles.appName}>
            {isNe ? 'सहायोगी' : 'Sahayogi'}
          </Text>
          {/* Language toggle pills */}
          <View style={styles.langToggle}>
            <TouchableOpacity
              style={[styles.langBtn, language === 'ne' && styles.langBtnActive]}
              onPress={() => setLanguage('ne')}
            >
              <Text style={[styles.langBtnText, language === 'ne' && styles.langBtnTextActive]}>
                ने
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>
                En
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Scrollable body */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section title */}
        <Text style={styles.sectionTitle}>
          {isNe ? 'के भयो?' : 'What happened?'}
        </Text>

        {/* Main emergency cards */}
        {MAIN_ACTIONS.map((a) =>
          renderCard(a, a.route + (a.routeParams ? 'fire' : '')),
        )}

        {/* Secondary row */}
        <View style={styles.secondaryRow}>
          {SECONDARY_ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.route}
              style={[styles.secondaryCard, { borderLeftColor: a.accentColor }]}
              onPress={() => navigate(a.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.secondaryIcon, { backgroundColor: `${a.accentColor}20` }]}>
                <Text style={[styles.secondaryIconText, { color: a.accentColor }]}>
                  {a.icon}
                </Text>
              </View>
              <Text style={styles.secondaryTitle}>
                {isNe ? a.labelNe : a.labelEn}
              </Text>
              <Text style={styles.secondarySubtitle}>
                {isNe ? a.labelEn : a.labelNe}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Emergency Contacts card */}
        <TouchableOpacity
          style={[
            styles.contactsCard,
            contacts.length === 0 && styles.contactsCardDashed,
          ]}
          onPress={() => navigate('EmergencyContacts')}
          activeOpacity={0.7}
        >
          {contacts.length === 0 ? (
            <View style={styles.contactsEmpty}>
              <Text style={styles.contactsEmptyTitle}>
                + {isNe ? 'आपतकालीन सम्पर्क थप्नुहोस्' : 'Add emergency contact'}
              </Text>
              <Text style={styles.contactsEmptySub}>
                {isNe ? 'तपाईंको भरोसाका मान्छेहरू' : 'Your trusted people'}
              </Text>
            </View>
          ) : (
            <View style={styles.contactsFilled}>
              <View style={styles.contactsHeader}>
                <Text style={styles.contactsTitle}>
                  {isNe ? 'आपतकालीन सम्पर्क' : 'Emergency Contacts'}
                </Text>
                <Text style={styles.contactsChevron}>›</Text>
              </View>
              <View style={styles.contactAvatarRow}>
                {contacts.map((c, i) => (
                  <View key={`${c.phone}-${i}`} style={styles.avatarWrap}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initials(c.name)}</Text>
                    </View>
                    <Text style={styles.avatarName} numberOfLines={1}>
                      {c.name.split(' ')[0]}
                    </Text>
                  </View>
                ))}
                {contacts.length < 3 && (
                  <View style={styles.avatarWrap}>
                    <View style={styles.avatarAdd}>
                      <Text style={styles.avatarAddText}>+</Text>
                    </View>
                    <Text style={styles.avatarName}>{isNe ? 'थप' : 'Add'}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Community counter */}
        {trainedCount != null && trainedCount > 0 && (
          <Text style={styles.communityText}>
            {isNe
              ? `• ${trainedCount} जना प्रशिक्षित सहयोगीहरू काठमाडौंमा •`
              : `• ${trainedCount} trained helpers in Kathmandu •`}
          </Text>
        )}
      </ScrollView>

      {/* Shake overlay */}
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
  root: { flex: 1, backgroundColor: colors.bgPrimary },

  // Header
  headerWrap: { backgroundColor: colors.bgPrimary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  appName: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: colors.emergencyRed,
  },
  langToggle: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.full,
    padding: 3,
  },
  langBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  langBtnActive: { backgroundColor: '#FFFFFF' },
  langBtnText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  langBtnTextActive: { color: colors.bgPrimary, fontWeight: '700' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },

  // ── Action cards ──
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderLeftWidth: 4,
    borderRadius: borderRadius.lg,
    padding: 20,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: { fontSize: 28 },
  cardLabels: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  cardSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  cardChevron: { fontSize: 24, color: colors.textMuted, fontWeight: '700' },

  // ── Secondary row (2-up) ──
  secondaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  secondaryCard: {
    flex: 1,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderLeftWidth: 4,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  secondaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  secondaryIconText: { fontSize: 22 },
  secondaryTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  secondarySubtitle: { fontSize: 12, color: colors.textSecondary },

  // ── Contacts card ──
  contactsCard: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  contactsCardDashed: {
    borderStyle: 'dashed',
    borderColor: colors.borderMedium,
  },
  contactsEmpty: { alignItems: 'center', paddingVertical: spacing.md },
  contactsEmptyTitle: { fontSize: 15, fontWeight: '700', color: colors.textMuted },
  contactsEmptySub: { fontSize: 12, color: colors.textDim, marginTop: 4 },

  contactsFilled: { gap: spacing.sm },
  contactsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contactsTitle: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  contactsChevron: { fontSize: 22, color: colors.textMuted, fontWeight: '700' },

  contactAvatarRow: { flexDirection: 'row', gap: spacing.md },
  avatarWrap: { alignItems: 'center', gap: 4 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.emergencyRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  avatarName: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  avatarAdd: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.borderMedium,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarAddText: { fontSize: 20, color: colors.borderMedium, fontWeight: '700' },

  // Community counter
  communityText: {
    fontSize: 12,
    color: colors.textDim,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },

  // Shake overlay
  shakeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(59,130,246,0.97)',
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
