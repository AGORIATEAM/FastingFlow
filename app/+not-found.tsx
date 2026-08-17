import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Page introuvable</Text>
      <Text style={styles.body}>Cet écran n'existe pas ou n'est plus disponible.</Text>
      <Link href="/(tabs)" style={styles.link}>
        <Text style={styles.linkText}>Retour à l'accueil</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: '#050F1D',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    color: '#e4e2e5',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  body: {
    color: '#c5c6ce',
    fontSize: 15,
    marginBottom: 28,
    textAlign: 'center',
  },
  link: {
    backgroundColor: '#3DB4F2',
    borderRadius: 9999,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  linkText: {
    color: '#050F1D',
    fontSize: 16,
    fontWeight: '600',
  },
});
