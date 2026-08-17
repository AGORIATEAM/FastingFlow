import Constants from 'expo-constants';
import { useCallback, useState } from 'react';
import { Alert, Linking, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Path, Circle } from 'react-native-svg';
import { useFocusEffect, useRouter } from 'expo-router';

import { GlassCard, ListRow, PressableScale, Screen, SectionTitle } from '@/components/ui';
import { calculateStreak } from '@/lib/domain/fasting';
import { haptics } from '@/lib/haptics';
import {
  cancelScheduledNotifications,
  requestNotificationPermissions,
  scheduleForSession,
} from '@/lib/notifications';
import { useRepositories } from '@/lib/repositories/provider';
import type { FastSession } from '@/lib/schemas';
import { useAppSettingsStore } from '@/lib/stores/useAppSettingsStore';
import { useSessionStore } from '@/lib/stores/useSessionStore';
import { useUserStore } from '@/lib/stores/useUserStore';
import { Colors, Header, Radius, Spacing } from '@/lib/theme';

// Specific icon accents (no matching token in Colors — kept as named constants).
const ICON_ACCENTS = {
  amber: '#fbbf24',
  violet: '#a78bfa',
  rose: '#fb7185',
  emerald: '#34d399',
  blue: '#60a5fa',
} as const;

// ─── Level system ────────────────────────────────────────────────────

const LEVEL_NAMES: Record<number, string> = {
  1: 'Débutant',
  2: 'Débutant',
  3: 'Initié',
  4: 'Initié',
  5: 'Pratiquant',
  6: 'Pratiquant',
  7: 'Pratiquant',
  8: 'Avancé',
  9: 'Avancé',
  10: 'Avancé',
  11: 'Bio-Optimiseur',
  12: 'Bio-Optimiseur',
  13: 'Bio-Optimiseur',
  14: 'Bio-Optimiseur',
  15: 'Expert',
  16: 'Expert',
  17: 'Expert',
  18: 'Maître',
  19: 'Maître',
  20: 'Maître',
};

const XP_PER_LEVEL = 500;

function computeLevel(sessions: FastSession[]): {
  level: number;
  xp: number;
  xpInLevel: number;
  nextLevelName: string;
} {
  const totalXP = sessions.reduce((acc, s) => {
    if (s.status !== 'completed') return acc;
    return acc + Math.floor(s.plannedDurationH * 10);
  }, 0);
  const level = Math.max(1, Math.floor(totalXP / XP_PER_LEVEL) + 1);
  const xpInLevel = totalXP % XP_PER_LEVEL;
  const nextLevelName = LEVEL_NAMES[level + 1] ?? 'Maître Absolu';
  return { level, xp: totalXP, xpInLevel, nextLevelName };
}

// ─── Goal labels ─────────────────────────────────────────────────────

const GOAL_LABELS: Record<string, string> = {
  weight: 'Perte de poids',
  energy: 'Énergie',
  longevity: 'Longévité',
  metabolic: 'Santé métabolique',
};

// ─── SVG Icons ──────────────────────────────────────────────────────

function FlameIcon({ color = Colors.cyan, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C10.5 5 8 8 8 11c0 .88.18 1.72.5 2.5C7.55 12.5 7 11 7 9.5c0 0-3 3-3 6.5C4 19.64 7.58 23 12 23s8-3.36 8-7c0-3.5-3-6.5-5-8C15 9 15 10.5 15 12c0 0-1-1.5-1.5-3.5C13 6 12 2 12 2z"
        fill={color}
      />
    </Svg>
  );
}

function TargetIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={Colors.cyan} strokeWidth="1.5" />
      <Circle cx="12" cy="12" r="5" stroke={Colors.cyan} strokeWidth="1.5" />
      <Circle cx="12" cy="12" r="1" fill={Colors.cyan} />
    </Svg>
  );
}

function HeartIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={ICON_ACCENTS.rose}>
      <Path
        d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
        stroke={ICON_ACCENTS.rose}
        strokeWidth="1"
      />
    </Svg>
  );
}

function BellIcon({ color = Colors.onSurfaceVariant }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function LockIcon({ color = Colors.onSurfaceVariant }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 11H6a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2zM8 11V7a4 4 0 018 0v4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function GlobeIcon({ color = Colors.onSurfaceVariant }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <Path
        d="M12 3c-2 4-2 14 0 18M3 12h18M3.6 8h16.8M3.6 16h16.8"
        stroke={color}
        strokeWidth="1.5"
      />
    </Svg>
  );
}

function HelpIcon({ color = Colors.onSurfaceVariant }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <Path
        d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ChatIcon({ color = Colors.onSurfaceVariant }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ExternalIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
        stroke={Colors.onSurfaceVariant}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LogoutIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
        stroke={Colors.error}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const endSession = useSessionStore((s) => s.endSession);
  const setUser = useUserStore((s) => s.setUser);
  const { fastSessions } = useRepositories();

  const firstName = useAppSettingsStore((s) => s.firstName);
  const targetWeightKg = useAppSettingsStore((s) => s.targetWeightKg);
  const primaryGoal = useAppSettingsStore((s) => s.primaryGoal);
  const language = useAppSettingsStore((s) => s.language);
  const notificationsEnabled = useAppSettingsStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useAppSettingsStore((s) => s.setNotificationsEnabled);

  const [sessions, setSessions] = useState<FastSession[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      fastSessions
        .findByStatus(user.id, 'completed')
        .then(setSessions)
        .catch(() => {});
    }, [user, fastSessions])
  );

  const { level, xpInLevel, nextLevelName } = computeLevel(sessions);
  const streak = calculateStreak(sessions);
  const xpPercent = Math.min((xpInLevel / XP_PER_LEVEL) * 100, 100);

  const displayName = firstName.trim() || (user?.isGuest ? 'Invité' : 'Utilisateur');
  const membership = user?.isGuest ? 'Mode Invité' : 'Compte FastLife';

  async function handleToggleNotifications(next: boolean) {
    if (!next) {
      setNotificationsEnabled(false);
      void cancelScheduledNotifications().catch(() => {});
      return;
    }
    const granted = await requestNotificationPermissions();
    if (!granted) {
      setNotificationsEnabled(false);
      Alert.alert(
        'Notifications désactivées',
        'Autorisez les notifications dans Réglages > FastLife pour recevoir les alertes de phase.'
      );
      return;
    }
    setNotificationsEnabled(true);
    const current = useSessionStore.getState().activeSession;
    if (current) void scheduleForSession(current).catch(() => {});
  }

  function handleLogout() {
    haptics.warning();
    Alert.alert('Se déconnecter', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: () => {
          endSession();
          setUser(null);
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{displayName[0]?.toUpperCase() ?? 'F'}</Text>
          </View>
          <Text style={styles.topBarBrand}>FastLife</Text>
        </View>
        <View style={styles.streakBadge}>
          <FlameIcon size={16} />
          <Text style={styles.streakBadgeText} maxFontSizeMultiplier={1.3}>
            {streak} Jours
          </Text>
        </View>
      </View>

      <Screen scroll contentStyle={styles.content}>
        {/* Profile header + level */}
        <View style={styles.profileHeader}>
          <View style={styles.profileHeaderLeft}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileMembership} maxFontSizeMultiplier={1.3}>
              {membership}
            </Text>
          </View>
          <GlassCard padded={false} style={styles.levelBadge}>
            <Text style={styles.levelBadgeLabel} maxFontSizeMultiplier={1.3}>
              Niveau
            </Text>
            <Text style={styles.levelBadgeValue}>{level}</Text>
          </GlassCard>
        </View>

        {/* XP progress */}
        <View style={styles.xpBlock}>
          <View style={styles.xpLabelRow}>
            <Text style={styles.xpLabel} maxFontSizeMultiplier={1.3}>
              Prochain niveau : {nextLevelName}
            </Text>
            <Text style={styles.xpLabel} maxFontSizeMultiplier={1.3}>
              {xpInLevel} / {XP_PER_LEVEL} XP
            </Text>
          </View>
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: `${xpPercent}%` }]} />
          </View>
        </View>

        {/* Bento grid */}
        <View style={styles.bento}>
          {/* Goals */}
          <GlassCard style={styles.bentoCard}>
            <View style={styles.bentoCardTop}>
              <TargetIcon />
              <Text style={styles.bentoCardTopLabel} maxFontSizeMultiplier={1.3}>
                Objectifs
              </Text>
            </View>
            <View style={styles.bentoBody}>
              <Text style={styles.bentoCardTitle} maxFontSizeMultiplier={1.3}>
                {primaryGoal ? (GOAL_LABELS[primaryGoal] ?? 'Personnalisé') : 'Non défini'}
              </Text>
              {targetWeightKg && (
                <View style={styles.bentoValueRow}>
                  <Text style={styles.bentoValueLarge}>{targetWeightKg}</Text>
                  <Text style={styles.bentoValueUnit} maxFontSizeMultiplier={1.3}>
                    kg
                  </Text>
                </View>
              )}
            </View>
            <PressableScale
              haptic="light"
              style={styles.bentoBtn}
              onPress={() => router.push('/modal/edit-profile')}
              accessibilityLabel="Modifier l'objectif"
            >
              <Text style={styles.bentoBtnText} maxFontSizeMultiplier={1.3}>
                Modifier
              </Text>
            </PressableScale>
          </GlassCard>

          {/* Health integration — not available yet */}
          <GlassCard style={[styles.bentoCard, styles.bentoDisabled]}>
            <View
              style={styles.bentoInner}
              accessible
              accessibilityLabel="Santé Apple, bientôt disponible"
              accessibilityState={{ disabled: true }}
            >
              <View style={styles.bentoCardTop}>
                <HeartIcon />
              </View>
              <View style={styles.bentoBody}>
                <Text style={styles.bentoCardTitle} maxFontSizeMultiplier={1.3}>
                  Santé Apple
                </Text>
                <Text style={styles.bentoCardSubtitle} maxFontSizeMultiplier={1.3}>
                  Bientôt disponible
                </Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Settings section */}
        <View style={styles.section}>
          <SectionTitle title="Paramètres" />
          <GlassCard padded={false} style={styles.listCard}>
            <ListRow
              icon={<BellIcon color={ICON_ACCENTS.amber} />}
              iconBg={`${ICON_ACCENTS.amber}24`}
              label="Notifications"
              sublabel="Phases métaboliques et fin de jeûne"
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={(v) => void handleToggleNotifications(v)}
                  trackColor={{
                    false: Colors.primaryContainer,
                    true: `${Colors.secondaryContainer}80`,
                  }}
                  thumbColor={notificationsEnabled ? Colors.secondary : Colors.outline}
                />
              }
              onPress={() => void handleToggleNotifications(!notificationsEnabled)}
            />
            <ListRow
              icon={<LockIcon color={ICON_ACCENTS.violet} />}
              iconBg={`${ICON_ACCENTS.violet}24`}
              label="Confidentialité"
              onPress={() =>
                Alert.alert(
                  'Confidentialité',
                  'Vos données sont stockées localement sur cet appareil et ne sont jamais partagées avec des tiers sans votre consentement explicite. Conformément au RGPD, vous pouvez demander la suppression de vos données à tout moment.',
                  [{ text: 'Compris' }]
                )
              }
            />
            <ListRow
              icon={<GlobeIcon color={ICON_ACCENTS.emerald} />}
              iconBg={`${ICON_ACCENTS.emerald}24`}
              label="Langue"
              sublabel={language === 'fr' ? 'Français' : 'English'}
              onPress={() => router.push('/modal/language')}
              isLast
            />
          </GlassCard>
        </View>

        {/* Support section */}
        <View style={styles.section}>
          <SectionTitle title="Support" accent={Colors.tertiary} />
          <GlassCard padded={false} style={styles.listCard}>
            <ListRow
              icon={<HelpIcon color={ICON_ACCENTS.blue} />}
              iconBg={`${ICON_ACCENTS.blue}24`}
              label="Centre d'aide"
              rightElement={<ExternalIcon />}
              onPress={() =>
                Linking.openURL('mailto:aide@fastlife.app?subject=Centre%20d%27aide%20FastLife')
              }
            />
            <ListRow
              icon={<ChatIcon color={Colors.cyan} />}
              iconBg={`${Colors.cyan}24`}
              label="Contacter l'expert"
              onPress={() =>
                Linking.openURL('mailto:experts@fastlife.app?subject=Consultation%20FastLife')
              }
              isLast
            />
          </GlassCard>
        </View>

        {/* Logout */}
        <GlassCard padded={false} style={styles.listCard}>
          <ListRow
            icon={<LogoutIcon />}
            iconBg={`${Colors.error}14`}
            label="Se déconnecter"
            destructive
            chevron={false}
            onPress={handleLogout}
            isLast
          />
        </GlassCard>
        <Text style={styles.version} maxFontSizeMultiplier={1.3}>
          FASTLIFE v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </Screen>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  // Top bar
  topBar: {
    height: Header.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    backgroundColor: Header.bg,
    borderBottomWidth: 1,
    borderBottomColor: Header.borderColor,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryContainer,
    borderWidth: 2,
    borderColor: `${Colors.cyan}50`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 15, fontWeight: '700', color: Colors.secondary },
  topBarBrand: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3, color: Colors.white },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${Colors.white}12`,
    borderWidth: 1,
    borderColor: `${Colors.white}1F`,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  streakBadgeText: { fontSize: 13, fontWeight: '600', color: Colors.white },

  content: { paddingTop: Spacing.lg, gap: Spacing.lg },

  // Profile header
  profileHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  profileHeaderLeft: { gap: 4 },
  profileName: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5, color: Colors.onSurface },
  profileMembership: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  levelBadge: {
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  levelBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.cyan,
    textTransform: 'uppercase',
  },
  levelBadgeValue: { fontSize: 32, fontWeight: '700', color: Colors.white, lineHeight: 36 },

  // XP
  xpBlock: { gap: Spacing.sm },
  xpLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  xpLabel: { fontSize: 11, fontWeight: '600', color: Colors.onSurfaceVariant },
  xpTrack: {
    height: 8,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: Radius.full,
    backgroundColor: Colors.secondaryContainer,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },

  // Bento grid
  bento: { flexDirection: 'row', gap: 12 },
  bentoCard: {
    flex: 1,
    minHeight: 180,
    gap: 10,
  },
  bentoDisabled: { backgroundColor: `${Colors.deepBlue}80`, opacity: 0.55 },
  bentoInner: { flex: 1, gap: 10 },
  bentoCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bentoCardTopLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  bentoBody: { flex: 1, justifyContent: 'center' },
  bentoCardTitle: { fontSize: 15, fontWeight: '600', color: Colors.white, marginBottom: 4 },
  bentoCardSubtitle: { fontSize: 11, color: Colors.onSurfaceVariant, lineHeight: 16 },
  bentoValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  bentoValueLarge: { fontSize: 32, fontWeight: '700', color: Colors.white, lineHeight: 36 },
  bentoValueUnit: { fontSize: 14, color: Colors.onSurfaceVariant },
  bentoBtn: {
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: `${Colors.white}0F`,
    borderWidth: 1,
    borderColor: `${Colors.white}1A`,
    alignItems: 'center',
  },
  bentoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },

  // Sections
  section: { gap: 10 },
  listCard: { overflow: 'hidden' },

  version: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2,
    color: Colors.onSurfaceVariant,
    opacity: 0.4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
