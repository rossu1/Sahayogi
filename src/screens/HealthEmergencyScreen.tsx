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
  Share,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../hooks/useLanguage';
import { useLocation } from '../hooks/useLocation';
import { useWebhook } from '../hooks/useWebhook';
import { useIncidents } from '../hooks/useIncidents';
import { colors, fontSizes, spacing, borderRadius, minTouchTarget } from '../constants/theme';
import { SituationType, EmergencyContact } from '../types';
import { mapsUrl, haversineDistance } from '../lib/geo';
import { FIRST_AID_GUIDES } from '../lib/firstAidData';

// ── Situation → hospital mapping ──────────────────────────────────────────────
const HOSPITAL_MAP: Record<string, { name_en: string; name_ne: string; phone: string; lat: number; lng: number }> = {
  chest_pain: {
    name_en: 'Shahid Gangalal National Heart Centre',
    name_ne: 'शहीद गंगालाल राष्ट्रिय हृदय केन्द्र',
    phone: '01-4371322',
    lat: 27.7365, lng: 85.3226,
  },
  accident: {
    name_en: 'National Trauma Centre',
    name_ne: 'राष्ट्रिय ट्रमा केन्द्र',
    phone: '01-4412505',
    lat: 27.7350, lng: 85.3310,
  },
  choking: {
    name_en: 'Tribhuvan University Teaching Hospital',
    name_ne: 'त्रिभुवन विश्वविद्यालय शिक्षण अस्पताल',
    phone: '01-4412303',
    lat: 27.7321, lng: 85.3319,
  },
  unconscious: {
    name_en: 'Tribhuvan University Teaching Hospital',
    name_ne: 'त्रिभुवन विश्वविद्यालय शिक्षण अस्पताल',
    phone: '01-4412303',
    lat: 27.7321, lng: 85.3319,
  },
  seizure: {
    name_en: 'Tribhuvan University Teaching Hospital',
    name_ne: 'त्रिभुवन विश्वविद्यालय शिक्षण अस्पताल',
    phone: '01-4412303',
    lat: 27.7321, lng: 85.3319,
  },
};

// Default fallback hospital
const DEFAULT_HOSPITAL = {
  name_en: 'Bir Hospital',
  name_ne: 'वीर अस्पताल',
  phone: '01-4221119',
  lat: 27.7041, lng: 85.3131,
};

// ── Situation → first aid guide ───────────────────────────────────────────────
const GUIDE_MAP: Record<string, string> = {
  unconscious: 'cpr',
  chest_pain: 'heartAttack',
  accident: 'roadAccident',
  choking: 'choking',
  seizure: 'seizure',
};

const SITUATIONS: { key: SituationType; en: string; ne: string }[] = [
  { key: 'unconscious', en: 'Unconscious / Not breathing', ne: 'बेहोश / सास फेर्न गाह्रो' },
  { key: 'chest_pain', en: 'Chest pain / Heart attack', ne: 'छातीमा दुखाइ / मुटुको दौरा' },
  { key: 'accident', en: 'Accident / Injury', ne: 'दुर्घटना / चोटपटक' },
  { key: 'choking', en: 'Choking', ne: 'घाँटीमा अड्किएको' },
  { key: 'seizure', en: 'Seizure', ne: 'झट्का / मिर्गौलाको दौरा' },
  { key: 'other', en: 'Other', ne: 'अन्य' },
];

type Step = 'select' | 'location' | 'action';

interface Props {
  navigation: any;
  route?: { params?: { type?: string } };
}

export default function HealthEmergencyScreen({ navigation, route }: Props) {
  const isFire = route?.params?.type === 'fire';
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const isNe = language === 'ne';
  const { location, loading: locLoading, requestLocation } = useLocation();
  const { dispatchNASAlert } = useWebhook();
  const { createIncident } = useIncidents();

  const [step, setStep] = useState<Step>('select');
  const [situation, setSituation] = useState<SituationType | null>(null);
  const [otherText, setOtherText] = useState('');
  const [landmark, setLandmark] = useState('');
  const [sending, setSending] = useState(false);

  const contacts: EmergencyContact[] = (user?.emergency_contacts as EmergencyContact[]) ?? [];

  const situationLabel = (): string => {
    if (isFire) return isNe ? 'आगो' : 'Fire';
    if (!situation) return '';
    const found = SITUATIONS.find((s) => s.key === situation);
    return found ? (isNe ? found.ne : found.en) : '';
  };

  // Get recommended hospital based on situation
  const recommendedHospital = situation
    ? (HOSPITAL_MAP[situation] ?? DEFAULT_HOSPITAL)
    : DEFAULT_HOSPITAL;

  // Get relevant first aid guide
  const guideId = situation ? GUIDE_MAP[situation] : null;
  const firstAidGuide = guideId
    ? FIRST_AID_GUIDES.find((g) => g.id === guideId)
    : null;

  const sendAlert = async () => {
    if (!location) {
      Alert.alert(t('common.error'), t('fallback.locationError'));
      return;
    }
    setSending(true);
    const summary = situation === 'other' ? otherText : situationLabel();
    try {
      try {
        await createIncident({
          type: isFire ? 'fire' : 'health',
          reported_by: user?.id ?? '',
          lat: location.lat,
          lng: location.lng,
          landmark_description: landmark,
          situation_summary: summary,
        });
      } catch {
        // Supabase unavailable — continue with webhook
      }

      await dispatchNASAlert({
        situation: summary,
        landmark: landmark || location.address || '',
        lat: location.lat,
        lng: location.lng,
        phone: user?.phone,
      });
    } catch {
      // Even on failure, show action screen with call option
    } finally {
      setSending(false);
      setStep('action');
    }
  };

  // Share location with emergency contacts
  const shareWithContacts = async () => {
    if (!location) return;
    const mapLink = `https://maps.google.com/?q=${location.lat},${location.lng}`;
    const name = user?.full_name ?? 'Someone';

    const message = isNe
      ? `आपतकाल! ${name} लाई काठमाडौंमा सहायता चाहिन्छ।\nस्थान: ${mapLink}\nSahayogi मार्फत पठाइएको`
      : `EMERGENCY! ${name} needs help in Kathmandu.\nLocation: ${mapLink}\nSent via Sahayogi`;

    try {
      await Share.share({ message });
    } catch {
      // user cancelled share
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (step === 'select') navigation.goBack();
            else if (step === 'location') setStep('select');
            else setStep('location');
          }}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>
            ← {step === 'action' ? '' : t('common.back')}
          </Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {isFire ? t('home.fireOther') : t('health.title')}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* ── Step 1: Select situation ── */}
        {step === 'select' && (
          <View>
            <Text style={styles.stepLabel}>
              {t('health.step')} 1 {t('health.of')} 2 — {t('health.selectSituation')}
            </Text>
            {!isFire && SITUATIONS.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={[styles.situationBtn, situation === s.key && styles.situationSelected]}
                onPress={() => setSituation(s.key)}
              >
                <Text style={[styles.situationText, situation === s.key && styles.situationTextSelected]}>
                  {isNe ? s.ne : s.en}
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
                placeholderTextColor="#9E9E9E"
              />
            )}
            {isFire && (
              <TouchableOpacity style={[styles.situationBtn, styles.situationSelected]}>
                <Text style={styles.situationTextSelected}>
                  {isNe ? '🔥 आगो / अन्य' : '🔥 Fire / Other'}
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

        {/* ── Step 2: Location confirmation ── */}
        {step === 'location' && (
          <View>
            <Text style={styles.stepLabel}>
              {t('health.step')} 2 {t('health.of')} 2 — {t('health.confirmLocation')}
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
              placeholderTextColor="#9E9E9E"
            />
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

        {/* ── Step 3: Action screen ── */}
        {step === 'action' && (
          <View style={styles.actionContainer}>

            {/* a) Call 102 — largest, pulsing red */}
            <TouchableOpacity
              style={styles.call102Btn}
              onPress={() => Linking.openURL('tel:102')}
              activeOpacity={0.85}
            >
              <Text style={styles.call102Icon}>🚑</Text>
              <Text style={styles.call102Text}>
                {isNe ? '१०२ मा फोन गर्नुहोस्' : 'Call 102 Now'}
              </Text>
              <Text style={styles.call102Sub}>
                {isNe ? 'एम्बुलेन्स बोलाउन थिच्नुहोस्' : 'Tap to call ambulance'}
              </Text>
            </TouchableOpacity>

            {/* b) Recommended hospital */}
            <View style={styles.hospitalCard}>
              <Text style={styles.hospitalLabel}>
                {isNe ? 'सिफारिस गरिएको अस्पताल' : 'Recommended Hospital'}
              </Text>
              <Text style={styles.hospitalSub}>
                {isNe ? 'तपाईंको अवस्थामा आधारित' : 'Based on your situation'}
              </Text>
              <Text style={styles.hospitalName}>
                {isNe ? recommendedHospital.name_ne : recommendedHospital.name_en}
              </Text>
              <View style={styles.hospitalActions}>
                <TouchableOpacity
                  style={[styles.hospBtn, { backgroundColor: colors.safeGreen }]}
                  onPress={() => Linking.openURL(`tel:${recommendedHospital.phone}`)}
                >
                  <Text style={styles.hospBtnText}>📞 {recommendedHospital.phone}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.hospBtn, { backgroundColor: colors.policeBlue }]}
                  onPress={() => {
                    const url = Platform.OS === 'ios'
                      ? `maps://maps.apple.com/?daddr=${recommendedHospital.lat},${recommendedHospital.lng}`
                      : `geo:${recommendedHospital.lat},${recommendedHospital.lng}?q=${encodeURIComponent(recommendedHospital.name_en)}`;
                    Linking.openURL(url).catch(() =>
                      Linking.openURL(`https://maps.google.com/?q=${recommendedHospital.lat},${recommendedHospital.lng}`)
                    );
                  }}
                >
                  <Text style={styles.hospBtnText}>🗺️ {isNe ? 'दिशा' : 'Directions'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* c) Share with emergency contacts */}
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={shareWithContacts}
            >
              <Text style={styles.shareBtnText}>
                📤 {isNe ? 'सम्पर्कहरूलाई सूचित गर्नुहोस्' : 'Notify your contacts'}
              </Text>
              {contacts.length > 0 && (
                <Text style={styles.shareSubText}>
                  {contacts.map((c) => c.name).join(', ')}
                </Text>
              )}
            </TouchableOpacity>

            {/* d) Relevant first aid guide */}
            {firstAidGuide && (
              <TouchableOpacity
                style={styles.guideCard}
                onPress={() => navigation.navigate('FirstAidGuide', { guide: firstAidGuide })}
              >
                <Text style={styles.guideIcon}>{firstAidGuide.icon}</Text>
                <View style={styles.guideInfo}>
                  <Text style={styles.guideTitle}>
                    {isNe ? firstAidGuide.titleNe : firstAidGuide.titleEn}
                  </Text>
                  <Text style={styles.guideSub}>
                    {isNe ? 'सम्बन्धित प्राथमिक उपचार चरणहरू हेर्नुहोस्' : 'View relevant first aid steps'}
                  </Text>
                </View>
                <Text style={styles.guideChevron}>›</Text>
              </TouchableOpacity>
            )}

            {/* Done button */}
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => navigation.navigate('Main')}
            >
              <Text style={styles.doneBtnText}>{t('common.done')}</Text>
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

  // ── Action screen ──
  actionContainer: { gap: spacing.md },

  call102Btn: {
    backgroundColor: colors.emergencyRed,
    borderRadius: borderRadius.lg,
    paddingVertical: 28,
    alignItems: 'center',
    gap: spacing.xs,
    shadowColor: colors.emergencyRed,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  call102Icon: { fontSize: 48 },
  call102Text: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  call102Sub: { color: 'rgba(255,255,255,0.75)', fontSize: 14 },

  hospitalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.safeGreen,
    gap: spacing.xs,
  },
  hospitalLabel: { fontSize: 11, fontWeight: '700', color: colors.lightText, textTransform: 'uppercase', letterSpacing: 0.5 },
  hospitalSub: { fontSize: 12, color: colors.lightText },
  hospitalName: { fontSize: fontSizes.lg, fontWeight: '900', color: colors.darkText, marginTop: 4 },
  hospitalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  hospBtn: { flex: 1, paddingVertical: 12, borderRadius: borderRadius.md, alignItems: 'center' },
  hospBtnText: { color: '#FFFFFF', fontSize: fontSizes.sm, fontWeight: '700' },

  shareBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.policeBlue,
    alignItems: 'center',
    gap: spacing.xs,
  },
  shareBtnText: { fontSize: fontSizes.md, fontWeight: '800', color: colors.policeBlue },
  shareSubText: { fontSize: 12, color: colors.lightText },

  guideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    gap: spacing.md,
  },
  guideIcon: { fontSize: 32 },
  guideInfo: { flex: 1, gap: 2 },
  guideTitle: { fontSize: fontSizes.md, fontWeight: '800', color: colors.darkText },
  guideSub: { fontSize: 12, color: colors.lightText },
  guideChevron: { fontSize: 24, color: colors.lightText, fontWeight: '700' },

  doneBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: minTouchTarget,
    justifyContent: 'center',
  },
  doneBtnText: { color: colors.darkText, fontSize: fontSizes.md, fontWeight: '600' },
});
