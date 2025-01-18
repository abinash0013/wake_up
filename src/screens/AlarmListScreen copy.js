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
import React, {useEffect, useState} from 'react';
import BackgroundTimer from 'react-native-background-timer';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';

import {
  SensorTypes,
  accelerometer,
  setUpdateIntervalForType,
} from 'react-native-sensors';

const AlarmListScreen = () => {
  const [alarms, setAlarms] = useState([]);
  const [time, setTime] = useState(new Date());
  const [stepCount, setStepCount] = useState(0);
  const [shouldHideDelete, setShouldHideDelete] = useState(false);

  useEffect(() => {
    setUpdateIntervalForType(SensorTypes.accelerometer, 50);

    let previousMagnitude = 0;
    let previousTime = Date.now();
    const threshold = 1.5; // Adjust based on user testing

    const subscription = accelerometer.subscribe(({x, y, z}) => {
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
  }, []);

  useEffect(() => {
    const intervalId = BackgroundTimer.setInterval(() => {
      checkAlarms();
    }, 1000); // Check every second

    return () => BackgroundTimer.clearInterval(intervalId);
  }, [alarms]);

  useEffect(() => {
    console.log('Alarm Stop by Steps');
    ringAlarm();
  }, [stepCount == 10]);

  const checkAlarms = () => {
    const currentTime = new Date();
    const formattedCurrentTime = formatTime(currentTime);
    alarms.forEach(alarm => {
      if (alarm.enabled && alarm.time === formattedCurrentTime) {
        ringAlarm();
        toggleAlarm(alarm.id); // Disable alarm after it rings
        setShouldHideDelete(true);
      }
    });
  };

  const ringAlarm = (() => {
    let isPlaying = false;
    let alarmSound;

    return () => {
      if (isPlaying) {
        return;
      }

      isPlaying = true;

      alarmSound = new Sound(
        require('./../assets/ringtone/alarm_sound.mp3'),
        error => {
          if (error) {
            console.log('Error loading sound', error);
            return;
          }

          // Play the sound in a loop
          alarmSound.setNumberOfLoops(-1); // Infinite loop
          alarmSound.play();
        },
      );

      // Alert.alert('Alarm', 'Time to wake up!', [
      //   {
      //     text: 'Start Walking',
      //     onPress: () => {
      //       if (stepCount < 10) {
      //         ToastAndroid.show(
      //           `You need ${10 - stepCount} more steps to stop the alarm!`,
      //           ToastAndroid.SHORT,
      //         );
      //         if (!alarmSound.isPlaying()) {
      //           alarmSound.play(); // Restart the alarm if it stopped
      //         }
      //       } else {
      //         setStepCount(0);
      //         alarmSound.stop(() => {
      //           isPlaying = false;
      //         });
      //         ToastAndroid.show(
      //           `Congratulations, you've completed ${stepCount} steps!`,
      //           ToastAndroid.SHORT,
      //         );
      //       }
      //     },
      //   },
      // ]);

      if (stepCount <= 10) {
        Alert.alert('Alarm', 'Time to wake up!', [
          {
            text: 'Start Walking',
            onPress: () => {
              ToastAndroid.show(
                `You need ${10 - stepCount} more steps to stop the alarm!`,
                ToastAndroid.SHORT,
              );
              if (!alarmSound.isPlaying()) {
                alarmSound.play(); // Restart the alarm if it stopped
              }
            },
          },
        ]);
      } else {
        setStepCount(0);
        alarmSound.stop(() => {
          isPlaying = false;
        });
        ToastAndroid.show(
          `Congratulations, you've completed ${stepCount} steps!`,
          ToastAndroid.SHORT,
        );
      }
    };
  })();

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
        // console.log('formattedTimeLog', formattedTime);

        setAlarms(prevAlarms => {
          const isDuplicate = prevAlarms.some(
            alarm => alarm.time === formattedTime,
          );
          if (isDuplicate) {
            ToastAndroid.show(
              'Alarm with this time already exists!',
              ToastAndroid.SHORT,
            );
            // Alert.alert('Alarm with this time already exists!');
            return prevAlarms; // Return the current list without changes
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
    const formattedHours = hours % 12 || 12; // Convert 24-hour time to 12-hour time
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
          {/* Only render the delete button if the delete condition is not met */}
          {!shouldHideDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteAlarm(item.id)}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.steps}>Steps Taken: {stepCount}</Text>
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
});
