import {
  AppState,
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';

const {AlarmNotificationManager} = NativeModules;

const emitter =
  Platform.OS === 'android' && AlarmNotificationManager
    ? new NativeEventEmitter(AlarmNotificationManager)
    : null;

const callNative = async (fn, fallback = null) => {
  if (Platform.OS !== 'android' || !AlarmNotificationManager) {
    return fallback;
  }
  try {
    return await fn();
  } catch (error) {
    console.warn('Alarm notification error', error);
    return fallback;
  }
};

// Ask for notification permission up-front (required for the alarm popup on
// Android 13+). Only meaningful when the app is in the foreground.
export const requestNotificationPermission = async () => {
  if (
    Platform.OS !== 'android' ||
    Number(Platform.Version) < 33 ||
    !PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS ||
    AppState.currentState !== 'active'
  ) {
    return;
  }
  try {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
  } catch (error) {
    console.warn('Failed to request notification permission', error);
  }
};

export const showRingingNotification = async (time = '') =>
  callNative(() => AlarmNotificationManager.showRinging(time || ''));

export const cancelRingingNotification = async () =>
  callNative(() => AlarmNotificationManager.cancel());

// Returns the currently ringing alarm (or null) so the JS layer can re-sync
// when the app is opened while an alarm is already ringing (fired in kill
// mode before the app was launched).
export const getRingingAlarm = async () =>
  callNative(() => AlarmNotificationManager.getRingingAlarm(), null);

export const addAlarmStoppedListener = callback => {
  if (!emitter) {
    return () => {};
  }
  const subscription = emitter.addListener('AlarmStopped', callback);
  return () => subscription.remove();
};

export const addAlarmFiredListener = callback => {
  if (!emitter) {
    return () => {};
  }
  const subscription = emitter.addListener('AlarmFired', callback);
  return () => subscription.remove();
};

export const addStepProgressListener = callback => {
  if (!emitter) {
    return () => {};
  }
  const subscription = emitter.addListener('StepProgress', callback);
  return () => subscription.remove();
};
