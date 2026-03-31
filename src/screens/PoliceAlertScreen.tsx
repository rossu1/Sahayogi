import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../hooks/useLanguage';
import { useLocation } from '../hooks/useLocation';
import { useWebhook } from '../hooks/useWebhook';
import { supabase, TABLES } from '../lib/supabase';
import { generateTrackingToken } from '../lib/geo';
import { colors, fontSizes, spacing, borderRadius, minTouchTarget } from '../constants/theme';
import { AlertType } from '../types';

const ALERT_TYPES: { key: AlertType; en: string; ne: string; icon: string }[] = [
  { key: 'fight', en: 'Fight / Violence', ne: 'झगडा / हिंसा', icon: '⚡' },
  { key: 'theft', en: 'Theft / Robbery', ne: 'चोरी / डकैती', icon: '🎒' },
  { key: 'harassment', en: 'Harassment', ne: 'दुर्व्यवहार', icon: '⚠️' },
  { key: 'suspicious', en: 'Suspicious Activity', ne: 'शंकास्पद गतिविधि', icon: '👁️' },
  { key: 'other', en: 'Other', ne: 'अन्य', icon: '🔴' },
];

type Step = 'select' | 'tracking';

interface Props {
  navigation: any;
  route?: { params?: { preselect?: AlertType } };
}

export default function PoliceAlertScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { location, requestLocation } = useLocation();
  const { dispatchPoliceAlert } = useWebhook();

  const [step, setStep] = useState<Step>('select');
  const [alertType, setAlertType] = useState<AlertType | null>(
    route?.params?.preselect ?? null
  );
  const [sending, setSending] = useState(false);
  const [trackingToken, setTrackingToken] = useState('');
  const [trackingSeconds, setTrackingSeconds] = useState(0);
  const [details, setDetails] = useState('');
  const trackingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (route?.params?.preselect) {
      setAlertType(route.params.preselect);
    }
  }, [route?.params?.preselect]);

  useEffect(() => {
    if (step === 'tracking') {
      trackingInterval.current = setInterval(() => {
        setTrackingSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (trackingInterval.current) clearInterval(trackingInterval.current);
    };
  }, [step]);

  const formatDuration = (s: number): string => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const sendAlert = async () => {
    if (!alertType) return;
    setSending(true);
    const loc = location || (await requestLocation());
    const token = generateTrackingToken();
    setTrackingToken(token);

    const lat = loc?.lat ?? 27.7172;
    const lng = loc?.lng ?? 85.3240;

    try {
      await supabase.from(TABLES.POLICE_ALERTS).insert({
        reporter_id: user?.id,
        lat,
        lng,
        alert_type: alertType,
        is_live_tracking: true,
        tracking_token: token,
      });
    } catch {
      // Continue even if Supabase fails
    }

    const typeLabel = ALERT_TYPES.find((a) => a.key === alertType);
    await dispatchPoliceAlert({
      alertType: language === 'ne' ? (typeLabel?.ne ?? alertType) : (typeLabel?.en ?? alertType),
      landmark: '',
      lat,
      lng,
      trackingToken: token,
      phone: user?.phone,
    });

    setSending(false);
    setStep('tracking');
  };

  const stopTracking = async () => {
    if (trackingInterval.current) clearInterval(trackingInterval.current);
    try {
      await supabase
        .from(TABLES.POLICE_ALERTS)
        .update({ is_live_tracking: false, ended_at: new Date().toISOString() })
        .eq('tracking_token', trackingToken);
    } catch {}
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {step === 'select' && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← {t('common.back')}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{t('police.title')}</Text>
        <Text style={styles.subtitle}>{t('police.subtitle')}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {step === 'select' && (
          <View>
            <Text style={styles.stepLabel}>{t('police.selectType')}</Text>
            {ALERT_TYPES.map((a) => (
              <TouchableOpacity
                key={a.key}
                style={[styles.alertTypeBtn, alertType === a.key && styles.alertTypeSelected]}
                onPress={() => setAlertType(a.key)}
              >
                <Text style={styles.alertTypeIcon}>{a.icon}</Text>
                <Text style={[styles.alertTypeText, alertType === a.key && styles.alertTypeTextSelected]}>
                  {language === 'ne' ? a.ne : a.en}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.sendBtn, (!alertType || sending) && styles.disabledBtn]}
              onPress={sendAlert}
              disabled={!alertType || sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <Text style={styles.sendBtnText}>{t('police.sendSilentAlert')}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {step === 'tracking' && (
          <View style={styles.trackingContainer}>
            <Text style={styles.trackingIcon}>🔵</Text>
            <Text style={styles.trackingTitle}>{t('police.alertSent')}</Text>
            <Text style={styles.trackingSubtitle}>{t('police.policeNotified')}</Text>

            <View style={styles.trackingCard}>
              <Text style={styles.liveLabel}>{t('police.liveTracking')}</Text>
              <Text style={styles.timerText}>{formatDuration(trackingSeconds)}</Text>
              <Text style={styles.timerLabel}>{t('police.trackingDuration')}</Text>
            </View>

            <Text style={styles.detailsLabel}>{t('police.addDetails')}</Text>
            <TextInput
              style={styles.detailsInput}
              placeholder={t('police.detailsPlaceholder')}
              value={details}
              onChangeText={setDetails}
              multiline
            />

            <TouchableOpacity style={styles.stopBtn} onPress={stopTracking}>
              <Text style={styles.stopBtnText}>{t('police.stopSharing')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callPoliceBtn}
              onPress={() => Linking.openURL('tel:100')}
            >
              <Text style={styles.callPoliceBtnText}>📞 {t('home.emergency100')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.policeBlue,
    paddingTop: 48,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  backBtn: { marginBottom: spacing.xs },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: fontSizes.sm },
  title: { color: colors.white, fontSize: fontSizes.xl, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: fontSizes.sm, marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  stepLabel: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.darkText, marginBottom: spacing.md },
  alertTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: 20,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
    minHeight: minTouchTarget + 10,
    gap: spacing.md,
  },
  alertTypeSelected: { borderColor: colors.policeBlue, backgroundColor: '#EEF4FF' },
  alertTypeIcon: { fontSize: 28 },
  alertTypeText: { fontSize: fontSizes.lg, color: colors.darkText, fontWeight: '600' },
  alertTypeTextSelected: { color: colors.policeBlue, fontWeight: '800' },
  sendBtn: {
    backgroundColor: colors.policeBlue,
    borderRadius: borderRadius.md,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: spacing.md,
    minHeight: 72,
    justifyContent: 'center',
    shadowColor: colors.policeBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledBtn: { backgroundColor: '#9E9E9E', shadowOpacity: 0 },
  sendBtnText: { color: colors.white, fontSize: fontSizes.xl, fontWeight: '900' },
  trackingContainer: { alignItems: 'center', paddingTop: spacing.md },
  trackingIcon: { fontSize: 64, marginBottom: spacing.sm },
  trackingTitle: { fontSize: fontSizes.xxl, fontWeight: '900', color: colors.policeBlue, marginBottom: spacing.xs },
  trackingSubtitle: { fontSize: fontSizes.md, color: colors.lightText, marginBottom: spacing.lg, textAlign: 'center' },
  trackingCard: {
    backgroundColor: '#EEF4FF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.md,
  },
  liveLabel: { fontSize: fontSizes.sm, color: colors.policeBlue, fontWeight: '600', marginBottom: spacing.xs },
  timerText: { fontSize: 48, fontWeight: '900', color: colors.policeBlue },
  timerLabel: { fontSize: fontSizes.sm, color: colors.lightText },
  detailsLabel: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.lightText, marginBottom: spacing.xs, alignSelf: 'flex-start' },
  detailsInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: fontSizes.md,
    minHeight: 80,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
    width: '100%',
  },
  stopBtn: {
    borderWidth: 2,
    borderColor: colors.emergencyRed,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.sm,
    minHeight: minTouchTarget,
    justifyContent: 'center',
  },
  stopBtnText: { color: colors.emergencyRed, fontSize: fontSizes.md, fontWeight: '700' },
  callPoliceBtn: {
    backgroundColor: colors.policeBlue,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    minHeight: minTouchTarget,
    justifyContent: 'center',
  },
  callPoliceBtnText: { color: colors.white, fontSize: fontSizes.md, fontWeight: '700' },
});
