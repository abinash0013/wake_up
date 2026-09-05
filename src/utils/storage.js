import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@wake_up/alarms/v1';

export const loadAlarms = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to load alarms from storage', error);
    return null;
  }
};

export const saveAlarms = async alarms => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
  } catch (error) {
    console.warn('Failed to save alarms to storage', error);
  }
};
