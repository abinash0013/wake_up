import {NativeModules, Platform} from 'react-native';
import Sound from 'react-native-sound';

// Prefer the native MediaPlayer-backed module; fall back to the bundled
// mp3 (also used on iOS and in tests when the module is absent).
const nativeModule = NativeModules.AlarmSoundManager;

let playingSoundRef = null;

const playBundled = () =>
  new Promise(resolve => {
    if (playingSoundRef) {
      resolve();
      return;
    }

    const alarmSound = new Sound(
      require('../assets/ringtone/alarm_sound.mp3'),
      error => {
        if (error) {
          console.warn('Error loading alarm sound', error);
          resolve();
          return;
        }
        alarmSound.setNumberOfLoops(-1);
        alarmSound.play();
        playingSoundRef = alarmSound;
        resolve();
      },
    );
  });

export const playAlarmSound = uri => {
  if (Platform.OS === 'android' && nativeModule) {
    return nativeModule.start(uri || null, true);
  }
  return playBundled();
};

export const stopAlarmSound = () => {
  if (Platform.OS === 'android' && nativeModule) {
    return nativeModule.stop();
  }
  return new Promise(resolve => {
    if (!playingSoundRef) {
      resolve();
      return;
    }
    const sound = playingSoundRef;
    playingSoundRef = null;
    sound.setNumberOfLoops(0);
    sound.stop(() => resolve());
  });
};
