import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { useLanguage } from '../hooks/useLanguage';
import { useResponder } from '../hooks/useResponder';
import { useAuth } from '../context/AuthContext';
import { colors, fontSizes, spacing, borderRadius, minTouchTarget } from '../constants/theme';
import { Incident } from '../types';
import { formatDistance } from '../lib/geo';

interface Props {
  navigation: any;
  route: { params: { incident: Incident; distance: number } };
}

export default function ResponderAlertScreen({ navigation, route }: Props) {
  const { incident, distance } = route.params;
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { acceptIncident, markArrived, completeResponse } = useResponder(user?.id);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [arrived, setArrived] = useState(false);

  const timeAgo = () => {
    const mins = Math.floor(
      (Date.now() - new Date(incident.created_at).getTime()) / 60000
    );
    return `${mins} ${t('responder.minutesAgo')}`;
  };

  const TYPE_COLORS: Record<string, string> = {
    health: colors.emergencyRed,
    police: colors.policeBlue,
    fire: colors.fireOrange,
    earthquake: '#795548',
  };
  const color = TYPE_COLORS[incident.type] ?? colors.emergencyRed;

  const handleRespond = async () => {
    const response = await acceptIncident(incident.id);
    if (response) {
      setResponseId(response.id);
      Linking.openURL(`https://maps.google.com/?q=${incident.lat},${incident.lng}`);
    }
  };

  const handleArrived = async () => {
    if (responseId) {
      await markArrived(responseId);
      setArrived(true);
    }
  };

  const handleComplete = async () => {
    if (responseId) {
      await completeResponse(responseId);
      navigation.navigate('Home');
    }
  };

  const guideId =
    incident.type === 'health' ? 'cpr' :
    incident.type === 'fire' ? 'burns' : 'roadAccident';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: color }]}>
        <Text style={styles.headerTitle}>{t('responder.incidentNearby')}</Text>
        <Text style={styles.distance}>
          📍 {formatDistance(distance)} {t('responder.distanceAway')}
        </Text>
        <Text style={styles.timeAgo}>{timeAgo()}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {incident.situation_summary ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              {language === 'ne' ? 'अवस्था' : 'Situation'}
            </Text>
            <Text style={styles.summaryText}>{incident.situation_summary}</Text>
          </View>
        ) : null}
        {incident.landmark_description ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              {language === 'ne' ? 'स्थान चिनारी' : 'Landmark'}
            </Text>
            <Text style={styles.summaryText}>{incident.landmark_description}</Text>
          </View>
        ) : null}

        {!responseId ? (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.safeGreen }]}
              onPress={handleRespond}
            >
              <Text style={styles.actionText}>{t('responder.respond')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#9E9E9E' }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.actionText}>{t('responder.skip')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ongoingContainer}>
            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: colors.policeBlue }]}
              onPress={() => Linking.openURL(`https://maps.google.com/?q=${incident.lat},${incident.lng}`)}
            >
              <Text style={styles.navBtnText}>🗺️ {t('responder.navigateTo')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: colors.safeGreen }]}
              onPress={() => navigation.navigate('FirstAidGuide', { guideId })}
            >
              <Text style={styles.navBtnText}>🩺 {t('responder.firstAidGuide')}</Text>
            </TouchableOpacity>

            {!arrived ? (
              <TouchableOpacity
                style={[styles.navBtn, { backgroundColor: colors.emergencyRed }]}
                onPress={handleArrived}
              >
                <Text style={styles.navBtnText}>✅ {t('responder.iHaveArrived')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.navBtn, { backgroundColor: '#795548' }]}
                onPress={handleComplete}
              >
                <Text style={styles.navBtnText}>🤝 {t('responder.handOver')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 48,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  headerTitle: { color: colors.white, fontSize: fontSizes.xxl, fontWeight: '900', marginBottom: spacing.xs },
  distance: { color: colors.white, fontSize: fontSizes.lg, fontWeight: '700', marginBottom: 4 },
  timeAgo: { color: 'rgba(255,255,255,0.8)', fontSize: fontSizes.sm },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: fontSizes.xs,
    color: colors.lightText,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryText: { fontSize: fontSizes.md, color: colors.darkText },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  actionText: { color: colors.white, fontSize: fontSizes.xl, fontWeight: '900' },
  ongoingContainer: { gap: spacing.sm, marginTop: spacing.md },
  navBtn: {
    paddingVertical: 16,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    minHeight: minTouchTarget,
    justifyContent: 'center',
  },
  navBtnText: { color: colors.white, fontSize: fontSizes.md, fontWeight: '700' },
});
