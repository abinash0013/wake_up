import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {
  accelerometer,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';

const StepCounter = () => {
  const [stepCount, setStepCount] = useState(0);

  useEffect(() => {
    // Set the update interval to 50ms for better accuracy
    setUpdateIntervalForType(SensorTypes.accelerometer, 50);

    let previousMagnitude = 0;
    let previousTime = Date.now();

    // const threshold = 1.2; // Adjust threshold based on user testing
    // const threshold = 2.0; // Adjust threshold based on user testing
    const threshold = 1.5; // Adjust threshold based on user testing

    const subscription = accelerometer.subscribe(({x, y, z}) => {
      // Calculate the magnitude of the accelerometer vector
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      // Current time for step timing validation
      const currentTime = Date.now();

      // Detect a step: Check if magnitude crosses the threshold and ensure a minimum time between steps
      if (
        magnitude - previousMagnitude > threshold &&
        currentTime - previousTime > 300 // Minimum 300ms between steps
      ) {
        setStepCount(prev => prev + 1);
        previousTime = currentTime;
      }
      previousMagnitude = magnitude;
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  console.log('stepCountLog', stepCount);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Step Counter</Text>
      <Text style={styles.steps}>Steps Taken: {stepCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  steps: {
    fontSize: 20,
    color: 'green',
  },
});

export default StepCounter;
