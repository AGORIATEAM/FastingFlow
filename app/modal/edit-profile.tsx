import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Circle, Path, Svg } from 'react-native-svg';

import { GlassCard, PressableScale } from '@/components/ui';
import { goalToDb, parseTargetWeightKg } from '@/lib/domain/profile';
import { useRepositories } from '@/lib/repositories/provider';
import { useAppSettingsStore } from '@/lib/stores/useAppSettingsStore';
import { useUserStore } from '@/lib/stores/useUserStore';
import { Colors, Fonts, Header, HitSlop, Radius, Spacing, Typography } from '@/lib/theme';

/** Dark checkmark stroke on the cyan check disc — no theme token. */
const CHECK_STROKE_DARK = '#003549';

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
        stroke={Colors.onSurface}
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
      <Circle cx="12" cy="12" r="9" fill={Colors.cyan} />
      <Path
        d="M8 12l3 3 5-5"
        stroke={CHECK_STROKE_DARK}
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
  const { users } = useRepositories();
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);

  const [firstName, setFirstName] = useState(storedFirstName);
  const [weight, setWeight] = useState(storedWeight ? String(storedWeight) : '');
  const [goal, setGoal] = useState<string | null>(storedGoal);

  function save() {
    const parsedWeight = parseTargetWeightKg(weight);
    if (parsedWeight === 'invalid') {
      Alert.alert('Poids invalide', 'Entrez un poids cible entre 30 et 300 kg.');
      return;
    }

    setProfileData({
      firstName: firstName.trim(),
      targetWeightKg: parsedWeight,
      primaryGoal: goal,
    });

    // The canonical profile lives in the SQLite user table
    if (user) {
      users
        .update(user.id, {
          displayName: firstName.trim() || null,
          goal: goalToDb(goal),
        })
        .then(setUser)
        .catch(() => {
          // Settings-store copy is already saved; SQLite sync retries next edit
        });
    }
    router.back();
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <PressableScale
          onPress={() => router.back()}
          hitSlop={HitSlop}
          accessibilityLabel="Retour"
          style={styles.backBtn}
        >
          <BackIcon />
        </PressableScale>
        <Text style={styles.headerTitle} maxFontSizeMultiplier={1.3}>
          Modifier le profil
        </Text>
        <PressableScale
          onPress={save}
          haptic="medium"
          accessibilityLabel="Enregistrer"
          style={styles.saveBtn}
        >
          <Text style={styles.saveBtnText} maxFontSizeMultiplier={1.3}>
            Enregistrer
          </Text>
        </PressableScale>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Personal info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
              Informations personnelles
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel} maxFontSizeMultiplier={1.3}>
                PRÉNOM
              </Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Votre prénom"
                placeholderTextColor={Colors.mutedText}
                autoCapitalize="words"
                autoCorrect={false}
                keyboardAppearance="dark"
                maxFontSizeMultiplier={1.3}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel} maxFontSizeMultiplier={1.3}>
                POIDS CIBLE (KG)
              </Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder="70"
                placeholderTextColor={Colors.mutedText}
                keyboardType="decimal-pad"
                keyboardAppearance="dark"
                maxFontSizeMultiplier={1.3}
              />
            </View>
          </View>

          {/* Goal selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
              Objectif principal
            </Text>
            <View style={styles.goalList}>
              {GOALS.map((g) => {
                const active = goal === g.id;
                return (
                  <PressableScale
                    key={g.id}
                    onPress={() => setGoal(g.id)}
                    haptic="selection"
                    accessibilityLabel={`${g.label}, ${g.sub}`}
                    accessibilityState={{ selected: active }}
                  >
                    <GlassCard style={[styles.goalCard, active && styles.goalCardActive]}>
                      <View style={styles.goalCardText}>
                        <Text
                          style={[styles.goalLabel, active && styles.goalLabelActive]}
                          maxFontSizeMultiplier={1.3}
                        >
                          {g.label}
                        </Text>
                        <Text style={styles.goalSub} maxFontSizeMultiplier={1.3}>
                          {g.sub}
                        </Text>
                      </View>
                      {active && <CheckIcon />}
                    </GlassCard>
                  </PressableScale>
                );
              })}
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },

  header: {
    height: Header.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    backgroundColor: Header.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Header.borderColor,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: Fonts.semibold, fontSize: 16, color: Colors.white },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: Colors.secondaryContainer,
    borderRadius: Radius.full,
  },
  saveBtnText: { fontFamily: Fonts.bold, fontSize: Typography.bodySmall, color: Colors.bg },

  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, gap: 28 },

  section: { gap: 14 },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: Typography.bodySmall,
    letterSpacing: 1.2,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },

  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    paddingHorizontal: Spacing.xs,
  },
  input: {
    backgroundColor: `${Colors.deepBlue}99`,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontFamily: Fonts.regular,
    fontSize: Typography.body,
    color: Colors.white,
  },

  goalList: { gap: 10 },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    padding: 14,
  },
  goalCardActive: {
    backgroundColor: `${Colors.cyan}1A`,
    borderColor: `${Colors.cyan}50`,
  },
  goalCardText: { gap: 3 },
  goalLabel: { fontFamily: Fonts.semibold, fontSize: Typography.body, color: Colors.onSurface },
  goalLabelActive: { color: Colors.white },
  goalSub: {
    fontFamily: Fonts.regular,
    fontSize: Typography.label + 1,
    color: Colors.onSurfaceVariant,
  },

  bottomSpacer: { height: 40 },
});
