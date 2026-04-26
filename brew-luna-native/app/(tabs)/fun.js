import React from 'react';
import { ScrollView, View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { HeroSection }          from '../../src/components/entertainment/HeroSection';
import { DailyChallengeCard }   from '../../src/components/entertainment/DailyChallengeCard';
import { StreakTracker }        from '../../src/components/entertainment/StreakTracker';
import { GameCard }             from '../../src/components/entertainment/GameCard';
import { QuoteCarousel }        from '../../src/components/entertainment/QuoteCarousel';
import { HealthTipCard }        from '../../src/components/entertainment/HealthTipCard';
import { ET }                   from '../../src/constants/entertainmentTheme';

// Données des jeux avec icônes réelles conformément au mapping prompt
const GAMES = [
  {
    id: 'wordle',
    title: 'Mot Mystère',
    subtitle: 'Devinez le mot café en 6 essais',
    iconLib: 'MaterialCommunityIcons',
    iconName: 'alphabetical-variant',
    difficulty: 'easy',
    diffIcon: 'speedometer-slow',
    points: 80,
    patternType: 'grid',
    isFeatured: true,
    route: '/games/wordle',
  },
  {
    id: 'quiz',
    title: 'Quiz Barista',
    subtitle: 'Culture café & monde',
    iconLib: 'MaterialCommunityIcons',
    iconName: 'brain',
    difficulty: 'medium',
    diffIcon: 'speedometer-medium',
    points: 100,
    patternType: 'dots',
    route: '/quiz',
  },
  {
    id: 'puzzle',
    title: 'Mots Cachés',
    subtitle: 'Trouve les mots dans la grille',
    iconLib: 'MaterialCommunityIcons',
    iconName: 'text-search',
    difficulty: 'medium',
    diffIcon: 'speedometer-medium',
    points: 120,
    patternType: 'lines',
    route: '/puzzle',
  },
  {
    id: 'memory',
    title: 'Memory Luna',
    subtitle: 'Trouvez les paires',
    iconLib: 'MaterialCommunityIcons',
    iconName: 'cards-outline',
    difficulty: 'easy',
    diffIcon: 'speedometer-slow',
    points: 60,
    patternType: 'arcs',
    route: '/memory',
  },
  {
    id: 'crossword',
    title: 'Mots Croisés',
    subtitle: 'Vocabulaire café & thé',
    iconLib: 'MaterialCommunityIcons',
    iconName: 'grid',
    difficulty: 'hard',
    diffIcon: 'speedometer',
    points: 150,
    patternType: 'lines',
    route: '/games/crossword',
  },
  {
    id: 'wheel',
    title: 'Roue Chanceuse',
    subtitle: '1× par visite',
    iconLib: 'MaterialCommunityIcons',
    iconName: 'circle-slice-8',
    difficulty: 'easy',
    diffIcon: 'speedometer-slow',
    points: 50,
    patternType: 'hex',
    route: '/games/wheel',
  },
  {
    id: 'breathing',
    title: 'Pause Luna',
    subtitle: 'Respirez et détendez-vous',
    iconLib: 'MaterialCommunityIcons',
    iconName: 'meditation',
    difficulty: 'easy',
    diffIcon: 'speedometer-slow',
    points: 20,
    patternType: 'arcs',
    route: '/games/breathing',
  },
  {
    id: 'horoscope',
    title: 'Horoscope Café',
    subtitle: 'Votre café du destin',
    iconLib: 'MaterialCommunityIcons',
    iconName: 'weather-night',
    difficulty: 'easy',
    diffIcon: 'speedometer-slow',
    points: 10,
    patternType: 'dots',
    route: '/games/horoscope',
  },
  {
    id: 'truthfalse',
    title: 'Vrai ou Faux',
    subtitle: 'Swipez vos réponses',
    iconLib: 'MaterialCommunityIcons',
    iconName: 'scale-balance',
    difficulty: 'medium',
    diffIcon: 'speedometer-medium',
    points: 90,
    patternType: 'lines',
    route: '/games/truthfalse',
  },
];

// Section label réutilisable
const SectionLabel = ({ icon, label }) => (
  <View style={styles.sectionRow}>
    <MaterialCommunityIcons name={icon} size={16} color={ET.accent} />
    <Text style={styles.sectionTitle}>{label}</Text>
    <View style={styles.sectionLine} />
  </View>
);

export default function EntertainmentScreen() {
  const router = useRouter();
  const featured = GAMES.find(g => g.isFeatured);
  const others   = GAMES.filter(g => !g.isFeatured);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* HERO */}
        <HeroSection />

        <View style={styles.body}>

          {/* DÉFI + STREAK */}
          <SectionLabel icon="lightning-bolt" label="Défi du soir" />
          <View style={styles.topRow}>
            <View style={{ flex: 1.6 }}>
              <DailyChallengeCard />
            </View>
            <View style={{ flex: 1 }}>
              <StreakTracker />
            </View>
          </View>

          {/* JEU VEDETTE */}
          <SectionLabel icon="star-four-points-outline" label="À la une" />
          <GameCard
            {...featured}
            onPress={() => router.push(featured.route)}
          />

          {/* GRILLE ASYMÉTRIQUE */}
          <SectionLabel icon="gamepad-variant-outline" label="Tous les jeux" />

          {/* Ligne 1 : 1 grande + 1 petite */}
          <View style={styles.row}>
            <View style={{ flex: 1.3 }}>
              {others[0] && <GameCard {...others[0]} onPress={() => router.push(others[0].route)} />}
            </View>
            <View style={{ flex: 1 }}>
              {others[1] && <GameCard {...others[1]} onPress={() => router.push(others[1].route)} />}
            </View>
          </View>

          {/* Ligne 2 : 2 égales */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              {others[2] && <GameCard {...others[2]} onPress={() => router.push(others[2].route)} />}
            </View>
            <View style={{ flex: 1 }}>
              {others[3] && <GameCard {...others[3]} onPress={() => router.push(others[3].route)} />}
            </View>
          </View>

          {/* Ligne 3 : 1 petite + 1 grande */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              {others[4] && <GameCard {...others[4]} onPress={() => router.push(others[4].route)} />}
            </View>
            <View style={{ flex: 1.3 }}>
              {others[5] && <GameCard {...others[5]} onPress={() => router.push(others[5].route)} />}
            </View>
          </View>

          {/* CITATIONS */}
          <SectionLabel icon="message-text-outline" label="Citation du soir" />
          <QuoteCarousel />

          {/* SANTÉ */}
          <SectionLabel icon="leaf" label="Conseils bien-être" />
          <HealthTipCard />

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: ET.bg },
  scroll: { flex: 1 },
  body: { padding: 14, gap: 12 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: ET.fontBody,
    fontSize: 11,
    color: ET.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  sectionLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: ET.border,
  },
  topRow: { flexDirection: 'row', gap: 10 },
  row:    { flexDirection: 'row', gap: 10 },
});
