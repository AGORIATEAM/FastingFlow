import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';

// ─── Design tokens ─────────────────────────────────────────────────
const C = {
  bg: '#050F1D',
  glass: 'rgba(13, 37, 71, 0.55)',
  glassBorder: 'rgba(245, 247, 250, 0.10)',
  cyan: '#3DB4F2',
  secondary: '#84cfff',
  secondaryContainer: '#009ad7',
  tertiary: '#45dfa4',
  onSurface: '#e4e2e5',
  onSurfaceVariant: '#c5c6ce',
  outline: '#8e9098',
  inputBg: 'rgba(5, 15, 29, 0.7)',
  inputBorder: 'rgba(255,255,255,0.08)',
  white: '#ffffff',
};

// ─── SVG Icons ─────────────────────────────────────────────────────

function FlameIcon({ size = 22, color = C.secondary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C10.5 5 8 8 8 11c0 .88.18 1.72.5 2.5C7.55 12.5 7 11 7 9.5c0 0-3 3-3 6.5C4 19.64 7.58 23 12 23s8-3.36 8-7c0-3.5-3-6.5-5-8C15 9 15 10.5 15 12c0 0-1-1.5-1.5-3.5C13 6 12 2 12 2z"
        fill={color}
      />
    </Svg>
  );
}

function MailIcon({ focused }: { focused: boolean }) {
  const color = focused ? C.cyan : `${C.onSurfaceVariant}60`;
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 6l-10 7L2 6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockIcon({ focused }: { focused: boolean }) {
  const color = focused ? C.cyan : `${C.onSurfaceVariant}60`;
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 11H6a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 11V7a4 4 0 018 0v4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function UserIcon({ focused }: { focused: boolean }) {
  const color = focused ? C.cyan : `${C.onSurfaceVariant}60`;
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.5" />
      <Path
        d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function EyeIcon({ show, color = C.outline }: { show: boolean; color?: string }) {
  if (show) {
    return (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
          d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" />
      </Svg>
    );
  }
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function GoogleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

function AppleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="black">
      <Path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </Svg>
  );
}

// ─── Input field ─────────────────────────────────────────────────────

interface InputProps {
  fieldId: string;
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secure?: boolean;
  showSecure?: boolean;
  onToggleSecure?: () => void;
  icon: (focused: boolean) => React.ReactNode;
  rightLabel?: React.ReactNode;
  focusedField: string | null;
  onFocus: (id: string) => void;
  onBlur: () => void;
  keyboardType?: 'default' | 'email-address';
  textContentType?: 'emailAddress' | 'password' | 'newPassword' | 'name' | 'none';
}

function InputField({
  fieldId,
  label,
  placeholder,
  value,
  onChangeText,
  secure,
  showSecure,
  onToggleSecure,
  icon,
  rightLabel,
  focusedField,
  onFocus,
  onBlur,
  keyboardType = 'default',
  textContentType = 'none',
}: InputProps) {
  const focused = focusedField === fieldId;
  return (
    <View style={styles.inputGroup}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
        {rightLabel}
      </View>
      <View style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}>
        <View style={styles.inputIconBox}>{icon(focused)}</View>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={`${C.onSurfaceVariant}40`}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && !showSecure}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={keyboardType}
          keyboardAppearance="dark"
          textContentType={textContentType}
          onFocus={() => onFocus(fieldId)}
          onBlur={onBlur}
          accessibilityLabel={label}
        />
        {secure && onToggleSecure && (
          <Pressable
            onPress={onToggleSecure}
            hitSlop={12}
            accessibilityLabel={showSecure ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            <EyeIcon show={showSecure ?? false} color={focused ? C.cyan : C.outline} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────

type AuthTab = 'login' | 'signup';

export default function LoginScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [ctaPressed, setCtaPressed] = useState(false);
  const [applePressed, setApplePressed] = useState(false);
  const [googlePressed, setGooglePressed] = useState(false);

  function handleSubmit() {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.replace('/(tabs)');
    }, 700);
  }

  function handleTabSwitch(t: AuthTab) {
    setTab(t);
    setFocusedField(null);
    setShowPassword(false);
    setShowConfirm(false);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Centered brand header */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <FlameIcon size={16} color={C.cyan} />
          <Text style={styles.headerBrand}>FastLife</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Ambient depth blobs */}
          <View style={[styles.blob, styles.blobTopLeft]} />
          <View style={[styles.blob, styles.blobBottomRight]} />

          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.monogram}>
              <FlameIcon size={26} color={C.cyan} />
            </View>
            <Text style={styles.heroTitle}>{tab === 'login' ? 'Bon retour' : 'Commencer'}</Text>
            <Text style={styles.heroSubtitle}>
              {tab === 'login'
                ? 'Reprenez là où vous en étiez'
                : 'Rejoignez des milliers de pratiquants'}
            </Text>
          </View>

          {/* Auth card */}
          <View style={styles.card}>
            {/* Pill tab selector */}
            <View style={styles.tabContainer}>
              {(['login', 'signup'] as AuthTab[]).map((t) => {
                const active = tab === t;
                return (
                  <Pressable
                    key={t}
                    style={[styles.tabPill, active && styles.tabPillActive]}
                    onPress={() => handleTabSwitch(t)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.tabPillText, active && styles.tabPillTextActive]}>
                      {t === 'login' ? 'Se connecter' : "S'inscrire"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Form fields */}
            <View style={styles.form}>
              {tab === 'signup' && (
                <InputField
                  fieldId="name"
                  label="Nom complet"
                  placeholder="Jean Dupont"
                  value={name}
                  onChangeText={setName}
                  icon={(f) => <UserIcon focused={f} />}
                  focusedField={focusedField}
                  onFocus={setFocusedField}
                  onBlur={() => setFocusedField(null)}
                  textContentType="name"
                />
              )}

              <InputField
                fieldId="email"
                label="Adresse e-mail"
                placeholder="nom@exemple.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                icon={(f) => <MailIcon focused={f} />}
                focusedField={focusedField}
                onFocus={setFocusedField}
                onBlur={() => setFocusedField(null)}
                textContentType="emailAddress"
              />

              <InputField
                fieldId="password"
                label="Mot de passe"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secure
                showSecure={showPassword}
                onToggleSecure={() => setShowPassword((v) => !v)}
                icon={(f) => <LockIcon focused={f} />}
                focusedField={focusedField}
                onFocus={setFocusedField}
                onBlur={() => setFocusedField(null)}
                textContentType={tab === 'signup' ? 'newPassword' : 'password'}
                rightLabel={
                  tab === 'login' ? (
                    <Pressable hitSlop={12} accessibilityLabel="Réinitialiser le mot de passe">
                      <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
                    </Pressable>
                  ) : undefined
                }
              />

              {tab === 'signup' && (
                <InputField
                  fieldId="confirm"
                  label="Confirmer le mot de passe"
                  placeholder="••••••••"
                  value={confirm}
                  onChangeText={setConfirm}
                  secure
                  showSecure={showConfirm}
                  onToggleSecure={() => setShowConfirm((v) => !v)}
                  icon={(f) => <LockIcon focused={f} />}
                  focusedField={focusedField}
                  onFocus={setFocusedField}
                  onBlur={() => setFocusedField(null)}
                  textContentType="newPassword"
                />
              )}

              {/* Primary CTA */}
              <Pressable
                style={[styles.ctaButton, (ctaPressed || isLoading) && styles.ctaButtonPressed]}
                onPress={handleSubmit}
                onPressIn={() => setCtaPressed(true)}
                onPressOut={() => setCtaPressed(false)}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel={tab === 'login' ? 'Se connecter' : 'Créer mon compte'}
              >
                {isLoading ? (
                  <ActivityIndicator color="#001e2e" size="small" />
                ) : (
                  <Text style={styles.ctaText}>
                    {tab === 'login' ? 'Se connecter' : 'Créer mon compte'}
                  </Text>
                )}
              </Pressable>
            </View>

            {/* OR divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou continuer avec</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social auth */}
            <View style={styles.socialButtons}>
              <Pressable
                style={[styles.socialBtn, styles.appleBtn, applePressed && styles.socialBtnPressed]}
                onPressIn={() => setApplePressed(true)}
                onPressOut={() => setApplePressed(false)}
                accessibilityLabel="Continuer avec Apple"
                accessibilityRole="button"
              >
                <AppleIcon />
                <Text style={styles.appleBtnText}>Continuer avec Apple</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.socialBtn,
                  styles.googleBtn,
                  googlePressed && styles.googleBtnPressed,
                ]}
                onPressIn={() => setGooglePressed(true)}
                onPressOut={() => setGooglePressed(false)}
                accessibilityLabel="Continuer avec Google"
                accessibilityRole="button"
              >
                <GoogleIcon />
                <Text style={styles.googleBtnText}>Continuer avec Google</Text>
              </Pressable>
            </View>
          </View>

          {/* Legal */}
          <Text style={styles.legal}>
            En continuant, vous acceptez nos{' '}
            <Text style={styles.legalLink}>Conditions d'utilisation</Text> et notre{' '}
            <Text style={styles.legalLink}>Politique de confidentialité</Text>.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },

  // Header — centered minimal brand
  header: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  headerInner: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerBrand: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, color: C.white },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },

  // Ambient blobs
  blob: { position: 'absolute', borderRadius: 999 },
  blobTopLeft: {
    top: '5%',
    left: -100,
    width: 260,
    height: 260,
    backgroundColor: 'rgba(0,154,215,0.07)',
  },
  blobBottomRight: {
    bottom: '8%',
    right: -80,
    width: 240,
    height: 240,
    backgroundColor: 'rgba(69,223,164,0.05)',
  },

  // Hero
  hero: { alignItems: 'center', marginBottom: 28, width: '100%', gap: 8 },
  monogram: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(61,180,242,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(61,180,242,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: C.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: C.white,
  },
  heroSubtitle: {
    fontSize: 14,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
  },

  // Card
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
    shadowColor: C.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 8,
  },

  // Pill tab selector
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  tabPill: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabPillActive: {
    backgroundColor: 'rgba(61,180,242,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(61,180,242,0.22)',
  },
  tabPillText: { fontSize: 14, fontWeight: '600', color: `${C.onSurfaceVariant}75` },
  tabPillTextActive: { color: C.cyan },

  // Form
  form: { gap: 18 },
  inputGroup: { gap: 7 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2, color: C.onSurfaceVariant },
  labelFocused: { color: C.cyan },
  forgotText: { fontSize: 12, fontWeight: '500', color: C.secondary },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  inputWrapperFocused: {
    borderColor: 'rgba(61,180,242,0.50)',
    backgroundColor: 'rgba(5,15,29,0.88)',
    shadowColor: C.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 2,
  },
  inputIconBox: { flexShrink: 0 },
  input: { flex: 1, fontSize: 15, color: C.onSurface, height: '100%' },

  // CTA button
  ctaButton: {
    backgroundColor: C.secondaryContainer,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    marginTop: 6,
    shadowColor: '#009ad7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  ctaButtonPressed: { opacity: 0.87, transform: [{ scale: 0.984 }] },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#001e2e', letterSpacing: 0.2 },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.4,
    color: `${C.onSurfaceVariant}50`,
  },

  // Social buttons
  socialButtons: { gap: 10 },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    minHeight: 50,
  },
  socialBtnPressed: { opacity: 0.84, transform: [{ scale: 0.984 }] },
  appleBtn: { backgroundColor: C.white },
  appleBtnText: { fontSize: 14, fontWeight: '600', color: '#000' },
  googleBtn: {
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  googleBtnPressed: { opacity: 0.84, transform: [{ scale: 0.984 }] },
  googleBtnText: { fontSize: 14, fontWeight: '600', color: C.onSurface },

  // Legal
  legal: {
    fontSize: 11,
    color: `${C.onSurfaceVariant}50`,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
    marginTop: 4,
  },
  legalLink: { color: `${C.onSurfaceVariant}80`, textDecorationLine: 'underline' },
});
