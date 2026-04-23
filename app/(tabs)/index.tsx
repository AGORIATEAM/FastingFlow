import { randomUUID } from 'expo-crypto';
import { useEffect, useReducer, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Circle, Svg } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { calculateCurrentPhase, calculateProgress } from '@/lib/domain/fasting';
import { useRepositories } from '@/lib/repositories/provider';
import { PROTOCOL_DURATION_H, type Protocol } from '@/lib/schemas';
import { useSessionStore } from '@/lib/stores/useSessionStore';
import { useUserStore } from '@/lib/stores/useUserStore';

const RING_SIZE = 280;
const STROKE_WIDTH = 16;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const PROTOCOLS: Protocol[] = ['16:8', '18:6', '20:4', 'OMAD', '24h', '36h', '48h'];

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface TimerRingProps {
  progress: number;
  elapsedMs: number;
  plannedH: number;
}

function TimerRing({ progress, elapsedMs, plannedH }: TimerRingProps) {
  const { t } = useTranslation();
  const clamped = Math.min(Math.max(progress, 0), 1);
  const offset = CIRCUMFERENCE * (1 - clamped);

  return (
    <View className="items-center justify-center">
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          stroke="#1a3060"
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          stroke="#3DB4F2"
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90, ${RING_SIZE / 2}, ${RING_SIZE / 2})`}
        />
      </Svg>
      <View className="absolute items-center">
        <Text className="text-brand-offWhite text-4xl font-bold">{formatTime(elapsedMs)}</Text>
        {plannedH > 0 && (
          <Text className="text-brand-offWhite/60 text-sm mt-1">
            {t('timer.of_hours', { hours: plannedH })}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { fastSessions } = useRepositories();
  const user = useUserStore((s) => s.user);
  const activeSession = useSessionStore((s) => s.activeSession);
  const startSession = useSessionStore((s) => s.startSession);
  const endSession = useSessionStore((s) => s.endSession);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol>('16:8');
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    if (!user || activeSession !== null) return;
    fastSessions.findActiveByUserId(user.id).then((session) => {
      if (session) startSession(session);
    });
  }, [user, activeSession, fastSessions, startSession]);

  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(forceUpdate, 1000);
    return () => clearInterval(interval);
  }, [activeSession, forceUpdate]);

  const elapsedMs = activeSession ? Date.now() - new Date(activeSession.startedAt).getTime() : 0;
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  const plannedH = activeSession?.plannedDurationH ?? 0;
  const progress = calculateProgress(elapsedHours, plannedH);
  const currentPhase = calculateCurrentPhase(elapsedHours);

  async function handleStart() {
    if (!user) return;
    const now = new Date().toISOString();
    const session = await fastSessions.create({
      id: randomUUID(),
      userId: user.id,
      protocol: selectedProtocol,
      plannedDurationH: PROTOCOL_DURATION_H[selectedProtocol],
      startedAt: now,
      endedAt: null,
      status: 'active',
      notes: null,
    });
    startSession(session);
  }

  async function handleStop() {
    if (!activeSession) return;
    const now = new Date().toISOString();
    await fastSessions.update(activeSession.id, { endedAt: now, status: 'completed' });
    endSession();
  }

  if (activeSession) {
    return (
      <View className="flex-1 bg-brand-deepBlue items-center justify-center px-6">
        <View className="bg-brand-cyan/20 rounded-full px-4 py-1 mb-8">
          <Text className="text-brand-cyan text-sm font-semibold">{activeSession.protocol}</Text>
        </View>

        <TimerRing progress={progress} elapsedMs={elapsedMs} plannedH={plannedH} />

        <View className="mt-8 items-center">
          {currentPhase !== null ? (
            <Text className="text-brand-mint text-base font-medium">
              {t('timer.phase_reached', { phase: currentPhase })}
            </Text>
          ) : (
            <Text className="text-brand-offWhite/50 text-base">{t('timer.phase_none')}</Text>
          )}
        </View>

        <Pressable
          className="mt-12 border border-brand-offWhite/30 rounded-2xl py-4 px-12"
          onPress={handleStop}
        >
          <Text className="text-brand-offWhite font-semibold text-lg">{t('timer.stop')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-brand-deepBlue items-center justify-center px-6">
      <Text className="text-brand-offWhite text-2xl font-bold mb-2">{t('timer.idle_title')}</Text>
      <Text className="text-brand-offWhite/60 text-base mb-10">{t('timer.idle_subtitle')}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-10 flex-grow-0"
        contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
      >
        {PROTOCOLS.map((p) => (
          <Pressable
            key={p}
            className={`rounded-full px-5 py-2 ${selectedProtocol === p ? 'bg-brand-cyan' : 'bg-brand-offWhite/10'}`}
            onPress={() => setSelectedProtocol(p)}
          >
            <Text
              className={`font-semibold text-sm ${selectedProtocol === p ? 'text-brand-deepBlue' : 'text-brand-offWhite'}`}
            >
              {p}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text className="text-brand-offWhite/50 text-sm mb-10">
        {t('timer.duration_hint', { hours: PROTOCOL_DURATION_H[selectedProtocol] })}
      </Text>

      <Pressable className="bg-brand-cyan rounded-2xl py-4 px-14" onPress={handleStart}>
        <Text className="text-brand-deepBlue font-bold text-lg">{t('timer.start')}</Text>
      </Pressable>
    </View>
  );
}
