import {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, AppState, Vibration} from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import useStepCounter from './useStepCounter';
import {playAlarmSound, stopAlarmSound} from '../services/alarmSound';
import {
  addAlarmFiredListener,
  addAlarmStoppedListener,
  addStepProgressListener,
  cancelRingingNotification,
  getRingingAlarm,
  requestActivityRecognitionPermission,
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

// After "Start Walking" the alarm stays silent while steps keep incrementing.
// If no new step is detected for this long, the alarm rings again to nudge
// the user to keep moving (and goes silent again when they resume).
const STEP_IDLE_TIMEOUT_MS = 10000;

// Owns the full alarm lifecycle: time-based scheduling, ringing (sound +
// alert), sequential step progression and stopping.
const useAlarmEngine = ({alarms, toggleAlarm, loaded}) => {
  const [activeAlarmId, setActiveAlarmId] = useState(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [shouldHideDelete, setShouldHideDelete] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [isWalking, setIsWalking] = useState(false);
  const [stepWarning, setStepWarning] = useState(null);

  const alarmsRef = useRef(alarms);
  const activeAlarmIdRef = useRef(activeAlarmId);
  const activeStepIndexRef = useRef(activeStepIndex);
  const ringInProgressRef = useRef(false);
  const isWalkingRef = useRef(false);
  const walkTimerRef = useRef(null);
  const appStateRef = useRef(appState);

  alarmsRef.current = alarms;
  activeAlarmIdRef.current = activeAlarmId;
  activeStepIndexRef.current = activeStepIndex;
  isWalkingRef.current = isWalking;
  appStateRef.current = appState;

  const activeAlarm = activeAlarmId
    ? alarms.find(alarm => alarm.id === activeAlarmId)
    : null;

  const enabledSteps = activeAlarm ? getEnabledSteps(activeAlarm) : [];
  const activeStep = enabledSteps[activeStepIndex] || null;

  const clearWalkTimer = useCallback(() => {
    if (walkTimerRef.current) {
      clearTimeout(walkTimerRef.current);
      walkTimerRef.current = null;
    }
  }, []);

  const stopAlarm = useCallback(async () => {
    if (!activeAlarmIdRef.current) {
      return;
    }
    Vibration.cancel();
    clearWalkTimer();
    setIsWalking(false);
    setStepWarning(null);
    await stopAlarmSound();
    cancelRingingNotification();
    stopRingingService();
    setActiveAlarmId(null);
    setActiveStepIndex(0);
    setStepProgress(0);
    setShouldHideDelete(false);
    ringInProgressRef.current = false;
    console.log('Alarm stopped');
    showToast('Alarm stopped!');
  }, [clearWalkTimer]);

  const silenceAlarm = useCallback(async () => {
    Vibration.cancel();
    try {
      await stopAlarmSound();
    } catch (error) {
      console.warn('Failed to silence alarm sound', error);
    }
  }, []);

  const resumeAlarmRinging = useCallback(async () => {
    clearWalkTimer();
    if (!activeAlarmIdRef.current || appStateRef.current !== 'active') {
      return;
    }
    const alarm = alarmsRef.current.find(
      item => item.id === activeAlarmIdRef.current,
    );
    if (!alarm) {
      return;
    }
    setIsWalking(false);
    setStepWarning('Step count stopped — keep walking!');
    if (alarm.vibrate) {
      Vibration.vibrate(ALARM_VIBRATION_PATTERN, true);
    }
    try {
      await playAlarmSound(alarm.sound?.uri);
    } catch (error) {
      console.warn('Failed to resume alarm sound', error);
    }
  }, [clearWalkTimer]);

  const scheduleIdleCheck = useCallback(() => {
    clearWalkTimer();
    if (appStateRef.current !== 'active' || !isWalkingRef.current) {
      return undefined;
    }
    walkTimerRef.current = setTimeout(() => {
      walkTimerRef.current = null;
      if (!activeAlarmIdRef.current || !isWalkingRef.current) {
        return;
      }
      resumeAlarmRinging();
    }, STEP_IDLE_TIMEOUT_MS);
    return undefined;
  }, [clearWalkTimer, resumeAlarmRinging]);

  const startWalking = useCallback(async () => {
    if (!activeAlarmIdRef.current) {
      return;
    }
    setIsWalking(true);
    setStepWarning(null);
    await silenceAlarm();
    showToast('Alarm muted — keep walking!');
    scheduleIdleCheck();
  }, [silenceAlarm, scheduleIdleCheck]);

  const ringAlarm = useCallback(
    async alarm => {
      if (ringInProgressRef.current) {
        return; // Prevent multiple simultaneous alarms
      }
      ringInProgressRef.current = true;
      clearWalkTimer();
      setIsWalking(false);
      setStepWarning(null);

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
            startWalking();
          },
        },
        {
          text: 'Stop',
          style: 'cancel',
          onPress: () => {
            stopAlarm();
          },
        },
      ]);
    },
    [toggleAlarm, clearWalkTimer, startWalking, stopAlarm],
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
      // Any detected movement silences the alarm and re-arms the idle nudge.
      if (!isWalkingRef.current) {
        setIsWalking(true);
        setStepWarning(null);
        Vibration.cancel();
        stopAlarmSound();
      }
      scheduleIdleCheck();
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
    [stopAlarm, scheduleIdleCheck],
  );

  // Count steps with the accelerometer whenever the React UI is visible and
  // the active step is a walking step. This is the reliable path (it is what
  // works in "open state"); the native sensor only becomes the driver when the
  // app is closed/backgrounded. Native StepProgress events below still stop
  // the alarm if the native counter reaches the target first.
  useStepCounter({
    active:
      appState === 'active' &&
      !!activeAlarm &&
      !!activeStep &&
      activeStep.type === 'steps',
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
      clearWalkTimer();
      setIsWalking(false);
      setStepWarning(null);
      setActiveAlarmId(alarm.id);
      setActiveStepIndex(0);
      setStepProgress(payload?.walked || 0);
      setShouldHideDelete(true);
      toggleAlarm(alarm.id);
    });
  }, [toggleAlarm, clearWalkTimer]);

  // Native step progress. The JS accelerometer drives the on-screen count while
// the app is open; native events (which keep counting while the app is closed
// or backgrounded) are still used to stop the alarm when the native counter
// reaches the target first.
useEffect(() => {
    return addStepProgressListener(payload => {
      const alarm = alarmsRef.current.find(
        item => item.id === payload?.id,
      );
      if (!alarm || !ringInProgressRef.current) {
        return;
      }
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

  // Track foreground/background state so the JS accelerometer only runs while
  // the React UI is visible (native counting takes over when it is not).
  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      setAppState(next);
      if (next !== 'active') {
        clearWalkTimer();
      }
    });
    return () => sub.remove();
  }, [clearWalkTimer]);

  // When the alarm fired while the app was killed, the AlarmFired event never
  // reached JS. Re-query the native ringing service after the alarms have been
  // loaded and restore the UI/step-counting state so "Start Walking" works
  // after the app is opened. Waiting for `loaded` avoids the race where the
  // persisted alarm list is not ready yet and the sync silently bails.
  useEffect(() => {
    if (!loaded) {
      return undefined;
    }
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
      clearWalkTimer();
      setIsWalking(false);
      setStepWarning(null);
      setActiveAlarmId(alarm.id);
      setActiveStepIndex(0);
      setStepProgress(0);
      setShouldHideDelete(true);
      toggleAlarm(alarm.id);
    });
    return () => {
      cancelled = true;
    };
  }, [toggleAlarm, loaded, clearWalkTimer]);

  // Ask for the permissions the native alarm surfaces need later even when the
  // app is closed: notifications for the popup, activity recognition so the
  // hardware step sensor can feed the ringing service in kill mode.
  useEffect(() => {
    requestNotificationPermission();
    requestActivityRecognitionPermission();
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
    isWalking,
    stepWarning,
    startWalking,
    ringAlarm,
    stopAlarm,
  };
};

export default useAlarmEngine;
