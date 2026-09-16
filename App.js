import React, {useState} from 'react';
import {LogBox, StyleSheet, View} from 'react-native';
import AlarmListScreen from './src/screens/AlarmListScreen';
import SplashScreen from './src/components/SplashScreen';
import {colors} from './src/theme';

LogBox.ignoreLogs(['Warning: ...']);
LogBox.ignoreAllLogs(true);

const App = () => {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <View style={styles.root}>
      {splashDone ? (
        <AlarmListScreen />
      ) : (
        <SplashScreen onFinish={() => setSplashDone(true)} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default App;
