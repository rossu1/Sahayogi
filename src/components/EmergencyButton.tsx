import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { colors, borderRadius, fontSizes, minTouchTarget } from '../constants/theme';

interface EmergencyButtonProps {
  label: string;
  sublabel?: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  size?: 'large' | 'medium' | 'small';
  style?: ViewStyle;
}

export function EmergencyButton({
  label,
  sublabel,
  color,
  onPress,
  disabled,
  loading,
  size = 'medium',
  style,
}: EmergencyButtonProps) {
  const height =
    size === 'large' ? 100 : size === 'medium' ? minTouchTarget + 10 : minTouchTarget;
  const fontSize =
    size === 'large' ? fontSizes.xl : size === 'medium' ? fontSizes.lg : fontSizes.md;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: disabled ? '#9E9E9E' : color, minHeight: height },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="large" />
      ) : (
        <>
          <Text style={[styles.label, { fontSize }]}>{label}</Text>
          {sublabel ? (
            <Text style={styles.sublabel}>{sublabel}</Text>
          ) : null}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  sublabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: fontSizes.sm,
    marginTop: 4,
    textAlign: 'center',
  },
});
