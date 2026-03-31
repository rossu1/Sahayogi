import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Hospital } from '../types';
import { colors, fontSizes, spacing, borderRadius } from '../constants/theme';
import { formatDistance } from '../lib/geo';

interface HospitalCardProps {
  hospital: Hospital;
  distance?: number; // meters
  language: 'en' | 'ne';
  onDirections?: () => void;
}

export function HospitalCard({
  hospital,
  distance,
  language,
  onDirections,
}: HospitalCardProps) {
  const name = language === 'ne' ? hospital.name_ne : hospital.name_en;
  const address = language === 'ne' ? hospital.address_ne : hospital.address_en;
  const spec = language === 'ne' ? hospital.speciality_ne : hospital.speciality;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.address}>{address}</Text>
          <View style={styles.row}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{spec}</Text>
            </View>
            {distance !== undefined && (
              <Text style={styles.distance}>{formatDistance(distance)}</Text>
            )}
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.safeGreen }]}
          onPress={() => Linking.openURL(`tel:${hospital.phone}`)}
        >
          <Text style={styles.actionText}>📞 {hospital.phone}</Text>
        </TouchableOpacity>
        {onDirections && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.policeBlue }]}
            onPress={onDirections}
          >
            <Text style={styles.actionText}>
              {language === 'ne' ? 'दिशा' : 'Directions'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  info: { flex: 1 },
  name: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.darkText,
    marginBottom: 4,
  },
  address: { fontSize: fontSizes.sm, color: colors.lightText, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  badgeText: { fontSize: fontSizes.xs, color: colors.policeBlue, fontWeight: '600' },
  distance: { fontSize: fontSizes.sm, color: colors.lightText },
  actions: { flexDirection: 'row', gap: 8, marginTop: spacing.sm },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  actionText: { color: colors.white, fontSize: fontSizes.sm, fontWeight: '700' },
});
