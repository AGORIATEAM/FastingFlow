import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-brand-deepBlue items-center justify-center px-8">
      <Text className="text-brand-offWhite text-5xl font-bold mb-3">{t('app.name')}</Text>
      <Text className="text-brand-offWhite/70 text-center text-base mb-16">
        {t('onboarding.tagline')}
      </Text>
      <Pressable
        className="bg-brand-cyan rounded-2xl py-4 px-12"
        onPress={() => router.replace('/(tabs)')}
      >
        <Text className="text-brand-deepBlue font-bold text-lg">{t('onboarding.start')}</Text>
      </Pressable>
    </View>
  );
}
