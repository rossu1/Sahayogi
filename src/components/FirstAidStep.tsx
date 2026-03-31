import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSizes, spacing, borderRadius } from '../constants/theme';

interface FirstAidStepProps {
  stepNumber: number;
  title: string;
  description: string;
  critical?: boolean;
}

export function FirstAidStep({
  stepNumber,
  title,
  description,
  critical,
}: FirstAidStepProps) {
  return (
    <View style={[styles.container, critical && styles.criticalContainer]}>
      <View style={[styles.numberCircle, critical && styles.criticalCircle]}>
        <Text style={styles.number}>{stepNumber}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, critical && styles.criticalTitle]}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.safeGreen,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  criticalContainer: {
    borderLeftColor: colors.emergencyRed,
    backgroundColor: '#FFF8F8',
  },
  numberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.safeGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    flexShrink: 0,
  },
  criticalCircle: { backgroundColor: colors.emergencyRed },
  number: { color: colors.white, fontWeight: '800', fontSize: fontSizes.md },
  content: { flex: 1 },
  title: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.darkText,
    marginBottom: 4,
  },
  criticalTitle: { color: colors.emergencyRed },
  description: { fontSize: fontSizes.sm, color: '#444', lineHeight: 20 },
});
