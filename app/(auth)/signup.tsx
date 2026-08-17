import { StyleSheet, Text, View } from 'react-native';

import { Colors, TextStyles } from '@/lib/theme';

// Placeholder — rebuilt with real authentication in bloc-o
export default function SignupScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Inscription</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: Colors.bg,
    flex: 1,
    justifyContent: 'center',
  },
  title: { ...TextStyles.h2 },
});
