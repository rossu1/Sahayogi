import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Language } from '../types';
import { colors, fontSizes, borderRadius } from '../constants/theme';

interface LanguageToggleProps {
  language: Language;
  onToggle: (lang: Language) => void;
}

export function LanguageToggle({ language, onToggle }: LanguageToggleProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.option, language === 'ne' && styles.active]}
        onPress={() => onToggle('ne')}
      >
        <Text style={[styles.text, language === 'ne' && styles.activeText]}>
          नेपाली
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.option, language === 'en' && styles.active]}
        onPress={() => onToggle('en')}
      >
        <Text style={[styles.text, language === 'en' && styles.activeText]}>
          English
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: borderRadius.full,
    padding: 3,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  active: { backgroundColor: colors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 },
  text: { fontSize: fontSizes.sm, color: colors.lightText, fontWeight: '600' },
  activeText: { color: colors.darkText },
});
