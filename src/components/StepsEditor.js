import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, spacing, typography} from '../theme';
import {showToast} from '../utils/toast';
import StepCard from './StepCard';
import StepConfigModal from './StepConfigModal';
import ConfirmModal from './ui/ConfirmModal';
import AppButton from './ui/AppButton';
import Icon from './ui/Icon';

const StepsEditor = ({steps, onChange}) => {
  const [editingStep, setEditingStep] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [deletingStepId, setDeletingStepId] = useState(null);

  const persist = updated => {
    const ordered = updated
      .map((step, order) => ({...step, order}))
      .sort((a, b) => a.order - b.order);
    onChange(ordered);
  };

  const handleAdd = () => {
    setEditingStep(null);
    setShowEditor(true);
  };

  const handleEdit = step => {
    setEditingStep(step);
    setShowEditor(true);
  };

  const handleSave = savedStep => {
    setShowEditor(false);
    if (editingStep) {
      persist(steps.map(step => (step.id === savedStep.id ? savedStep : step)));
    } else {
      persist([...steps, savedStep]);
    }
  };

  const handleDelete = () => {
    if (!deletingStepId) {
      return;
    }
    setDeletingStepId(null);
    const remaining = steps.filter(step => step.id !== deletingStepId);
    if (remaining.length === 0) {
      showToast('An alarm needs at least one step');
      return;
    }
    persist(remaining);
  };

  const handleToggle = stepId => {
    persist(
      steps.map(step =>
        step.id === stepId ? {...step, enabled: !step.enabled} : step,
      ),
    );
  };

  const handleMove = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= steps.length) {
      return;
    }
    const reordered = [...steps];
    [reordered[index], reordered[target]] = [
      reordered[target],
      reordered[index],
    ];
    persist(reordered);
  };

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Steps</Text>
        <AppButton
          title="Add Step"
          variant="outline"
          size="sm"
          icon={<Icon name="+" size={14} color={colors.primary} />}
          onPress={handleAdd}
        />
      </View>
      <Text style={styles.subtitle}>
        Steps run in order; the alarm stops when all enabled steps are done.
      </Text>

      {steps.map((step, index) => (
        <StepCard
          key={step.id}
          step={step}
          index={index}
          total={steps.length}
          onToggle={() => handleToggle(step.id)}
          onEdit={() => handleEdit(step)}
          onDelete={() => setDeletingStepId(step.id)}
          onMoveUp={() => handleMove(index, -1)}
          onMoveDown={() => handleMove(index, 1)}
        />
      ))}

      <StepConfigModal
        visible={showEditor}
        initialStep={editingStep}
        onSave={handleSave}
        onClose={() => setShowEditor(false)}
      />

      <ConfirmModal
        visible={!!deletingStepId}
        title="Delete Step?"
        message="This step will be removed from the alarm."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeletingStepId(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
});

export default StepsEditor;
