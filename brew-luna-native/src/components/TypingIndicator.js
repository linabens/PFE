import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, Radius } from '../styles/theme';

/**
 * Indicateur de saisie animé pour Luna
 */
const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (val, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = animate(dot1, 0);
    const anim2 = animate(dot2, 150);
    const anim3 = animate(dot3, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.avatarSmall}>
        <Text style={styles.avatarEmoji}>☽</Text>
      </View>
      
      <View style={styles.bubble}>
        <View style={styles.dotRow}>
          <Animated.View style={[styles.dot, { opacity: dot1 }]} />
          <Animated.View style={[styles.dot, { opacity: dot2 }]} />
          <Animated.View style={[styles.dot, { opacity: dot3 }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    alignItems: 'flex-end',
  },
  avatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.espresso,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  avatarEmoji: {
    fontSize: 12,
    color: Colors.cream,
  },
  bubble: {
    backgroundColor: Colors.bgCard,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderBottomLeftRadius: Radius.xs,
    borderBottomRightRadius: Radius.lg,
    shadowColor: Colors.espresso,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textMuted,
  },
});

export default TypingIndicator;
