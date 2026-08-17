import * as Notifications from 'expo-notifications';

import phasesRaw from '@/content/phases.json';
import { planNotificationTriggers } from '@/lib/domain/fasting';
import type { FastSession } from '@/lib/schemas';
import { PhasesContentSchema, type PhaseContent } from '@/lib/schemas';

const PHASES: readonly PhaseContent[] = PhasesContentSchema.parse(phasesRaw);

function phaseTitle(phaseId: string): string {
  return PHASES.find((p) => p.id === phaseId)?.title ?? `Phase ${phaseId}`;
}

/** Show alerts (banner + list) while the app is foregrounded. */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: () =>
      Promise.resolve({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
  });
}

/** Returns true when notifications are (or become) permitted. */
export async function requestNotificationPermissions(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  if (!settings.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'unset'> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return 'granted';
  return settings.canAskAgain ? 'unset' : 'denied';
}

/**
 * Schedules the session's phase + completion notifications.
 * Only one fast can be active at a time, so previous schedules are cleared.
 */
export async function scheduleForSession(session: FastSession): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const triggers = planNotificationTriggers(session);

  for (const t of triggers) {
    const content =
      t.kind === 'end'
        ? {
            title: 'Objectif atteint',
            body: `Votre jeûne de ${session.plannedDurationH}h est terminé. Félicitations !`,
          }
        : {
            title: phaseTitle(t.phaseId ?? ''),
            body: 'Nouvelle phase métabolique atteinte. Ouvrez FastLife pour en savoir plus.',
          };

    await Notifications.scheduleNotificationAsync({
      content: { ...content, sound: false },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: t.date,
      },
    });
  }
}

/** Cancels everything scheduled (single-active-session app). */
export async function cancelScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
