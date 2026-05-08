import React, { useRef } from 'react';
import {
  ScrollView, View, StyleSheet, Text, TouchableOpacity,
  FlatList, Image, ActivityIndicator, Animated, Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Coffee, Gamepad2, Newspaper, ChevronRight,
  Star, Brain, Search, Grid3x3, Shuffle, LayoutGrid, X, BookOpen,
} from 'lucide-react-native';
import { useNews } from '../../src/context/NewsContext';

const { width } = Dimensions.get('window');

// ─── Palette (matches home.js exactly) ──────────────────────────────────────
const C = {
  bg:        '#FAF3EB',
  card:      '#FFFFFF',
  primary:   '#5C3221',
  rosewood:  '#C09891',
  blush:     '#F4D8D8',
  border:    '#EAD9C9',
  imgBg:     '#F0E4D6',
  mainText:  '#3D1C0C',
  secondary: '#7A5C4D',
  muted:     '#BBA898',
  tagline:   '#BEA8A7',
};

const FONT = {
  playfair:   'PlayfairDisplay_700Bold',
  poppins:    'Poppins_400Regular',
  poppinsSemi:'Poppins_600SemiBold',
};

// ─── Game Definitions ────────────────────────────────────────────────────────
const GAMES = [
  {
    id: 'quiz',
    title: 'Quiz Barista',
    subtitle: 'Culture café & monde',
    route: '/quiz',
    icon: Brain,
    color: '#C09891',
    difficulty: 'Moyen',
    points: 100,
    featured: true,
  },
  {
    id: 'wordcache',
    title: 'Mots Cachés',
    subtitle: 'Trouve les mots dans la grille',
    route: '/puzzle',
    icon: Search,
    color: '#8B7355',
    difficulty: 'Moyen',
    points: 120,
  },
  {
    id: 'crossword',
    title: 'Mots Croisés',
    subtitle: 'Culture générale',
    route: '/games/crossword',
    icon: Grid3x3,
    color: '#775144',
    difficulty: 'Difficile',
    points: 150,
  },
  {
    id: 'wordbrew',
    title: 'Word Brew',
    subtitle: 'Réarrange les lettres',
    route: '/games/wordscramble',
    icon: Shuffle,
    color: '#C09891',
    difficulty: 'Facile',
    points: 80,
  },
  {
    id: 'memory',
    title: 'Memory',
    subtitle: 'Trouvez les paires cachées',
    route: '/memory',
    icon: LayoutGrid,
    color: '#A0785A',
    difficulty: 'Facile',
    points: 60,
  },
  {
    id: 'tictactoe',
    title: 'Tic-Tac-Toe',
    subtitle: 'Classique contre l\'IA',
    route: '/games/tictactoe',
    icon: X,
    color: '#775144',
    difficulty: 'Moyen',
    points: 90,
  },
  {
    id: 'coffeequiz',
    title: 'Coffee Quiz',
    subtitle: 'Testez vos connaissances',
    route: '/games/coffee-quiz',
    icon: BookOpen,
    color: '#C09891',
    difficulty: 'Moyen',
    points: 100,
  },
];

const DIFFICULTY_COLOR = {
  'Facile':    { bg: '#D4EDDA', text: '#155724' },
  'Moyen':     { bg: '#FFF3CD', text: '#856404' },
  'Difficile': { bg: '#F8D7DA', text: '#721C24' },
};

const NEWS_CATEGORIES = [
  { id: 'all',    label: 'Tout' },
  { id: 'sports', label: 'Sports' },
  { id: 'world',  label: 'Monde' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 3600)  return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
}

// ─── Featured Game Card (full-width) ─────────────────────────────────────────
function FeaturedGameCard({ game, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const IconComp = game.icon;
  const diff = DIFFICULTY_COLOR[game.difficulty];

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={s.featuredCard}
        onPress={onPress}
        activeOpacity={1}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start()}
      >
        {/* Left accent bar */}
        <View style={[s.featuredBar, { backgroundColor: game.color }]} />

        {/* Icon */}
        <View style={[s.featuredIconBg, { backgroundColor: game.color + '22' }]}>
          <IconComp size={32} color={game.color} strokeWidth={1.8} />
        </View>

        {/* Text */}
        <View style={s.featuredText}>
          <View style={s.featuredTopRow}>
            <View style={[s.diffBadge, { backgroundColor: diff.bg }]}>
              <Text style={[s.diffTxt, { color: diff.text }]}>{game.difficulty}</Text>
            </View>
            <View style={s.ptsBadge}>
              <Star size={10} color={C.rosewood} fill={C.rosewood} />
              <Text style={s.ptsTxt}>{game.points} pts</Text>
            </View>
          </View>
          <Text style={s.featuredTitle}>{game.title}</Text>
          <Text style={s.featuredSub}>{game.subtitle}</Text>
        </View>

        {/* Play button */}
        <View style={s.featuredPlay}>
          <ChevronRight size={20} color={C.card} strokeWidth={2.5} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Regular Game Card (2-column grid) ───────────────────────────────────────
function GameCard({ game, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const IconComp = game.icon;
  const diff = DIFFICULTY_COLOR[game.difficulty];

  return (
    <Animated.View style={[{ transform: [{ scale }] }, s.gameCardWrapper]}>
      <TouchableOpacity
        style={s.gameCard}
        onPress={onPress}
        activeOpacity={1}
        onPressIn={() => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start()}
      >
        {/* Icon zone */}
        <View style={[s.gameIconBg, { backgroundColor: game.color + '20' }]}>
          <IconComp size={26} color={game.color} strokeWidth={1.8} />
        </View>

        {/* Title */}
        <Text style={s.gameTitle} numberOfLines={1}>{game.title}</Text>
        <Text style={s.gameSub} numberOfLines={2}>{game.subtitle}</Text>

        {/* Footer row */}
        <View style={s.gameFooter}>
          <View style={[s.diffBadge, { backgroundColor: diff.bg }]}>
            <Text style={[s.diffTxt, { color: diff.text }]}>{game.difficulty}</Text>
          </View>
          <Text style={s.gamePts}>{game.points} pts</Text>
        </View>

        {/* Play pill */}
        <View style={[s.gamePill, { backgroundColor: game.color }]}>
          <ChevronRight size={11} color={C.card} strokeWidth={3} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── News Card ────────────────────────────────────────────────────────────────
function NewsCard({ article, onPress }) {
  return (
    <TouchableOpacity style={s.newsCard} onPress={onPress} activeOpacity={0.88}>
      {article.image ? (
        <Image source={{ uri: article.image }} style={s.newsImg} resizeMode="cover" />
      ) : (
        <View style={[s.newsImg, s.newsImgEmpty]}>
          <Newspaper size={24} color={C.muted} />
        </View>
      )}
      <View style={s.newsBody}>
        <Text style={s.newsTitle} numberOfLines={3}>{article.title}</Text>
        <View style={s.newsMeta}>
          <View style={s.sourcePill}>
            <Text style={s.sourceTxt}>{article.source}</Text>
          </View>
          <Text style={s.newsTime}>{timeAgo(article.pubDate)}</Text>
        </View>
      </View>
      <ChevronRight size={16} color={C.muted} />
    </TouchableOpacity>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: IconComp, label, color }) {
  return (
    <View style={s.sectionHeader}>
      <View style={[s.sectionIconBg, { backgroundColor: (color || C.primary) + '18' }]}>
        <IconComp size={16} color={color || C.primary} strokeWidth={2} />
      </View>
      <Text style={s.sectionLabel}>{label}</Text>
      <View style={s.sectionLine} />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function FunScreen() {
  const router = useRouter();
  const { news, loading, refreshing, selectedCategory, setSelectedCategory, refreshNews } = useNews();

  const [featured, ...otherGames] = GAMES;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshNews} tintColor={C.rosewood} />
        }
      >

        {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
        <View style={s.pageHeader}>
          <View style={s.pageHeaderLeft}>
            <View style={s.coffeeIconBg}>
              <Coffee size={20} color={C.primary} strokeWidth={2} />
            </View>
            <View>
              <Text style={s.pageTitle}>Play & Lire</Text>
              <Text style={s.pageTagline}>COFFEE TIME</Text>
            </View>
          </View>
          <View style={s.headerBadge}>
            <Gamepad2 size={14} color={C.primary} strokeWidth={2} />
            <Text style={s.headerBadgeTxt}>{GAMES.length} jeux</Text>
          </View>
        </View>

        {/* ── GAMES SECTION ───────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionHeader icon={Gamepad2} label="Jeux" />

          {/* Featured game — full width */}
          <FeaturedGameCard
            game={featured}
            onPress={() => router.push(featured.route)}
          />

          {/* 2-column grid for remaining 6 games */}
          <View style={s.grid}>
            {otherGames.map(game => (
              <GameCard
                key={game.id}
                game={game}
                onPress={() => router.push(game.route)}
              />
            ))}
          </View>
        </View>

        {/* ── NEWS SECTION ────────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionHeader icon={Newspaper} label="Actualités" color={C.rosewood} />

          {/* Category pills */}
          <View style={s.catRow}>
            {NEWS_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[s.catPill, selectedCategory === cat.id && s.catPillActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[s.catTxt, selectedCategory === cat.id && s.catTxtActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* News list */}
          {loading && news.length === 0 ? (
            <View style={s.newsState}>
              <ActivityIndicator size="small" color={C.rosewood} />
              <Text style={s.newsStateTxt}>Chargement des actualités…</Text>
            </View>
          ) : news.length === 0 ? (
            <View style={s.newsState}>
              <Newspaper size={36} color={C.muted} strokeWidth={1.5} />
              <Text style={s.newsStateTxt}>Aucune actualité disponible</Text>
              <TouchableOpacity style={s.retryBtn} onPress={refreshNews}>
                <Text style={s.retryTxt}>Actualiser</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={news.slice(0, 15)}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.newsList}
              renderItem={({ item }) => (
                <NewsCard
                  article={item}
                  onPress={() =>
                    router.push({
                      pathname: '/games/news-detail',
                      params: { article: JSON.stringify(item) },
                    })
                  }
                />
              )}
            />
          )}
        </View>

        {/* ── BOTTOM QUOTE ────────────────────────────────────────────────── */}
        <View style={s.quoteCard}>
          <Coffee size={18} color={C.rosewood} strokeWidth={1.8} style={{ marginBottom: 8 }} />
          <Text style={s.quoteText}>
            "La vie est trop courte pour du mauvais café."
          </Text>
          <Text style={s.quoteAuthor}>— Coffee Time</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CARD_GAP = 10;
const CARD_WIDTH = (width - 32 - CARD_GAP) / 2;

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bg },
  scroll:  { flex: 1 },
  content: { paddingBottom: 100 },

  // ── Page Header
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  pageHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  coffeeIconBg: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.blush,
    alignItems: 'center', justifyContent: 'center',
  },
  pageTitle: {
    fontFamily: FONT.playfair,
    fontSize: 22, color: C.mainText,
  },
  pageTagline: {
    fontFamily: FONT.poppinsSemi,
    fontSize: 9, letterSpacing: 1.5,
    color: C.tagline, marginTop: -2,
  },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.border,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20,
  },
  headerBadgeTxt: {
    fontFamily: FONT.poppinsSemi,
    fontSize: 11, color: C.primary,
  },

  // ── Sections
  section: { paddingHorizontal: 16, marginTop: 12 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 14,
  },
  sectionIconBg: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionLabel: {
    fontFamily: FONT.playfair,
    fontSize: 16, color: C.mainText,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: C.border },

  // ── Featured Card
  featuredCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1, borderColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
    marginBottom: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  featuredBar: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  featuredIconBg: {
    width: 64, height: 64,
    borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  featuredText: { flex: 1, gap: 4 },
  featuredTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featuredTitle: {
    fontFamily: FONT.playfair,
    fontSize: 18, color: C.mainText,
  },
  featuredSub: {
    fontFamily: FONT.poppins,
    fontSize: 12, color: C.secondary,
  },
  featuredPlay: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  // ── Difficulty / Points Badges
  diffBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
  },
  diffTxt: {
    fontFamily: FONT.poppinsSemi,
    fontSize: 9,
  },
  ptsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: C.blush,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 8,
  },
  ptsTxt: {
    fontFamily: FONT.poppinsSemi,
    fontSize: 9, color: C.rosewood,
  },

  // ── Game Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  gameCardWrapper: { width: CARD_WIDTH },
  gameCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1, borderColor: C.border,
    padding: 14,
    gap: 6,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  gameIconBg: {
    width: 48, height: 48,
    borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  gameTitle: {
    fontFamily: FONT.playfair,
    fontSize: 14, color: C.mainText,
  },
  gameSub: {
    fontFamily: FONT.poppins,
    fontSize: 10, color: C.secondary,
    lineHeight: 14,
  },
  gameFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  gamePts: {
    fontFamily: FONT.poppinsSemi,
    fontSize: 10, color: C.rosewood,
  },
  gamePill: {
    position: 'absolute',
    top: 12, right: 12,
    width: 22, height: 22,
    borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── News Section
  catRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  catPill: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.card,
  },
  catPillActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  catTxt: {
    fontFamily: FONT.poppinsSemi,
    fontSize: 12, color: C.secondary,
  },
  catTxtActive: { color: C.card },

  newsList: { paddingBottom: 4, gap: 10 },
  newsCard: {
    width: 280,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  newsImg: {
    width: 68, height: 68,
    borderRadius: 12,
    backgroundColor: C.imgBg,
    flexShrink: 0,
  },
  newsImgEmpty: {
    alignItems: 'center', justifyContent: 'center',
  },
  newsBody: { flex: 1, gap: 6 },
  newsTitle: {
    fontFamily: FONT.poppinsSemi,
    fontSize: 12, color: C.mainText,
    lineHeight: 17,
  },
  newsMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sourcePill: {
    backgroundColor: C.imgBg,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
  },
  sourceTxt: {
    fontFamily: FONT.poppins,
    fontSize: 10, color: C.secondary,
  },
  newsTime: {
    fontFamily: FONT.poppins,
    fontSize: 10, color: C.muted,
  },

  newsState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  newsStateTxt: {
    fontFamily: FONT.poppins,
    fontSize: 13, color: C.secondary,
  },
  retryBtn: {
    backgroundColor: C.rosewood,
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, marginTop: 4,
  },
  retryTxt: {
    fontFamily: FONT.poppinsSemi,
    fontSize: 13, color: C.card,
  },

  // ── Bottom Quote
  quoteCard: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1, borderColor: C.border,
    padding: 24,
    alignItems: 'center',
  },
  quoteText: {
    fontFamily: FONT.playfair,
    fontSize: 15,
    color: C.mainText,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 8,
  },
  quoteAuthor: {
    fontFamily: FONT.poppinsSemi,
    fontSize: 11,
    color: C.rosewood,
    letterSpacing: 1,
  },
});
