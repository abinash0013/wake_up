import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import React, {useEffect, useState} from 'react';
import {Button, StyleSheet, Text, View} from 'react-native';

const AlarmScreen = () => {
  // const [time, setTime] = useState('');
  const [time, setTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(new Date());

  useEffect(() => {
    console.log('called');
    scheduleAlarm();
  }, [time]);

  const handleTimeChange = (event, selectedTime) => {
    setShowPicker(false);
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  const scheduleAlarm = () => {
    // Alert.alert('Alarm set successfully!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set an Alarm</Text>
      <Button title="Select Time" onPress={() => setShowPicker(true)} />
      {showPicker && (
        <DateTimePicker
          value={time}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}
      <Text style={styles.timeText}>
        Selected Time: {time.toLocaleTimeString()}
      </Text>
      <Button title="Set Alarm" onPress={scheduleAlarm} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  timeText: {
    fontSize: 18,
    marginVertical: 16,
  },
});

export default AlarmScreen;
