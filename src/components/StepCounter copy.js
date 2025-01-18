import React, {useEffect, useState} from 'react';
import {View, Text, Button, StyleSheet, Alert} from 'react-native';
import GoogleFit, {Scopes} from 'react-native-google-fit';

const StepCounter = () => {
  const [steps, setSteps] = useState(0);

  useEffect(() => {
    // Authorize Google Fit
    const options = {
      scopes: [Scopes.FITNESS_ACTIVITY_READ, Scopes.FITNESS_ACTIVITY_WRITE],
    };

    console.log('GoogleFitLog', GoogleFit.authorize);

    GoogleFit.authorize(options)
      .then(authResult => {
        console.log('Authorization Result:', authResult);
        if (authResult.success) {
          fetchStepCount();
        } else {
          console.log('Authorization failed:', authResult);
          if (authResult.message.includes('canceled')) {
            Alert.alert(
              'Authorization Canceled',
              'Please authorize the app to access your data.',
            );
          } else {
            Alert.alert(
              'Authorization Failed',
              authResult.message || 'Unknown error occurred',
            );
          }
        }
      })
      .catch(error => {
        console.error('Authorization Error:', error);
        Alert.alert(
          'Authorization Error',
          'An error occurred during authorization. Please try again.',
        );
      });
  }, []);

  const fetchStepCount = () => {
    const start = new Date();
    start.setDate(start.getDate() - 7); // 1 week ago
    const end = new Date(); // today

    GoogleFit.getDailyStepCountSamples({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    })
      .then(results => {
        const stepsData = results.find(
          result => result.source === 'com.google.android.gms:estimated_steps',
        );
        if (stepsData) {
          setSteps(stepsData.steps[stepsData.steps.length - 1]?.value || 0);
        } else {
          setSteps(0);
        }
      })
      .catch(err => {
        console.error('Error fetching step count:', err);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Steps Today: {steps}</Text>
      <Button title="Refresh Steps" onPress={fetchStepCount} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 20,
    marginBottom: 20,
  },
});

export default StepCounter;
