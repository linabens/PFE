import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, Animated } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { ET } from '../../constants/entertainmentTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_WIDTH = SCREEN_WIDTH - 40;

const QUOTES = [
  { text: "Le café est une façon de voler du temps qui devrait appartenir de droit à soi-même.", source: "TERRY PRATCHETT" },
  { text: "On ne peut pas acheter le bonheur, mais on peut acheter du café, et c'est presque la même chose.", source: "ANONYME" },
  { text: "Noir comme le diable, chaud comme l'enfer, pur comme un ange, doux comme l'amour.", source: "TALLEYRAND" },
];

export const QuoteCarousel = () => {
  const [index, setIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (index < QUOTES.length - 1) {
      Animated.timing(translateX, {
        toValue: -(index + 1) * CAROUSEL_WIDTH,
        duration: 400,
        useNativeDriver: true,
      }).start();
      setIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (index > 0) {
      Animated.timing(translateX, {
        toValue: -(index - 1) * CAROUSEL_WIDTH,
        duration: 400,
        useNativeDriver: true,
      }).start();
      setIndex(prev => prev - 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Art Deco Background SVG */}
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 320 120">
        <Rect x="2" y="2" width="316" height="116" rx="16" stroke={ET.border} strokeWidth="1" fill="none" />
        {/* Decorative corner lines */}
        <Path d="M 10 20 L 30 20 M 20 10 L 20 30" stroke={ET.primary} strokeWidth="0.5" />
        <Path d="M 290 20 L 310 20 M 300 10 L 300 30" stroke={ET.primary} strokeWidth="0.5" />
        <Path d="M 10 90 L 30 90 M 20 100 L 20 80" stroke={ET.primary} strokeWidth="0.5" />
        <Path d="M 290 90 L 310 90 M 300 100 L 300 80" stroke={ET.primary} strokeWidth="0.5" />
      </Svg>

      <View style={styles.header}>
        <Ionicons name="chatbubble-ellipses" size={16} color={ET.primary} />
        <View style={styles.dotsRow}>
          {QUOTES.map((_, i) => (
            <View key={i} style={[styles.dot, index === i ? styles.dotActive : styles.dotInactive]} />
          ))}
        </View>
      </View>

      <View style={styles.carouselFrame}>
        <Animated.View style={[styles.carouselInner, { transform: [{ translateX }] }]}>
          {QUOTES.map((q, i) => (
            <View key={i} style={styles.quoteSlide}>
              <Text style={styles.quoteText}>"{q.text}"</Text>
              <Text style={styles.quoteSource}>{q.source}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      <View style={styles.navRow}>
        <Pressable onPress={handlePrev} disabled={index === 0}>
          <Ionicons name="chevron-back" size={18} color={index === 0 ? ET.textMuted : ET.accent} />
        </Pressable>
        <Pressable onPress={handleNext} disabled={index === QUOTES.length - 1}>
          <Ionicons name="chevron-forward" size={18} color={index === QUOTES.length - 1 ? ET.textMuted : ET.accent} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { height: 140, backgroundColor: ET.bgCard, borderRadius: ET.radiusMd, padding: 18, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dotsRow: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, transform: [{ rotate: '45deg' }] }, // Diamond dots
  dotActive: { backgroundColor: ET.accent },
  dotInactive: { borderSize: 1, borderColor: ET.border, backgroundColor: ET.bgAccent },
  
  carouselFrame: { flex: 1, overflow: 'hidden' },
  carouselInner: { flexDirection: 'row', width: CAROUSEL_WIDTH * QUOTES.length },
  quoteSlide: { width: CAROUSEL_WIDTH - 36, paddingRight: 20, justifyContent: 'center' },
  quoteText: { fontFamily: ET.fontDisplay, fontSize: 13, fontStyle: 'italic', color: ET.textPrimary, lineHeight: 20 },
  quoteSource: { fontFamily: ET.fontMono, fontSize: 9, color: ET.textMuted, letterSpacing: 2, marginTop: 8 },
  
  navRow: { flexDirection: 'row', alignSelf: 'flex-end', gap: 12 }
});
