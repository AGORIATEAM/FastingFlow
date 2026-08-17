import * as ExpoHaptics from 'expo-haptics';

/**
 * Central haptics wrapper. Every call is fire-and-forget and silently no-ops
 * on failure so haptics can never break an interaction.
 */

function safe(fn: () => Promise<void>): void {
  fn().catch(() => {});
}

export const haptics = {
  /** Chip/protocol/period selections */
  selection(): void {
    safe(() => ExpoHaptics.selectionAsync());
  },
  /** Small additive actions (+250 ml water) */
  light(): void {
    safe(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light));
  },
  /** Opening a confirmation, stopping a fast */
  medium(): void {
    safe(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium));
  },
  /** Fast started, phase reached, goal met */
  success(): void {
    safe(() => ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success));
  },
  /** Early stop, destructive confirmation */
  warning(): void {
    safe(() => ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning));
  },
};
