import React from 'react';
import {Modal, View, Text, Button} from 'react-native';

const AlarmModal = ({stepsTaken, isWalking, startsStepCounter, stopAlarm}) => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={isWalking}
    onRequestClost={stopAlarm}>
    <View style={styles.modalContainer}>
      <View style={styles.modalInnerContainer}>
        <Text style={styles.modalText}>Steps Taken </Text>
        {/* <Text style={styles.modalText}>{stepsTaken > 0 ? stepsTaken : 0}</Text> */}
        {/* <Button title="Start Walking" onPress={startsStepCounter} />
      <Button title="Stop Alarm" onPress={stopAlarm} /> */}
      </View>
    </View>
  </Modal>
);

const styles = {
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalText: {
    fontSize: 18,
    color: '#fff',
  },
  modalInnerContainer: {
    backgroundColor: '#000',
    margin: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
    padding: 20,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
};

export default AlarmModal;
