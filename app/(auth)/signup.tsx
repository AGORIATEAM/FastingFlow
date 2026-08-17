import { Redirect } from 'expo-router';

/** Signup lives as a tab inside the login screen — this route just redirects. */
export default function SignupScreen() {
  return <Redirect href="/(auth)/login" />;
}
