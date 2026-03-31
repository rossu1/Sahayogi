import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Linking,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../hooks/useLanguage';
import { useLocation } from '../hooks/useLocation';
import { useShakeDetect } from '../hooks/useShakeDetect';
import { useResponder } from '../hooks/useResponder';
import { LanguageToggle } from '../components/LanguageToggle';
import { EmergencyButton } from '../components/EmergencyButton';
import { colors, fontSizes, spacing, borderRadius, minTouchTarget } from '../constants/theme';

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { user, refreshUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { location } = useLocation();
  const { toggleDuty } = useResponder(user?.id);
  const [onDuty, setOnDuty] = useState(user?.is_active_responder ?? false);
  const [shakeEnabled] = useState(false);
  const [shakeCountdown, setShakeCountdown] = useState<number | null>(null);

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

  const cancelShake = () => setShakeCountdown(null);

  const isResponder = user?.role === 'responder' || user?.role === 'admin';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>{t('home.title')}</Text>
          <Text style={styles.appSubtitle}>{t('home.subtitle')}</Text>
        </View>
        <LanguageToggle language={language} onToggle={setLanguage} />
      </View>

      {/* On-duty status banner */}
      {isResponder && onDuty && (
        <View style={styles.onDutyBanner}>
          <View style={styles.pulseDot} />
          <Text style={styles.onDutyText}>
            {t('home.onDutyBadge')}
          </Text>
        </View>
      )}

      {/* Shake countdown overlay */}
      {shakeCountdown !== null && (
        <View style={styles.shakeOverlay}>
          <Text style={styles.shakeCountText}>{shakeCountdown}</Text>
          <Text style={styles.shakeLabel}>{t('police.shakeDetected')}</Text>
          <TouchableOpacity style={styles.shakeCancelBtn} onPress={cancelShake}>
            <Text style={styles.shakeCancelText}>{t('police.shakeCancel')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Primary emergency buttons */}
      <View style={styles.primaryButtons}>
        <EmergencyButton
          label={t('home.healthEmergency')}
          color={colors.emergencyRed}
          onPress={() => navigation.navigate('HealthEmergency')}
          size="large"
          style={styles.fullWidth}
        />

        <View style={styles.row}>
          <EmergencyButton
            label={t('home.policeAlert')}
            color={colors.policeBlue}
            onPress={() => navigation.navigate('PoliceAlert')}
            size="medium"
            style={styles.halfWidth}
          />
          <EmergencyButton
            label={t('home.fireOther')}
            color={colors.fireOrange}
            onPress={() => navigation.navigate('HealthEmergency', { type: 'fire' })}
            size="medium"
            style={styles.halfWidth}
          />
        </View>
      </View>

      {/* Responder toggle */}
      {isResponder && (
        <View style={styles.responderCard}>
          <Text style={styles.responderLabel}>{t('home.responderToggle')}</Text>
          <View style={styles.responderToggleRow}>
            <Text style={styles.responderStatus}>
              {onDuty ? t('home.goOffDuty') : t('home.goOnDuty')}
            </Text>
            <Switch
              value={onDuty}
              onValueChange={toggleResponderDuty}
              trackColor={{ false: '#ccc', true: colors.safeGreen }}
              thumbColor={onDuty ? colors.safeGreen : '#f4f3f4'}
            />
          </View>
        </View>
      )}

      {/* Secondary actions */}
      <View style={styles.secondaryButtons}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Hospitals')}
        >
          <Text style={styles.secondaryBtnIcon}>🏥</Text>
          <Text style={styles.secondaryBtnText}>{t('home.nearbyHospitals')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('FirstAid')}
        >
          <Text style={styles.secondaryBtnIcon}>🩺</Text>
          <Text style={styles.secondaryBtnText}>{t('home.firstAidGuides')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.secondaryBtnIcon}>⚙️</Text>
          <Text style={styles.secondaryBtnText}>{t('settings.title')}</Text>
        </TouchableOpacity>
      </View>

      {/* Emergency numbers quick dial */}
      <View style={styles.quickDial}>
        <TouchableOpacity
          style={[styles.quickDialBtn, { borderColor: colors.emergencyRed }]}
          onPress={() => Linking.openURL('tel:102')}
        >
          <Text style={[styles.quickDialText, { color: colors.emergencyRed }]}>
            🚑 {t('home.emergency102')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickDialBtn, { borderColor: colors.policeBlue }]}
          onPress={() => Linking.openURL('tel:100')}
        >
          <Text style={[styles.quickDialText, { color: colors.policeBlue }]}>
            🚔 {t('home.emergency100')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickDialBtn, { borderColor: colors.fireOrange }]}
          onPress={() => Linking.openURL('tel:101')}
        >
          <Text style={[styles.quickDialText, { color: colors.fireOrange }]}>
            🚒 {t('home.emergency101')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  appName: { fontSize: fontSizes.xxl, fontWeight: '900', color: colors.emergencyRed },
  appSubtitle: { fontSize: fontSizes.sm, color: colors.lightText },
  onDutyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: 8,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.safeGreen,
  },
  onDutyText: { fontSize: fontSizes.sm, color: colors.safeGreen, fontWeight: '600' },
  primaryButtons: { gap: spacing.sm, marginBottom: spacing.md },
  fullWidth: { width: '100%' },
  row: { flexDirection: 'row', gap: spacing.sm },
  halfWidth: { flex: 1 },
  responderCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  responderLabel: { fontSize: fontSizes.sm, color: colors.lightText, marginBottom: spacing.xs },
  responderToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  responderStatus: { fontSize: fontSizes.md, fontWeight: '600', color: colors.darkText },
  secondaryButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    minHeight: minTouchTarget + 10,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  secondaryBtnIcon: { fontSize: 24, marginBottom: 4 },
  secondaryBtnText: { fontSize: fontSizes.xs, color: colors.darkText, textAlign: 'center', fontWeight: '600' },
  quickDial: { gap: spacing.xs },
  quickDialBtn: {
    borderWidth: 1.5,
    borderRadius: borderRadius.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    minHeight: minTouchTarget,
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  quickDialText: { fontSize: fontSizes.sm, fontWeight: '700' },
  shakeOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(21,101,192,0.95)',
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
  },
  shakeCountText: { fontSize: 96, fontWeight: '900', color: colors.white },
  shakeLabel: { fontSize: fontSizes.lg, color: colors.white, marginBottom: spacing.xl, textAlign: 'center' },
  shakeCancelBtn: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  shakeCancelText: { color: colors.policeBlue, fontSize: fontSizes.md, fontWeight: '700' },
});
