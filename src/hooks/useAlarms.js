import {useCallback, useEffect, useRef, useState} from 'react';
import {uid} from '../utils/id';
import {loadAlarms, saveAlarms} from '../utils/storage';
import {normalizeSteps} from '../utils/steps';
import {normalizeRepeatDays} from '../utils/days';
import {currentWeekday} from '../utils/time';
import {DEFAULT_SOUND} from '../constants/sound';

const normalizeSound = sound => {
  if (sound && typeof sound.uri === 'string' && sound.uri.length > 0) {
    return {title: sound.title || 'Alarm sound', uri: sound.uri};
  }
  return DEFAULT_SOUND;
};

const normalizeAlarm = alarm => ({
  id: alarm.id || uid(),
  time: alarm.time || '7:00 AM',
  day: alarm.day || currentWeekday(),
  enabled: alarm.enabled !== false,
  name: typeof alarm.name === 'string' ? alarm.name : '',
  vibrate: alarm.vibrate !== false,
  sound: normalizeSound(alarm.sound),
  steps: normalizeSteps(alarm.steps),
  repeatDays: normalizeRepeatDays(alarm.repeatDays),
});

const useAlarms = () => {
  const [alarms, setAlarms] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    loadAlarms().then(stored => {
      if (!mounted) {
        return;
      }
      if (Array.isArray(stored)) {
        setAlarms(stored.map(normalizeAlarm));
      }
      setLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Persist with a short debounce to avoid excessive writes.
  useEffect(() => {
    if (!loaded) {
      return undefined;
    }
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => saveAlarms(alarms), 200);
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [alarms, loaded]);

  const addAlarm = useCallback(settings => {
    const {time, repeatDays, name, vibrate, sound, steps} = settings || {};
    let created = null;
    setAlarms(prev => {
      if (prev.some(alarm => alarm.time === time)) {
        return prev;
      }
      created = {
        id: uid(),
        time,
        day: currentWeekday(),
        enabled: true,
        name: typeof name === 'string' ? name : '',
        vibrate: vibrate !== false,
        sound: normalizeSound(sound),
        steps: normalizeSteps(steps),
        repeatDays: normalizeRepeatDays(repeatDays),
      };
      return [...prev, created];
    });
    return created;
  }, []);

  const updateAlarm = useCallback((id, updater) => {
    setAlarms(prev =>
      prev.map(alarm =>
        alarm.id === id
          ? {
              ...alarm,
              ...(typeof updater === 'function' ? updater(alarm) : updater),
            }
          : alarm,
      ),
    );
  }, []);

  const deleteAlarm = useCallback(id => {
    setAlarms(prev => prev.filter(alarm => alarm.id !== id));
  }, []);

  const toggleAlarm = useCallback(id => {
    setAlarms(prev =>
      prev.map(alarm =>
        alarm.id === id ? {...alarm, enabled: !alarm.enabled} : alarm,
      ),
    );
  }, []);

  const hasDuplicateTime = useCallback(
    (time, excludeId) =>
      alarms.some(alarm => alarm.time === time && alarm.id !== excludeId),
    [alarms],
  );

  return {
    alarms,
    loaded,
    addAlarm,
    updateAlarm,
    deleteAlarm,
    toggleAlarm,
    hasDuplicateTime,
  };
};

export default useAlarms;
