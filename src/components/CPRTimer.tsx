import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration } from 'react-native';
import { colors, fontSizes, spacing, borderRadius } from '../constants/theme';

const BPM = 110; // Middle of 100-120 range
const INTERVAL_MS = Math.round(60000 / BPM);

interface CPRTimerProps {
  language: 'en' | 'ne';
}

export function CPRTimer({ language }: CPRTimerProps) {
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setCount((c) => {
          const next = c + 1;
          Vibration.vibrate(50);
          return next;
        });
      }, INTERVAL_MS);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const toggle = () => {
    if (!running) setCount(0);
    setRunning((r) => !r);
  };

  const isNe = language === 'ne';

  return (
    <View style={styles.container}>
      <Text style={styles.countLabel}>
        {isNe ? 'कम्प्रेसन' : 'Compressions'}
      </Text>
      <Text style={[styles.count, running && styles.countActive]}>{count}</Text>
      <Text style={styles.rateLabel}>
        {isNe ? 'प्रति मिनेट १००-१२०' : '100-120 per minute'}
      </Text>
      <TouchableOpacity
        style={[styles.button, running ? styles.stopBtn : styles.startBtn]}
        onPress={toggle}
      >
        <Text style={styles.buttonText}>
          {running
            ? isNe ? 'रोक्नुहोस्' : 'Stop'
            : isNe ? 'सिपिआर टाइमर सुरु' : 'Start CPR Timer'}
        </Text>
      </TouchableOpacity>
      {running && (
        <View style={styles.hints}>
          <Text style={styles.hint}>
            {isNe ? '• जोरसँग र छिटो थिच्नुहोस्' : '• Push hard and fast'}
          </Text>
          <Text style={styles.hint}>
            {isNe ? '• ५ सेन्टिमिटर गहिरो' : '• 2 inches deep'}
          </Text>
          <Text style={styles.hint}>
            {isNe ? '• प्रत्येक धड्कनमा पूरा छाती उठाउनुहोस्' : '• Allow full chest recoil'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF3F3',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  countLabel: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
    marginBottom: 4,
  },
  count: {
    fontSize: 72,
    fontWeight: '900',
    color: '#E0E0E0',
  },
  countActive: {
    color: colors.emergencyRed,
  },
  rateLabel: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
    marginBottom: spacing.md,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: borderRadius.full,
    minWidth: 200,
    alignItems: 'center',
  },
  startBtn: { backgroundColor: colors.emergencyRed },
  stopBtn: { backgroundColor: '#757575' },
  buttonText: { color: colors.white, fontSize: fontSizes.md, fontWeight: '700' },
  hints: { marginTop: spacing.md, alignSelf: 'stretch' },
  hint: { fontSize: fontSizes.sm, color: colors.darkText, marginBottom: 4 },
});
