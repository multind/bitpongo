import { getTimeZonePreference, syncDeviceTimeZone } from '@/api';
import { getAppContext, setDisplayTimeZonePreference } from './app-context';

export async function initializeSessionTimeZone(): Promise<void> {
  try {
    const preference = await getTimeZonePreference();
    setDisplayTimeZonePreference(preference.mode, preference.timezone);
    if (preference.mode === 'FOLLOW_DEVICE') {
      const deviceZone = getAppContext()?.timeZone || 'UTC';
      void syncDeviceTimeZone(deviceZone).catch((error) => console.warn('Failed to synchronize device timezone', error));
    }
  } catch (error) {
    console.warn('Failed to initialize timezone preference', error);
  }
}

export function resetSessionTimeZone(): void {
  setDisplayTimeZonePreference('FOLLOW_DEVICE', null);
}
