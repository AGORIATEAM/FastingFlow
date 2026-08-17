import '../global.css';

import * as SplashScreen from 'expo-splash-screen';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { bootstrapUser } from '@/lib/auth';
import { RepositoriesProvider, useRepositories } from '@/lib/repositories/provider';
import { useUserStore } from '@/lib/stores/useUserStore';
import { initI18n } from '@/utils/i18n';
import SplashContent from './splash';

SplashScreen.preventAutoHideAsync();
initI18n();

// Renders the custom splash as a full-screen overlay while bootstrapping,
// then hides itself once navigation is complete.
function AppBootstrap() {
  const { users } = useRepositories();
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const [done, setDone] = useState(false);

  useEffect(() => {
    void SplashScreen.hideAsync();

    let active = true;
    bootstrapUser(users).then(({ user, isFirstLaunch }) => {
      if (!active) return;
      setUser(user);
      router.replace(isFirstLaunch ? '/(auth)/onboarding' : '/(tabs)');
      setDone(true);
    });
    return () => {
      active = false;
    };
  }, [users, router, setUser]);

  if (done) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <SplashContent />
    </View>
  );
}

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
