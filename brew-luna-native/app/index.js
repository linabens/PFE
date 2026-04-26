import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, G, Rect, Ellipse } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// --- ASSETS & COLORS ---
const SPLASH_BG = require('../assets/images/screenpage.jpg');
const AMBIENT_SOUND_URL = 'https://assets.mixkit.co/sfx/preview/mixkit-coffee-shop-ambience-with-people-talking-and-cups-clinking-2895.mp3';

const COLORS = {
  espresso: '#2A0800',
  mocha: '#775144',
  rosewood: '#C09891',
  blush: '#BEA8A7',
  cream: '#F4D8D8',
};

// --- COMPONENT: CUSTOM HEART-CUP LOGO SVG ---
const HeartCupLogoSVG = ({ size, color }) => (
  <View style={{ width: size, height: size }}>
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Path 
        d="M50,45 L40,35 C30,25 45,10 50,25 C55,10 70,25 60,35 L50,45 Z" 
        fill="none" stroke={color} strokeWidth="6" strokeLinejoin="round"
        transform="translate(0, -15)"
      />
      <Path d="M15,50 L85,50 L75,95 L25,95 Z" fill="none" stroke={color} strokeWidth="6" strokeLinejoin="round" />
      <Path d="M85,60 C95,60 95,85 85,85" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" />
    </Svg>
  </View>
);

// --- COMPONENT: ANIMATED STEAM WISP ---
const SteamWisp = ({ delay }) => {
  const liftAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleX = 0.8 + Math.random() * 0.4;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(liftAnim, { toValue: -60, duration: 3000, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacityAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0, duration: 2000, useNativeDriver: true })
          ])
        ]),
        Animated.timing(liftAnim, { toValue: 0, duration: 0, useNativeDriver: true })
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[
      styles.steamContainer,
      { opacity: opacityAnim, transform: [{ translateY: liftAnim }, { scaleX }] }
    ]}>
      <Svg width="20" height="40" viewBox="0 0 20 40">
        <Path d="M10,40 C15,30 5,20 10,10 C15,0 10,-5 10,-10" stroke={COLORS.cream} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
      </Svg>
    </Animated.View>
  );
};

// --- COMPONENT 1: REALISTIC TWIN-BEAN SVG ---
const BeanClusterSVG = ({ size }) => (
  <View style={{ width: size, height: size * 1.1 }}>
    <Svg viewBox="0 0 100 110" width="100%" height="100%">
      <G transform="translate(-5, 0) rotate(-10, 50, 55)">
        <Ellipse cx="50" cy="55" rx="35" ry="45" fill="#6F4E37" />
        <Path d="M45,20 C35,45 65,65 55,90" stroke="#3D2B1F" strokeWidth="6" strokeLinecap="round" fill="none" />
      </G>
      <G transform="translate(15, 10) rotate(15, 50, 55)">
        <Ellipse cx="50" cy="55" rx="35" ry="45" fill="#8B5E3C" stroke="#5D3A1A" strokeWidth="1" />
        <Path d="M45,20 C35,45 65,65 55,90" stroke="#4E2C1E" strokeWidth="8" strokeLinecap="round" fill="none" />
        <Path d="M25,40 C20,50 25,70 30,80" stroke="#A98467" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
      </G>
    </Svg>
  </View>
);

// --- ANIMATED RAINING PARTICLE ---
const RainingParticle = ({ delay, startX, duration }) => {
  const fallAnim = useRef(new Animated.Value(-150)).current; 
  const driftAnim = useRef(new Animated.Value(startX)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  const size = 35 + Math.random() * 25;
  const targetX = width / 2 - size / 2;
  const targetY = height / 2 - 30;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(fallAnim, { toValue: targetY, duration, easing: Easing.bezier(0.4, 0, 1, 1), useNativeDriver: true }),
          Animated.timing(driftAnim, { toValue: targetX, duration, easing: Easing.bezier(0.4, 0, 1, 1), useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.4, duration, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacityAnim, { toValue: 0.6, duration: duration * 0.1, useNativeDriver: true }),
            Animated.delay(duration * 0.85),
            Animated.timing(opacityAnim, { toValue: 0, duration: duration * 0.05, useNativeDriver: true })
          ])
        ]),
        Animated.parallel([
          Animated.timing(fallAnim, { toValue: -150, duration: 0, useNativeDriver: true }),
          Animated.timing(driftAnim, { toValue: startX, duration: 0, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 0, useNativeDriver: true })
        ])
      ])
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={[
      styles.particleContainer,
      { opacity: opacityAnim, transform: [{ translateY: fallAnim }, { translateX: driftAnim }, { scale: scaleAnim }, { rotate }] }
    ]}>
      <BeanClusterSVG size={size} />
    </Animated.View>
  );
};

export default function SplashScreen() {
  const router = useRouter();
  const soundRef = useRef(null);

  // Layout Animations
  const bgScale = useRef(new Animated.Value(1)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const containerScale = useRef(new Animated.Value(1)).current;

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const nameScale = useRef(new Animated.Value(0.75)).current;
  const nameTranslateY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(30)).current;

  const particles = useRef(
    Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      startX: Math.random() * width,
      delay: Math.random() * 12000,
      duration: 7000 + Math.random() * 5000
    }))
  ).current;

  useEffect(() => {
    async function init() {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: AMBIENT_SOUND_URL },
          { shouldPlay: true, isLooping: true, volume: 0.3 }
        );
        soundRef.current = sound;
      } catch (e) { console.log('Audio error', e); }

      Animated.timing(bgScale, {
        toValue: 1.1,
        duration: 8500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      }).start();

      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true })
      ]).start();

      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(nameOpacity, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.spring(nameScale, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
          Animated.timing(nameTranslateY, { toValue: 0, duration: 2000, useNativeDriver: true })
        ])
      ]).start();

      Animated.sequence([
        Animated.delay(600),
        Animated.parallel([
          Animated.timing(taglineOpacity, { toValue: 1, duration: 2500, useNativeDriver: true }),
          Animated.timing(taglineTranslateY, { toValue: 0, duration: 2500, useNativeDriver: true })
        ])
      ]).start();
    }

    init();

    // CINEMATIC EXIT TIMER
    const timer = setTimeout(() => {
      // 1. Audio Fade Out
      if (soundRef.current) {
        let currentVol = 0.3;
        const fadeInterval = setInterval(() => {
          currentVol -= 0.05;
          if (currentVol <= 0) {
            clearInterval(fadeInterval);
          } else {
            soundRef.current.setVolumeAsync(currentVol).catch(() => {});
          }
        }, 150);
      }

      // 2. Premium Zoom-Fade Out
      Animated.parallel([
        Animated.timing(containerOpacity, { toValue: 0, duration: 1400, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
        Animated.timing(containerScale, { toValue: 1.15, duration: 1400, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true })
      ]).start(() => {
        router.replace('/scan');
      });
    }, 7000);

    return () => {
      clearTimeout(timer);
      if (soundRef.current) soundRef.current.unloadAsync();
    };
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity, transform: [{ scale: containerScale }] }]}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.Image source={SPLASH_BG} style={[styles.bgImage, { transform: [{ scale: bgScale }] }]} blurRadius={1.5} />
        <LinearGradient colors={['rgba(42, 8, 0, 0.4)', 'rgba(119, 81, 68, 0.3)']} style={StyleSheet.absoluteFill} />
      </View>

      <View style={styles.beansOverlay}>
        {particles.map(p => (
          <RainingParticle key={p.id} startX={p.startX} delay={p.delay} duration={p.duration} />
        ))}
      </View>

      <View style={styles.centerContent}>
        <View style={styles.logoStack}>
          <View style={styles.steamWrapper}>
            <SteamWisp delay={2000} />
            <SteamWisp delay={3500} />
            <SteamWisp delay={5000} />
          </View>
          
          <Animated.View style={[styles.logoImgContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
            <HeartCupLogoSVG size={100} color={COLORS.cream} />
          </Animated.View>
        </View>

        <Animated.View style={[styles.nameWrapper, { opacity: nameOpacity, transform: [{ scale: nameScale }, { translateY: nameTranslateY }] }]}>
          <Text style={styles.logoText}>Coffee Time</Text>
        </Animated.View>

        <Animated.View style={[{ opacity: taglineOpacity, transform: [{ translateY: taglineTranslateY }] }]}>
          <Text style={styles.tagline}>Your perfect coffee moment</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.espresso },
  bgImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  beansOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 5 },
  logoStack: { position: 'relative', alignItems: 'center' },
  steamWrapper: { position: 'absolute', top: -30, height: 60, width: 40, alignItems: 'center' },
  steamContainer: { position: 'absolute', bottom: 0 },
  logoImgContainer: { marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10 },
  nameWrapper: { marginBottom: 15 },
  logoText: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 56, fontWeight: '700', color: COLORS.cream, textAlign: 'center', letterSpacing: 4, textShadowColor: 'rgba(0, 0, 0, 0.9)', textShadowOffset: { width: 4, height: 4 }, textShadowRadius: 20 },
  tagline: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 16, fontWeight: '300', color: COLORS.blush, fontStyle: 'italic', letterSpacing: 3, marginTop: 15 },
  particleContainer: { position: 'absolute' },
});
