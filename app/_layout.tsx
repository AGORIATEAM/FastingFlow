import '../global.css';

import * as SplashScreen from 'expo-splash-screen';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { bootstrapUser } from '@/lib/auth';
import { RepositoriesProvider, useRepositories } from '@/lib/repositories/provider';
import { initI18n } from '@/utils/i18n';

SplashScreen.preventAutoHideAsync();
initI18n();

function AppBootstrap() {
  const { users } = useRepositories();
  const router = useRouter();

  useEffect(() => {
    let active = true;
    bootstrapUser(users).then(({ isFirstLaunch }) => {
      if (!active) return;
      void SplashScreen.hideAsync();
      router.replace(isFirstLaunch ? '/(auth)/onboarding' : '/(tabs)');
    });
    return () => {
      active = false;
    };
  }, [users, router]);

  return null;
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
