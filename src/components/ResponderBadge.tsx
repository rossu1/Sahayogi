import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Qualification } from '../types';
import { colors, fontSizes, borderRadius } from '../constants/theme';

interface ResponderBadgeProps {
  qualification: Qualification;
  language?: 'en' | 'ne';
}

const BADGE_COLORS: Record<string, string> = {
  doctor: colors.doctorBadge,
  nurse: colors.doctorBadge,
  medical_student: colors.medStudentBadge,
  anm: colors.medStudentBadge,
  first_aid_trained: colors.firstAidBadge,
  none: '#9E9E9E',
};

const LABELS_EN: Record<string, string> = {
  doctor: 'Doctor',
  nurse: 'Nurse',
  medical_student: 'Med Student',
  anm: 'ANM',
  first_aid_trained: 'First Aid',
  none: '',
};

const LABELS_NE: Record<string, string> = {
  doctor: 'डाक्टर',
  nurse: 'नर्स',
  medical_student: 'मेडिकल',
  anm: 'ANM',
  first_aid_trained: 'प्राथमिक',
  none: '',
};

export function ResponderBadge({ qualification, language = 'ne' }: ResponderBadgeProps) {
  if (qualification === 'none') return null;
  const label = language === 'ne' ? LABELS_NE[qualification] : LABELS_EN[qualification];
  const bgColor = BADGE_COLORS[qualification] ?? '#9E9E9E';

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#FFFFFF',
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
});
