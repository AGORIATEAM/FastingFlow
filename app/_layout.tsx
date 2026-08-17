import '../global.css';

import * as SplashScreen from 'expo-splash-screen';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { bootstrapUser } from '@/lib/auth';
import { RepositoriesProvider, useRepositories } from '@/lib/repositories/provider';
import { useUserStore } from '@/lib/stores/useUserStore';
import { initI18n } from '@/utils/i18n';
import SplashContent from '@/components/SplashContent';

SplashScreen.preventAutoHideAsync();
initI18n();

// Surface uncaught render errors with expo-router's built-in boundary UI
export { ErrorBoundary } from 'expo-router';

// Renders the custom splash as a full-screen overlay while bootstrapping,
// then hides itself once navigation is complete.
function AppBootstrap() {
  const { users } = useRepositories();
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    void SplashScreen.hideAsync();

    let active = true;
    setFailed(false);
    bootstrapUser(users)
      .then(({ user, isFirstLaunch }) => {
        if (!active) return;
        setUser(user);
        router.replace(isFirstLaunch ? '/(auth)/onboarding' : '/(tabs)');
        setDone(true);
      })
      .catch(() => {
        if (!active) return;
        setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [users, router, setUser, attempt]);

  if (done) return null;

  if (failed) {
    return (
      <View style={[StyleSheet.absoluteFill, bootstrapStyles.errorScreen]}>
        <Text style={bootstrapStyles.errorTitle}>Démarrage impossible</Text>
        <Text style={bootstrapStyles.errorBody}>
          Une erreur est survenue lors de l'initialisation des données locales.
        </Text>
        <Pressable
          accessibilityRole="button"
          style={bootstrapStyles.retryBtn}
          onPress={() => setAttempt((a) => a + 1)}
        >
          <Text style={bootstrapStyles.retryText}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <SplashContent />
    </View>
  );
}

const bootstrapStyles = StyleSheet.create({
  errorScreen: {
    alignItems: 'center',
    backgroundColor: '#050F1D',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    color: '#e4e2e5',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  errorBody: {
    color: '#c5c6ce',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#3DB4F2',
    borderRadius: 9999,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  retryText: {
    color: '#050F1D',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RepositoriesProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
        <AppBootstrap />
      </RepositoriesProvider>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
