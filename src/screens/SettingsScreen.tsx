import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../hooks/useLanguage';
import { supabase, TABLES } from '../lib/supabase';
import { colors, fontSizes, spacing, borderRadius, minTouchTarget } from '../constants/theme';
import { Qualification, EmergencyContact } from '../types';

const QUALIFICATIONS: Qualification[] = [
  'doctor', 'nurse', 'medical_student', 'anm', 'first_aid_trained', 'none',
];

const SHAKE_KEY = '@sahayogi_shake';

interface Props { navigation: any }

export default function SettingsScreen({ navigation }: Props) {
  const { user, signOut, refreshUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const isNe = language === 'ne';
  const [shakeEnabled, setShakeEnabled] = useState(false);
  const [qualification, setQualification] = useState<Qualification>(
    (user?.qualification as Qualification) ?? 'none'
  );
  const [saving, setSaving] = useState(false);
  const isTrained = qualification !== 'none';
  const contacts: EmergencyContact[] = (user?.emergency_contacts as EmergencyContact[]) ?? [];

  useEffect(() => {
    AsyncStorage.getItem(SHAKE_KEY).then((v) => setShakeEnabled(v === 'true'));
  }, []);

  const toggleShake = async (val: boolean) => {
    setShakeEnabled(val);
    await AsyncStorage.setItem(SHAKE_KEY, String(val));
  };

  const saveQualification = async (q: Qualification) => {
    setQualification(q);
    setSaving(true);
    await supabase
      .from(TABLES.USERS)
      .update({ qualification: q, role: q !== 'none' ? 'responder' : 'public' })
      .eq('id', user?.id ?? '');
    await refreshUser();
    setSaving(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      isNe ? 'साइन आउट' : 'Sign out',
      isNe ? 'के तपाईं पक्का साइन आउट गर्न चाहनुहुन्छ?' : 'Are you sure you want to sign out?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: isNe ? 'साइन आउट' : 'Sign out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.title')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Language */}
        <Text style={styles.sectionHeader}>{t('settings.language')}</Text>
        <View style={styles.card}>
          <View style={styles.langRow}>
            {(['ne', 'en'] as const).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.langOption, language === lang && styles.langSelected]}
                onPress={() => setLanguage(lang)}
              >
                <Text style={[styles.langText, language === lang && styles.langTextSelected]}>
                  {lang === 'ne' ? t('settings.nepali') : t('settings.english')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Shake to Alert */}
        <Text style={styles.sectionHeader}>{t('settings.shakeToAlert')}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('settings.shakeDescription')}</Text>
            <Switch
              value={shakeEnabled}
              onValueChange={toggleShake}
              trackColor={{ false: '#ccc', true: colors.policeBlue }}
            />
          </View>
        </View>

        {/* I am trained — passive registration */}
        <Text style={styles.sectionHeader}>
          {isNe ? 'म प्रशिक्षित छु' : 'I am trained'}
        </Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>
              {isNe ? 'प्राथमिक उपचार तालिम छ' : 'I have first aid training'}
            </Text>
            <Switch
              value={isTrained}
              onValueChange={(val) =>
                saveQualification(val ? 'first_aid_trained' : 'none')
              }
              trackColor={{ false: '#ccc', true: colors.safeGreen }}
            />
          </View>

          {isTrained && (
            <>
              <View style={styles.qualDivider} />
              <Text style={styles.qualLabel}>{t('settings.qualification')}</Text>
              <View style={styles.qualGrid}>
                {QUALIFICATIONS.filter((q) => q !== 'none').map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={[styles.qualOption, qualification === q && styles.qualSelected]}
                    onPress={() => saveQualification(q)}
                  >
                    <Text style={[styles.qualText, qualification === q && styles.qualSelectedText]}>
                      {t(`settings.qualifications.${q}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.trainedBanner}>
                <Text style={styles.trainedBannerText}>
                  ✅ {isNe
                    ? 'तपाईं हाम्रो प्रशिक्षित सहयोगी नेटवर्कमा हुनुहुन्छ'
                    : 'You are part of our trained helper network'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Emergency Contacts */}
        <Text style={styles.sectionHeader}>
          {isNe ? 'आपतकालीन सम्पर्क' : 'Emergency Contacts'}
        </Text>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('EmergencyContacts')}
          activeOpacity={0.7}
        >
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>
                {contacts.length > 0
                  ? contacts.map((c) => c.name).join(', ')
                  : (isNe ? 'सम्पर्क थप्नुहोस्' : 'Add contacts')}
              </Text>
              <Text style={styles.hintText}>
                {isNe ? 'आपतकालमा स्वतः सूचित गरिन्छ' : 'Notified automatically in emergencies'}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Phone */}
        <Text style={styles.sectionHeader}>{t('settings.phoneNumber')}</Text>
        <View style={styles.card}>
          <Text style={styles.phoneText}>{user?.phone ?? '—'}</Text>
        </View>

        {/* About */}
        <Text style={styles.sectionHeader}>{t('settings.about')}</Text>
        <View style={styles.card}>
          <Text style={styles.aboutText}>{t('settings.aboutText')}</Text>
          <Text style={styles.version}>{t('settings.version')}: 1.0.0</Text>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>
            {isNe ? 'साइन आउट' : 'Sign Out'}
          </Text>
        </TouchableOpacity>

        {/* Emergency fallback */}
        <View style={styles.emergencyBar}>
          <Text style={styles.emergencyBarText}>
            {t('fallback.ambulance')} • {t('fallback.police')} • {t('fallback.fire')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkText,
    paddingTop: 48,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  title: { color: colors.white, fontSize: fontSizes.xl, fontWeight: '800' },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  sectionHeader: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.lightText,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { flex: 1, fontSize: fontSizes.sm, color: colors.darkText, marginRight: spacing.sm },
  hintText: { fontSize: 11, color: colors.lightText, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.lightText, fontWeight: '700' },
  langRow: { flexDirection: 'row', gap: spacing.sm },
  langOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    minHeight: minTouchTarget,
    justifyContent: 'center',
  },
  langSelected: { borderColor: colors.emergencyRed, backgroundColor: '#FFF0F0' },
  langText: { fontSize: fontSizes.md, color: colors.lightText, fontWeight: '600' },
  langTextSelected: { color: colors.emergencyRed, fontWeight: '800' },

  qualDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: spacing.sm },
  qualLabel: { fontSize: 12, fontWeight: '700', color: colors.lightText, marginBottom: spacing.xs },
  qualGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  qualOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  qualSelected: { borderColor: colors.safeGreen, backgroundColor: '#E8F5E9' },
  qualText: { fontSize: fontSizes.sm, color: colors.lightText },
  qualSelectedText: { color: colors.safeGreen, fontWeight: '700' },

  trainedBanner: {
    backgroundColor: '#E8F5E9',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  trainedBannerText: { fontSize: 12, color: colors.safeGreen, fontWeight: '600', textAlign: 'center' },

  phoneText: { fontSize: fontSizes.md, color: colors.darkText },
  aboutText: { fontSize: fontSizes.sm, color: colors.darkText, lineHeight: 22 },
  version: { fontSize: fontSizes.xs, color: colors.lightText, marginTop: spacing.sm },
  signOutBtn: {
    marginTop: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.emergencyRed,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: minTouchTarget,
    justifyContent: 'center',
  },
  signOutText: { color: colors.emergencyRed, fontSize: fontSizes.md, fontWeight: '700' },
  emergencyBar: {
    backgroundColor: '#1A1A1A',
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  emergencyBarText: { color: colors.white, textAlign: 'center', fontSize: fontSizes.xs },
});
