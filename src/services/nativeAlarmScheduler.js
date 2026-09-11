import {NativeModules, Platform} from 'react-native';

const {AlarmSchedulerManager} = NativeModules;

export const isNativeSchedulerAvailable =
  Platform.OS === 'android' && !!AlarmSchedulerManager;

export const syncNativeAlarms = async alarms => {
  if (!isNativeSchedulerAvailable) {
    return;
  }
  try {
    await AlarmSchedulerManager.rescheduleAll(JSON.stringify(alarms || []));
  } catch (error) {
    console.warn('Failed to sync native alarm schedule', error);
  }
};

export const stopRingingService = async () => {
  if (!isNativeSchedulerAvailable) {
    return;
  }
  try {
    await AlarmSchedulerManager.stopRinging();
  } catch (error) {
    console.warn('Failed to stop native ringing service', error);
  }
};
