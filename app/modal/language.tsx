import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Path, Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';

import { useAppSettingsStore } from '@/lib/stores/useAppSettingsStore';

const C = {
  bg: '#050F1D',
  glass: 'rgba(13, 37, 71, 0.5)',
  glassBorder: 'rgba(245, 247, 250, 0.10)',
  cyan: '#3DB4F2',
  secondaryContainer: '#009ad7',
  onSurface: '#e4e2e5',
  onSurfaceVariant: '#c5c6ce',
  white: '#ffffff',
};

const LANGUAGES = [
  { id: 'fr' as const, label: 'Français', flag: '🇫🇷', sublabel: 'French' },
  { id: 'en' as const, label: 'English', flag: '🇬🇧', sublabel: 'Anglais' },
];

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

export default function LanguageModal() {
  const router = useRouter();
  const currentLang = useAppSettingsStore((s) => s.language);
  const setLanguage = useAppSettingsStore((s) => s.setLanguage);
  const [selected, setSelected] = useState(currentLang);

  function confirm() {
    setLanguage(selected);
    router.back();
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={16}>
          <BackIcon />
        </Pressable>
        <Text style={styles.headerTitle}>Langue</Text>
        <Pressable style={styles.confirmBtn} onPress={confirm}>
          <Text style={styles.confirmBtnText}>Appliquer</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.hint}>Sélectionnez la langue de l'interface.</Text>

        <View style={styles.list}>
          {LANGUAGES.map((lang) => {
            const active = selected === lang.id;
            return (
              <Pressable
                key={lang.id}
                style={[styles.langCard, active && styles.langCardActive]}
                onPress={() => setSelected(lang.id)}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <View style={styles.langText}>
                  <Text style={[styles.langLabel, active && { color: C.white }]}>{lang.label}</Text>
                  <Text style={styles.langSub}>{lang.sublabel}</Text>
                </View>
                {active && <CheckIcon />}
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

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
  confirmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: C.secondaryContainer,
    borderRadius: 99,
  },
  confirmBtnText: { fontSize: 13, fontWeight: '700', color: '#001e2e' },

  content: { paddingHorizontal: 20, paddingTop: 24, gap: 20 },
  hint: { fontSize: 14, color: C.onSurfaceVariant },
  list: { gap: 10 },

  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderRadius: 14,
    padding: 16,
  },
  langCardActive: { backgroundColor: 'rgba(61,180,242,0.10)', borderColor: `${C.cyan}50` },
  langFlag: { fontSize: 28 },
  langText: { flex: 1, gap: 2 },
  langLabel: { fontSize: 16, fontWeight: '600', color: C.onSurface },
  langSub: { fontSize: 12, color: C.onSurfaceVariant },
});
