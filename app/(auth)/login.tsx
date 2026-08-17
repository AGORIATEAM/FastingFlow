import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';

import { GhostButton, GlassCard, PressableScale, PrimaryButton, Screen } from '@/components/ui';
import { sendPasswordReset, signInWithEmail, signUpWithEmail } from '@/lib/auth/account';
import { haptics } from '@/lib/haptics';
import { useRepositories } from '@/lib/repositories/provider';
import { useUserStore } from '@/lib/stores/useUserStore';
import { isAuthConfigured } from '@/lib/supabase';
import { Colors, Fonts, Radius, Spacing, TextStyles, Typography } from '@/lib/theme';

// ─── Validation ─────────────────────────────────────────────────────

const EMAIL_RE = /^\S+@\S+\.\S+$/;

const ERR_REQUIRED = 'Ce champ est requis.';
const ERR_EMAIL = 'Adresse email invalide.';
const ERR_PASSWORD = 'Le mot de passe doit contenir au moins 6 caractères.';
const ERR_CONFIRM = 'Les mots de passe ne correspondent pas.';
const ERR_GENERIC = 'Une erreur est survenue. Veuillez réessayer.';

type AuthTab = 'login' | 'signup';

interface FieldErrors {
  email?: string;
  password?: string;
  confirm?: string;
}

function validateFields(
  tab: AuthTab,
  email: string,
  password: string,
  confirm: string
): FieldErrors {
  const errors: FieldErrors = {};
  const trimmedEmail = email.trim();
  if (trimmedEmail.length === 0) errors.email = ERR_REQUIRED;
  else if (!EMAIL_RE.test(trimmedEmail)) errors.email = ERR_EMAIL;
  if (password.length === 0) errors.password = ERR_REQUIRED;
  else if (password.length < 6) errors.password = ERR_PASSWORD;
  if (tab === 'signup') {
    if (confirm.length === 0) errors.confirm = ERR_REQUIRED;
    else if (confirm !== password) errors.confirm = ERR_CONFIRM;
  }
  return errors;
}

// ─── SVG icons ──────────────────────────────────────────────────────

function FlameIcon({ size = 22, color = Colors.secondary }: { size?: number; color?: string }) {
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
  const color = focused ? Colors.cyan : Colors.mutedText;
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
  const color = focused ? Colors.cyan : Colors.mutedText;
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

function EyeIcon({ show, color = Colors.outline }: { show: boolean; color?: string }) {
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

// ─── Input field ────────────────────────────────────────────────────

interface InputFieldProps {
  fieldId: string;
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string | undefined;
  secure?: boolean | undefined;
  showSecure?: boolean | undefined;
  onToggleSecure?: (() => void) | undefined;
  icon: (focused: boolean) => ReactNode;
  rightLabel?: ReactNode;
  focusedField: string | null;
  onFocus: (id: string) => void;
  onBlur: () => void;
  keyboardType?: 'default' | 'email-address' | undefined;
  textContentType?: 'emailAddress' | 'password' | 'newPassword' | undefined;
}

function InputField({
  fieldId,
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secure,
  showSecure,
  onToggleSecure,
  icon,
  rightLabel,
  focusedField,
  onFocus,
  onBlur,
  keyboardType = 'default',
  textContentType,
}: InputFieldProps) {
  const focused = focusedField === fieldId;
  return (
    <View style={styles.inputGroup}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
        {rightLabel}
      </View>
      <View
        style={[
          styles.inputWrapper,
          focused && styles.inputWrapperFocused,
          error !== undefined && styles.inputWrapperError,
        ]}
      >
        <View style={styles.inputIconBox}>{icon(focused)}</View>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.mutedText}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure === true && showSecure !== true}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={keyboardType}
          keyboardAppearance="dark"
          textContentType={textContentType}
          onFocus={() => onFocus(fieldId)}
          onBlur={onBlur}
          accessibilityLabel={label}
        />
        {secure === true && onToggleSecure !== undefined && (
          <Pressable
            onPress={onToggleSecure}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={
              showSecure === true ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
            }
          >
            <EyeIcon show={showSecure === true} color={focused ? Colors.cyan : Colors.outline} />
          </Pressable>
        )}
      </View>
      {error !== undefined && (
        <Text style={styles.fieldError} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
}

// ─── Forgot-password sheet ──────────────────────────────────────────

type ResetStatus = 'idle' | 'sending' | 'sent';

interface ResetSheetProps {
  visible: boolean;
  initialEmail: string;
  onClose: () => void;
}

function ResetSheet({ visible, initialEmail, onClose }: ResetSheetProps) {
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<ResetStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  function handleShow(): void {
    setEmail(initialEmail);
    setStatus('idle');
    setError(null);
  }

  async function handleSend(): Promise<void> {
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError(ERR_EMAIL);
      return;
    }
    setError(null);
    setStatus('sending');
    const result = await sendPasswordReset(trimmed);
    if (result.ok) {
      haptics.success();
      setStatus('sent');
    } else {
      haptics.warning();
      setStatus('idle');
      setError(result.error ?? ERR_GENERIC);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={handleShow}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          style={styles.sheetOverlay}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
        >
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Mot de passe oublié</Text>
            {status === 'sent' ? (
              <>
                <Text style={styles.sheetConfirmation} accessibilityLiveRegion="polite">
                  Email envoyé si un compte existe.
                </Text>
                <GhostButton label="Fermer" onPress={onClose} />
              </>
            ) : (
              <>
                <Text style={styles.sheetSubtitle}>
                  Recevez un lien de réinitialisation par email.
                </Text>
                <View style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}>
                  <View style={styles.inputIconBox}>
                    <MailIcon focused={focused} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="nom@exemple.com"
                    placeholderTextColor={Colors.mutedText}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    keyboardAppearance="dark"
                    textContentType="emailAddress"
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    accessibilityLabel="Adresse email"
                  />
                </View>
                {error !== null && (
                  <Text style={styles.fieldError} accessibilityLiveRegion="polite">
                    {error}
                  </Text>
                )}
                {status === 'sending' ? (
                  <View style={styles.sheetSpinner}>
                    <ActivityIndicator color={Colors.cyan} size="small" />
                  </View>
                ) : (
                  <PrimaryButton label="Envoyer le lien" onPress={handleSend} />
                )}
              </>
            )}
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main screen ────────────────────────────────────────────────────

export default function LoginScreen() {
  const router = useRouter();
  const { users } = useRepositories();
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);

  const [tab, setTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetVisible, setResetVisible] = useState(false);

  const authConfigured = isAuthConfigured();

  function continueAsGuest(): void {
    router.replace('/(tabs)');
  }

  function handleTabSwitch(next: AuthTab): void {
    if (next === tab) return;
    haptics.selection();
    setTab(next);
    setFieldErrors({});
    setBanner(null);
    setShowPassword(false);
    setShowConfirm(false);
    setFocusedField(null);
  }

  async function handleSubmit(): Promise<void> {
    if (isSubmitting) return;
    setBanner(null);
    const errors = validateFields(tab, email, password, confirm);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      haptics.warning();
      return;
    }
    if (user === null) {
      // Theoretical case: the guest user is bootstrapped before this screen.
      setBanner(ERR_GENERIC);
      haptics.warning();
      return;
    }
    setIsSubmitting(true);
    const trimmedEmail = email.trim().toLowerCase();
    const result =
      tab === 'login'
        ? await signInWithEmail(users, user, trimmedEmail, password)
        : await signUpWithEmail(users, user, trimmedEmail, password);
    setIsSubmitting(false);
    if (result.ok) {
      setUser(result.user);
      haptics.success();
      router.replace('/(tabs)');
    } else {
      setBanner(result.error);
      haptics.warning();
    }
  }

  const heroTitle = tab === 'login' ? 'Bon retour' : 'Créer un compte';
  const heroSubtitle =
    tab === 'login'
      ? 'Reprenez là où vous en étiez'
      : 'Sauvegardez vos données de jeûne en toute sécurité';
  const ctaLabel = tab === 'login' ? 'Se connecter' : 'Créer mon compte';

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
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
              <FlameIcon size={26} color={Colors.cyan} />
            </View>
            <Text style={styles.heroTitle}>{heroTitle}</Text>
            <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>
          </View>

          {authConfigured ? (
            <GlassCard style={styles.card} padded={false}>
              {/* Pill tab selector */}
              <View style={styles.tabContainer} accessibilityRole="tablist">
                {(['login', 'signup'] as const).map((t) => {
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
                        {t === 'login' ? 'Connexion' : 'Inscription'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Error banner */}
              {banner !== null && (
                <GlassCard style={styles.errorBanner}>
                  <Text
                    style={styles.errorBannerText}
                    accessibilityRole="alert"
                    accessibilityLiveRegion="polite"
                  >
                    {banner}
                  </Text>
                </GlassCard>
              )}

              {/* Form */}
              <View style={styles.form}>
                <InputField
                  fieldId="email"
                  label="Adresse email"
                  placeholder="nom@exemple.com"
                  value={email}
                  onChangeText={setEmail}
                  error={fieldErrors.email}
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
                  placeholder="6 caractères minimum"
                  value={password}
                  onChangeText={setPassword}
                  error={fieldErrors.password}
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
                      <Pressable
                        hitSlop={12}
                        onPress={() => setResetVisible(true)}
                        accessibilityRole="button"
                        accessibilityLabel="Réinitialiser le mot de passe"
                      >
                        <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
                      </Pressable>
                    ) : undefined
                  }
                />

                {tab === 'signup' && (
                  <InputField
                    fieldId="confirm"
                    label="Confirmer le mot de passe"
                    placeholder="Retapez votre mot de passe"
                    value={confirm}
                    onChangeText={setConfirm}
                    error={fieldErrors.confirm}
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
                <PressableScale
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  accessibilityLabel={ctaLabel}
                  accessibilityState={{ busy: isSubmitting }}
                  style={[styles.cta, isSubmitting && styles.ctaDisabled]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={Colors.bg} size="small" />
                  ) : (
                    <Text style={styles.ctaText}>{ctaLabel}</Text>
                  )}
                </PressableScale>
              </View>
            </GlassCard>
          ) : (
            <GlassCard style={styles.card}>
              <Text style={styles.unavailableTitle}>Bientôt disponible</Text>
              <Text style={styles.unavailableText}>
                La création de compte sera bientôt disponible. Vos données restent enregistrées sur
                cet appareil.
              </Text>
            </GlassCard>
          )}

          {/* Guest access — always available */}
          <GhostButton
            label="Continuer en invité"
            onPress={continueAsGuest}
            style={styles.guestBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <ResetSheet
        visible={resetVisible}
        initialEmail={email}
        onClose={() => setResetVisible(false)}
      />
    </Screen>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl + Spacing.sm,
    alignItems: 'center',
  },

  // Ambient blobs
  blob: { position: 'absolute', borderRadius: Radius.full },
  blobTopLeft: {
    top: '5%',
    left: -100,
    width: 260,
    height: 260,
    backgroundColor: `${Colors.secondaryContainer}12`,
  },
  blobBottomRight: {
    bottom: '8%',
    right: -80,
    width: 240,
    height: 240,
    backgroundColor: `${Colors.tertiary}0D`,
  },

  // Hero
  hero: { alignItems: 'center', marginBottom: Spacing.xl, width: '100%', gap: Spacing.sm },
  monogram: {
    width: 60,
    height: 60,
    borderRadius: Radius.lg,
    backgroundColor: `${Colors.cyan}1A`,
    borderWidth: 1,
    borderColor: `${Colors.cyan}33`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  heroTitle: {
    ...TextStyles.h1,
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    ...TextStyles.body,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.xl,
  },

  // Card
  card: {
    width: '100%',
    maxWidth: 440,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },

  // Pill tab selector
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.divider,
    borderRadius: Radius.md,
    padding: Spacing.xs,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  tabPill: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  tabPillActive: {
    backgroundColor: `${Colors.cyan}1F`,
    borderWidth: 1,
    borderColor: `${Colors.cyan}38`,
  },
  tabPillText: {
    fontFamily: Fonts.semibold,
    fontSize: Typography.body - 1,
    color: Colors.mutedText,
  },
  tabPillTextActive: { color: Colors.cyan },

  // Error banner
  errorBanner: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorBg,
    marginBottom: Spacing.md,
  },
  errorBannerText: {
    fontFamily: Fonts.medium,
    fontSize: Typography.bodySmall,
    color: Colors.error,
    lineHeight: 18,
  },

  // Form
  form: { gap: Spacing.md },
  inputGroup: { gap: Spacing.xs + 2 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  label: {
    fontFamily: Fonts.semibold,
    fontSize: Typography.bodySmall - 1,
    letterSpacing: 0.2,
    color: Colors.onSurfaceVariant,
  },
  labelFocused: { color: Colors.cyan },
  forgotText: {
    fontFamily: Fonts.medium,
    fontSize: Typography.bodySmall - 1,
    color: Colors.secondary,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryContainer,
    borderWidth: 1,
    borderColor: Colors.glassBorderDim,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md - 2,
    height: 52,
    gap: Spacing.sm + 2,
  },
  inputWrapperFocused: {
    borderColor: Colors.cyan,
  },
  inputWrapperError: {
    borderColor: Colors.error,
  },
  inputIconBox: { flexShrink: 0 },
  input: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: Typography.body,
    color: Colors.onSurface,
    height: '100%',
  },
  fieldError: {
    fontFamily: Fonts.medium,
    fontSize: Typography.bodySmall - 1,
    color: Colors.error,
    paddingHorizontal: 2,
  },

  // CTA
  cta: {
    backgroundColor: Colors.cyan,
    paddingVertical: 15,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: Spacing.xs,
  },
  ctaDisabled: { opacity: 0.7 },
  ctaText: {
    fontFamily: Fonts.semibold,
    fontSize: Typography.body + 1,
    color: Colors.bg,
    textAlign: 'center',
  },

  // Auth unavailable
  unavailableTitle: {
    ...TextStyles.h3,
    marginBottom: Spacing.sm,
  },
  unavailableText: {
    ...TextStyles.body,
    lineHeight: 22,
  },

  // Guest
  guestBtn: {
    width: '100%',
    maxWidth: 440,
  },

  // Reset sheet
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: `${Colors.bg}CC`,
  },
  sheet: {
    backgroundColor: Colors.deepBlue,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl + Spacing.sm,
    gap: Spacing.md,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.glassBorder,
  },
  sheetTitle: {
    ...TextStyles.h3,
    textAlign: 'center',
  },
  sheetSubtitle: {
    ...TextStyles.body,
    textAlign: 'center',
  },
  sheetConfirmation: {
    fontFamily: Fonts.medium,
    fontSize: Typography.body,
    color: Colors.tertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
  sheetSpinner: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
