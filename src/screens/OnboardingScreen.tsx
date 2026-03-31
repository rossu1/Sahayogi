import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase, TABLES } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../hooks/useLanguage';
import { LanguageToggle } from '../components/LanguageToggle';
import { colors, fontSizes, spacing, borderRadius, minTouchTarget } from '../constants/theme';
import { Qualification } from '../types';

type Step = 'phone' | 'otp' | 'profile';

const QUALIFICATIONS: Qualification[] = [
  'doctor', 'nurse', 'medical_student', 'anm', 'first_aid_trained', 'none',
];

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { loginAsGuest } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [qualification, setQualification] = useState<Qualification>('none');
  const [loading, setLoading] = useState(false);

  const sendOTP = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      Alert.alert('', t('onboarding.invalidPhone'));
      return;
    }
    setLoading(true);
    const formatted = `+977${cleaned}`;
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setStep('otp');
    }
  };

  const verifyOTP = async () => {
    if (otp.length < 4) {
      Alert.alert('', t('onboarding.invalidOTP'));
      return;
    }
    setLoading(true);
    const formatted = `+977${phone.replace(/\D/g, '')}`;
    const { error } = await supabase.auth.verifyOtp({
      phone: formatted,
      token: otp,
      type: 'sms',
    });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setStep('profile');
    }
  };

  const saveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('', t('onboarding.namePlaceholder'));
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    await supabase.from(TABLES.USERS).upsert({
      id: user.id,
      phone: phone.replace(/\D/g, ''),
      full_name: name.trim(),
      qualification,
      role: qualification !== 'none' ? 'responder' : 'public',
      language_preference: language,
    });
    setLoading(false);
    onComplete();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <LanguageToggle language={language} onToggle={setLanguage} />
        </View>

        <Text style={styles.appName}>{t('appName')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>

        {step === 'phone' && (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>{t('onboarding.enterPhone')}</Text>
            <View style={styles.phoneRow}>
              <View style={styles.countryCode}>
                <Text style={styles.countryText}>🇳🇵 +977</Text>
              </View>
              <TextInput
                style={[styles.input, styles.phoneInput]}
                placeholder={t('onboarding.phonePlaceholder')}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.disabledBtn]}
              onPress={sendOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>{t('onboarding.sendOTP')}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('common.or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.skipBtn} onPress={loginAsGuest}>
              <Text style={styles.skipBtnText}>
                {language === 'ne' ? '🧪 परीक्षणको लागि सिधै प्रवेश' : '🧪 Skip login for testing'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'otp' && (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>{t('onboarding.enterOTP')}</Text>
            <Text style={styles.otpSent}>
              {t('onboarding.otpSent')}: +977{phone}
            </Text>
            <TextInput
              style={[styles.input, styles.otpInput]}
              placeholder="------"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.disabledBtn]}
              onPress={verifyOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>{t('onboarding.verify')}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setStep('phone'); setOtp(''); }} style={styles.linkBtn}>
              <Text style={styles.linkText}>{t('onboarding.resendOTP')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'profile' && (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>{t('onboarding.setupProfile')}</Text>
            <Text style={styles.fieldLabel}>{t('onboarding.fullName')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('onboarding.namePlaceholder')}
              value={name}
              onChangeText={setName}
              autoFocus
            />
            <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>
              {t('onboarding.selectQualification')}
            </Text>
            <View style={styles.qualGrid}>
              {QUALIFICATIONS.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[
                    styles.qualOption,
                    qualification === q && styles.qualSelected,
                  ]}
                  onPress={() => setQualification(q)}
                >
                  <Text
                    style={[
                      styles.qualText,
                      qualification === q && styles.qualSelectedText,
                    ]}
                  >
                    {t(`settings.qualifications.${q}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.primaryBtn, { marginTop: spacing.lg }, loading && styles.disabledBtn]}
              onPress={saveProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>{t('onboarding.getStarted')}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Emergency fallback always visible */}
        <View style={styles.emergencyBar}>
          <Text style={styles.emergencyBarText}>
            {t('fallback.ambulance')} • {t('fallback.police')} • {t('fallback.fire')}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: spacing.lg },
  header: { alignItems: 'flex-end', marginBottom: spacing.lg },
  appName: {
    fontSize: fontSizes.hero,
    fontWeight: '900',
    color: colors.emergencyRed,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: colors.lightText,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: spacing.lg,
  },
  stepTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.darkText,
    marginBottom: spacing.md,
  },
  phoneRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  countryCode: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  countryText: { fontSize: fontSizes.md, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: fontSizes.md,
    color: colors.darkText,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
    minHeight: minTouchTarget,
  },
  phoneInput: { flex: 1, marginBottom: 0 },
  otpInput: {
    fontSize: fontSizes.xxl,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: spacing.md,
  },
  otpSent: { fontSize: fontSizes.sm, color: colors.lightText, marginBottom: spacing.md },
  primaryBtn: {
    backgroundColor: colors.emergencyRed,
    borderRadius: borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: minTouchTarget,
    justifyContent: 'center',
  },
  disabledBtn: { backgroundColor: '#9E9E9E' },
  primaryBtnText: { color: colors.white, fontSize: fontSizes.lg, fontWeight: '700' },
  linkBtn: { alignItems: 'center', marginTop: spacing.sm, paddingVertical: 8 },
  linkText: { color: colors.policeBlue, fontSize: fontSizes.sm },
  fieldLabel: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.lightText, marginBottom: spacing.xs },
  qualGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  qualOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  qualSelected: { borderColor: colors.emergencyRed, backgroundColor: '#FFF0F0' },
  qualText: { fontSize: fontSizes.sm, color: colors.lightText },
  qualSelectedText: { color: colors.emergencyRed, fontWeight: '700' },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    gap: spacing.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: fontSizes.xs, color: colors.lightText },
  skipBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: minTouchTarget,
    justifyContent: 'center',
    backgroundColor: '#F9F9F9',
  },
  skipBtnText: { color: colors.lightText, fontSize: fontSizes.sm, fontWeight: '600' },
  emergencyBar: {
    backgroundColor: '#1A1A1A',
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: 'auto',
  },
  emergencyBarText: { color: colors.white, textAlign: 'center', fontSize: fontSizes.xs },
});
