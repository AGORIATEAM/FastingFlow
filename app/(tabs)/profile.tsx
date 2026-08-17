import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Path, Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';

import { calculateStreak } from '@/lib/domain/fasting';
import { useRepositories } from '@/lib/repositories/provider';
import type { FastSession } from '@/lib/schemas';
import { useAppSettingsStore } from '@/lib/stores/useAppSettingsStore';
import { useSessionStore } from '@/lib/stores/useSessionStore';
import { useUserStore } from '@/lib/stores/useUserStore';

// ─── Design tokens ──────────────────────────────────────────────────
const C = {
  bg: '#050F1D',
  surface: '#1f1f22',
  deepBlue: '#0D2547',
  glass: 'rgba(13, 37, 71, 0.4)',
  glassBorder: 'rgba(245, 247, 250, 0.10)',
  cyan: '#3DB4F2',
  secondary: '#84cfff',
  secondaryContainer: '#009ad7',
  tertiary: '#45dfa4',
  onSurface: '#e4e2e5',
  onSurfaceVariant: '#c5c6ce',
  outline: '#8e9098',
  primaryContainer: '#0a1f3d',
  error: '#ffb4ab',
  white: '#ffffff',
  divider: 'rgba(255,255,255,0.05)',
};

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

function FlameIcon({ color = C.cyan, size = 20 }: { color?: string; size?: number }) {
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
      <Circle cx="12" cy="12" r="9" stroke={C.cyan} strokeWidth="1.5" />
      <Circle cx="12" cy="12" r="5" stroke={C.cyan} strokeWidth="1.5" />
      <Circle cx="12" cy="12" r="1" fill={C.cyan} />
    </Svg>
  );
}

function HeartIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="#fb7185">
      <Path
        d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
        stroke="#fb7185"
        strokeWidth="1"
      />
    </Svg>
  );
}

function BellIcon({ color = C.onSurfaceVariant }: { color?: string }) {
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

function LockIcon({ color = C.onSurfaceVariant }: { color?: string }) {
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

function GlobeIcon({ color = C.onSurfaceVariant }: { color?: string }) {
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

function HelpIcon({ color = C.onSurfaceVariant }: { color?: string }) {
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

function ChatIcon({ color = C.onSurfaceVariant }: { color?: string }) {
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

function ChevronIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={C.onSurfaceVariant} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function ExternalIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
        stroke={C.onSurfaceVariant}
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
        stroke={C.error}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Settings row ─────────────────────────────────────────────────────

interface SettingsRowProps {
  icon: React.ReactNode;
  iconBg?: string;
  label: string;
  sublabel?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  externalLink?: boolean;
  isLast?: boolean;
}

function SettingsRow({
  icon,
  iconBg,
  label,
  sublabel,
  rightElement,
  onPress,
  chevron = true,
  externalLink = false,
  isLast = false,
}: SettingsRowProps) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      style={[
        styles.settingsRow,
        !isLast && styles.settingsRowBorder,
        pressed && styles.settingsRowPressed,
      ]}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <View style={styles.settingsRowLeft}>
        <View style={[styles.settingsIcon, iconBg ? { backgroundColor: iconBg } : null]}>
          {icon}
        </View>
        <View style={styles.settingsTextBlock}>
          <Text style={styles.settingsLabel} numberOfLines={1}>
            {label}
          </Text>
          {sublabel ? <Text style={styles.settingsSublabel}>{sublabel}</Text> : null}
        </View>
      </View>
      <View style={styles.settingsRowRight}>
        {rightElement ?? (externalLink ? <ExternalIcon /> : chevron ? <ChevronIcon /> : null)}
      </View>
    </Pressable>
  );
}

// ─── Logout button ───────────────────────────────────────────────────

function LogoutButton({ onPress }: { onPress: () => void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      style={[styles.logoutBtn, pressed && styles.logoutBtnPressed]}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <LogoutIcon />
      <Text style={styles.logoutText}>Se déconnecter</Text>
    </Pressable>
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

  useEffect(() => {
    if (!user) return;
    fastSessions.findByStatus(user.id, 'completed').then(setSessions);
  }, [user, fastSessions]);

  const { level, xpInLevel, nextLevelName } = computeLevel(sessions);
  const streak = calculateStreak(sessions);
  const xpPercent = Math.min((xpInLevel / XP_PER_LEVEL) * 100, 100);

  const displayName = firstName.trim() || (user?.isGuest ? 'Invité' : 'Utilisateur');
  const membership = user?.isGuest ? 'Mode Invité' : 'Compte FastLife';

  function handleLogout() {
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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
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
          <Text style={styles.streakBadgeText}>{streak} Jours</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header + level */}
        <View style={styles.profileHeader}>
          <View style={styles.profileHeaderLeft}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileMembership}>{membership}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeLabel}>Niveau</Text>
            <Text style={styles.levelBadgeValue}>{level}</Text>
          </View>
        </View>

        {/* XP progress */}
        <View style={styles.xpBlock}>
          <View style={styles.xpLabelRow}>
            <Text style={styles.xpLabel}>Prochain niveau : {nextLevelName}</Text>
            <Text style={styles.xpLabel}>
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
          <View style={styles.bentoCard}>
            <View style={styles.bentoCardTop}>
              <TargetIcon />
              <Text style={styles.bentoCardTopLabel}>Objectifs</Text>
            </View>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={styles.bentoCardTitle}>
                {primaryGoal ? (GOAL_LABELS[primaryGoal] ?? 'Personnalisé') : 'Non défini'}
              </Text>
              {targetWeightKg && (
                <View style={styles.bentoValueRow}>
                  <Text style={styles.bentoValueLarge}>{targetWeightKg}</Text>
                  <Text style={styles.bentoValueUnit}>kg</Text>
                </View>
              )}
            </View>
            <Pressable style={styles.bentoBtn} onPress={() => router.push('/modal/edit-profile')}>
              <Text style={styles.bentoBtnText}>Modifier</Text>
            </Pressable>
          </View>

          {/* Health integration */}
          <View style={[styles.bentoCard, styles.bentoDark]}>
            <View style={styles.bentoCardTop}>
              <HeartIcon />
              <View style={styles.healthStatusDot} />
            </View>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={styles.bentoCardTitle}>Santé Apple</Text>
              <Text style={styles.bentoCardSubtitle}>Données biométriques synchronisées.</Text>
            </View>
            <Pressable
              style={styles.bentoBtnCyan}
              onPress={() =>
                Alert.alert(
                  'Santé Apple',
                  "L'intégration HealthKit sera disponible dans la prochaine mise à jour. Vos données biométriques se synchroniseront automatiquement.",
                  [{ text: 'OK' }]
                )
              }
            >
              <Text style={styles.bentoBtnCyanText}>Gérer</Text>
            </Pressable>
          </View>
        </View>

        {/* Settings section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionAccent, { backgroundColor: C.secondaryContainer }]} />
            <Text style={styles.sectionTitle}>Paramètres</Text>
          </View>
          <View style={styles.settingsCard}>
            <SettingsRow
              icon={<BellIcon color="#fbbf24" />}
              iconBg="rgba(251,191,36,0.14)"
              label="Notifications"
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: C.surface, true: `${C.secondaryContainer}80` }}
                  thumbColor={notificationsEnabled ? C.secondary : C.outline}
                />
              }
              onPress={() => setNotificationsEnabled(!notificationsEnabled)}
              chevron={false}
            />
            <SettingsRow
              icon={<LockIcon color="#a78bfa" />}
              iconBg="rgba(167,139,250,0.14)"
              label="Confidentialité"
              onPress={() =>
                Alert.alert(
                  'Confidentialité',
                  'Vos données sont stockées localement sur cet appareil et ne sont jamais partagées avec des tiers sans votre consentement explicite. Conformément au RGPD, vous pouvez demander la suppression de vos données à tout moment.',
                  [{ text: 'Compris' }]
                )
              }
            />
            <SettingsRow
              icon={<GlobeIcon color="#34d399" />}
              iconBg="rgba(52,211,153,0.14)"
              label="Langue"
              sublabel={language === 'fr' ? 'Français' : 'English'}
              onPress={() => router.push('/modal/language')}
              isLast
            />
          </View>
        </View>

        {/* Support section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionAccent, { backgroundColor: C.tertiary }]} />
            <Text style={styles.sectionTitle}>Support</Text>
          </View>
          <View style={styles.settingsCard}>
            <SettingsRow
              icon={<HelpIcon color="#60a5fa" />}
              iconBg="rgba(96,165,250,0.14)"
              label="Centre d'aide"
              externalLink
              chevron={false}
              onPress={() =>
                Linking.openURL('mailto:aide@fastlife.app?subject=Centre%20d%27aide%20FastLife')
              }
            />
            <SettingsRow
              icon={<ChatIcon color={C.cyan} />}
              iconBg="rgba(61,180,242,0.14)"
              label="Contacter l'expert"
              onPress={() =>
                Linking.openURL('mailto:experts@fastlife.app?subject=Consultation%20FastLife')
              }
              isLast
            />
          </View>
        </View>

        {/* Logout */}
        <LogoutButton onPress={handleLogout} />
        <Text style={styles.version}>FASTLIFE v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },

  // Top bar
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(13,37,71,0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.primaryContainer,
    borderWidth: 2,
    borderColor: `${C.cyan}50`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 15, fontWeight: '700', color: C.secondary },
  topBarBrand: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3, color: C.white },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  streakBadgeText: { fontSize: 13, fontWeight: '600', color: C.white },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 20, paddingBottom: 32 },

  // Profile header
  profileHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  profileHeaderLeft: { gap: 4 },
  profileName: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5, color: C.onSurface },
  profileMembership: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  levelBadge: {
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  levelBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    color: C.cyan,
    textTransform: 'uppercase',
  },
  levelBadgeValue: { fontSize: 32, fontWeight: '700', color: C.white, lineHeight: 36 },

  // XP
  xpBlock: { gap: 8 },
  xpLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  xpLabel: { fontSize: 11, fontWeight: '600', color: C.onSurfaceVariant },
  xpTrack: { height: 8, backgroundColor: C.surface, borderRadius: 99, overflow: 'hidden' },
  xpFill: {
    height: '100%',
    borderRadius: 99,
    backgroundColor: C.secondaryContainer,
    shadowColor: C.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },

  // Bento grid
  bento: { flexDirection: 'row', gap: 12 },
  bentoCard: {
    flex: 1,
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderRadius: 24,
    padding: 16,
    minHeight: 180,
    gap: 10,
  },
  bentoDark: { backgroundColor: 'rgba(13,37,71,0.5)' },
  bentoCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bentoCardTopLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  bentoCardTitle: { fontSize: 15, fontWeight: '600', color: C.white, marginBottom: 4 },
  bentoCardSubtitle: { fontSize: 11, color: C.onSurfaceVariant, lineHeight: 16 },
  bentoValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  bentoValueLarge: { fontSize: 32, fontWeight: '700', color: C.white, lineHeight: 36 },
  bentoValueUnit: { fontSize: 14, color: C.onSurfaceVariant },
  healthStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34d399',
    shadowColor: '#34d399',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  bentoBtn: {
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
  },
  bentoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  bentoBtnCyan: {
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: `${C.secondaryContainer}30`,
    borderWidth: 1,
    borderColor: `${C.secondaryContainer}50`,
    alignItems: 'center',
  },
  bentoBtnCyanText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: C.secondary,
    textTransform: 'uppercase',
  },

  // Sections
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  sectionAccent: { width: 3, height: 16, borderRadius: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.onSurface, letterSpacing: -0.2 },
  settingsCard: {
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderRadius: 24,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    minHeight: 56,
  },
  settingsRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  settingsRowPressed: { backgroundColor: 'rgba(255,255,255,0.04)' },
  settingsRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  settingsTextBlock: { flex: 1 },
  settingsRowRight: { marginLeft: 8, alignItems: 'center', justifyContent: 'center' },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  settingsLabel: { fontSize: 15, fontWeight: '500', color: C.white },
  settingsSublabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
    marginTop: 2,
  },

  // Logout
  logoutSection: { gap: 24, paddingTop: 4 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,180,171,0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  logoutBtnPressed: {
    backgroundColor: 'rgba(255,180,171,0.10)',
    borderColor: `${C.error}20`,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: C.error },
  version: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2,
    color: C.onSurfaceVariant,
    opacity: 0.4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
