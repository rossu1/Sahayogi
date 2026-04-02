import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, TABLES } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../hooks/useLanguage';
import { colors, fontSizes, spacing, borderRadius, minTouchTarget } from '../constants/theme';
import { Qualification } from '../types';

type Step = 'phone' | 'otp' | 'profile';

const QUALIFICATIONS: Qualification[] = [
  'doctor', 'nurse', 'medical_student', 'anm', 'first_aid_trained', 'none',
];

// ── Pulse ring component ──────────────────────────────────────────────────────
function PulseRing() {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createPulse = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );

    createPulse(pulse1, 0).start();
    createPulse(pulse2, 1000).start();
  }, [pulse1, pulse2]);

  const ringStyle = (val: Animated.Value) => ({
    position: 'absolute' as const,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.emergencyRed,
    opacity: val.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
    transform: [
      { scale: val.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] }) },
    ],
  });

  return (
    <View style={pulseStyles.container}>
      <Animated.View style={ringStyle(pulse1)} />
      <Animated.View style={ringStyle(pulse2)} />
    </View>
  );
}

const pulseStyles = StyleSheet.create({
  container: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
});

// ── Component ─────────────────────────────────────────────────────────────────
export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { loginAsGuest } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const isNe = language === 'ne';
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [qualification, setQualification] = useState<Qualification>('none');
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

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
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Top section: Logo + tagline ── */}
          <View style={styles.topSection}>
            <PulseRing />
            <Text style={styles.appName}>सहायोगी</Text>
            <Text style={styles.subtitle}>
              काठमाडौंको आपतकालीन साथी
            </Text>

            {/* Service pills */}
            <View style={styles.pillRow}>
              <View style={[styles.pill, { backgroundColor: 'rgba(220,38,38,0.15)' }]}>
                <View style={[styles.pillDot, { backgroundColor: colors.emergencyRed }]} />
                <Text style={styles.pillText}>Health</Text>
              </View>
              <View style={[styles.pill, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                <View style={[styles.pillDot, { backgroundColor: colors.policeBlue }]} />
                <Text style={styles.pillText}>Police</Text>
              </View>
              <View style={[styles.pill, { backgroundColor: 'rgba(249,115,22,0.15)' }]}>
                <View style={[styles.pillDot, { backgroundColor: colors.fireOrange }]} />
                <Text style={styles.pillText}>Fire</Text>
              </View>
            </View>
          </View>

          {/* ── Middle section: Auth form ── */}
          {step === 'phone' && (
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>
                {isNe ? 'आफ्नो फोन नम्बर दिनुहोस्' : 'Enter your phone'}
              </Text>
              <View style={styles.phoneRow}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>+977</Text>
                </View>
                <TextInput
                  style={[styles.phoneInput, inputFocused && styles.inputFocused]}
                  placeholder="98XXXXXXXX"
                  placeholderTextColor="#555555"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  autoFocus
                />
              </View>
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
                onPress={sendOTP}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {isNe ? 'OTP पठाउनुहोस्' : 'Send OTP'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {step === 'otp' && (
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>
                {isNe ? 'प्रमाणीकरण कोड लेख्नुहोस्' : 'Enter verification code'}
              </Text>
              <Text style={styles.otpSent}>
                {t('onboarding.otpSent')}: +977{phone}
              </Text>
              <TextInput
                style={[styles.otpInput, inputFocused && styles.inputFocused]}
                placeholder="------"
                placeholderTextColor="#555555"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
                onPress={verifyOTP}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {isNe ? 'प्रमाणित गर्नुहोस्' : 'Verify'}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setStep('phone'); setOtp(''); }}
                style={styles.linkBtn}
              >
                <Text style={styles.linkText}>{t('onboarding.resendOTP')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'profile' && (
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>
                {isNe ? 'आफ्नो प्रोफाइल सेटअप गर्नुहोस्' : 'Set up your profile'}
              </Text>
              <Text style={styles.fieldLabel}>
                {isNe ? 'पूरा नाम' : 'Full name'}
              </Text>
              <TextInput
                style={[styles.textInput, inputFocused && styles.inputFocused]}
                placeholder={isNe ? 'तपाईंको नाम' : 'Your name'}
                placeholderTextColor="#555555"
                value={name}
                onChangeText={setName}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                autoFocus
              />
              <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>
                {isNe ? 'आफ्नो योग्यता छान्नुहोस्' : 'Select your qualification'}
              </Text>
              <View style={styles.qualGrid}>
                {QUALIFICATIONS.map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={[styles.qualOption, qualification === q && styles.qualSelected]}
                    onPress={() => setQualification(q)}
                  >
                    <Text style={[styles.qualText, qualification === q && styles.qualSelectedText]}>
                      {t(`settings.qualifications.${q}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: spacing.lg }, loading && styles.disabledBtn]}
                onPress={saveProfile}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {isNe ? 'सुरु गर्नुहोस्' : 'Get Started'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ── Bottom section ── */}
          <View style={styles.bottomSection}>
            {/* Language toggle */}
            <View style={styles.langToggle}>
              <TouchableOpacity
                style={[styles.langBtn, language === 'ne' && styles.langBtnActive]}
                onPress={() => setLanguage('ne')}
              >
                <Text style={[styles.langBtnText, language === 'ne' && styles.langBtnTextActive]}>
                  नेपाली
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
                onPress={() => setLanguage('en')}
              >
                <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>
                  English
                </Text>
              </TouchableOpacity>
            </View>

            {/* Skip login */}
            {step === 'phone' && (
              <TouchableOpacity onPress={loginAsGuest} style={styles.skipLink}>
                <Text style={styles.skipLinkText}>
                  {isNe ? 'परीक्षणको लागि छोड्नुहोस्' : 'Skip for testing'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Emergency numbers bar ── */}
      <SafeAreaView edges={['bottom']} style={styles.emergencyBar}>
        <View style={styles.emergencyBarInner}>
          <TouchableOpacity onPress={() => Linking.openURL('tel:102')}>
            <Text style={styles.emergencyBarText}>102</Text>
          </TouchableOpacity>
          <Text style={styles.emergencyDot}>•</Text>
          <TouchableOpacity onPress={() => Linking.openURL('tel:100')}>
            <Text style={styles.emergencyBarText}>100</Text>
          </TouchableOpacity>
          <Text style={styles.emergencyDot}>•</Text>
          <TouchableOpacity onPress={() => Linking.openURL('tel:101')}>
            <Text style={styles.emergencyBarText}>101</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },

  // ── Top section ──
  topSection: { alignItems: 'center', marginBottom: spacing.xl },
  appName: {
    fontSize: fontSizes.hero,
    fontWeight: '800',
    color: colors.emergencyRed,
    textAlign: 'center',
    marginTop: -spacing.md,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    gap: 6,
  },
  pillDot: { width: 8, height: 8, borderRadius: 4 },
  pillText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },

  // ── Form section ──
  formSection: { marginBottom: spacing.xl },
  formLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  phoneRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  countryCode: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: borderRadius.md,
    paddingHorizontal: 16,
    justifyContent: 'center',
    height: 56,
  },
  countryCodeText: { color: colors.textPrimary, fontSize: fontSizes.md, fontWeight: '600' },
  phoneInput: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: borderRadius.md,
    paddingHorizontal: 16,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    height: 56,
  },
  textInput: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    minHeight: 56,
    marginBottom: spacing.sm,
  },
  inputFocused: { borderColor: colors.emergencyRed },
  otpInput: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: borderRadius.md,
    paddingHorizontal: 16,
    fontSize: fontSizes.xxl,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 8,
    height: 64,
    marginBottom: spacing.md,
  },
  otpSent: { fontSize: fontSizes.sm, color: colors.textMuted, marginBottom: spacing.md },
  primaryBtn: {
    backgroundColor: colors.emergencyRed,
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: { backgroundColor: '#333340' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  linkBtn: { alignItems: 'center', marginTop: spacing.md, paddingVertical: 8 },
  linkText: { color: colors.policeBlue, fontSize: fontSizes.sm },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  qualGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  qualOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.borderMedium,
    backgroundColor: colors.bgElevated,
  },
  qualSelected: {
    borderColor: colors.emergencyRed,
    backgroundColor: 'rgba(220,38,38,0.15)',
  },
  qualText: { fontSize: fontSizes.sm, color: colors.textSecondary },
  qualSelectedText: { color: colors.emergencyRed, fontWeight: '700' },

  // ── Bottom section ──
  bottomSection: { alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  langToggle: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.full,
    padding: 4,
  },
  langBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
  },
  langBtnActive: { backgroundColor: '#FFFFFF' },
  langBtnText: { fontSize: fontSizes.sm, color: colors.textSecondary, fontWeight: '600' },
  langBtnTextActive: { color: colors.bgPrimary, fontWeight: '700' },
  skipLink: { paddingVertical: 8 },
  skipLinkText: { fontSize: 13, color: colors.textDim },

  // ── Emergency bar ──
  emergencyBar: { backgroundColor: colors.emergencyRed },
  emergencyBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: spacing.md,
  },
  emergencyBarText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  emergencyDot: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
});
