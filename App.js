import React from 'react';
import AlarmListScreen from './src/screens/AlarmListScreen';
import StepCounter from './src/components/StepCounter';
import {LogBox} from 'react-native';

LogBox.ignoreLogs(['Warning: ...']); // Ignore specific logs
LogBox.ignoreAllLogs(true); // Ignore all logs

const App = () => {
  return <AlarmListScreen />;
  // return <StepCounter />;
};

export default App;
