import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Animated, Easing, Modal, Pressable, StyleSheet} from 'react-native';
import {colors, radii, spacing, shadows} from '../../theme';

// Shared modal shell with animated backdrop + card pop/slide enter and
// smooth exit. Runs enter/exit animations for both user and parent closes.
const AppModal = ({visible, onClose, children, animationType = 'slide'}) => {
  const [internalVisible, setInternalVisible] = useState(false);
  const closingRef = useRef(false);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const cardTranslateX = useRef(new Animated.Value(40)).current;
  const cardTranslateY = useRef(new Animated.Value(56)).current;

  const runEnter = useCallback(() => {
    backdropOpacity.setValue(0);
    cardOpacity.setValue(0);
    cardScale.setValue(0.92);
    cardTranslateX.setValue(40);
    cardTranslateY.setValue(56);

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 8,
        tension: 110,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateX, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, cardOpacity, cardScale, cardTranslateX, cardTranslateY]);

  const runExit = useCallback(
    onDone => {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 0.94,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateX, {
          toValue: 24,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 36,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(onDone);
    },
    [backdropOpacity, cardOpacity, cardScale, cardTranslateX, cardTranslateY],
  );

  useEffect(() => {
    if (visible) {
      closingRef.current = false;
      setInternalVisible(true);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible && internalVisible && !closingRef.current) {
      runExit(() => setInternalVisible(false));
    }
  }, [visible, internalVisible, runExit]);

  const requestClose = useCallback(() => {
    if (closingRef.current) {
      return;
    }
    closingRef.current = true;
    runExit(() => {
      closingRef.current = false;
      setInternalVisible(false);
      if (onClose) {
        onClose();
      }
    });
  }, [runExit, onClose]);

  return (
    <Modal
      transparent
      visible={internalVisible}
      animationType="none"
      onShow={runEnter}
      onRequestClose={requestClose}>
      <Animated.View style={[styles.backdrop, {opacity: backdropOpacity}]}>
        <Pressable style={styles.backdropFill} onPress={requestClose}>
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardOpacity,
                transform: [
                  {translateX: cardTranslateX},
                  {translateY: cardTranslateY},
                  {scale: cardScale},
                ],
              },
            ]}>
            <Pressable onPress={event => event.stopPropagation()}>
              {children}
            </Pressable>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  backdropFill: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    ...shadows.floating,
    maxHeight: '85%',
  },
});

export default AppModal;
