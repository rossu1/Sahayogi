import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Platform,
  Modal,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase, TABLES } from '../lib/supabase';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../context/AuthContext';
import { HospitalRecord, HospitalPrice, HospitalReview } from '../types';
import { colors, fontSizes, spacing, borderRadius } from '../constants/theme';

// ── Route params ──────────────────────────────────────────────────────────────
interface Props {
  navigation: any;
  route: { params: { hospitalId: string; hospitalName: string } };
}

// ── Star picker ───────────────────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)}>
          <Text style={{ fontSize: 32, color: n <= value ? '#FFC107' : '#D0D0D0' }}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function HospitalDetailScreen({ navigation, route }: Props) {
  const { hospitalId, hospitalName } = route.params;
  const { language } = useLanguage();
  const { user } = useAuth();
  const isNe = language === 'ne';

  const [hospital, setHospital] = useState<HospitalRecord | null>(null);
  const [prices, setPrices]     = useState<HospitalPrice[]>([]);
  const [reviews, setReviews]   = useState<HospitalReview[]>([]);
  const [loading, setLoading]   = useState(true);

  // ── Add-Price modal state ──
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [pServiceEn, setPServiceEn]         = useState('');
  const [pServiceNe, setPServiceNe]         = useState('');
  const [pMin, setPMin]                     = useState('');
  const [pMax, setPMax]                     = useState('');
  const [pSubmitting, setPSubmitting]       = useState(false);

  // ── Add-Review modal state ──
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rRating, setRRating]               = useState(5);
  const [rComment, setRComment]             = useState('');
  const [rSubmitting, setRSubmitting]       = useState(false);

  // ── Load data ────────────────────────────────────────────────────────────────
  const loadHospital = useCallback(async () => {
    const { data } = await supabase
      .from(TABLES.HOSPITAL_FINDER)
      .select('*')
      .eq('id', hospitalId)
      .single();
    if (data) setHospital(data as HospitalRecord);
  }, [hospitalId]);

  const loadPrices = useCallback(async () => {
    const { data } = await supabase
      .from(TABLES.HOSPITAL_PRICES)
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('created_at', { ascending: false });
    if (data) setPrices(data as HospitalPrice[]);
  }, [hospitalId]);

  const loadReviews = useCallback(async () => {
    const { data } = await supabase
      .from(TABLES.HOSPITAL_REVIEWS)
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('created_at', { ascending: false });
    if (data) setReviews(data as HospitalReview[]);
  }, [hospitalId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadHospital(), loadPrices(), loadReviews()]);
      setLoading(false);
    })();
  }, [loadHospital, loadPrices, loadReviews]);

  // ── Submit price ─────────────────────────────────────────────────────────────
  const submitPrice = async () => {
    if (!pServiceEn.trim() || !pMin || !pMax) {
      Alert.alert(
        isNe ? 'अधूरो जानकारी' : 'Missing info',
        isNe ? 'सेवाको नाम र मूल्य भर्नुहोस्' : 'Please fill in service name and price range',
      );
      return;
    }
    const minVal = parseInt(pMin, 10);
    const maxVal = parseInt(pMax, 10);
    if (isNaN(minVal) || isNaN(maxVal) || minVal > maxVal) {
      Alert.alert(
        isNe ? 'अमान्य मूल्य' : 'Invalid price',
        isNe ? 'कृपया सही मूल्य हाल्नुहोस्' : 'Please enter a valid price range',
      );
      return;
    }

    setPSubmitting(true);
    const { error } = await supabase.from(TABLES.HOSPITAL_PRICES).insert({
      hospital_id: hospitalId,
      service_en: pServiceEn.trim(),
      service_ne: pServiceNe.trim(),
      price_min:  minVal,
      price_max:  maxVal,
      reported_by: user?.id ?? null,
    });
    setPSubmitting(false);

    if (error) {
      Alert.alert(isNe ? 'त्रुटि' : 'Error', error.message);
      return;
    }

    setShowPriceModal(false);
    setPServiceEn(''); setPServiceNe(''); setPMin(''); setPMax('');
    await loadPrices();
    Alert.alert(
      isNe ? 'धन्यवाद!' : 'Thank you!',
      isNe ? 'मूल्य थपिएको छ।' : 'Price added successfully.',
    );
  };

  // ── Submit review ─────────────────────────────────────────────────────────────
  const submitReview = async () => {
    setRSubmitting(true);
    const { error } = await supabase.from(TABLES.HOSPITAL_REVIEWS).insert({
      hospital_id: hospitalId,
      reviewer_id: user?.id ?? null,
      rating:      rRating,
      comment_en:  rComment.trim(),
      comment_ne:  '',
    });
    setRSubmitting(false);

    if (error) {
      Alert.alert(isNe ? 'त्रुटि' : 'Error', error.message);
      return;
    }

    setShowReviewModal(false);
    setRRating(5); setRComment('');
    await Promise.all([loadReviews(), loadHospital()]); // reload rating
    Alert.alert(
      isNe ? 'धन्यवाद!' : 'Thank you!',
      isNe ? 'समीक्षा थपिएको छ।' : 'Review submitted.',
    );
  };

  // ── Map / call helpers ────────────────────────────────────────────────────────
  const openMap = (h: HospitalRecord) => {
    const url = Platform.OS === 'ios'
      ? `maps://maps.apple.com/?daddr=${h.lat},${h.lng}`
      : `geo:${h.lat},${h.lng}?q=${encodeURIComponent(h.name_en)}`;
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://maps.google.com/?q=${h.lat},${h.lng}`)
    );
  };

  function renderStars(rating: number, size = 16) {
    return (
      <Text style={{ fontSize: size, color: '#FFC107', letterSpacing: 1 }}>
        {'★'.repeat(Math.round(rating))}{'☆'.repeat(Math.max(0, 5 - Math.round(rating)))}
      </Text>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹ {isNe ? 'फिर्ता' : 'Back'}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.emergencyRed} />
        </View>
      </SafeAreaView>
    );
  }

  const h = hospital;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ {isNe ? 'फिर्ता' : 'Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {hospitalName}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {h ? (
          <>
            {/* ── Hero card ── */}
            <View style={styles.heroCard}>
              <View style={styles.heroNames}>
                <Text style={styles.heroNamePrimary}>
                  {isNe ? h.name_ne : h.name_en}
                </Text>
                <Text style={styles.heroNameSecondary}>
                  {isNe ? h.name_en : h.name_ne}
                </Text>
              </View>

              {/* Type badge + rating */}
              <View style={styles.heroBadgeRow}>
                <View style={[
                  styles.typeBadge,
                  { backgroundColor: h.hospital_type === 'government' ? '#1565C0' : h.hospital_type === 'ngo' ? '#2E7D32' : '#6A1B9A' }
                ]}>
                  <Text style={styles.typeBadgeText}>
                    {h.hospital_type === 'government'
                      ? (isNe ? 'सरकारी' : 'Govt')
                      : h.hospital_type === 'ngo' ? 'NGO'
                      : (isNe ? 'निजी' : 'Private')}
                  </Text>
                </View>
                {h.review_count > 0 && (
                  <View style={styles.ratingPill}>
                    {renderStars(h.rating, 14)}
                    <Text style={styles.ratingCount}>
                      {h.rating.toFixed(1)} ({h.review_count} {isNe ? 'समीक्षा' : 'reviews'})
                    </Text>
                  </View>
                )}
              </View>

              {/* 24hr emergency banner */}
              {h.is_24hr_emergency && (
                <View style={styles.emergencyBanner}>
                  <Text style={styles.emergencyBannerText}>
                    🚨 {isNe ? '२४ घण्टा आपतकाल उपलब्ध' : '24-hour Emergency Available'}
                  </Text>
                  {h.emergency_phone && (
                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${h.emergency_phone}`)}>
                      <Text style={styles.emergencyPhone}>{h.emergency_phone}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Info grid */}
              <View style={styles.infoGrid}>
                <View style={styles.infoCell}>
                  <Text style={styles.infoCellLabel}>{isNe ? 'फोन' : 'Phone'}</Text>
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${h.phone}`)}>
                    <Text style={[styles.infoCellValue, { color: colors.policeBlue }]}>{h.phone}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.infoCell}>
                  <Text style={styles.infoCellLabel}>{isNe ? 'OPD समय' : 'OPD Hours'}</Text>
                  <Text style={styles.infoCellValue}>{isNe ? h.opd_hours_ne : h.opd_hours_en}</Text>
                </View>
                <View style={styles.infoCell}>
                  <Text style={styles.infoCellLabel}>{isNe ? 'परामर्श शुल्क' : 'Consultation Fee'}</Text>
                  <Text style={styles.infoCellValue}>
                    {h.consultation_fee_min != null && h.consultation_fee_max != null
                      ? `NPR ${h.consultation_fee_min}–${h.consultation_fee_max}`
                      : (isNe ? 'उपलब्ध छैन' : 'Unavailable')}
                  </Text>
                </View>
                <View style={styles.infoCell}>
                  <Text style={styles.infoCellLabel}>{isNe ? 'ठेगाना' : 'Address'}</Text>
                  <Text style={styles.infoCellValue}>{isNe ? h.address_ne : h.address_en}</Text>
                </View>
              </View>

              {/* Specialities */}
              {h.specialities.length > 0 && (
                <View style={styles.specialityWrap}>
                  {h.specialities.map((s) => (
                    <View key={s} style={styles.specialityPill}>
                      <Text style={styles.specialityPillText}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* CTA buttons */}
              <View style={styles.ctaRow}>
                <TouchableOpacity
                  style={[styles.ctaBtn, { backgroundColor: colors.safeGreen }]}
                  onPress={() => Linking.openURL(`tel:${h.phone}`)}
                >
                  <Text style={styles.ctaBtnText}>📞 {isNe ? 'फोन गर्नुहोस्' : 'Call'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ctaBtn, { backgroundColor: colors.policeBlue }]}
                  onPress={() => openMap(h)}
                >
                  <Text style={styles.ctaBtnText}>🗺️ {isNe ? 'दिशा' : 'Directions'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Estimated Prices ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  💰 {isNe ? 'अनुमानित मूल्य' : 'Estimated Prices'}
                </Text>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => setShowPriceModal(true)}
                >
                  <Text style={styles.addBtnText}>+ {isNe ? 'थप्नुहोस्' : 'Add'}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.disclaimerBox}>
                <Text style={styles.disclaimerText}>
                  ⚠️ {isNe
                    ? 'समुदाय-रिपोर्ट गरिएको अनुमान। भ्रमण गर्नु अघि अस्पतालसँग पुष्टि गर्नुहोस्।'
                    : 'Community-reported estimates. Confirm prices with hospital before visiting.'}
                </Text>
              </View>

              {prices.length === 0 ? (
                <Text style={styles.emptyText}>
                  {isNe ? 'अहिलेसम्म मूल्य डेटा छैन।' : 'No price data yet.'}
                </Text>
              ) : (
                prices.map((p) => (
                  <View key={p.id} style={styles.priceRow}>
                    <View style={styles.priceServiceWrap}>
                      <Text style={styles.priceService}>{isNe && p.service_ne ? p.service_ne : p.service_en}</Text>
                      {p.verified && (
                        <View style={styles.verifiedBadge}>
                          <Text style={styles.verifiedText}>✓ {isNe ? 'प्रमाणित' : 'Verified'}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.priceValue}>NPR {p.price_min}–{p.price_max}</Text>
                  </View>
                ))
              )}
            </View>

            {/* ── Reviews ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  ⭐ {isNe ? 'समीक्षाहरू' : 'Reviews'}
                </Text>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => setShowReviewModal(true)}
                >
                  <Text style={styles.addBtnText}>+ {isNe ? 'थप्नुहोस्' : 'Add'}</Text>
                </TouchableOpacity>
              </View>

              {reviews.length === 0 ? (
                <Text style={styles.emptyText}>
                  {isNe ? 'अहिलेसम्म कुनै समीक्षा छैन। पहिलो हुनुहोस्!' : 'No reviews yet. Be the first!'}
                </Text>
              ) : (
                reviews.map((r) => (
                  <View key={r.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      {renderStars(r.rating, 16)}
                      <Text style={styles.reviewDate}>
                        {new Date(r.created_at).toLocaleDateString(isNe ? 'ne-NP' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                    {(r.comment_en || r.comment_ne) ? (
                      <Text style={styles.reviewComment}>
                        {isNe && r.comment_ne ? r.comment_ne : r.comment_en}
                      </Text>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          </>
        ) : (
          // Hospital not found in Supabase (ID is from static data)
          <View style={styles.notFoundWrap}>
            <Text style={styles.notFoundText}>
              {isNe
                ? 'विस्तृत जानकारी उपलब्ध छैन। अस्पतालमा सिधै सम्पर्क गर्नुहोस्।'
                : 'Detailed info not available. Contact the hospital directly.'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Add Price Modal ── */}
      <Modal
        visible={showPriceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPriceModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {isNe ? 'मूल्य थप्नुहोस्' : 'Add a Price'}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder={isNe ? 'सेवाको नाम (English)' : 'Service name'}
              value={pServiceEn}
              onChangeText={setPServiceEn}
              placeholderTextColor="#9E9E9E"
            />
            <TextInput
              style={styles.modalInput}
              placeholder={isNe ? 'सेवाको नाम नेपालीमा (ऐच्छिक)' : 'Service name in Nepali (optional)'}
              value={pServiceNe}
              onChangeText={setPServiceNe}
              placeholderTextColor="#9E9E9E"
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TextInput
                style={[styles.modalInput, { flex: 1 }]}
                placeholder={isNe ? 'न्यूनतम (NPR)' : 'Min (NPR)'}
                value={pMin}
                onChangeText={setPMin}
                keyboardType="number-pad"
                placeholderTextColor="#9E9E9E"
              />
              <TextInput
                style={[styles.modalInput, { flex: 1 }]}
                placeholder={isNe ? 'अधिकतम (NPR)' : 'Max (NPR)'}
                value={pMax}
                onChangeText={setPMax}
                keyboardType="number-pad"
                placeholderTextColor="#9E9E9E"
              />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setShowPriceModal(false)}
              >
                <Text style={styles.modalCancelText}>{isNe ? 'रद्द' : 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalSubmitBtn]}
                onPress={submitPrice}
                disabled={pSubmitting}
              >
                <Text style={styles.modalSubmitText}>
                  {pSubmitting
                    ? (isNe ? 'पेश हुँदैछ...' : 'Submitting...')
                    : (isNe ? 'पेश गर्नुहोस्' : 'Submit')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add Review Modal ── */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {isNe ? 'समीक्षा थप्नुहोस्' : 'Add a Review'}
            </Text>

            <Text style={styles.modalLabel}>
              {isNe ? 'तपाईंको मूल्यांकन' : 'Your rating'}
            </Text>
            <StarPicker value={rRating} onChange={setRRating} />

            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder={isNe ? 'तपाईंको टिप्पणी (ऐच्छिक)' : 'Your comment (optional)'}
              value={rComment}
              onChangeText={setRComment}
              multiline
              numberOfLines={3}
              placeholderTextColor="#9E9E9E"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setShowReviewModal(false)}
              >
                <Text style={styles.modalCancelText}>{isNe ? 'रद्द' : 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalSubmitBtn]}
                onPress={submitReview}
                disabled={rSubmitting}
              >
                <Text style={styles.modalSubmitText}>
                  {rSubmitting
                    ? (isNe ? 'पेश हुँदैछ...' : 'Submitting...')
                    : (isNe ? 'पेश गर्नुहोस्' : 'Submit')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F6FA' },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  backBtn: { paddingVertical: 4, paddingRight: spacing.sm, minWidth: 60 },
  backBtnText: { color: '#FFFFFF', fontSize: fontSizes.md, fontWeight: '600' },
  navTitle: { flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '700', textAlign: 'center' },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, gap: spacing.md, paddingBottom: 40 },

  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  heroNames: { gap: 2 },
  heroNamePrimary: { fontSize: fontSizes.xl, fontWeight: '900', color: colors.darkText, lineHeight: 28 },
  heroNameSecondary: { fontSize: 13, color: colors.lightText },

  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.sm },
  typeBadgeText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingCount: { fontSize: 12, color: colors.lightText },

  emergencyBanner: {
    backgroundColor: '#FFEBEE',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.emergencyRed,
    gap: 4,
  },
  emergencyBannerText: { fontSize: 14, fontWeight: '700', color: colors.emergencyRed },
  emergencyPhone: { fontSize: 16, fontWeight: '900', color: colors.emergencyRed, textDecorationLine: 'underline' },

  infoGrid: { gap: spacing.sm },
  infoCell: { gap: 2 },
  infoCellLabel: { fontSize: 11, fontWeight: '700', color: colors.lightText, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoCellValue: { fontSize: fontSizes.md, fontWeight: '600', color: colors.darkText },

  specialityWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  specialityPill: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.full },
  specialityPillText: { fontSize: 12, fontWeight: '600', color: '#3949AB' },

  ctaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  ctaBtn: { flex: 1, paddingVertical: 14, borderRadius: borderRadius.md, alignItems: 'center' },
  ctaBtnText: { fontSize: fontSizes.md, fontWeight: '800', color: '#FFFFFF' },

  // Section
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: fontSizes.md, fontWeight: '800', color: colors.darkText },
  addBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#3949AB' },

  disclaimerBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  disclaimerText: { fontSize: 12, color: '#795548' },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  priceServiceWrap: { flex: 1, gap: 2 },
  priceService: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.darkText },
  priceValue: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.safeGreen },
  verifiedBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, alignSelf: 'flex-start' },
  verifiedText: { fontSize: 10, color: colors.safeGreen, fontWeight: '700' },

  reviewCard: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 4,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewDate: { fontSize: 11, color: colors.lightText },
  reviewComment: { fontSize: fontSizes.sm, color: colors.darkText, lineHeight: 20 },

  emptyText: { fontSize: fontSizes.sm, color: colors.lightText, textAlign: 'center', paddingVertical: spacing.md },

  notFoundWrap: { padding: spacing.xl, alignItems: 'center' },
  notFoundText: { fontSize: fontSizes.md, color: colors.lightText, textAlign: 'center', lineHeight: 24 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: { fontSize: fontSizes.lg, fontWeight: '800', color: colors.darkText },
  modalLabel: { fontSize: 13, fontWeight: '700', color: colors.lightText },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: fontSizes.md,
    color: colors.darkText,
    backgroundColor: '#FAFAFA',
  },
  modalTextArea: { minHeight: 80, textAlignVertical: 'top' },
  modalBtnRow: { flexDirection: 'row', gap: spacing.sm },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: borderRadius.md, alignItems: 'center' },
  modalCancelBtn: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  modalCancelText: { fontSize: fontSizes.md, fontWeight: '700', color: colors.darkText },
  modalSubmitBtn: { backgroundColor: colors.emergencyRed },
  modalSubmitText: { fontSize: fontSizes.md, fontWeight: '800', color: '#FFFFFF' },
});
