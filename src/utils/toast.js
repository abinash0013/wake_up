import {Alert, Platform, ToastAndroid} from 'react-native';

export const showToast = message => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.LONG);
  } else {
    Alert.alert(message);
  }
};
