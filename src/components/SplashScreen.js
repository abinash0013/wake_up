import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, Text, View} from 'react-native';
import {colors, spacing, typography} from '../theme';

const AlarmBell = () => (
  <View style={bellStyles.wrap}>
    <View style={bellStyles.bellLeft} />
    <View style={bellStyles.bellRight} />
    <View style={bellStyles.domeClip}>
      <View style={bellStyles.dome} />
    </View>
    <View style={bellStyles.body} />
    <View style={bellStyles.base} />
    <View style={bellStyles.clapper} />
  </View>
);

const SPLASH_DURATION = 2400;
const FADE_OUT_DURATION = 450;

const SplashScreen = ({onFinish}) => {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.7)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  const glowDriftA = useRef(new Animated.Value(0)).current;
  const glowScaleA = useRef(new Animated.Value(1)).current;
  const glowOpacityA = useRef(new Animated.Value(0.35)).current;
  const glowDriftB = useRef(new Animated.Value(0)).current;
  const glowScaleB = useRef(new Animated.Value(1)).current;
  const glowOpacityB = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    const ring = Animated.loop(
      Animated.parallel([
        Animated.timing(ringScale, {
          toValue: 1.9,
          duration: 1800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 1800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );
    ring.start();

    const glowEase = Easing.inOut(Easing.ease);
    const bobbing = value =>
      Animated.sequence([
        Animated.timing(value, {
          toValue: -24,
          duration: 2600,
          easing: glowEase,
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 24,
          duration: 2600,
          easing: glowEase,
          useNativeDriver: true,
        }),
      ]);

    const glowA = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(glowDriftA, {
            toValue: -22,
            duration: 2800,
            easing: glowEase,
            useNativeDriver: true,
          }),
          Animated.timing(glowDriftA, {
            toValue: 0,
            duration: 2800,
            easing: glowEase,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(glowScaleA, {
            toValue: 1.18,
            duration: 2800,
            easing: glowEase,
            useNativeDriver: true,
          }),
          Animated.timing(glowScaleA, {
            toValue: 1,
            duration: 2800,
            easing: glowEase,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(glowOpacityA, {
            toValue: 0.5,
            duration: 2800,
            easing: glowEase,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacityA, {
            toValue: 0.3,
            duration: 2800,
            easing: glowEase,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    glowA.start();

    const driftBFirst = bobbing(glowDriftB);
    const scaleBFirst = Animated.sequence([
      Animated.timing(glowScaleB, {
        toValue: 1.18,
        duration: 2800,
        easing: glowEase,
        useNativeDriver: true,
      }),
      Animated.timing(glowScaleB, {
        toValue: 1,
        duration: 2800,
        easing: glowEase,
        useNativeDriver: true,
      }),
    ]);
    const opacityBFirst = Animated.sequence([
      Animated.timing(glowOpacityB, {
        toValue: 0.28,
        duration: 2800,
        easing: glowEase,
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacityB, {
        toValue: 0.5,
        duration: 2800,
        easing: glowEase,
        useNativeDriver: true,
      }),
    ]);
    const glowB = Animated.loop(Animated.parallel([driftBFirst, scaleBFirst, opacityBFirst]));
    glowB.start();

    Animated.timing(progress, {
      toValue: 1,
      duration: SPLASH_DURATION - 400,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      ring.stop();
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: FADE_OUT_DURATION,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({finished}) => {
        if (finished && onFinish) {
          onFinish();
        }
      });
    }, SPLASH_DURATION);

    return () => {
      clearTimeout(timer);
      ring.stop();
      glowA.stop();
      glowB.stop();
    };
  }, [
    fadeIn,
    scale,
    ringScale,
    ringOpacity,
    progress,
    fadeOut,
    glowDriftA,
    glowScaleA,
    glowOpacityA,
    glowDriftB,
    glowScaleB,
    glowOpacityB,
    onFinish,
  ]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, {opacity: fadeOut}]}>
      <Animated.View
        style={[
          styles.glow,
          styles.glowTop,
          {
            opacity: glowOpacityA,
            transform: [{translateY: glowDriftA}, {scale: glowScaleA}],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glow,
          styles.glowBottom,
          {
            opacity: glowOpacityB,
            transform: [{translateY: glowDriftB}, {scale: glowScaleB}],
          },
        ]}
      />

      <View style={styles.content}>
        <View style={styles.logoArea}>
          <Animated.View
            style={[
              styles.ring,
              styles.ringOuter,
              {transform: [{scale: ringScale}], opacity: ringOpacity},
            ]}
          />
          <Animated.View
            style={[styles.logoWrap, {opacity: fadeIn, transform: [{scale}]}]}>
            <AlarmBell />
          </Animated.View>
        </View>

        <Animated.View style={[styles.textArea, {opacity: fadeIn}]}>
          <Text style={styles.title}>No Snooze</Text>
          <Text style={styles.tagline}>Rise on time. Every time.</Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, {width: progressWidth}]}
          />
        </View>
        <Text style={styles.footerText}>Waking your alarms…</Text>
      </View>
    </Animated.View>
  );
};

const glowSize = 260;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: glowSize,
    height: glowSize,
    borderRadius: glowSize / 2,
    opacity: 0.35,
  },
  glowTop: {
    top: -90,
    right: -70,
    backgroundColor: 'rgba(124, 108, 255, 0.5)',
  },
  glowBottom: {
    bottom: -110,
    left: -80,
    backgroundColor: 'rgba(46, 204, 143, 0.35)',
  },
  content: {
    alignItems: 'center',
  },
  logoArea: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  logoWrap: {
    width: 104,
    height: 104,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 18,
  },
  ring: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  ringOuter: {
    borderColor: 'rgba(124, 108, 255, 0.55)',
  },
  textArea: {
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    // letterSpacing: 5,
    color: colors.text,
  },
  titleAccent: {
    color: colors.primary,
  },
  tagline: {
    ...typography.bodySmall,
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
  footer: {
    position: 'absolute',
    bottom: 56,
    left: spacing.xl,
    right: spacing.xl,
    alignItems: 'center',
  },
  progressTrack: {
    width: 160,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceLight,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  footerText: {
    marginTop: spacing.md,
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 1,
  },
});

const bellStyles = StyleSheet.create({
  wrap: {
    width: 56,
    height: 58,
    alignItems: 'center',
  },
  domeClip: {
    width: 40,
    height: 22,
    overflow: 'hidden',
    marginTop: 3,
  },
  dome: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  bellLeft: {
    position: 'absolute',
    top: 14,
    left: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  bellRight: {
    position: 'absolute',
    top: 14,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  body: {
    width: 30,
    height: 34,
    marginTop: -6,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    backgroundColor: colors.primary,
  },
  base: {
    width: 38,
    height: 8,
    borderRadius: 4,
    marginTop: 1,
    backgroundColor: colors.primary,
  },
  clapper: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 2,
    backgroundColor: colors.text,
  },
});

export default SplashScreen;
