import { getTimeZonePreference, syncDeviceTimeZone } from '@/api';
import { getAppContext, setDisplayTimeZonePreference } from './app-context';

let sessionGeneration = 0;

export async function initializeSessionTimeZone(): Promise<void> {
  const generation = ++sessionGeneration;
  try {
    const preference = await getTimeZonePreference();
    if (generation !== sessionGeneration) return;
    setDisplayTimeZonePreference(preference.mode, preference.timezone);
    if (preference.mode === 'FOLLOW_DEVICE') {
      const deviceZone = getAppContext()?.timeZone || 'UTC';
      if (generation !== sessionGeneration) return;
      void syncDeviceTimeZone(deviceZone).catch((error) => console.warn('Failed to synchronize device timezone', error));
    }
  } catch (error) {
    console.warn('Failed to initialize timezone preference', error);
  }
}

export function resetSessionTimeZone(): void {
  sessionGeneration++;
  setDisplayTimeZonePreference('FOLLOW_DEVICE', null);
}
