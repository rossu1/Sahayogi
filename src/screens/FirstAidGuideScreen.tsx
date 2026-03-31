import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLanguage } from '../hooks/useLanguage';
import { FIRST_AID_GUIDES } from '../lib/firstAidData';
import { FirstAidStep } from '../components/FirstAidStep';
import { CPRTimer } from '../components/CPRTimer';
import { colors, fontSizes, spacing } from '../constants/theme';

interface Props {
  navigation: any;
  route: { params: { guideId: string } };
}

export default function FirstAidGuideScreen({ navigation, route }: Props) {
  const { language } = useLanguage();
  const guide = FIRST_AID_GUIDES.find((g) => g.id === route.params.guideId);

  if (!guide) return null;

  const title = language === 'ne' ? guide.titleNe : guide.titleEn;
  const description = language === 'ne' ? guide.descriptionNe : guide.descriptionEn;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.backBtn} onPress={() => navigation.goBack()}>←</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.guideIcon}>{guide.icon}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {guide.hasCPRTimer && <CPRTimer language={language} />}
        <Text style={styles.stepsLabel}>
          {language === 'ne' ? 'चरणहरू' : 'Steps'}
        </Text>
        {guide.steps.map((step, i) => (
          <FirstAidStep
            key={i}
            stepNumber={i + 1}
            title={language === 'ne' ? step.titleNe : step.titleEn}
            description={language === 'ne' ? step.descriptionNe : step.descriptionEn}
            critical={step.critical}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.safeGreen,
    paddingTop: 48,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  backBtn: { color: colors.white, fontSize: fontSizes.xl, paddingTop: 4 },
  headerInfo: { flex: 1 },
  guideIcon: { fontSize: 28, marginBottom: 4 },
  title: { color: colors.white, fontSize: fontSizes.xl, fontWeight: '800' },
  description: { color: 'rgba(255,255,255,0.85)', fontSize: fontSizes.sm, marginTop: 2 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  stepsLabel: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.lightText,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
