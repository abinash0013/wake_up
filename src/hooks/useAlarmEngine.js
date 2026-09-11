import {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, Vibration} from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import useStepCounter from './useStepCounter';
import {playAlarmSound, stopAlarmSound} from '../services/alarmSound';
import {
  addAlarmFiredListener,
  addAlarmStoppedListener,
  addStepProgressListener,
  cancelRingingNotification,
  getRingingAlarm,
  requestNotificationPermission,
} from '../services/alarmNotification';
import {
  isNativeSchedulerAvailable,
  stopRingingService,
} from '../services/nativeAlarmScheduler';
import {getEnabledSteps} from '../utils/steps';
import {formatTime} from '../utils/time';
import {isTodayIncluded} from '../utils/days';
import {showToast} from '../utils/toast';

// wait, vibrate, wait, vibrate... repeated while ringing.
const ALARM_VIBRATION_PATTERN = [0, 600, 400, 600, 400];

// Owns the full alarm lifecycle: time-based scheduling, ringing (sound +
// alert), sequential step progression and stopping.
const useAlarmEngine = ({alarms, toggleAlarm}) => {
  const [activeAlarmId, setActiveAlarmId] = useState(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [shouldHideDelete, setShouldHideDelete] = useState(false);
  const [nativeWalking, setNativeWalking] = useState(false);

  const alarmsRef = useRef(alarms);
  const activeAlarmIdRef = useRef(activeAlarmId);
  const activeStepIndexRef = useRef(activeStepIndex);
  const ringInProgressRef = useRef(false);

  alarmsRef.current = alarms;
  activeAlarmIdRef.current = activeAlarmId;
  activeStepIndexRef.current = activeStepIndex;

  const activeAlarm = activeAlarmId
    ? alarms.find(alarm => alarm.id === activeAlarmId)
    : null;

  const enabledSteps = activeAlarm ? getEnabledSteps(activeAlarm) : [];
  const activeStep = enabledSteps[activeStepIndex] || null;

  const stopAlarm = useCallback(async () => {
    if (!activeAlarmIdRef.current) {
      return;
    }
    Vibration.cancel();
    await stopAlarmSound();
    cancelRingingNotification();
    stopRingingService();
    setActiveAlarmId(null);
    setActiveStepIndex(0);
    setStepProgress(0);
    setShouldHideDelete(false);
    setNativeWalking(false);
    ringInProgressRef.current = false;
    console.log('Alarm stopped');
    showToast('Alarm stopped!');
  }, []);

  const ringAlarm = useCallback(
    async alarm => {
      if (ringInProgressRef.current) {
        return; // Prevent multiple simultaneous alarms
      }
      ringInProgressRef.current = true;

      setActiveAlarmId(alarm.id);
      setActiveStepIndex(0);
      setStepProgress(0);
      setShouldHideDelete(true);

      if (alarm.vibrate) {
        Vibration.vibrate(ALARM_VIBRATION_PATTERN, true);
      }

      try {
        await playAlarmSound(alarm.sound?.uri);
      } catch (error) {
        console.warn('Failed to play alarm sound', error);
      }
      // Disable the alarm after it rings (matches previous behaviour).
      toggleAlarm(alarm.id);

      const firstStep = getEnabledSteps(alarm)[0];
      const remainingSteps = firstStep ? firstStep.config.target : 0;
      Alert.alert('Alarm', 'Time to Wake Up', [
        {
          text: 'Start Walking',
          onPress: () => {
            showToast(
              `You need ${remainingSteps} more steps to stop the alarm!`,
            );
          },
        },
      ]);
    },
    [toggleAlarm],
  );

  const onStep = useCallback(
    count => {
      const alarm = alarmsRef.current.find(
        item => item.id === activeAlarmIdRef.current,
      );
      if (!alarm) {
        return;
      }
      const steps = getEnabledSteps(alarm);
      const currentStep = steps[activeStepIndexRef.current];
      if (!currentStep) {
        stopAlarm();
        return;
      }
      if (count >= currentStep.config.target) {
        const nextIndex = activeStepIndexRef.current + 1;
        if (nextIndex < steps.length) {
          console.log(`Step "${currentStep.label}" completed, moving to next`);
          setActiveStepIndex(nextIndex);
          setStepProgress(0);
        } else {
          stopAlarm();
        }
      } else {
        setStepProgress(count);
      }
    },
    [stopAlarm],
  );

  useStepCounter({
    active:
      !!activeAlarm &&
      !!activeStep &&
      activeStep.type === 'steps' &&
      !nativeWalking,
    threshold: activeStep?.config.threshold,
    minIntervalMs: activeStep?.config.minIntervalMs,
    onStep,
    resetKey: activeStepIndex,
  });

  const checkAlarms = useCallback(() => {
    const formattedCurrentTime = formatTime(new Date());
    alarmsRef.current.forEach(alarm => {
      if (
        alarm.enabled &&
        alarm.time === formattedCurrentTime &&
        isTodayIncluded(alarm.repeatDays)
      ) {
        ringAlarm(alarm);
      }
    });
  }, [ringAlarm]);

  useEffect(() => {
    if (isNativeSchedulerAvailable) {
      return undefined;
    }
    const intervalId = BackgroundTimer.setInterval(() => {
      checkAlarms();
    }, 1000);
    return () => BackgroundTimer.clearInterval(intervalId);
  }, [checkAlarms]);

  // On Android the AlarmManager/ringing service drives ringing (works even
  // when the app is killed). JS only needs to reflect it in the UI.
  useEffect(() => {
    return addAlarmFiredListener(payload => {
      const alarm = alarmsRef.current.find(
        item => item.id === payload?.id,
      );
      if (!alarm || ringInProgressRef.current) {
        return;
      }
      ringInProgressRef.current = true;
      setActiveAlarmId(alarm.id);
      setActiveStepIndex(0);
      const walking = !!(payload?.walking && payload.walkTarget > 0);
      setNativeWalking(walking);
      setStepProgress(payload?.walked || 0);
      setShouldHideDelete(true);
      toggleAlarm(alarm.id);
    });
  }, [toggleAlarm]);

  // A walking alarm started natively: reflect the step count in the UI and
  // stop when the native step counter reaches the target.
  useEffect(() => {
    return addStepProgressListener(payload => {
      const alarm = alarmsRef.current.find(
        item => item.id === payload?.id,
      );
      if (!alarm || !ringInProgressRef.current) {
        return;
      }
      setStepProgress(payload.walked || 0);
      if (payload.target > 0 && payload.walked >= payload.target) {
        stopAlarm();
      }
    });
  }, [stopAlarm]);

  // Stop the alarm when it is dismissed from the native popup/notification.
  useEffect(() => {
    return addAlarmStoppedListener(() => {
      stopAlarm();
    });
  }, [stopAlarm]);

  // When the alarm fired while the app was killed, the AlarmFired event never
  // reached JS. Re-query the native ringing service on mount and restore the
  // UI/step-counting state so "Start Walking" works after the app is opened.
  useEffect(() => {
    let cancelled = false;
    getRingingAlarm().then(payload => {
      if (cancelled || !payload?.id || ringInProgressRef.current) {
        return;
      }
      const alarm = alarmsRef.current.find(item => item.id === payload.id);
      if (!alarm) {
        return;
      }
      ringInProgressRef.current = true;
      setActiveAlarmId(alarm.id);
      setActiveStepIndex(0);
      setStepProgress(payload.walked || 0);
      setNativeWalking(!!(payload.walking && payload.walkTarget > 0));
      setShouldHideDelete(true);
      toggleAlarm(alarm.id);
    });
    return () => {
      cancelled = true;
    };
  }, [toggleAlarm]);

  // Ask for notification permission up-front so the native alarm popup can
  // appear later even when the app is closed.
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return {
    activeAlarmId,
    activeAlarm,
    activeStep,
    activeStepIndex,
    enabledStepsCount: enabledSteps.length,
    stepProgress,
    shouldHideDelete,
    isRinging: activeAlarmId !== null,
    ringAlarm,
    stopAlarm,
  };
};

export default useAlarmEngine;
