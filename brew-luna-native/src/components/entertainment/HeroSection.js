import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Line, Path, G } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ET } from '../../constants/entertainmentTheme';
import { usePoints } from '../../hooks/useEntertainment';

export const HeroSection = () => {
  const { totalPoints, sessionPoints } = usePoints();

  const pulse = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade-in au mount
    Animated.timing(opacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Pulse infini sur l'arc décoratif
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.04,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1.0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.hero}>
      {/* Arc décoratif SVG en arrière-plan */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity, transform: [{ scale: pulse }] }]}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 320 140"
          preserveAspectRatio="xMidYMid slice"
        >
          <G>
            {/* Cercles concentriques — Art Déco */}
            <Circle cx="280" cy="20" r="80" stroke={ET.primary} strokeWidth="1" fill="none" opacity={0.15} />
            <Circle cx="280" cy="20" r="60" stroke={ET.primary} strokeWidth="0.5" fill="none" opacity={0.1} />
            <Circle cx="280" cy="20" r="40" stroke={ET.primary} strokeWidth="0.5" fill="none" opacity={0.05} />
          </G>
          {/* Lignes géométriques */}
          <Line x1="0" y1="130" x2="320" y2="130" stroke={ET.border} strokeWidth="0.5" />
          <Line x1="0" y1="135" x2="160" y2="135" stroke={ET.border} strokeWidth="0.3" />
          {/* Arc accent */}
          <Path
            d="M 40 140 Q 160 60 280 140"
            stroke={ET.accent}
            strokeWidth="0.5"
            fill="none"
            opacity={0.3}
          />
        </Svg>
      </Animated.View>

      {/* Contenu */}
      <View style={styles.heroContent}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroEyebrow}>ESPACE DÉTENTE</Text>
            <Text style={styles.heroTitle}>Divertissement</Text>
          </View>
          {/* Points en typographie mono */}
          <View style={styles.heroPoints}>
            <MaterialCommunityIcons
              name="star-four-points-outline"
              size={14}
              color={ET.accent}
            />
            <Text style={styles.heroPointsVal}>{totalPoints}</Text>
            <Text style={styles.heroPointsLabel}>pts</Text>
          </View>
        </View>

        <Text style={styles.heroSub}>
          Profitez de votre attente avec style
        </Text>

        {/* Ligne décorative */}
        <View style={styles.heroDivider}>
          <View style={styles.heroDividerLine} />
          <MaterialCommunityIcons
            name="star-four-points-outline"
            size={10}
            color={ET.accent}
          />
          <View style={styles.heroDividerLine} />
        </View>

        {/* Session stats */}
        <View style={styles.sessionRow}>
          <View style={styles.sessionStat}>
            <MaterialCommunityIcons name="fire" size={14} color={ET.accent} />
            <Text style={styles.sessionVal}>4</Text>
            <Text style={styles.sessionLabel}>jours</Text>
          </View>
          <View style={styles.sessionDot} />
          <View style={styles.sessionStat}>
            <MaterialCommunityIcons name="lightning-bolt" size={14} color={ET.accent} />
            <Text style={styles.sessionVal}>{sessionPoints}</Text>
            <Text style={styles.sessionLabel}>ce soir</Text>
          </View>
          <View style={styles.sessionDot} />
          <View style={styles.sessionStat}>
            <MaterialCommunityIcons name="trophy-outline" size={14} color={ET.accent} />
            <Text style={styles.sessionVal}>12</Text>
            <Text style={styles.sessionLabel}>parties</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hero: {
    backgroundColor: ET.bg,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: ET.border,
    overflow: 'hidden',
    position: 'relative'
  },
  heroContent: { position: 'relative', zIndex: 1 },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  heroEyebrow: {
    fontFamily: ET.fontMono,
    fontSize: 9,
    color: ET.textMuted,
    letterSpacing: 3,
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: ET.fontDisplay,
    fontSize: 28,
    color: ET.textPrimary,
    fontWeight: '600',
  },
  heroPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ET.bgAccent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: ET.radiusSm,
    borderWidth: 1,
    borderColor: ET.border,
  },
  heroPointsVal: {
    fontFamily: ET.fontMono,
    fontSize: 16,
    color: ET.accent,
  },
  heroPointsLabel: {
    fontFamily: ET.fontMono,
    fontSize: 10,
    color: ET.textMuted,
  },
  heroSub: {
    fontFamily: ET.fontBody,
    fontSize: 12,
    color: ET.textSecond,
    marginBottom: 12,
  },
  heroDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  heroDividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: ET.border,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sessionVal: {
    fontFamily: ET.fontMono,
    fontSize: 13,
    color: ET.textPrimary,
  },
  sessionLabel: {
    fontFamily: ET.fontBody,
    fontSize: 10,
    color: ET.textMuted,
  },
  sessionDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: ET.border,
  },
});
