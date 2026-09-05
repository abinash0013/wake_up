import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {colors, spacing, typography} from '../../theme';

const EmptyState = ({imageSource, title, subtitle, action}) => (
  <View style={styles.container}>
    {imageSource && <Image source={imageSource} style={styles.image} />}
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    {action}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl * 2,
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: spacing.xl,
    opacity: 0.9,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});

export default EmptyState;
