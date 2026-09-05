import React from 'react';
import AlarmListScreen from './src/screens/AlarmListScreen';
import {LogBox} from 'react-native';

LogBox.ignoreLogs(['Warning: ...']); // Ignore specific logs
LogBox.ignoreAllLogs(true); // Ignore all logs

const App = () => {
  return <AlarmListScreen />;
};

export default App;
