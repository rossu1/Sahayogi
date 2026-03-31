import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLanguage } from '../hooks/useLanguage';
import { FIRST_AID_GUIDES } from '../lib/firstAidData';
import { colors, fontSizes, spacing, borderRadius } from '../constants/theme';

interface Props { navigation: any }

export default function FirstAidScreen({ navigation }: Props) {
  const { language, t } = useLanguage();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.backBtn} onPress={() => navigation.goBack()}>←</Text>
        <View>
          <Text style={styles.title}>{t('firstAid.title')}</Text>
          <Text style={styles.offlineTag}>✓ {t('firstAid.offlineReady')}</Text>
        </View>
      </View>
      <FlatList
        data={FIRST_AID_GUIDES}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.list}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.guideCard}
            onPress={() => navigation.navigate('FirstAidGuide', { guideId: item.id })}
          >
            <Text style={styles.guideIcon}>{item.icon}</Text>
            <Text style={styles.guideName}>
              {language === 'ne' ? item.titleNe : item.titleEn}
            </Text>
            <Text style={styles.guideDesc} numberOfLines={2}>
              {language === 'ne' ? item.descriptionNe : item.descriptionEn}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingTop: 48,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  backBtn: { color: colors.white, fontSize: fontSizes.xl },
  title: { color: colors.white, fontSize: fontSizes.xl, fontWeight: '800' },
  offlineTag: { color: 'rgba(255,255,255,0.8)', fontSize: fontSizes.xs },
  list: { padding: spacing.sm },
  guideCard: {
    flex: 1,
    margin: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 130,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  guideIcon: { fontSize: 32, marginBottom: spacing.xs },
  guideName: { fontSize: fontSizes.md, fontWeight: '700', color: colors.darkText, marginBottom: 4 },
  guideDesc: { fontSize: fontSizes.xs, color: colors.lightText, lineHeight: 16 },
});
