import {
  Text,
  View,
  Image,
  Alert,
  Switch,
  FlatList,
  StyleSheet,
  ToastAndroid,
  TouchableOpacity,
} from 'react-native';
import Sound from 'react-native-sound';
import React, {useEffect, useRef, useState} from 'react';
import BackgroundTimer from 'react-native-background-timer';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';

import {
  SensorTypes,
  accelerometer,
  setUpdateIntervalForType,
} from 'react-native-sensors';

const AlarmListScreen = () => {
  const time = new Date();
  const [alarms, setAlarms] = useState([]);
  const [stepCount, setStepCount] = useState(0);
  const [activeAlarmId, setActiveAlarmId] = useState(null); // Track active alarm ID
  const [shouldHideDelete, setShouldHideDelete] = useState(false);
  // const [showStopButton, setShowStopButton] = useState(false); // New state
  const alarmSoundRef = useRef(null);

  useEffect(() => {
    setUpdateIntervalForType(SensorTypes.accelerometer, 50);

    let previousMagnitude = 0;
    let previousTime = Date.now();
    const threshold = 2.5;

    const subscription = accelerometer.subscribe(({x, y, z}) => {
      if (!activeAlarmId) return; // Only count steps if an alarm is active
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const currentTime = Date.now();

      if (
        magnitude - previousMagnitude > threshold &&
        currentTime - previousTime > 300
      ) {
        setStepCount(prev => prev + 1);
        previousTime = currentTime;
      }
      previousMagnitude = magnitude;
    });

    return () => subscription.unsubscribe();
  }, [activeAlarmId]);

  useEffect(() => {
    const intervalId = BackgroundTimer.setInterval(() => {
      checkAlarms();
    }, 1000);

    return () => BackgroundTimer.clearInterval(intervalId);
  }, [alarms]);

  useEffect(() => {
    if (stepCount >= 10 && alarmSoundRef.current) {
      console.log('Step count reached 10. Stopping alarm...');
      setTimeout(() => stopAlarm(), 500); // Add delay
    }
  }, [stepCount]);

  const checkAlarms = () => {
    const currentTime = new Date();
    const formattedCurrentTime = formatTime(currentTime);
    alarms.forEach(alarm => {
      if (alarm.enabled && alarm.time === formattedCurrentTime) {
        ringAlarm(alarm.id);
        toggleAlarm(alarm.id);
        setShouldHideDelete(true);
      }
    });
  };

  const ringAlarm = alarmId => {
    if (alarmSoundRef.current) return; // Prevent multiple instances

    setStepCount(0); // Reset step count for the triggered alarm
    setActiveAlarmId(alarmId); // Set active alarm ID
    // setShowStopButton(true);

    const alarmSound = new Sound(
      require('./../assets/ringtone/alarm_sound.mp3'),
      error => {
        if (error) {
          console.log('Error loading sound', error);
          return;
        }
        alarmSound.setNumberOfLoops(-1);
        alarmSound.play();
        alarmSoundRef.current = alarmSound;
        // setShowStopButton(true); // Show the stop button when alarm rings
      },
      Alert.alert('Alarm', 'Time to Wake Up', [
        {
          text: 'Start Walking',
          onPress: () => {
            ToastAndroid.show(
              `You need ${10 - stepCount} more steps to stop the alarm!`,
              ToastAndroid.LONG,
            );
          },
        },
      ]),
    );
  };

  const stopAlarm = () => {
    if (alarmSoundRef.current) {
      console.log('Stopping alarm...');
      alarmSoundRef.current.setNumberOfLoops(0);
      alarmSoundRef.current.stop(() => {
        console.log('Alarm sound stopped');
        alarmSoundRef.current = null; // Clean up reference
        setStepCount(0); // Reset step count
        setActiveAlarmId(null); // Clear active alarm ID
        setShouldHideDelete(false); // Allow delete button visibility
        ToastAndroid.show('Alarm stopped!', ToastAndroid.LONG);
      });
    }
  };

  const toggleAlarm = id => {
    setAlarms(prevAlarms =>
      prevAlarms.map(alarm =>
        alarm.id === id ? {...alarm, enabled: !alarm.enabled} : alarm,
      ),
    );
  };

  const deleteAlarm = id => {
    setAlarms(previousAlarm => previousAlarm.filter(alarm => alarm.id !== id));
  };

  const showTimePicker = () => {
    DateTimePickerAndroid.open({
      value: time,
      mode: 'time',
      is24Hour: false,
      onChange: (event, selectedTime) => {
        if (event.type === 'dismissed' || !selectedTime) {
          return;
        }

        const updatedTime = new Date();
        updatedTime.setHours(selectedTime.getHours());
        updatedTime.setMinutes(selectedTime.getMinutes());
        updatedTime.setSeconds(0);

        const formattedTime = formatTime(updatedTime);

        setAlarms(prevAlarms => {
          const isDuplicate = prevAlarms.some(
            alarm => alarm.time === formattedTime,
          );
          if (isDuplicate) {
            ToastAndroid.show(
              'Alarm with this time already exists!',
              ToastAndroid.LONG,
            );
            return prevAlarms;
          }

          return [
            ...prevAlarms,
            {
              id: Math.random().toString(),
              time: formattedTime,
              day: new Date().toLocaleDateString('en-US', {weekday: 'long'}),
              enabled: true,
            },
          ];
        });
      },
    });
  };

  const formatTime = date => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  const renderAlarmCard = ({item}) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.alarmTime}>{item.time}</Text>
          <Text style={styles.alarmDay}>{item.day}</Text>
        </View>
        <View style={styles.cardActions}>
          <Switch
            value={item.enabled}
            onValueChange={() => toggleAlarm(item.id)}
          />
          {!shouldHideDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteAlarm(item.id)}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.steps}>
          {/* comment for now */}
          {/* Steps Taken: {activeAlarmId === item.id ? stepCount : 0}  */}
          Steps Taken: {stepCount}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.alarmScreenHeading}>Alarm</Text>
      <View style={styles.alarmScreenContainer}>
        {alarms.length > 0 ? (
          <FlatList
            data={alarms}
            keyExtractor={item => item.id}
            renderItem={renderAlarmCard}
          />
        ) : (
          <View style={styles.noDataFoundContainer}>
            <Image
              source={require('./../assets/icons/no_data_found.png')}
              style={styles.icon}
            />
            <Text style={styles.noDataFound}>
              You have not set any alarms yet..!
            </Text>
          </View>
        )}
      </View>
      {/* {showStopButton && (
        <TouchableOpacity style={styles.stopButton} onPress={stopAlarm}>
          <Text style={styles.stopButtonText}>Stop Alarm</Text>
        </TouchableOpacity>
      )} */}
      <View style={styles.floatingIcon}>
        <Text style={styles.floatingIconText} onPress={showTimePicker}>
          +
        </Text>
      </View>
    </View>
  );
};

export default AlarmListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#1a1a2e',
  },
  floatingIcon: {
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
    position: 'absolute',
    bottom: 20,
    right: 20,
    elevation: 5,
  },
  floatingIconText: {
    color: 'black',
    fontSize: 30,
  },
  alarmScreenHeading: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    padding: 10,
    textAlign: 'center',
  },
  alarmScreenContainer: {
    flex: 1,
    marginTop: 10,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Transparent white for glass effect
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alarmTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  alarmDay: {
    fontSize: 16,
    color: '#ccc',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  deleteButton: {
    backgroundColor: '#ff4d4d',
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 3,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  steps: {
    color: '#fff',
    fontSize: 9,
    alignSelf: 'center',
    paddingTop: 10,
  },
  noDataFound: {
    color: '#ccc',
    textAlign: 'center',
    fontWeight: 900,
    fontSize: 17,
  },
  noDataFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 100,
  },
  icon: {
    height: 100,
    width: 100,
    marginBottom: 10,
    alignSelf: 'center',
  },
  stopButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 10,
  },
  stopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
