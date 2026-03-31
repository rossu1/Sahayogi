import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Linking } from 'react-native';
import { useLanguage } from '../hooks/useLanguage';
import { useLocation } from '../hooks/useLocation';
import { HospitalCard } from '../components/HospitalCard';
import { HOSPITALS } from '../constants/hospitals';
import { haversineDistance, mapsUrl } from '../lib/geo';
import { colors, fontSizes, spacing } from '../constants/theme';

interface Props { navigation: any }

export default function HospitalsScreen({ navigation }: Props) {
  const { language, t } = useLanguage();
  const { location } = useLocation();

  const hospitalsWithDistance = useMemo(() => {
    return HOSPITALS.map((h) => ({
      ...h,
      distance: location
        ? haversineDistance(location.lat, location.lng, h.lat, h.lng)
        : undefined,
    })).sort((a, b) => {
      if (a.distance === undefined || b.distance === undefined) return 0;
      return a.distance - b.distance;
    });
  }, [location]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.backBtn} onPress={() => navigation.goBack()}>←</Text>
        <Text style={styles.title}>{t('hospitals.title')}</Text>
      </View>
      <FlatList
        data={hospitalsWithDistance}
        keyExtractor={(h) => h.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <HospitalCard
            hospital={item}
            distance={item.distance}
            language={language}
            onDirections={() => Linking.openURL(mapsUrl(item.lat, item.lng))}
          />
        )}
        ListHeaderComponent={
          location ? (
            <Text style={styles.nearLabel}>
              📍 {language === 'ne' ? 'तपाईंको स्थानबाट दूरी' : 'Distance from your location'}
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.safeGreen,
    paddingTop: 48,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  backBtn: { color: colors.white, fontSize: fontSizes.xl },
  title: { color: colors.white, fontSize: fontSizes.xl, fontWeight: '800' },
  list: { padding: spacing.md },
  nearLabel: { fontSize: fontSizes.sm, color: colors.lightText, marginBottom: spacing.sm },
});
