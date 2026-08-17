import DateTimePicker from '@react-native-community/datetimepicker';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { randomUUID } from 'expo-crypto';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type DimensionValue,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Circle, Path, Svg } from 'react-native-svg';
import { useRouter } from 'expo-router';

import { PhaseBadge } from '@/components/fasting/PhaseBadge';
import { ProgressRing } from '@/components/fasting/ProgressRing';
import { Chip, GhostButton, PressableScale, PrimaryButton } from '@/components/ui';
import type { HapticType } from '@/components/ui';
import {
  calculateCurrentPhase,
  calculateProgress,
  computeMissingPhases,
  getUpcomingPhaseIds,
} from '@/lib/domain/fasting';
import { haptics } from '@/lib/haptics';
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
import { Colors, Fonts, Header, HitSlop, Radius, Spacing, TextStyles } from '@/lib/theme';

// Resolve the effective planned duration for a protocol
function effectiveDurationH(protocol: Protocol, freeDurationH: number): number {
  if (protocol === 'free') return freeDurationH > 0 ? freeDurationH : 16;
  return PROTOCOL_DURATION_H[protocol] ?? 0;
}

// ─── Constants ──────────────────────────────────────────────────────
const STROKE = 8;
const MAX_START_BACKDATE_MS = 7 * 24 * 3600000;

// ─── Phase metadata ─────────────────────────────────────────────────
const PHASE_META: Record<string, { label: string; metabolicText: string; color: string }> = {
  '12h': {
    label: 'Glycogénolyse',
    metabolicText:
      "Le glycogène hépatique s'épuise. Votre corps commence à puiser dans ses réserves de graisses.",
    color: Colors.secondary,
  },
  '16h': {
    label: 'Cétogenèse débutante',
    metabolicText:
      'Production de corps cétoniques amorcée. Le cerveau commence à utiliser les cétones comme carburant alternatif.',
    color: Colors.secondary,
  },
  '18h': {
    label: 'Autophagie active',
    metabolicText:
      "L'autophagie cellulaire est pleinement active. Vos cellules recyclent les protéines endommagées.",
    color: Colors.tertiary,
  },
  '24h': {
    label: 'Cétose profonde',
    metabolicText:
      "Cétose profonde établie. L'organisme utilise principalement les acides gras. Hormones de croissance augmentées.",
    color: Colors.tertiary,
  },
  '36h': {
    label: 'Régénération cellulaire',
    metabolicText:
      'Régénération cellulaire intense. Activation des gènes de longévité SIRT1 et FOXO3.',
    color: Colors.tertiary,
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
      color: Colors.secondary,
    };
  return (
    PHASE_META[phaseId] ?? {
      label: phaseId,
      metabolicText: 'Transition métabolique en cours.',
      color: Colors.secondary,
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
    color: meta?.color ?? Colors.secondary,
  };
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

// ─── Quick action card ──────────────────────────────────────────────

function QuickCard({
  icon,
  label,
  value,
  btnLabel,
  btnColor,
  haptic = 'none',
  onPress,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  btnLabel: string;
  btnColor: string;
  haptic?: HapticType | undefined;
  onPress: () => void;
}) {
  return (
    <View style={styles.quickCard}>
      {icon}
      <View style={styles.quickMid}>
        <Text style={styles.quickLabel} maxFontSizeMultiplier={1.3}>
          {label}
        </Text>
        <Text style={styles.quickValue} numberOfLines={1} maxFontSizeMultiplier={1.3}>
          {value}
        </Text>
      </View>
      <PressableScale
        onPress={onPress}
        haptic={haptic}
        accessibilityLabel={`${label} : ${btnLabel}`}
        style={[
          styles.quickBtn,
          { borderColor: `${btnColor}40`, backgroundColor: `${btnColor}18` },
        ]}
      >
        <Text style={[styles.quickBtnText, { color: btnColor }]} maxFontSizeMultiplier={1.3}>
          {btnLabel}
        </Text>
      </PressableScale>
    </View>
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
          <Text style={styles.modalTitle} maxFontSizeMultiplier={1.3}>
            Ajouter une note
          </Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Comment vous sentez-vous ?"
            placeholderTextColor={Colors.mutedText}
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={4}
            keyboardAppearance="dark"
            maxFontSizeMultiplier={1.3}
            autoFocus
          />
          <PrimaryButton
            label="Enregistrer"
            onPress={() => {
              onSave(text);
              setText('');
              onClose();
            }}
          />
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Stop confirmation modal ────────────────────────────────────────

function StopConfirmModal({
  visible,
  elapsedHours,
  plannedH,
  goalReached,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  elapsedHours: number;
  plannedH: number;
  goalReached: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle} maxFontSizeMultiplier={1.3}>
            {goalReached ? 'Bravo !' : 'Arrêter le jeûne ?'}
          </Text>
          <Text style={styles.confirmElapsed} maxFontSizeMultiplier={1.3}>
            Durée écoulée : {formatDuration(elapsedHours)}
          </Text>
          {plannedH > 0 && (
            <Text
              style={[
                styles.confirmGoal,
                goalReached ? styles.confirmGoalMet : styles.confirmGoalPending,
              ]}
              maxFontSizeMultiplier={1.3}
            >
              {goalReached
                ? `Objectif de ${plannedH}h atteint`
                : `Il reste ${formatDuration(Math.max(plannedH - elapsedHours, 0))} avant l'objectif`}
            </Text>
          )}
          <PrimaryButton
            label="Terminer le jeûne"
            haptic={goalReached ? 'success' : 'warning'}
            onPress={onConfirm}
          />
          <GhostButton label="Continuer" onPress={onClose} />
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Start time edit modal ──────────────────────────────────────────

function StartTimeModal({
  visible,
  value,
  onChange,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  value: Date;
  onChange: (d: Date) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const now = new Date();
  const minDate = new Date(now.getTime() - MAX_START_BACKDATE_MS);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle} maxFontSizeMultiplier={1.3}>
            Modifier l'heure de début
          </Text>
          <DateTimePicker
            value={value}
            mode={Platform.OS === 'ios' ? 'datetime' : 'time'}
            display="spinner"
            themeVariant="dark"
            maximumDate={now}
            minimumDate={minDate}
            onChange={(_event: DateTimePickerEvent, date?: Date) => {
              if (date) onChange(date);
            }}
            style={styles.timePicker}
          />
          <PrimaryButton label="Valider" onPress={onConfirm} />
          <GhostButton label="Annuler" onPress={onClose} />
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Idle state ─────────────────────────────────────────────────────

const MOODS = ['Stable', 'Énergique', 'Fatigué', 'Concentré', 'Calme'];

const TIPS = ['Hydratez-vous', 'Café OK', 'Électrolytes'];

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
          <Text style={styles.idleBadgeText} maxFontSizeMultiplier={1.3}>
            PRÊT À COMMENCER
          </Text>
        </View>
        <Text style={styles.idleTitle} maxFontSizeMultiplier={1.3}>
          Votre prochain{'\n'}jeûne vous attend
        </Text>
        <Text style={styles.idleSubtitle} maxFontSizeMultiplier={1.3}>
          Chaque jeûne renforce votre métabolisme{'\n'}et régénère vos cellules.
        </Text>
      </View>

      {/* Protocol card */}
      <View style={styles.protocolCard}>
        <View style={styles.protocolCardTop}>
          <View>
            <Text style={styles.protocolCardMeta} maxFontSizeMultiplier={1.3}>
              Protocole actuel
            </Text>
            <Text style={styles.protocolCardName} maxFontSizeMultiplier={1.3}>
              {protocol}
            </Text>
            {durationH > 0 && (
              <Text style={styles.protocolCardDuration} maxFontSizeMultiplier={1.3}>
                {durationH} heures de jeûne
              </Text>
            )}
          </View>
          <Pressable style={styles.changeBtn} onPress={() => router.push('/modal/protocol')}>
            <Text style={styles.changeBtnText} maxFontSizeMultiplier={1.3}>
              Modifier
            </Text>
          </Pressable>
        </View>
        {benefit.length > 0 && (
          <View style={styles.protocolBenefitRow}>
            <View style={styles.benefitDot} />
            <Text style={styles.protocolBenefit} maxFontSizeMultiplier={1.3}>
              {benefit}
            </Text>
          </View>
        )}
      </View>

      {/* Start CTA */}
      <PrimaryButton
        label={`Commencer · ${protocol}`}
        haptic="none"
        onPress={() => onStart(protocol)}
      />

      {/* Tips */}
      <View style={styles.tipsRow}>
        {TIPS.map((tip) => (
          <Chip key={tip} label={tip} />
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

  const { width: windowWidth } = useWindowDimensions();
  const ringSize = Math.min(windowWidth - 48, 288);

  const [waterMl, setWaterMl] = useState(0);
  const [moodIdx, setMoodIdx] = useState(0);
  const [note, setNote] = useState('');
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [stopConfirmOpen, setStopConfirmOpen] = useState(false);
  const [startEditOpen, setStartEditOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(() => new Date());
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
  // phase crossed while the app was killed (catch-up). Also re-runs whenever
  // the session reference changes (e.g. edited start time) to catch up phases.
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
  const goalReached = plannedH > 0 && progress >= 1;
  const remainingH = plannedH > 0 ? Math.max(0, plannedH - elapsedHours) : 0;

  // Minute-precision accessibility label so VoiceOver isn't spammed every second.
  const elapsedWholeMinutes = Math.floor(elapsedMs / 60000);
  const ringA11yHours = Math.floor(elapsedWholeMinutes / 60);
  const ringA11yMinutes = elapsedWholeMinutes % 60;
  const ringA11ySuffix =
    plannedH > 0
      ? goalReached
        ? ', objectif atteint'
        : `, ${formatDuration(remainingH)} restant`
      : '';
  const ringA11yLabel = `Jeûne en cours, ${ringA11yHours} heures ${ringA11yMinutes} minutes écoulées${ringA11ySuffix}`;

  // Announce metabolic phase changes to screen readers.
  const prevPhaseRef = useRef<string | null>(currentPhaseId);
  useEffect(() => {
    if (!activeSession) {
      prevPhaseRef.current = null;
      return;
    }
    if (currentPhaseId !== prevPhaseRef.current) {
      prevPhaseRef.current = currentPhaseId;
      if (currentPhaseId) {
        AccessibilityInfo.announceForAccessibility(
          `Nouvelle phase métabolique : ${getPhaseInfo(currentPhaseId).label}`
        );
      }
    }
  }, [activeSession, currentPhaseId]);

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
      haptics.success();

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

  function openStartEdit() {
    if (!activeSession) return;
    setDraftStart(new Date(activeSession.startedAt));
    setStartEditOpen(true);
  }

  async function handleStartTimeSave() {
    if (!activeSession) return;
    // Clamp: never in the future, never more than 7 days back.
    const nowMs = Date.now();
    const clampedMs = Math.min(
      Math.max(draftStart.getTime(), nowMs - MAX_START_BACKDATE_MS),
      nowMs
    );
    try {
      const updated = await fastSessions.update(activeSession.id, {
        startedAt: new Date(clampedMs).toISOString(),
      });
      // New session reference → the journal/phases effect above re-runs and
      // catches up any phase now crossed with the earlier start time.
      useSessionStore.getState().setActiveSession(updated);
      setStartEditOpen(false);
      if (useAppSettingsStore.getState().notificationsEnabled) {
        void scheduleForSession(updated).catch(() => {});
      }
    } catch {
      Alert.alert('Erreur', "Impossible de modifier l'heure de début. Veuillez réessayer.");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerBrand} maxFontSizeMultiplier={1.3}>
          FastLife
        </Text>
        {activeSession && (
          <View style={styles.headerBadge}>
            <View style={styles.headerDot} />
            <Text style={styles.headerBadgeText} maxFontSizeMultiplier={1.3}>
              {activeSession.protocol}
            </Text>
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
          <PhaseBadge
            label={goalReached ? 'Objectif atteint' : phaseInfo.label}
            color={goalReached ? Colors.tertiary : phaseInfo.color}
          />

          {/* Ring */}
          <View style={styles.ringSection} accessible accessibilityLabel={ringA11yLabel}>
            <ProgressRing progress={progress} size={ringSize} strokeWidth={STROKE}>
              <View style={styles.ringInner}>
                <Text style={styles.timerDisplay}>{formatTime(elapsedMs)}</Text>
                {plannedH > 0 && (
                  <Text style={styles.timerSub} maxFontSizeMultiplier={1.3}>
                    {remainingH > 0.016
                      ? `${formatDuration(remainingH)} restant`
                      : `Objectif ${plannedH}h atteint`}
                  </Text>
                )}
                <PressableScale
                  onPress={openStartEdit}
                  hitSlop={HitSlop}
                  accessibilityLabel="Modifier l'heure de début"
                >
                  <Text style={styles.timerStarted} maxFontSizeMultiplier={1.3}>
                    démarré à {formatTimeOfDay(activeSession.startedAt)}
                  </Text>
                </PressableScale>
              </View>
            </ProgressRing>
          </View>

          {/* Next phase */}
          {nextPhase && (
            <View style={styles.nextPhaseCard}>
              <Text style={styles.nextPhaseLabel} maxFontSizeMultiplier={1.3}>
                PROCHAINE PHASE
              </Text>
              <View style={styles.nextPhaseRow}>
                <Text
                  style={[styles.nextPhaseName, { color: nextPhase.color }]}
                  maxFontSizeMultiplier={1.3}
                >
                  {nextPhase.name}
                </Text>
                <Text style={styles.nextPhaseIn} maxFontSizeMultiplier={1.3}>
                  dans {formatDuration(nextPhase.inHours)}
                </Text>
              </View>
            </View>
          )}

          {/* Stop CTA — opens the confirmation sheet */}
          {goalReached ? (
            <PrimaryButton
              label="Terminer le jeûne"
              haptic="medium"
              onPress={() => setStopConfirmOpen(true)}
              style={styles.fullWidth}
            />
          ) : (
            <GhostButton
              label="Arrêter le jeûne"
              danger
              haptic="medium"
              onPress={() => setStopConfirmOpen(true)}
              style={styles.fullWidth}
            />
          )}

          {/* Quick actions — 3 column grid */}
          <View style={styles.quickGrid}>
            <QuickCard
              icon={<WaterIcon color={Colors.secondary} />}
              label="EAU"
              value={
                waterMl >= 1000
                  ? `${(waterMl / 1000).toFixed(1)}L`
                  : waterMl > 0
                    ? `${waterMl}ml`
                    : '0ml'
              }
              btnLabel="+250ml"
              btnColor={Colors.secondary}
              haptic="light"
              onPress={() => {
                const next = waterMl + 250;
                setWaterMl(next);
                void upsertJournal({ waterMl: next });
              }}
            />
            <QuickCard
              icon={<MoodIcon color={Colors.tertiary} />}
              label="HUMEUR"
              value={MOODS[moodIdx] ?? 'Stable'}
              btnLabel="Changer"
              btnColor={Colors.tertiary}
              haptic="selection"
              onPress={() => {
                const nextIdx = (moodIdx + 1) % MOODS.length;
                setMoodIdx(nextIdx);
                void upsertJournal({ mood: nextIdx + 1 });
              }}
            />
            <QuickCard
              icon={<NoteIcon color={Colors.mutedText} />}
              label="NOTE"
              value={note || '—'}
              btnLabel={note ? 'Modifier' : 'Ajouter'}
              btnColor={Colors.mutedText}
              onPress={() => setNoteModalOpen(true)}
            />
          </View>

          {/* Metabolic state */}
          <View style={styles.metaCard}>
            <View style={styles.metaHeader}>
              <Text style={styles.metaTitle} maxFontSizeMultiplier={1.3}>
                État métabolique
              </Text>
              <Text
                style={[styles.metaPhaseTag, { color: phaseInfo.color }]}
                maxFontSizeMultiplier={1.3}
              >
                {currentPhaseId ?? 'Transition'}
              </Text>
            </View>
            <Text style={styles.metaBody} maxFontSizeMultiplier={1.3}>
              {phaseInfo.metabolicText}
            </Text>
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
              <Text
                style={[styles.metaPercent, { color: phaseInfo.color }]}
                maxFontSizeMultiplier={1.3}
              >
                {Math.round(metabolicProgress * 100)}%
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
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

      <StopConfirmModal
        visible={stopConfirmOpen}
        elapsedHours={elapsedHours}
        plannedH={plannedH}
        goalReached={goalReached}
        onConfirm={() => {
          setStopConfirmOpen(false);
          void handleStop();
        }}
        onClose={() => setStopConfirmOpen(false)}
      />

      <StartTimeModal
        visible={startEditOpen}
        value={draftStart}
        onChange={setDraftStart}
        onConfirm={() => {
          void handleStartTimeSave();
        }}
        onClose={() => setStartEditOpen(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },

  header: {
    height: Header.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    backgroundColor: Header.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Header.borderColor,
  },
  headerBrand: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    letterSpacing: -0.3,
    color: Colors.white,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${Colors.primaryContainer}80`,
    borderWidth: 1,
    borderColor: `${Colors.secondary}33`,
    paddingHorizontal: 12,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  headerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.secondary },
  headerBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    color: Colors.secondary,
    letterSpacing: 1,
  },

  scroll: { flex: 1 },
  activeContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.section,
  },
  fullWidth: { alignSelf: 'stretch' },
  bottomSpacer: { height: Spacing.tabBar },

  // Ring
  ringSection: { alignItems: 'center' },
  ringInner: { alignItems: 'center', gap: Spacing.xs },
  timerDisplay: {
    ...TextStyles.displayTimer,
    includeFontPadding: false,
  },
  timerSub: { fontSize: 14, fontFamily: Fonts.semibold, color: Colors.mutedText },
  timerStarted: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.mutedText,
    marginTop: 2,
  },

  // Next phase card
  nextPhaseCard: {
    alignSelf: 'stretch',
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.md,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  nextPhaseLabel: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    letterSpacing: 2,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  nextPhaseRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nextPhaseName: { fontSize: 14, fontFamily: Fonts.semibold },
  nextPhaseIn: { fontSize: 13, fontFamily: Fonts.regular, color: Colors.onSurfaceVariant },

  // Quick cards
  quickGrid: { alignSelf: 'stretch', flexDirection: 'row', gap: 10 },
  quickCard: {
    flex: 1,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: Radius.md,
    padding: 12,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quickMid: { alignItems: 'center', gap: 2, width: '100%' },
  quickLabel: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    letterSpacing: 1.2,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  quickValue: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.white,
    textAlign: 'center',
  },
  quickBtn: {
    width: '100%',
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickBtnText: { fontSize: 10, fontFamily: Fonts.bold, letterSpacing: 0.3 },

  // Modal sheets (note, stop confirmation, start time edit)
  modalOverlay: {
    flex: 1,
    backgroundColor: `${Colors.bg}A6`,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.deepBlue,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: Spacing.xl,
    paddingBottom: 44,
    gap: Spacing.md,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: `${Colors.white}33`,
    alignSelf: 'center',
    marginBottom: Spacing.xs,
  },
  modalTitle: { fontSize: 18, fontFamily: Fonts.semibold, color: Colors.white },
  noteInput: {
    backgroundColor: `${Colors.bg}99`,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.white,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  confirmElapsed: { fontSize: 15, fontFamily: Fonts.medium, color: Colors.onSurface },
  confirmGoal: { fontSize: 13, fontFamily: Fonts.regular },
  confirmGoalMet: { color: Colors.tertiary, fontFamily: Fonts.semibold },
  confirmGoalPending: { color: Colors.mutedText },
  timePicker: { alignSelf: 'stretch' },

  // Metabolic card
  metaCard: {
    alignSelf: 'stretch',
    backgroundColor: Colors.deepBlue,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: 10,
  },
  metaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaTitle: { fontSize: 16, fontFamily: Fonts.semibold, color: Colors.white },
  metaPhaseTag: { fontSize: 11, fontFamily: Fonts.bold, letterSpacing: 0.5 },
  metaBody: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
  },
  metaBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  metaFill: { height: '100%', borderRadius: Radius.full },
  metaPercent: { fontSize: 12, fontFamily: Fonts.bold, width: 36, textAlign: 'right' },

  // Idle state
  idleScroll: { flex: 1 },
  idleContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 36,
    paddingBottom: Spacing.tabBar,
    gap: Spacing.section,
  },
  idleHero: { alignItems: 'center', gap: 12 },
  idleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: `${Colors.primaryContainer}60`,
    borderWidth: 1,
    borderColor: `${Colors.tertiary}33`,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  idlePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.tertiary },
  idleBadgeText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    letterSpacing: 2,
    color: Colors.tertiary,
    textTransform: 'uppercase',
  },
  idleTitle: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    letterSpacing: -0.5,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 36,
  },
  idleSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Protocol card
  protocolCard: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: `${Colors.cyan}35`,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: 12,
  },
  protocolCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  protocolCardMeta: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    letterSpacing: 1.5,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  protocolCardName: {
    fontSize: 30,
    fontFamily: Fonts.bold,
    color: Colors.cyan,
    letterSpacing: -1,
  },
  protocolCardDuration: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  protocolBenefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  benefitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.tertiary,
    marginTop: 5,
    flexShrink: 0,
  },
  protocolBenefit: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
    flex: 1,
  },
  changeBtn: {
    backgroundColor: `${Colors.cyan}18`,
    borderWidth: 1,
    borderColor: `${Colors.cyan}35`,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  changeBtnText: { fontSize: 12, fontFamily: Fonts.bold, color: Colors.cyan },

  // Tips
  tipsRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
});
