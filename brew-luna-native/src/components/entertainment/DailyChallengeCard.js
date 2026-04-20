import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { ET } from '../../constants/entertainmentTheme';

export const DailyChallengeCard = ({ navigation }) => {
  const shimmerPos = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerPos, {
        toValue: 400,
        duration: 2500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <Pressable activeOpacity={0.9} style={styles.container}>
      <View style={styles.card}>
        {/* Shimmering Border Effect */}
        <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerPos }] }]} />

        <View style={styles.topRow}>
          <View style={styles.badge}>
            <MaterialCommunityIcons name="lightning-bolt" size={12} color={ET.bg} />
            <Text style={styles.badgeText}>DÉFI DU JOUR</Text>
          </View>
          <View style={styles.timer}>
            <Feather name="clock" size={12} color={ET.primary} />
            <Text style={styles.timerText}>03:45</Text>
          </View>
        </View>

        <Text style={styles.title}>Le Mystère du Moka</Text>
        <Text style={styles.category}>MOT MYSTÈRE — DIFFICULTÉ MOYENNE</Text>

        <View style={styles.footer}>
          <View style={styles.ptsRow}>
            <MaterialCommunityIcons name="star-four-points-outline" size={14} color={ET.accent} />
            <Text style={styles.ptsText}>+50 pts</Text>
          </View>
          
          <TouchableOpacity style={styles.playBtn}>
             <Ionicons name="play-circle-outline" size={18} color={ET.textPrimary} />
             <Text style={styles.playTxt}>Jouer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    backgroundColor: ET.bgCard,
    borderRadius: ET.radiusMd,
    padding: 16,
    borderWidth: 1.5,
    borderColor: ET.borderAccent,
    overflow: 'hidden',
    position: 'relative',
    height: 124
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    width: 60,
    height: '100%',
    backgroundColor: 'rgba(192, 152, 145, 0.1)',
    transform: [{ skewX: '-20deg' }],
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: ET.accent, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontFamily: ET.fontMono, fontSize: 8, color: ET.bg, fontWeight: 'bold' },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timerText: { fontFamily: ET.fontMono, fontSize: 10, color: ET.primary },
  
  title: { fontFamily: ET.fontDisplay, fontSize: 18, color: ET.textPrimary, marginBottom: 2 },
  category: { fontFamily: ET.fontMono, fontSize: 8, color: ET.textMuted, letterSpacing: 1 },
  
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' },
  ptsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ptsText: { fontFamily: ET.fontMono, fontSize: 12, color: ET.accent, fontWeight: 'bold' },
  
  playBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: ET.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: ET.radiusPill },
  playTxt: { fontFamily: ET.fontBody, fontSize: 11, color: '#FFFFFF', fontWeight: 'bold' }
});
