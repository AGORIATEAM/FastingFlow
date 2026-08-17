import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Path, Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';

import { useAppSettingsStore } from '@/lib/stores/useAppSettingsStore';

// ─── Design tokens ──────────────────────────────────────────────────
const C = {
  bg: '#050F1D',
  deepBlue: '#0D2547',
  glass: 'rgba(13, 37, 71, 0.5)',
  glassBorder: 'rgba(245, 247, 250, 0.10)',
  inputBg: 'rgba(13, 37, 71, 0.6)',
  cyan: '#3DB4F2',
  secondary: '#84cfff',
  secondaryContainer: '#009ad7',
  tertiary: '#45dfa4',
  onSurface: '#e4e2e5',
  onSurfaceVariant: '#c5c6ce',
  white: '#ffffff',
};

// ─── Goal options ────────────────────────────────────────────────────

const GOALS = [
  { id: 'weight', label: 'Perte de poids', sub: 'Combustion des graisses' },
  { id: 'energy', label: 'Énergie', sub: 'Clarté mentale' },
  { id: 'longevity', label: 'Longévité', sub: 'Autophagie cellulaire' },
  { id: 'metabolic', label: 'Santé métabolique', sub: 'Insuline et glycémie' },
];

// ─── Icons ──────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={C.onSurface}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" fill={C.cyan} />
      <Path
        d="M8 12l3 3 5-5"
        stroke="#003549"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────

export default function EditProfileModal() {
  const router = useRouter();

  const storedFirstName = useAppSettingsStore((s) => s.firstName);
  const storedWeight = useAppSettingsStore((s) => s.targetWeightKg);
  const storedGoal = useAppSettingsStore((s) => s.primaryGoal);
  const setProfileData = useAppSettingsStore((s) => s.setProfileData);

  const [firstName, setFirstName] = useState(storedFirstName);
  const [weight, setWeight] = useState(storedWeight ? String(storedWeight) : '');
  const [goal, setGoal] = useState<string | null>(storedGoal);

  function save() {
    setProfileData({
      firstName: firstName.trim(),
      targetWeightKg: weight ? parseFloat(weight) || null : null,
      primaryGoal: goal,
    });
    router.back();
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={16}>
          <BackIcon />
        </Pressable>
        <Text style={styles.headerTitle}>Modifier le profil</Text>
        <Pressable style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveBtnText}>Enregistrer</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Personal info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations personnelles</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PRÉNOM</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Votre prénom"
                placeholderTextColor={`${C.onSurfaceVariant}60`}
                autoCapitalize="words"
                autoCorrect={false}
                keyboardAppearance="dark"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>POIDS CIBLE (KG)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder="70"
                placeholderTextColor={`${C.onSurfaceVariant}60`}
                keyboardType="decimal-pad"
                keyboardAppearance="dark"
              />
            </View>
          </View>

          {/* Goal selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Objectif principal</Text>
            <View style={styles.goalList}>
              {GOALS.map((g) => {
                const active = goal === g.id;
                return (
                  <Pressable
                    key={g.id}
                    style={[styles.goalCard, active && styles.goalCardActive]}
                    onPress={() => setGoal(g.id)}
                  >
                    <View style={styles.goalCardText}>
                      <Text style={[styles.goalLabel, active && { color: C.white }]}>
                        {g.label}
                      </Text>
                      <Text style={styles.goalSub}>{g.sub}</Text>
                    </View>
                    {active && <CheckIcon />}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },

  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(13,37,71,0.88)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: C.white },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: C.secondaryContainer,
    borderRadius: 99,
  },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: '#001e2e' },

  content: { paddingHorizontal: 20, paddingTop: 24, gap: 28 },

  section: { gap: 14 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
  },

  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
  input: {
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: C.white,
  },

  goalList: { gap: 10 },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderRadius: 14,
    padding: 14,
  },
  goalCardActive: {
    backgroundColor: 'rgba(61,180,242,0.10)',
    borderColor: `${C.cyan}50`,
  },
  goalCardText: { gap: 3 },
  goalLabel: { fontSize: 15, fontWeight: '600', color: C.onSurface },
  goalSub: { fontSize: 12, color: C.onSurfaceVariant },
});
