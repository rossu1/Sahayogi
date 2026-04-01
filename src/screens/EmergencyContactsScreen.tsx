import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../hooks/useLanguage';
import { supabase, TABLES } from '../lib/supabase';
import { EmergencyContact, Relationship } from '../types';
import { colors, fontSizes, spacing, borderRadius, minTouchTarget } from '../constants/theme';

const RELATIONSHIPS: { key: Relationship; en: string; ne: string }[] = [
  { key: 'family',    en: 'Family',    ne: 'परिवार' },
  { key: 'friend',    en: 'Friend',    ne: 'साथी' },
  { key: 'neighbour', en: 'Neighbour', ne: 'छिमेकी' },
];

const MAX_CONTACTS = 3;

interface Props { navigation: any; }

export default function EmergencyContactsScreen({ navigation }: Props) {
  const { user, refreshUser } = useAuth();
  const { language, t } = useLanguage();
  const isNe = language === 'ne';

  const [contacts, setContacts] = useState<EmergencyContact[]>(
    (user?.emergency_contacts as EmergencyContact[]) ?? [],
  );
  const [showForm, setShowForm] = useState(false);
  const [name, setName]           = useState('');
  const [phone, setPhone]         = useState('');
  const [relationship, setRelationship] = useState<Relationship>('family');
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    setContacts((user?.emergency_contacts as EmergencyContact[]) ?? []);
  }, [user?.emergency_contacts]);

  const saveContacts = async (updated: EmergencyContact[]) => {
    setSaving(true);
    const { error } = await supabase
      .from(TABLES.USERS)
      .update({ emergency_contacts: updated })
      .eq('id', user?.id ?? '');
    setSaving(false);

    if (error) {
      Alert.alert(t('common.error'), error.message);
      return false;
    }
    setContacts(updated);
    await refreshUser();
    return true;
  };

  const handleAdd = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert(
        isNe ? 'अधूरो जानकारी' : 'Missing info',
        isNe ? 'नाम र फोन नम्बर भर्नुहोस्' : 'Please fill in name and phone number',
      );
      return;
    }
    const newContact: EmergencyContact = {
      name: name.trim(),
      phone: phone.trim(),
      relationship,
    };
    const updated = [...contacts, newContact];
    const ok = await saveContacts(updated);
    if (ok) {
      setShowForm(false);
      setName(''); setPhone(''); setRelationship('family');
    }
  };

  const handleRemove = (index: number) => {
    Alert.alert(
      isNe ? 'हटाउनुहोस्' : 'Remove',
      isNe ? 'यो सम्पर्क हटाउने?' : 'Remove this contact?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: isNe ? 'हटाउनुहोस्' : 'Remove',
          style: 'destructive',
          onPress: () => {
            const updated = contacts.filter((_, i) => i !== index);
            saveContacts(updated);
          },
        },
      ],
    );
  };

  const initials = (n: string) => {
    const parts = n.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : n.slice(0, 2).toUpperCase();
  };

  const relationLabel = (r: Relationship) => {
    const found = RELATIONSHIPS.find((rel) => rel.key === r);
    return found ? (isNe ? found.ne : found.en) : r;
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ {isNe ? 'फिर्ता' : 'Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isNe ? 'आपतकालीन सम्पर्क' : 'Emergency Contacts'}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={styles.introCard}>
          <Text style={styles.introIcon}>👥</Text>
          <Text style={styles.introTitle}>
            {isNe ? 'तपाईंको भरोसाका मान्छेहरू' : 'Your trusted people'}
          </Text>
          <Text style={styles.introSubtext}>
            {isNe
              ? 'आपतकालमा तपाईंको स्थान स्वतः पठाइन्छ'
              : 'Your location is automatically shared in emergencies'}
          </Text>
        </View>

        {/* Contact list */}
        {contacts.map((c, i) => (
          <View key={`${c.phone}-${i}`} style={styles.contactCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(c.name)}</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{c.name}</Text>
              <Text style={styles.contactPhone}>{c.phone}</Text>
              <Text style={styles.contactRel}>{relationLabel(c.relationship)}</Text>
            </View>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemove(i)}
            >
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add form */}
        {showForm ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {isNe ? 'नयाँ सम्पर्क' : 'New contact'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder={isNe ? 'नाम' : 'Name'}
              value={name}
              onChangeText={setName}
              placeholderTextColor="#9E9E9E"
            />
            <TextInput
              style={styles.input}
              placeholder={isNe ? 'फोन नम्बर' : 'Phone number'}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#9E9E9E"
            />

            <Text style={styles.fieldLabel}>
              {isNe ? 'सम्बन्ध' : 'Relationship'}
            </Text>
            <View style={styles.relRow}>
              {RELATIONSHIPS.map((r) => (
                <TouchableOpacity
                  key={r.key}
                  style={[styles.relChip, relationship === r.key && styles.relChipActive]}
                  onPress={() => setRelationship(r.key)}
                >
                  <Text style={[styles.relText, relationship === r.key && styles.relTextActive]}>
                    {isNe ? r.ne : r.en}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setShowForm(false); setName(''); setPhone(''); }}
              >
                <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleAdd}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? (isNe ? 'सुरक्षित हुँदैछ...' : 'Saving...') : (isNe ? 'सुरक्षित गर्नुहोस्' : 'Save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : contacts.length < MAX_CONTACTS ? (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowForm(true)}
          >
            <Text style={styles.addBtnIcon}>+</Text>
            <Text style={styles.addBtnText}>
              {isNe ? 'सम्पर्क थप्नुहोस्' : 'Add contact'}
            </Text>
          </TouchableOpacity>
        ) : null}

        {contacts.length >= MAX_CONTACTS && !showForm && (
          <Text style={styles.maxText}>
            {isNe ? 'अधिकतम ३ सम्पर्कहरू' : 'Maximum 3 contacts'}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F6FA' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  backBtn: { paddingVertical: 4, paddingRight: spacing.sm, minWidth: 60 },
  backText: { color: '#FFFFFF', fontSize: fontSizes.md, fontWeight: '600' },
  headerTitle: { flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '700', textAlign: 'center' },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, gap: spacing.md, paddingBottom: 40 },

  introCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  introIcon: { fontSize: 40 },
  introTitle: { fontSize: fontSizes.lg, fontWeight: '800', color: colors.darkText },
  introSubtext: { fontSize: fontSizes.sm, color: colors.lightText, textAlign: 'center' },

  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.emergencyRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  contactInfo: { flex: 1, gap: 2 },
  contactName: { fontSize: fontSizes.md, fontWeight: '700', color: colors.darkText },
  contactPhone: { fontSize: fontSizes.sm, color: colors.lightText },
  contactRel: { fontSize: 11, color: colors.lightText, textTransform: 'capitalize' },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { color: colors.emergencyRed, fontSize: 14, fontWeight: '700' },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  formTitle: { fontSize: fontSizes.md, fontWeight: '800', color: colors.darkText },
  input: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: fontSizes.md,
    color: colors.darkText,
    backgroundColor: '#FAFAFA',
  },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.lightText, marginTop: spacing.xs },
  relRow: { flexDirection: 'row', gap: spacing.sm },
  relChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    minHeight: minTouchTarget,
    justifyContent: 'center',
  },
  relChipActive: { borderColor: colors.emergencyRed, backgroundColor: '#FFF0F0' },
  relText: { fontSize: fontSizes.sm, color: colors.lightText, fontWeight: '600' },
  relTextActive: { color: colors.emergencyRed, fontWeight: '700' },
  formBtnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: fontSizes.md, fontWeight: '700', color: colors.darkText },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    backgroundColor: colors.emergencyRed,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: fontSizes.md, fontWeight: '800', color: '#FFFFFF' },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  addBtnIcon: { fontSize: 24, color: colors.lightText, fontWeight: '700' },
  addBtnText: { fontSize: fontSizes.md, fontWeight: '700', color: colors.lightText },

  maxText: { fontSize: fontSizes.sm, color: colors.lightText, textAlign: 'center' },
});
