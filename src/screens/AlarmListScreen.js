import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Platform,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';
import {colors, spacing} from '../theme';
import useAlarms from '../hooks/useAlarms';
import useAlarmEngine from '../hooks/useAlarmEngine';
import {formatTime} from '../utils/time';
import {showToast} from '../utils/toast';
import AlarmCard from '../components/AlarmCard';
import AlarmFormModal from '../components/AlarmFormModal';
import ActiveAlarmOverlay from '../components/ActiveAlarmOverlay';
import ConfirmModal from '../components/ui/ConfirmModal';
import AppHeader from '../components/ui/AppHeader';
import EmptyState from '../components/ui/EmptyState';
import FloatingActionButton from '../components/ui/FloatingActionButton';

const AlarmListScreen = () => {
  const {
    alarms,
    loaded,
    addAlarm,
    updateAlarm,
    deleteAlarm,
    toggleAlarm,
    hasDuplicateTime,
  } = useAlarms();

  const {
    activeAlarm,
    activeAlarmId,
    activeStep,
    activeStepIndex,
    enabledStepsCount,
    stepProgress,
    shouldHideDelete,
    isRinging,
    stopAlarm,
  } = useAlarmEngine({alarms, toggleAlarm});

  const [editingAlarm, setEditingAlarm] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [creatingTime, setCreatingTime] = useState(null);
  const [deletingAlarmId, setDeletingAlarmId] = useState(null);

  const showTimePicker = useCallback(() => {
    if (Platform.OS !== 'android') {
      showToast('Time picking is only supported on Android');
      return;
    }
    DateTimePickerAndroid.open({
      value: new Date(),
      mode: 'time',
      is24Hour: false,
      onChange: (event, selectedTime) => {
        if (event.type === 'dismissed' || !selectedTime) {
          return;
        }
        const updatedTime = new Date();
        updatedTime.setHours(
          selectedTime.getHours(),
          selectedTime.getMinutes(),
          0,
          0,
        );
        const formattedTime = formatTime(updatedTime);

        if (hasDuplicateTime(formattedTime)) {
          showToast('Alarm with this time already exists!');
          return;
        }
        setCreatingTime(formattedTime);
      },
    });
  }, [hasDuplicateTime]);

  const openEditModal = alarm => {
    setEditingAlarm(alarm);
    setShowEditModal(true);
  };

  const handleSaveAlarm = ({time, name, vibrate, sound, steps, repeatDays}) => {
    if (creatingTime !== null) {
      if (hasDuplicateTime(time)) {
        showToast('Alarm with this time already exists!');
        return;
      }
      addAlarm({time, repeatDays, name, vibrate, sound, steps});
      setCreatingTime(null);
      showToast(`Alarm set for ${time}`);
      return;
    }
    if (hasDuplicateTime(time, editingAlarm?.id)) {
      showToast('Alarm with this time already exists!');
      return;
    }
    updateAlarm(editingAlarm.id, {
      time,
      steps,
      repeatDays,
      name,
      vibrate,
      sound,
    });
    setShowEditModal(false);
    showToast('Alarm updated');
  };

  const renderCard = ({item}) => (
    <AlarmCard
      alarm={item}
      isActive={activeAlarmId === item.id}
      activeStep={activeStep}
      activeStepIndex={activeStepIndex}
      enabledStepsCount={enabledStepsCount}
      stepProgress={stepProgress}
      actionsDisabled={shouldHideDelete}
      onToggle={() => toggleAlarm(item.id)}
      onEdit={() => openEditModal(item)}
      onDelete={() => setDeletingAlarmId(item.id)}
    />
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Alarm" subtitle={`${alarms.length} configured`} />

      <View style={styles.content}>
        {!loaded ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={alarms}
            keyExtractor={item => item.id}
            renderItem={renderCard}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                imageSource={require('../assets/icons/no_data_found.png')}
                title="No alarms yet"
                subtitle="Tap the + button to set your first alarm and start waking up the smart way."
              />
            }
          />
        )}
      </View>

      <FloatingActionButton onPress={showTimePicker} />

      <AlarmFormModal
        visible={creatingTime !== null}
        mode="create"
        initialTime={creatingTime}
        onSave={handleSaveAlarm}
        onClose={() => setCreatingTime(null)}
      />

      <AlarmFormModal
        visible={showEditModal}
        mode="edit"
        alarm={editingAlarm}
        onSave={handleSaveAlarm}
        onClose={() => setShowEditModal(false)}
      />

      <ConfirmModal
        visible={!!deletingAlarmId}
        title="Delete Alarm?"
        message="This alarm and its steps will be removed permanently."
        confirmLabel="Delete"
        onConfirm={() => {
          deleteAlarm(deletingAlarmId);
          setDeletingAlarmId(null);
        }}
        onCancel={() => setDeletingAlarmId(null)}
      />

      {isRinging && (
        <ActiveAlarmOverlay
          activeAlarm={activeAlarm}
          activeStep={activeStep}
          activeStepIndex={activeStepIndex}
          enabledStepsCount={enabledStepsCount}
          stepProgress={stepProgress}
          onStop={stopAlarm}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xxl * 2,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AlarmListScreen;
