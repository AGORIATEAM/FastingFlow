import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import phasesRaw from '@/content/phases.json';
import lexiconRaw from '@/content/lexicon.json';
import { calculateCurrentPhase } from '@/lib/domain/fasting';
import type { LexiconEntry, PhaseContent } from '@/lib/schemas';
import { useSessionStore } from '@/lib/stores/useSessionStore';

const phases = phasesRaw as PhaseContent[];
const lexicon = lexiconRaw as LexiconEntry[];

type Tab = 'timeline' | 'lexicon';

// ---------------------------------------------------------------------------
// Phase card
// ---------------------------------------------------------------------------

interface PhaseCardProps {
  phase: PhaseContent;
  isCurrent: boolean;
}

function PhaseCard({ phase, isCurrent }: PhaseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();

  return (
    <View
      className={`mb-3 rounded-2xl overflow-hidden border ${isCurrent ? 'border-brand-cyan' : 'border-brand-offWhite/10'}`}
    >
      <Pressable className="flex-row items-center p-4" onPress={() => setExpanded((v) => !v)}>
        <View
          className={`rounded-full px-3 py-1 mr-3 ${isCurrent ? 'bg-brand-cyan' : 'bg-brand-offWhite/10'}`}
        >
          <Text
            className={`text-xs font-bold ${isCurrent ? 'text-brand-deepBlue' : 'text-brand-offWhite'}`}
          >
            {phase.id}
          </Text>
        </View>
        <Text className="text-brand-offWhite font-semibold flex-1" numberOfLines={2}>
          {phase.title}
        </Text>
        <Text className="text-brand-offWhite/40 text-xs ml-2">
          {expanded ? t('learn.see_less') : t('learn.see_more')}
        </Text>
      </Pressable>

      {expanded && (
        <View className="px-4 pb-4">
          <Text className="text-brand-cyan text-xs font-semibold uppercase mb-2">
            {t('learn.what_happens')}
          </Text>
          {phase.whatHappens.map((item, i) => (
            <Text key={i} className="text-brand-offWhite/80 text-sm mb-1">
              {`• ${item}`}
            </Text>
          ))}

          <Text className="text-brand-cyan text-xs font-semibold uppercase mt-3 mb-2">
            {t('learn.mechanisms')}
          </Text>
          {phase.mechanisms.map((m, i) => (
            <View key={i} className="mb-2">
              <Text className="text-brand-offWhite text-sm font-semibold">{m.name}</Text>
              <Text className="text-brand-offWhite/70 text-sm">{m.description}</Text>
            </View>
          ))}

          <Text className="text-brand-mint text-xs font-semibold uppercase mt-3 mb-2">
            {t('learn.body_benefits')}
          </Text>
          {phase.bodyBenefits.map((item, i) => (
            <Text key={i} className="text-brand-offWhite/80 text-sm mb-1">
              {`• ${item}`}
            </Text>
          ))}

          <Text className="text-brand-mint text-xs font-semibold uppercase mt-3 mb-2">
            {t('learn.mind_benefits')}
          </Text>
          {phase.mindBenefits.map((item, i) => (
            <Text key={i} className="text-brand-offWhite/80 text-sm mb-1">
              {`• ${item}`}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Lexicon card
// ---------------------------------------------------------------------------

function LexiconCard({ entry }: { entry: LexiconEntry }) {
  const { t } = useTranslation();
  const visiblePhases = entry.activationPhases.slice(0, 3);
  const extraCount = entry.activationPhases.length - 3;

  return (
    <View className="mb-3 rounded-2xl border border-brand-offWhite/10 p-4">
      <View className="flex-row items-start justify-between mb-2 gap-3">
        <Text className="text-brand-offWhite font-bold text-base flex-1">{entry.name}</Text>
        <View className="flex-row flex-wrap gap-1">
          {visiblePhases.map((phaseId) => (
            <View key={phaseId} className="bg-brand-cyan/20 rounded-full px-2 py-0.5">
              <Text className="text-brand-cyan text-xs">{phaseId}</Text>
            </View>
          ))}
          {extraCount > 0 && (
            <View className="bg-brand-offWhite/10 rounded-full px-2 py-0.5">
              <Text className="text-brand-offWhite/50 text-xs">{`+${extraCount}`}</Text>
            </View>
          )}
        </View>
      </View>

      <Text className="text-brand-offWhite/80 text-sm mb-3">{entry.definition}</Text>

      <View className="mb-2">
        <Text className="text-brand-mint text-xs font-semibold uppercase mb-1">
          {t('learn.body_impact')}
        </Text>
        <Text className="text-brand-offWhite/70 text-sm">{entry.bodyImpact}</Text>
      </View>

      <View>
        <Text className="text-brand-mint text-xs font-semibold uppercase mb-1">
          {t('learn.mind_impact')}
        </Text>
        <Text className="text-brand-offWhite/70 text-sm">{entry.mindImpact}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function LearnScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('timeline');
  const { t } = useTranslation();
  const activeSession = useSessionStore((s) => s.activeSession);

  const elapsedHours = activeSession
    ? (Date.now() - new Date(activeSession.startedAt).getTime()) / (1000 * 60 * 60)
    : 0;
  const currentPhase = calculateCurrentPhase(elapsedHours);

  return (
    <SafeAreaView className="flex-1 bg-brand-deepBlue" edges={['top']}>
      <View className="flex-row mx-4 mt-2 mb-4 bg-brand-offWhite/10 rounded-xl p-1">
        <Pressable
          className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'timeline' ? 'bg-brand-cyan' : ''}`}
          onPress={() => setActiveTab('timeline')}
        >
          <Text
            className={`font-semibold text-sm ${activeTab === 'timeline' ? 'text-brand-deepBlue' : 'text-brand-offWhite/60'}`}
          >
            {t('learn.tab_timeline')}
          </Text>
        </Pressable>
        <Pressable
          className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'lexicon' ? 'bg-brand-cyan' : ''}`}
          onPress={() => setActiveTab('lexicon')}
        >
          <Text
            className={`font-semibold text-sm ${activeTab === 'lexicon' ? 'text-brand-deepBlue' : 'text-brand-offWhite/60'}`}
          >
            {t('learn.tab_lexicon')}
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {activeTab === 'timeline'
          ? phases.map((phase) => (
              <PhaseCard key={phase.id} phase={phase} isCurrent={currentPhase === phase.id} />
            ))
          : lexicon.map((entry) => <LexiconCard key={entry.id} entry={entry} />)}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
