import { Stack } from 'expo-router';

export default function ModalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="phase-detail" />
      <Stack.Screen name="term-detail" />
    </Stack>
  );
}
