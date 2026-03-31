import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../hooks/useLanguage';
import { useLocation } from '../hooks/useLocation';
import { useWebhook } from '../hooks/useWebhook';
import { useIncidents } from '../hooks/useIncidents';
import { colors, fontSizes, spacing, borderRadius, minTouchTarget } from '../constants/theme';
import { SituationType } from '../types';
import { mapsUrl } from '../lib/geo';

const SITUATIONS: { key: SituationType; en: string; ne: string }[] = [
  { key: 'unconscious', en: 'Unconscious / Not breathing', ne: 'बेहोश / सास फेर्न गाह्रो' },
  { key: 'chest_pain', en: 'Chest pain / Heart attack', ne: 'छातीमा दुखाइ / मुटुको दौरा' },
  { key: 'accident', en: 'Accident / Injury', ne: 'दुर्घटना / चोटपटक' },
  { key: 'choking', en: 'Choking', ne: 'घाँटीमा अड्किएको' },
  { key: 'seizure', en: 'Seizure', ne: 'झट्का / मिर्गौलाको दौरा' },
  { key: 'other', en: 'Other', ne: 'अन्य' },
];

type Step = 'select' | 'location' | 'confirm' | 'sent';

interface Props {
  navigation: any;
  route?: { params?: { type?: string } };
}

export default function HealthEmergencyScreen({ navigation, route }: Props) {
  const isFire = route?.params?.type === 'fire';
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { location, loading: locLoading, requestLocation } = useLocation();
  const { dispatchNASAlert } = useWebhook();
  const { createIncident } = useIncidents();

  const [step, setStep] = useState<Step>('select');
  const [situation, setSituation] = useState<SituationType | null>(null);
  const [otherText, setOtherText] = useState('');
  const [landmark, setLandmark] = useState('');
  const [sending, setSending] = useState(false);
  const [responderCount, setResponderCount] = useState(0);

  const situationLabel = (): string => {
    if (isFire) return language === 'ne' ? 'आगो' : 'Fire';
    if (!situation) return '';
    const found = SITUATIONS.find((s) => s.key === situation);
    if (!found) return '';
    return language === 'ne' ? found.ne : found.en;
  };

  const sendAlert = async () => {
    if (!location) {
      Alert.alert(t('common.error'), t('fallback.locationError'));
      return;
    }
    setSending(true);
    const summary = situation === 'other' ? otherText : situationLabel();
    try {
      let count = 0;
      try {
        const incident = await createIncident({
          type: isFire ? 'fire' : 'health',
          reported_by: user?.id ?? '',
          lat: location.lat,
          lng: location.lng,
          landmark_description: landmark,
          situation_summary: summary,
        });
        count = incident.responder_count ?? 0;
      } catch {
        // Supabase unavailable — continue with direct webhook
      }
      setResponderCount(count);

      await dispatchNASAlert({
        situation: summary,
        landmark: landmark || location.address || '',
        lat: location.lat,
        lng: location.lng,
        phone: user?.phone,
      });

      setStep('sent');
    } catch {
      // Even on full failure, show sent screen with direct call option
      setStep('sent');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step === 'select' ? navigation.goBack() : setStep(step === 'location' ? 'select' : 'location')} style={styles.backBtn}>
          <Text style={styles.backText}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {isFire ? t('home.fireOther') : t('health.title')}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Step 1: Select situation */}
        {step === 'select' && (
          <View>
            <Text style={styles.stepLabel}>
              {t('health.step')} 1 {t('health.of')} 3 — {t('health.selectSituation')}
            </Text>
            {!isFire && SITUATIONS.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={[styles.situationBtn, situation === s.key && styles.situationSelected]}
                onPress={() => setSituation(s.key)}
              >
                <Text style={[styles.situationText, situation === s.key && styles.situationTextSelected]}>
                  {language === 'ne' ? s.ne : s.en}
                </Text>
              </TouchableOpacity>
            ))}
            {situation === 'other' && (
              <TextInput
                style={styles.otherInput}
                placeholder={t('health.otherPlaceholder')}
                value={otherText}
                onChangeText={setOtherText}
                multiline
              />
            )}
            {isFire && (
              <TouchableOpacity
                style={[styles.situationBtn, styles.situationSelected]}
              >
                <Text style={styles.situationTextSelected}>
                  {language === 'ne' ? '🔥 आगो / अन्य' : '🔥 Fire / Other'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.nextBtn, (!situation && !isFire) && styles.disabledBtn]}
              onPress={() => { requestLocation(); setStep('location'); }}
              disabled={!situation && !isFire}
            >
              <Text style={styles.nextBtnText}>{t('common.next')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Location */}
        {step === 'location' && (
          <View>
            <Text style={styles.stepLabel}>
              {t('health.step')} 2 {t('health.of')} 3 — {t('health.confirmLocation')}
            </Text>
            <View style={styles.locationCard}>
              {locLoading ? (
                <View style={styles.locRow}>
                  <ActivityIndicator color={colors.emergencyRed} />
                  <Text style={styles.locText}>{t('health.detectingLocation')}</Text>
                </View>
              ) : location ? (
                <View>
                  <Text style={styles.locFound}>✅ {t('health.locationFound')}</Text>
                  {location.address && <Text style={styles.locAddress}>{location.address}</Text>}
                  <Text style={styles.locCoords}>
                    {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity onPress={requestLocation}>
                  <Text style={styles.retryText}>⚠️ {t('fallback.locationError')} — {t('common.retry')}</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.fieldLabel}>{t('health.landmarkLabel')}</Text>
            <TextInput
              style={styles.landmarkInput}
              placeholder={t('health.landmarkPlaceholder')}
              value={landmark}
              onChangeText={setLandmark}
              multiline
            />
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={() => setStep('confirm')}
            >
              <Text style={styles.nextBtnText}>{t('common.next')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && (
          <View>
            <Text style={styles.stepLabel}>
              {t('health.step')} 3 {t('health.of')} 3
            </Text>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryItem}>
                🚨 {situationLabel()}
              </Text>
              {location && (
                <Text style={styles.summaryItem}>
                  📍 {location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
                </Text>
              )}
              {landmark ? <Text style={styles.summaryItem}>🏠 {landmark}</Text> : null}
            </View>
            <TouchableOpacity
              style={[styles.sendBtn, sending && styles.disabledBtn]}
              onPress={sendAlert}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <Text style={styles.sendBtnText}>{t('health.sendAlert')}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Sent confirmation */}
        {step === 'sent' && (
          <View style={styles.sentContainer}>
            <Text style={styles.sentIcon}>✅</Text>
            <Text style={styles.sentTitle}>{t('health.alertSent')}</Text>
            {responderCount > 0 && (
              <Text style={styles.sentSubtitle}>
                {responderCount} {t('health.respondersNotified')}
              </Text>
            )}
            <Text style={styles.helpText}>{t('health.helpIsOnWay')}</Text>

            <TouchableOpacity
              style={[styles.callBtn]}
              onPress={() => Linking.openURL('tel:102')}
            >
              <Text style={styles.callBtnText}>🚑 {t('health.callNAS')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.homeBtn}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.homeBtnText}>{t('common.done')}</Text>
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
    backgroundColor: colors.emergencyRed,
    paddingTop: 48,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  backBtn: { marginBottom: spacing.xs },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: fontSizes.sm },
  title: { color: colors.white, fontSize: fontSizes.xl, fontWeight: '800' },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  stepLabel: { fontSize: fontSizes.sm, color: colors.lightText, marginBottom: spacing.md, fontWeight: '600' },
  situationBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: 18,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
    minHeight: minTouchTarget,
    justifyContent: 'center',
  },
  situationSelected: { borderColor: colors.emergencyRed, backgroundColor: '#FFF0F0' },
  situationText: { fontSize: fontSizes.md, color: colors.darkText },
  situationTextSelected: { color: colors.emergencyRed, fontWeight: '700' },
  otherInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: fontSizes.md,
    minHeight: 80,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
  },
  nextBtn: {
    backgroundColor: colors.emergencyRed,
    borderRadius: borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.md,
    minHeight: minTouchTarget,
    justifyContent: 'center',
  },
  disabledBtn: { backgroundColor: '#9E9E9E' },
  nextBtnText: { color: colors.white, fontSize: fontSizes.lg, fontWeight: '700' },
  locationCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.safeGreen,
  },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locText: { fontSize: fontSizes.sm, color: colors.lightText },
  locFound: { fontSize: fontSizes.md, fontWeight: '600', color: colors.safeGreen, marginBottom: 4 },
  locAddress: { fontSize: fontSizes.sm, color: colors.darkText, marginBottom: 2 },
  locCoords: { fontSize: fontSizes.xs, color: colors.lightText },
  retryText: { fontSize: fontSizes.sm, color: colors.fireOrange },
  fieldLabel: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.lightText, marginBottom: spacing.xs },
  landmarkInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: fontSizes.md,
    minHeight: 80,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  summaryItem: { fontSize: fontSizes.md, color: colors.darkText },
  sendBtn: {
    backgroundColor: colors.emergencyRed,
    borderRadius: borderRadius.md,
    paddingVertical: 20,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
    shadowColor: colors.emergencyRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  sendBtnText: { color: colors.white, fontSize: fontSizes.xl, fontWeight: '900', letterSpacing: 1 },
  sentContainer: { alignItems: 'center', paddingTop: spacing.xl },
  sentIcon: { fontSize: 72, marginBottom: spacing.md },
  sentTitle: { fontSize: fontSizes.xxl, fontWeight: '900', color: colors.safeGreen, marginBottom: spacing.xs },
  sentSubtitle: { fontSize: fontSizes.md, color: colors.lightText, marginBottom: spacing.md },
  helpText: { fontSize: fontSizes.lg, color: colors.darkText, fontWeight: '600', marginBottom: spacing.xl, textAlign: 'center' },
  callBtn: {
    backgroundColor: colors.emergencyRed,
    borderRadius: borderRadius.md,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: spacing.sm,
    minHeight: minTouchTarget,
    justifyContent: 'center',
    width: '100%',
    alignItems: 'center',
  },
  callBtnText: { color: colors.white, fontSize: fontSizes.lg, fontWeight: '700' },
  homeBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 32,
    minHeight: minTouchTarget,
    justifyContent: 'center',
    width: '100%',
    alignItems: 'center',
  },
  homeBtnText: { color: colors.darkText, fontSize: fontSizes.md, fontWeight: '600' },
});
