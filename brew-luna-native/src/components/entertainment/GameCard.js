import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { ET } from '../../constants/entertainmentTheme';

// Pattern SVG unique par type de jeu
const CardPattern = ({ type }) => {
  switch (type) {
    case 'dots':
      return (
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 120 80">
          {Array.from({ length: 6 }, (_, r) =>
            Array.from({ length: 8 }, (_, c) => (
              <Circle
                key={`${r}-${c}`}
                cx={c * 18 + 6}
                cy={r * 14 + 7}
                r="1.2"
                fill={ET.textMuted}
                opacity="0.3"
              />
            ))
          )}
        </Svg>
      );
    case 'lines':
      return (
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 120 80">
          {Array.from({ length: 8 }, (_, i) => (
            <Line
              key={i}
              x1={i * 18}  y1="0"
              x2={i * 18}  y2="80"
              stroke={ET.border} strokeWidth="0.5"
            />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <Line
              key={i}
              x1="0"   y1={i * 20}
              x2="120" y2={i * 20}
              stroke={ET.border} strokeWidth="0.5"
            />
          ))}
        </Svg>
      );
    case 'arcs':
      return (
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 120 80">
          <Circle cx="120" cy="0"  r="50" stroke={ET.border} strokeWidth="0.6" fill="none" opacity={0.4} />
          <Circle cx="120" cy="0"  r="35" stroke={ET.border} strokeWidth="0.4" fill="none" opacity={0.3} />
          <Circle cx="120" cy="0"  r="20" stroke={ET.border} strokeWidth="0.4" fill="none" opacity={0.2} />
        </Svg>
      );
    case 'hex':
      return (
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 120 80">
          {[
            [30, 20], [70, 20], [110, 20],
            [50, 50], [90, 50],
          ].map(([x, y], i) => (
            <Polygon
              key={i}
              points={`${x},${y-12} ${x+10},${y-6} ${x+10},${y+6} ${x},${y+12} ${x-10},${y+6} ${x-10},${y-6}`}
              stroke={ET.border}
              strokeWidth="0.6"
              fill="none"
              opacity={0.5}
            />
          ))}
        </Svg>
      );
    case 'grid':
        return (
          <Svg style={StyleSheet.absoluteFill} viewBox="0 0 120 80">
            {Array.from({ length: 12 }, (_, i) => (
              <Line key={i} x1="0" y1={i*10} x2="120" y2={i*10} stroke={ET.border} strokeWidth="0.4" />
            ))}
            {Array.from({ length: 12 }, (_, i) => (
                <Line key={i} x1={i*10} y1="0" x2={i*10} y2="80" stroke={ET.border} strokeWidth="0.4" />
              ))}
          </Svg>
        );
    default:
      return null;
  }
};

const DIFF_COLORS = {
  easy:   { bg: '#E8F5E9', text: '#166534' },
  medium: { bg: '#FFF7ED', text: '#C2410C' },
  hard:   { bg: '#FDEDEC', text: '#C0392B' },
};
const DIFF_LABELS = { easy: 'Facile', medium: 'Moyen', hard: 'Ambitieux' };

export const GameCard = ({
  title, subtitle, iconLib, iconName,
  difficulty, diffIcon, points,
  isLocked, isFeatured, patternType, onPress
}) => {

  const scale = useRef(new Animated.Value(1)).current;

  // Résoudre dynamiquement la bibliothèque d'icônes
  const IconComponent =
    iconLib === 'MaterialCommunityIcons' ? MaterialCommunityIcons :
    iconLib === 'Feather' ? Feather : Ionicons;

  const diff = DIFF_COLORS[difficulty];

  return (
    <View style={{ flex: 1 }}>
    <Pressable
      onPressIn={() => {
        Animated.timing(scale, { toValue: 0.97, duration: 100, useNativeDriver: true }).start();
      }}
      onPressOut={() => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
      }}
      onPress={isLocked ? undefined : onPress}
      style={{ flex: 1 }}
    >
      <Animated.View style={[
        styles.card,
        isFeatured && styles.cardFeatured,
        { transform: [{ scale }] }
      ]}>
        {/* Pattern SVG en fond */}
        <CardPattern type={patternType} />

        {/* Badge icône géométrique */}
        <View style={[styles.iconBadge, isFeatured && styles.iconBadgeLarge]}>
          <Svg width={isFeatured ? 60 : 48} height={isFeatured ? 60 : 48}
               style={StyleSheet.absoluteFill}>
            <Polygon
              points={
                isFeatured
                  ? "30,4 52,17 52,43 30,56 8,43 8,17"
                  : "24,3 41,13 41,35 24,45 7,35 7,13"
              }
              stroke={ET.accent}
              strokeWidth="1"
              fill={ET.bgAccent}
            />
          </Svg>
          <IconComponent
            name={iconName}
            size={isFeatured ? 26 : 20}
            color={ET.accent}
          />
        </View>

        {/* Contenu texte */}
        <View style={styles.content}>
          <Text style={[styles.title, isFeatured && styles.titleLarge]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={[styles.diffBadge, { backgroundColor: diff.bg }]}>
              <MaterialCommunityIcons
                name={diffIcon}
                size={11}
                color={diff.text}
              />
              <Text style={[styles.diffText, { color: diff.text }]}>
                {DIFF_LABELS[difficulty]}
              </Text>
            </View>

            <View style={styles.ptsRow}>
              <MaterialCommunityIcons
                name="star-four-points-outline"
                size={11}
                color={ET.accent}
              />
              <Text style={styles.ptsText}>+{points}</Text>
            </View>
          </View>
        </View>

        {/* Verrou si locked */}
        {isLocked && (
          <View style={styles.lockOverlay}>
            <Feather name="lock" size={22} color={ET.textMuted} />
          </View>
        )}

        {/* Flèche play */}
        {!isLocked && (
          <View style={styles.playBtn}>
            <Ionicons name="play-circle-outline" size={20} color={ET.accent} />
          </View>
        )}
      </Animated.View>
    </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: ET.bgCard,
    borderRadius: ET.radiusMd,
    borderWidth: 1,
    borderColor: ET.border,
    padding: 14,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 130,
    flex: 1
  },
  cardFeatured: {
    minHeight: 180,
    padding: 18,
  },
  iconBadge: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  iconBadgeLarge: { width: 60, height: 60 },
  content: { flex: 1 },
  title: {
    fontFamily: ET.fontDisplay,
    fontSize: 14,
    color: ET.textPrimary,
    marginBottom: 3,
  },
  titleLarge: { fontSize: 18, marginBottom: 6 },
  subtitle: {
    fontFamily: ET.fontBody,
    fontSize: 10,
    color: ET.textSecond,
    lineHeight: 14,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto'
  },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  diffText: {
    fontFamily: ET.fontBody,
    fontSize: 9,
    fontWeight: '600',
  },
  ptsRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ptsText: {
    fontFamily: ET.fontMono,
    fontSize: 11,
    color: ET.accent,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(250,243,235,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ET.radiusMd,
    zIndex: 10
  },
  playBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
});
