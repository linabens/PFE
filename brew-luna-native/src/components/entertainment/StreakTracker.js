import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Polygon, Line } from 'react-native-svg';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { ET } from '../../constants/entertainmentTheme';

const DayNode = ({ index, isPassed, isToday, isFuture }) => {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
    }, index * 100);
  }, []);

  return (
    <View style={styles.nodeContainer}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Polygon
            points="12,2 22,12 12,22 2,12"
            fill={isPassed ? ET.primary : isToday ? ET.accent : 'transparent'}
            stroke={isFuture ? ET.border : isToday ? ET.accent : ET.primary}
            strokeWidth={1.5}
          />
        </Svg>
        <View style={styles.nodeIcon}>
          {isPassed && <Ionicons name="checkmark" size={10} color="#FFFFFF" />}
          {isToday && <MaterialCommunityIcons name="star-four-points" size={10} color={ET.bg} />}
        </View>
      </Animated.View>
    </View>
  );
};

export const StreakTracker = () => {
    // Mocking 4 day streak: 0,1,2,3 are passed. 4 is today. 5,6 are future.
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="fire" size={16} color={ET.accent} />
        <Text style={styles.title}>4 JOURS D'AFFILÉE</Text>
      </View>

      <View style={styles.daysRow}>
        <View style={styles.lineBack} />
        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
          <DayNode 
            key={day} 
            index={day}
            isPassed={day < 4} 
            isToday={day === 4} 
            isFuture={day > 4} 
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: ET.bgCard,
    borderRadius: ET.radiusMd,
    padding: 12,
    borderWidth: 1,
    borderColor: ET.border,
    height: 124,
    justifyContent: 'space-between'
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  title: { fontFamily: ET.fontMono, fontSize: 10, color: ET.textPrimary, letterSpacing: 1 },
  
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', paddingHorizontal: 4 },
  lineBack: { position: 'absolute', top: 12, left: 10, right: 10, height: 1.5, backgroundColor: ET.border, zIndex: 0 },
  
  nodeContainer: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  nodeIcon: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center' }
});
