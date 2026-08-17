import { randomUUID } from 'expo-crypto';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type DimensionValue,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Circle, Defs, LinearGradient, Stop, Svg, Path } from 'react-native-svg';
import { useRouter } from 'expo-router';

import {
  calculateCurrentPhase,
  calculateProgress,
  computeMissingPhases,
  getUpcomingPhaseIds,
} from '@/lib/domain/fasting';
import {
  cancelScheduledNotifications,
  requestNotificationPermissions,
  scheduleForSession,
} from '@/lib/notifications';
import { useRepositories } from '@/lib/repositories/provider';
import { PROTOCOL_DURATION_H, type Protocol } from '@/lib/schemas';
import { useAppSettingsStore } from '@/lib/stores/useAppSettingsStore';
import { useSessionStore } from '@/lib/stores/useSessionStore';
import { useUserStore } from '@/lib/stores/useUserStore';

// Resolve the effective planned duration for a protocol
function effectiveDurationH(protocol: Protocol, freeDurationH: number): number {
  if (protocol === 'free') return freeDurationH > 0 ? freeDurationH : 16;
  return PROTOCOL_DURATION_H[protocol] ?? 0;
}

// ─── Constants ──────────────────────────────────────────────────────
const { width: SW } = Dimensions.get('window');
const RING_SIZE = Math.min(SW - 48, 288);
const STROKE = 8;
const RADIUS = (RING_SIZE - STROKE * 2) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const C = {
  bg: '#050F1D',
  surface: '#131316',
  surfaceHigh: '#1f1f22',
  deepBlue: '#0D2547',
  primary: '#3DB4F2',
  secondary: '#84cfff',
  secondaryContainer: '#009ad7',
  tertiary: '#45dfa4',
  onSurface: '#e4e2e5',
  onSurfaceVariant: '#c5c6ce',
  onPrimaryContainer: '#7587ab',
  primaryContainer: '#0a1f3d',
  white: '#ffffff',
  ring: '#1a3060',
  glass: 'rgba(13, 37, 71, 0.45)',
  glassBorder: 'rgba(245, 247, 250, 0.10)',
  divider: 'rgba(255,255,255,0.05)',
};

// ─── Phase metadata ─────────────────────────────────────────────────
const PHASE_META: Record<string, { label: string; metabolicText: string; color: string }> = {
  '12h': {
    label: 'Glycogénolyse',
    metabolicText:
      "Le glycogène hépatique s'épuise. Votre corps commence à puiser dans ses réserves de graisses.",
    color: C.secondary,
  },
  '16h': {
    label: 'Cétogenèse débutante',
    metabolicText:
      'Production de corps cétoniques amorcée. Le cerveau commence à utiliser les cétones comme carburant alternatif.',
    color: C.secondary,
  },
  '18h': {
    label: 'Autophagie active',
    metabolicText:
      "L'autophagie cellulaire est pleinement active. Vos cellules recyclent les protéines endommagées.",
    color: C.tertiary,
  },
  '24h': {
    label: 'Cétose profonde',
    metabolicText:
      "Cétose profonde établie. L'organisme utilise principalement les acides gras. Hormones de croissance augmentées.",
    color: C.tertiary,
  },
  '36h': {
    label: 'Régénération cellulaire',
    metabolicText:
      'Régénération cellulaire intense. Activation des gènes de longévité SIRT1 et FOXO3.',
    color: C.tertiary,
  },
};

const PROTOCOL_BENEFITS: Record<string, string> = {
  '16:8': "Stabilisation de l'insuline, brûlage des graisses, clarté mentale",
  '18:6': 'Cétose débutante, nettoyage cellulaire amorcé',
  '20:4': "Autophagie active, pic d'hormone de croissance",
  OMAD: 'Repos digestif total, clarté cognitive maximale',
  '24h': 'Régénération immunitaire, réinitialisation métabolique',
  '36h': 'Autophagie profonde, activation gènes longévité',
  '48h': 'Pic extrême HGH, régénération cellulaire complète',
  free: 'Protocole personnalisé selon votre rythme',
};

function getPhaseInfo(phaseId: string | null) {
  if (!phaseId)
    return {
      label: 'Phase de transition',
      metabolicText:
        'Transition vers la lipolyse. Votre corps utilise ses dernières réserves de glucose.',
      color: C.secondary,
    };
  return (
    PHASE_META[phaseId] ?? {
      label: phaseId,
      metabolicText: 'Transition métabolique en cours.',
      color: C.secondary,
    }
  );
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatTime(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDuration(hours: number): string {
  // Use Math.floor for minutes to avoid rounding up to 60 (e.g. 47.997h → "47h59" not "47h60")
  const totalMinutes = Math.floor(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, '0')}`;
}

function formatTimeOfDay(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function getNextPhaseInfo(
  elapsedHours: number
): { name: string; inHours: number; color: string } | null {
  const upcoming = getUpcomingPhaseIds(elapsedHours);
  if (upcoming.length === 0) return null;
  const nextId = upcoming[0]!;
  const triggerH = parseFloat(nextId.replace('h', ''));
  const meta = PHASE_META[nextId];
  return {
    name: meta?.label ?? nextId,
    inHours: triggerH - elapsedHours,
    color: meta?.color ?? C.secondary,
  };
}

// ─── Gradient Ring ──────────────────────────────────────────────────

function GradientRing({
  progress,
  elapsedMs,
  plannedH,
  startedAt,
}: {
  progress: number;
  elapsedMs: number;
  plannedH: number;
  startedAt?: string;
}) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const offset = CIRCUMFERENCE * (1 - clamped);
  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;
  const remainingH = plannedH > 0 ? Math.max(0, plannedH - elapsedMs / 3600000) : 0;

  return (
    <View
      style={{
        width: RING_SIZE,
        height: RING_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={RING_SIZE} height={RING_SIZE} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#3DB4F2" />
            <Stop offset="100%" stopColor="#45dfa4" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={cx}
          cy={cy}
          r={RADIUS}
          stroke={C.ring}
          strokeWidth={STROKE}
          fill="none"
          opacity={0.35}
        />
        <Circle
          cx={cx}
          cy={cy}
          r={RADIUS}
          stroke="url(#ringGrad)"
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90, ${cx}, ${cy})`}
        />
      </Svg>

      <View style={styles.ringInner}>
        <Text style={styles.timerDisplay}>{formatTime(elapsedMs)}</Text>
        {plannedH > 0 && (
          <Text style={styles.timerSub}>
            {remainingH > 0.016
              ? `${formatDuration(remainingH)} restant`
              : `Objectif ${plannedH}h atteint`}
          </Text>
        )}
        {startedAt && (
          <Text style={styles.timerStarted}>démarré à {formatTimeOfDay(startedAt)}</Text>
        )}
      </View>
    </View>
  );
}

// ─── Quick action SVG icons (no emojis per ui-ux-pro-max) ───────────

function WaterIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C9 7 6 11 6 15a6 6 0 0012 0c0-4-3-8-6-13z" fill={color} fillOpacity={0.9} />
    </Svg>
  );
}

function MoodIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <Path
        d="M8.5 14.5s1.5 2 3.5 2 3.5-2 3.5-2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Circle cx="9" cy="10" r="1" fill={color} />
      <Circle cx="15" cy="10" r="1" fill={color} />
    </Svg>
  );
}

function NoteIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9L14 3z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 3v6h6M16 13H8M16 17H8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Quick action card (with proper press handling) ──────────────────

function QuickCard({
  icon,
  label,
  value,
  btnLabel,
  btnColor,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  btnLabel: string;
  btnColor: string;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <View style={styles.quickCard}>
      <View style={styles.quickIcon}>{icon}</View>
      <View style={styles.quickMid}>
        <Text style={styles.quickLabel}>{label}</Text>
        <Text style={styles.quickValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <Pressable
        style={[
          styles.quickBtn,
          { borderColor: `${btnColor}40`, backgroundColor: `${btnColor}18` },
          pressed && { backgroundColor: `${btnColor}30` },
        ]}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onPress={onPress}
      >
        <Text style={[styles.quickBtnText, { color: btnColor }]}>{btnLabel}</Text>
      </Pressable>
    </View>
  );
}

// ─── Stop / CTA buttons with consistent press handling ──────────────

function StopButton({ onPress }: { onPress: () => void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      style={[styles.stopBtn, pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 }]}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
    >
      <Text style={styles.stopBtnText}>Arrêter le jeûne</Text>
    </Pressable>
  );
}

function StartButton({ label, onPress }: { label: string; onPress: () => void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      style={[styles.startBtn, pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 }]}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
    >
      <Text style={styles.startBtnText}>{label}</Text>
    </Pressable>
  );
}

// ─── Note modal ─────────────────────────────────────────────────────

function NoteModal({
  visible,
  initialText,
  onClose,
  onSave,
}: {
  visible: boolean;
  initialText: string;
  onClose: () => void;
  onSave: (t: string) => void;
}) {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    if (visible) setText(initialText);
  }, [visible, initialText]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Ajouter une note</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Comment vous sentez-vous ?"
            placeholderTextColor={`${C.onSurfaceVariant}60`}
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={4}
            keyboardAppearance="dark"
            autoFocus
          />
          <Pressable
            style={styles.modalSaveBtn}
            onPress={() => {
              onSave(text);
              setText('');
              onClose();
            }}
          >
            <Text style={styles.modalSaveBtnText}>Enregistrer</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Idle state ─────────────────────────────────────────────────────

const MOODS = ['Stable', 'Énergique', 'Fatigué', 'Concentré', 'Calme'];

function IdleScreen({ onStart }: { onStart: (p: Protocol) => void }) {
  const router = useRouter();
  const protocol = useAppSettingsStore((s) => s.preferredProtocol);
  const freeDurationH = useAppSettingsStore((s) => s.freeDurationH);
  const durationH = protocol === 'free' ? freeDurationH : (PROTOCOL_DURATION_H[protocol] ?? 0);
  const benefit = PROTOCOL_BENEFITS[protocol] ?? '';

  return (
    <ScrollView
      style={styles.idleScroll}
      contentContainerStyle={styles.idleContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.idleHero}>
        <View style={styles.idleBadge}>
          <View style={styles.idlePulse} />
          <Text style={styles.idleBadgeText}>PRÊT À COMMENCER</Text>
        </View>
        <Text style={styles.idleTitle}>Votre prochain{'\n'}jeûne vous attend</Text>
        <Text style={styles.idleSubtitle}>
          Chaque jeûne renforce votre métabolisme{'\n'}et régénère vos cellules.
        </Text>
      </View>

      {/* Protocol card */}
      <View style={styles.protocolCard}>
        <View style={styles.protocolCardTop}>
          <View>
            <Text style={styles.protocolCardMeta}>Protocole actuel</Text>
            <Text style={styles.protocolCardName}>{protocol}</Text>
            {durationH > 0 && (
              <Text style={styles.protocolCardDuration}>{durationH} heures de jeûne</Text>
            )}
          </View>
          <Pressable style={styles.changeBtn} onPress={() => router.push('/modal/protocol')}>
            <Text style={styles.changeBtnText}>Modifier</Text>
          </Pressable>
        </View>
        {benefit.length > 0 && (
          <View style={styles.protocolBenefitRow}>
            <View style={styles.benefitDot} />
            <Text style={styles.protocolBenefit}>{benefit}</Text>
          </View>
        )}
      </View>

      {/* Start CTA */}
      <StartButton label={`Commencer · ${protocol}`} onPress={() => onStart(protocol)} />

      {/* Tips */}
      <View style={styles.tipsRow}>
        {['💧 Hydratez-vous', '☕ Café OK', '🧂 Électrolytes'].map((tip) => (
          <View key={tip} style={styles.tipChip}>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────

export default function HomeScreen() {
  const { fastSessions, journalEntries, phasesReached: phasesReachedRepo } = useRepositories();
  const user = useUserStore((s) => s.user);
  const activeSession = useSessionStore((s) => s.activeSession);
  const startSession = useSessionStore((s) => s.startSession);
  const endSession = useSessionStore((s) => s.endSession);
  const setPhasesReached = useSessionStore((s) => s.setPhasesReached);
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  const [waterMl, setWaterMl] = useState(0);
  const [moodIdx, setMoodIdx] = useState(0);
  const [note, setNote] = useState('');
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const journalIdRef = useRef<string | null>(null);
  const phasesLoadedRef = useRef(false);

  useEffect(() => {
    if (!user || activeSession !== null) return;
    fastSessions
      .findActiveByUserId(user.id)
      .then((session) => {
        if (session) startSession(session);
      })
      .catch(() => {
        // Non-blocking: the idle screen still works without a resumed session
      });
  }, [user, activeSession, fastSessions, startSession]);

  // Restore the session's journal entry and phase history, then record any
  // phase crossed while the app was killed (catch-up).
  useEffect(() => {
    if (!activeSession || !user) return;
    let cancelled = false;
    phasesLoadedRef.current = false;

    journalEntries
      .findByFastSessionId(activeSession.id)
      .then((entries) => {
        if (cancelled) return;
        const entry = entries[0];
        journalIdRef.current = entry?.id ?? null;
        setWaterMl(entry?.waterMl ?? 0);
        setMoodIdx(entry ? entry.mood - 1 : 0);
        setNote(entry?.text ?? '');
      })
      .catch(() => {});

    phasesReachedRepo
      .findByFastSessionId(activeSession.id)
      .then(async (rows) => {
        if (cancelled) return;
        setPhasesReached(rows);
        phasesLoadedRef.current = true;
        const missing = computeMissingPhases(
          activeSession,
          rows.map((r) => r.phaseId)
        );
        for (const m of missing) {
          const created = await phasesReachedRepo.create({
            id: randomUUID(),
            userId: activeSession.userId,
            fastSessionId: activeSession.id,
            phaseId: m.phaseId,
            reachedAt: m.reachedAt,
          });
          if (!cancelled) useSessionStore.getState().addPhaseReached(created);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [activeSession, user, journalEntries, phasesReachedRepo, setPhasesReached]);

  useEffect(() => {
    if (!activeSession) return;
    const id = setInterval(() => {
      forceUpdate();
      if (!phasesLoadedRef.current) return;
      const { activeSession: current, phasesReached: reached } = useSessionStore.getState();
      if (!current) return;
      const missing = computeMissingPhases(
        current,
        reached.map((p) => p.phaseId)
      );
      for (const m of missing) {
        phasesReachedRepo
          .create({
            id: randomUUID(),
            userId: current.userId,
            fastSessionId: current.id,
            phaseId: m.phaseId,
            reachedAt: m.reachedAt,
          })
          .then((created) => useSessionStore.getState().addPhaseReached(created))
          .catch(() => {});
      }
    }, 1000);
    return () => clearInterval(id);
  }, [activeSession, forceUpdate, phasesReachedRepo]);

  // Single journal entry per session, created lazily on first interaction.
  const upsertJournal = useCallback(
    async (patch: { waterMl?: number; mood?: number; text?: string | null }) => {
      if (!user || !activeSession) return;
      try {
        if (journalIdRef.current) {
          await journalEntries.update(journalIdRef.current, patch);
        } else {
          const created = await journalEntries.create({
            id: randomUUID(),
            userId: user.id,
            fastSessionId: activeSession.id,
            mood: patch.mood ?? moodIdx + 1,
            energy: 5,
            hunger: 5,
            mentalClarity: 5,
            waterMl: patch.waterMl ?? waterMl,
            text: patch.text !== undefined ? patch.text : note || null,
          });
          journalIdRef.current = created.id;
        }
      } catch {
        // Journal writes must never break the timer
      }
    },
    [user, activeSession, journalEntries, moodIdx, waterMl, note]
  );

  const elapsedMs = activeSession ? Date.now() - new Date(activeSession.startedAt).getTime() : 0;
  const elapsedHours = elapsedMs / 3600000;
  const plannedH = activeSession?.plannedDurationH ?? 0;
  const progress = calculateProgress(elapsedHours, plannedH);
  const currentPhaseId = calculateCurrentPhase(elapsedHours);
  const phaseInfo = getPhaseInfo(currentPhaseId);
  const nextPhase = getNextPhaseInfo(elapsedHours);
  const metabolicProgress = Math.min(elapsedHours / (plannedH || 16), 1);

  const freeDurationH = useAppSettingsStore((s) => s.freeDurationH);

  async function handleStart(protocol: Protocol) {
    if (!user) return;
    try {
      const now = new Date().toISOString();
      const session = await fastSessions.create({
        id: randomUUID(),
        userId: user.id,
        protocol,
        plannedDurationH: effectiveDurationH(protocol, freeDurationH),
        startedAt: now,
        endedAt: null,
        status: 'active',
        notes: null,
      });
      journalIdRef.current = null;
      setWaterMl(0);
      setMoodIdx(0);
      setNote('');
      startSession(session);

      if (useAppSettingsStore.getState().notificationsEnabled) {
        void requestNotificationPermissions()
          .then((granted) => (granted ? scheduleForSession(session) : undefined))
          .catch(() => {});
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de démarrer le jeûne. Veuillez réessayer.');
    }
  }

  async function handleStop() {
    if (!activeSession) return;
    try {
      await fastSessions.update(activeSession.id, {
        endedAt: new Date().toISOString(),
        status: 'completed',
      });
      journalIdRef.current = null;
      setWaterMl(0);
      setMoodIdx(0);
      setNote('');
      endSession();
      void cancelScheduledNotifications().catch(() => {});
    } catch {
      Alert.alert('Erreur', "Impossible d'arrêter le jeûne. Veuillez réessayer.");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerBrand}>FastLife</Text>
        {activeSession && (
          <View style={styles.headerBadge}>
            <View style={styles.headerDot} />
            <Text style={styles.headerBadgeText}>{activeSession.protocol}</Text>
          </View>
        )}
      </View>

      {activeSession ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.activeContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Phase badge */}
          <View style={[styles.phaseBadge, { borderColor: `${phaseInfo.color}40` }]}>
            <View
              style={[
                styles.phaseDot,
                { backgroundColor: phaseInfo.color, shadowColor: phaseInfo.color },
              ]}
            />
            <Text style={[styles.phaseText, { color: phaseInfo.color }]}>
              {phaseInfo.label.toUpperCase()}
            </Text>
          </View>

          {/* Ring */}
          <View style={styles.ringSection}>
            <GradientRing
              progress={progress}
              elapsedMs={elapsedMs}
              plannedH={plannedH}
              startedAt={activeSession.startedAt}
            />
          </View>

          {/* Next phase */}
          {nextPhase && (
            <View style={styles.nextPhaseCard}>
              <Text style={styles.nextPhaseLabel}>PROCHAINE PHASE</Text>
              <View style={styles.nextPhaseRow}>
                <Text style={[styles.nextPhaseName, { color: nextPhase.color }]}>
                  {nextPhase.name}
                </Text>
                <Text style={styles.nextPhaseIn}>dans {formatDuration(nextPhase.inHours)}</Text>
              </View>
            </View>
          )}

          {/* Stop CTA */}
          <StopButton onPress={handleStop} />

          {/* Quick actions — 3 column grid */}
          <View style={styles.quickGrid}>
            <QuickCard
              icon={<WaterIcon color={C.secondary} />}
              label="EAU"
              value={
                waterMl >= 1000
                  ? `${(waterMl / 1000).toFixed(1)}L`
                  : waterMl > 0
                    ? `${waterMl}ml`
                    : '0ml'
              }
              btnLabel="+250ml"
              btnColor={C.secondary}
              onPress={() => {
                const next = waterMl + 250;
                setWaterMl(next);
                void upsertJournal({ waterMl: next });
              }}
            />
            <QuickCard
              icon={<MoodIcon color={C.tertiary} />}
              label="HUMEUR"
              value={MOODS[moodIdx] ?? 'Stable'}
              btnLabel="Changer"
              btnColor={C.tertiary}
              onPress={() => {
                const nextIdx = (moodIdx + 1) % MOODS.length;
                setMoodIdx(nextIdx);
                void upsertJournal({ mood: nextIdx + 1 });
              }}
            />
            <QuickCard
              icon={<NoteIcon color={C.onPrimaryContainer} />}
              label="NOTE"
              value={note || '—'}
              btnLabel={note ? 'Modifier' : 'Ajouter'}
              btnColor={C.onPrimaryContainer}
              onPress={() => setNoteModalOpen(true)}
            />
          </View>

          {/* Metabolic state */}
          <View style={styles.metaCard}>
            <View style={styles.metaHeader}>
              <Text style={styles.metaTitle}>État métabolique</Text>
              <Text style={[styles.metaPhaseTag, { color: phaseInfo.color }]}>
                {currentPhaseId ?? 'Transition'}
              </Text>
            </View>
            <Text style={styles.metaBody}>{phaseInfo.metabolicText}</Text>
            <View style={styles.metaBarRow}>
              <View style={styles.metaTrack}>
                <View
                  style={[
                    styles.metaFill,
                    {
                      width: `${metabolicProgress * 100}%` as DimensionValue,
                      backgroundColor: phaseInfo.color,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.metaPercent, { color: phaseInfo.color }]}>
                {Math.round(metabolicProgress * 100)}%
              </Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        <IdleScreen onStart={handleStart} />
      )}

      <NoteModal
        visible={noteModalOpen}
        initialText={note}
        onClose={() => setNoteModalOpen(false)}
        onSave={(t) => {
          setNote(t);
          void upsertJournal({ text: t || null });
        }}
      />
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
    paddingHorizontal: 20,
    backgroundColor: 'rgba(13,37,71,0.88)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerBrand: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3, color: C.white },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${C.primaryContainer}80`,
    borderWidth: 1,
    borderColor: `${C.secondary}33`,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
  },
  headerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.secondary },
  headerBadgeText: { fontSize: 11, fontWeight: '600', color: C.secondary, letterSpacing: 1 },

  scroll: { flex: 1 },
  activeContent: { paddingHorizontal: 20, paddingTop: 20, alignItems: 'center', gap: 20 },

  // Phase badge
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${C.primaryContainer}60`,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 99,
  },
  phaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 4,
  },
  phaseText: { fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },

  // Ring
  ringSection: { alignItems: 'center' },
  ringInner: { alignItems: 'center', gap: 4 },
  timerDisplay: {
    fontSize: 58,
    fontWeight: '700',
    letterSpacing: -3,
    color: C.white,
    includeFontPadding: false,
  },
  timerSub: { fontSize: 14, fontWeight: '600', color: `${C.onSurfaceVariant}99` },
  timerStarted: { fontSize: 11, color: `${C.onSurfaceVariant}60`, marginTop: 2 },

  // Next phase card
  nextPhaseCard: {
    width: SW - 40,
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  nextPhaseLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  nextPhaseRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nextPhaseName: { fontSize: 14, fontWeight: '600' },
  nextPhaseIn: { fontSize: 13, color: C.onSurfaceVariant },

  // Stop button
  stopBtn: {
    width: SW - 40,
    paddingVertical: 16,
    borderRadius: 99,
    backgroundColor: C.secondaryContainer,
    alignItems: 'center',
    shadowColor: C.secondaryContainer,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  stopBtnText: { fontSize: 16, fontWeight: '700', color: '#001e2e' },

  // Quick cards
  quickGrid: { width: SW - 40, flexDirection: 'row', gap: 10 },
  quickCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.divider,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  quickIcon: {},
  quickMid: { alignItems: 'center', gap: 2, width: '100%' },
  quickLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  quickValue: { fontSize: 13, fontWeight: '700', color: C.white, textAlign: 'center' },
  quickBtn: {
    width: '100%',
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickBtnText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },

  // Note modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: C.deepBlue,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 24,
    paddingBottom: 44,
    gap: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: C.white },
  noteInput: {
    backgroundColor: 'rgba(5,15,29,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: C.white,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalSaveBtn: {
    backgroundColor: C.primary,
    borderRadius: 99,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveBtnText: { fontSize: 16, fontWeight: '600', color: '#003549' },

  // Metabolic card
  metaCard: {
    width: SW - 40,
    backgroundColor: C.deepBlue,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
  metaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaTitle: { fontSize: 16, fontWeight: '600', color: C.white },
  metaPhaseTag: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  metaBody: { fontSize: 13, color: C.onSurfaceVariant, lineHeight: 20 },
  metaBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaTrack: {
    flex: 1,
    height: 6,
    backgroundColor: C.surfaceHigh,
    borderRadius: 99,
    overflow: 'hidden',
  },
  metaFill: { height: '100%', borderRadius: 99 },
  metaPercent: { fontSize: 12, fontWeight: '700', width: 36, textAlign: 'right' },

  // Idle state
  idleScroll: { flex: 1 },
  idleContent: { paddingHorizontal: 20, paddingTop: 36, paddingBottom: 100, gap: 20 },
  idleHero: { alignItems: 'center', gap: 12 },
  idleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${C.primaryContainer}60`,
    borderWidth: 1,
    borderColor: `${C.tertiary}33`,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 99,
  },
  idlePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.tertiary },
  idleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: C.tertiary,
    textTransform: 'uppercase',
  },
  idleTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: C.white,
    textAlign: 'center',
    lineHeight: 36,
  },
  idleSubtitle: { fontSize: 14, color: C.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },

  // Protocol card
  protocolCard: {
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: `${C.primary}35`,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  protocolCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  protocolCardMeta: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  protocolCardName: { fontSize: 30, fontWeight: '700', color: C.primary, letterSpacing: -1 },
  protocolCardDuration: { fontSize: 13, color: C.onSurfaceVariant, marginTop: 2 },
  protocolBenefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  benefitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.tertiary,
    marginTop: 5,
    flexShrink: 0,
  },
  protocolBenefit: { fontSize: 12, color: C.onSurfaceVariant, lineHeight: 18, flex: 1 },
  changeBtn: {
    backgroundColor: `${C.primary}18`,
    borderWidth: 1,
    borderColor: `${C.primary}35`,
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  changeBtnText: { fontSize: 12, fontWeight: '700', color: C.primary },

  // Start button
  startBtn: {
    backgroundColor: C.primary,
    paddingVertical: 17,
    borderRadius: 99,
    alignItems: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  startBtnText: { fontSize: 16, fontWeight: '700', color: '#003549' },

  // Tips
  tipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  tipChip: {
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tipText: { fontSize: 12, color: C.onSurfaceVariant },
});
