import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Incident } from '../types';
import { colors, fontSizes, spacing, borderRadius } from '../constants/theme';
import { formatDistance } from '../lib/geo';

interface IncidentCardProps {
  incident: Incident;
  distance?: number;
  language: 'en' | 'ne';
  onRespond?: () => void;
  onSkip?: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  health: colors.emergencyRed,
  police: colors.policeBlue,
  fire: colors.fireOrange,
  earthquake: '#795548',
};

const TYPE_LABELS_EN: Record<string, string> = {
  health: 'Health Emergency',
  police: 'Police Alert',
  fire: 'Fire / Other',
  earthquake: 'Earthquake',
};

const TYPE_LABELS_NE: Record<string, string> = {
  health: 'स्वास्थ्य आपतकाल',
  police: 'प्रहरी सूचना',
  fire: 'आगो / अन्य',
  earthquake: 'भूकम्प',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min ago';
  return `${mins} mins ago`;
}

export function IncidentCard({
  incident,
  distance,
  language,
  onRespond,
  onSkip,
}: IncidentCardProps) {
  const typeLabel =
    language === 'ne'
      ? TYPE_LABELS_NE[incident.type]
      : TYPE_LABELS_EN[incident.type];
  const typeColor = TYPE_COLORS[incident.type] ?? colors.emergencyRed;

  return (
    <View style={[styles.card, { borderLeftColor: typeColor }]}>
      <View style={styles.header}>
        <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
          <Text style={styles.typeText}>{typeLabel}</Text>
        </View>
        <Text style={styles.time}>{timeAgo(incident.created_at)}</Text>
      </View>
      {distance !== undefined && (
        <Text style={styles.distance}>
          📍 {formatDistance(distance)} {language === 'ne' ? 'टाढा' : 'away'}
        </Text>
      )}
      {incident.situation_summary ? (
        <Text style={styles.summary}>{incident.situation_summary}</Text>
      ) : null}
      {incident.landmark_description ? (
        <Text style={styles.landmark}>🏠 {incident.landmark_description}</Text>
      ) : null}
      {(onRespond || onSkip) && (
        <View style={styles.actions}>
          {onRespond && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.safeGreen }]}
              onPress={onRespond}
            >
              <Text style={styles.actionText}>
                {language === 'ne' ? 'म जान्छु' : "I'll go"}
              </Text>
            </TouchableOpacity>
          )}
          {onSkip && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#9E9E9E' }]}
              onPress={onSkip}
            >
              <Text style={styles.actionText}>
                {language === 'ne' ? 'सक्दिन' : "Can't go"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: borderRadius.full },
  typeText: { color: colors.white, fontSize: fontSizes.sm, fontWeight: '700' },
  time: { fontSize: fontSizes.xs, color: colors.lightText },
  distance: { fontSize: fontSizes.md, fontWeight: '600', color: colors.darkText, marginBottom: 4 },
  summary: { fontSize: fontSizes.sm, color: '#444', marginBottom: 4 },
  landmark: { fontSize: fontSizes.sm, color: colors.lightText, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: spacing.sm },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: borderRadius.sm, alignItems: 'center' },
  actionText: { color: colors.white, fontSize: fontSizes.md, fontWeight: '700' },
});
