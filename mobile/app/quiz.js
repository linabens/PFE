import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Dimensions, ScrollView, StatusBar, Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Trophy, Star, Target, Flame } from 'lucide-react-native';
import quizData from '../src/data/games/quizzes.json';
import { useLoyalty } from '../src/context/LoyaltyContext';
import { POINTS_RULES } from '../src/constants/loyalty';
import PointsToast from '../src/components/PointsToast';

const { width } = Dimensions.get('window');
const TIMER_SECONDS = 20;

const C = {
  bg:      '#FAF3EB',   // Home Match
  card:    '#FFFFFF',
  primary: '#5C3221',   // espresso
  accent:  '#C09891',   // rosewood
  muted:   '#B89A87',
  mocha:   '#7A5C4D',
  border:  '#EAD9C9',
  cream:   '#F5E6D3',
  success: '#166534',
  danger:  '#C0392B',
};

// ── Data ──────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    key: 'monde',
    label: 'Géographie',
    sublabel: 'Capitales, pays, continents',
    color: '#166534',
    bgGlow: '#E8F5E9',
    iconLib: 'MaterialCommunityIcons',
    iconName: 'earth',
  },
  {
    key: 'sport',
    label: 'Sport & Olympisme',
    sublabel: 'Records, compétitions, athlètes',
    color: '#C2410C',
    bgGlow: '#FFF7ED',
    iconLib: 'MaterialCommunityIcons',
    iconName: 'trophy-variant',
  },
  {
    key: 'culture',
    label: 'Culture & Histoire',
    sublabel: 'Art, littérature, civilisations',
    color: '#1D4ED8',
    bgGlow: '#EFF6FF',
    iconLib: 'Ionicons',
    iconName: 'book-outline',
  },
];

const LEVELS = [
  {
    key: 'facile',
    label: 'Facile',
    desc: 'Parfait pour débuter',
    color: '#059669',
    iconLib: 'MaterialCommunityIcons',
    iconName: 'shield-check-outline',
    pts: 10,
    timer: 20,
  },
  {
    key: 'moyen',
    label: 'Moyen',
    desc: 'Un challenge équilibré',
    color: '#D97706',
    iconLib: 'MaterialCommunityIcons',
    iconName: 'shield-half-full',
    pts: 20,
    timer: 15,
  },
  {
    key: 'difficile',
    label: 'Difficile',
    desc: 'Pour les experts confirmés',
    color: '#DC2626',
    iconLib: 'MaterialCommunityIcons',
    iconName: 'shield-star-outline',
    pts: 30,
    timer: 12,
  },
];

const IconComponent = ({ lib, name, size, color }) => {
  if (lib === 'Ionicons') return <Ionicons name={name} size={size} color={color} />;
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
};

// ─────────────────────────────────────────────────────────────────────────────
export default function QuizGameScreen() {
  const router = useRouter();

  // ── Navigation state ──────────────────────────────────────────────────────
  const [screen, setScreen] = useState('categories'); // categories | levels | game | result
  const [category, setCategory] = useState(null);
  const [level, setLevel] = useState(null);

  // ── Game state ────────────────────────────────────────────────────────────
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // ── Loyalty state ─────────────────────────────────────────────────────────
  const { isLoggedIn, earnPoints } = useLoyalty();
  const [showToast, setShowToast] = useState(false);
  const [toastPts, setToastPts] = useState(0);

  // ── Animations ────────────────────────────────────────────────────────────
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const scoreAnim = useRef(new Animated.Value(1)).current;
  const timerRef  = useRef(null);

  const questions = category && level ? quizData[category.key][level.key] : [];
  const timerDuration = level?.timer ?? TIMER_SECONDS;

  // ── Screen fade-in ────────────────────────────────────────────────────────
  useEffect(() => {
    fadeAnim.setValue(0); scaleAnim.setValue(0.95);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  }, [screen, currentQ]);

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'game' || isAnswered) return;
    setTimeLeft(timerDuration);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); handleTimeOut(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [currentQ, screen]);

  const handleTimeOut = () => {
    if (!isAnswered) {
      setIsAnswered(true);
      setSelectedAnswer(-1);
      setStreak(0);
      setWrongCount(p => p + 1);
    }
  };

  // ── Score bounce ──────────────────────────────────────────────────────────
  const bounceScore = () => {
    Animated.sequence([
      Animated.timing(scoreAnim, { toValue: 1.35, duration: 120, useNativeDriver: true }),
      Animated.spring(scoreAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  // ── Game logic ────────────────────────────────────────────────────────────
  const startGame = (cat, lev) => {
    setCategory(cat); setLevel(lev);
    setCurrentQ(0); setScore(0);
    setCorrectCount(0); setWrongCount(0);
    setStreak(0); setBestStreak(0);
    setSelectedAnswer(null); setIsAnswered(false);
    setScreen('game');
  };

  const handleAnswer = (idx) => {
    if (isAnswered) return;
    clearInterval(timerRef.current);
    const isCorrect = idx === questions[currentQ].answer;
    setSelectedAnswer(idx);
    setIsAnswered(true);
    if (isCorrect) {
      const pts = questions[currentQ].points + Math.max(0, timeLeft * 2);
      setScore(p => p + pts);
      setCorrectCount(p => p + 1);
      const ns = streak + 1;
      setStreak(ns);
      if (ns > bestStreak) setBestStreak(ns);
      bounceScore();
    } else {
      setStreak(0);
      setWrongCount(p => p + 1);
    }
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(p => p + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setScreen('result');
      
      // Attribution des points si connecté
      if (isLoggedIn) {
        const difficultyMap = { facile: 'easy', moyen: 'medium', difficile: 'hard' };
        const key = difficultyMap[level?.key] || 'easy';
        const pts = POINTS_RULES.GAME[key];
        
        earnPoints(pts, 'game', `Quiz: ${category?.label} (${level?.label})`);
        setToastPts(pts);
        setShowToast(true);
      }
    }
  };

  const timerColor = timeLeft > (timerDuration * 0.6) ? C.success
                   : timeLeft > (timerDuration * 0.3) ? '#f59e0b'
                   : C.danger;
  const progress = (currentQ / (questions.length || 1)) * 100;

  // ════════════════════════════════════════════════════════════════════════════
  // SCREEN: CATEGORIES
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'categories') return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={C.primary} />
            <Text style={s.backTxt}>Retour</Text>
          </TouchableOpacity>

          <Text style={s.eyebrow}>DIVERTISSEMENT</Text>
          <Text style={s.bigTitle}>Quiz Culture</Text>
          <Text style={s.subtitle}>Testez vos connaissances et gagnez des points</Text>

          <Text style={s.sectionLbl}>CHOISIR UNE THÉMATIQUE</Text>

          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={[s.catCard, { borderColor: C.border, backgroundColor: C.card }]}
              activeOpacity={0.8}
              onPress={() => { setCategory(cat); setScreen('levels'); }}
            >
              <View style={[s.catIconWrap, { backgroundColor: cat.bgGlow, borderColor: C.border }]}>
                <IconComponent lib={cat.iconLib} name={cat.iconName} size={28} color={cat.color} />
              </View>

              <View style={s.catBody}>
                <Text style={s.catLabel}>{cat.label}</Text>
                <Text style={s.catSub}>{cat.sublabel}</Text>
                <View style={s.catMeta}>
                  <View style={[s.catDot, { backgroundColor: cat.color }]} />
                  <Text style={s.catMetaTxt}>
                    {Object.values(quizData[cat.key]).flat().length} questions · 3 niveaux
                  </Text>
                </View>
              </View>

              <View style={s.catArrow}>
                <Ionicons name="chevron-forward" size={20} color={C.muted} />
              </View>
            </TouchableOpacity>
          ))}

          {/* Rules card */}
          <View style={s.rulesCard}>
            <View style={s.rulesTitleRow}>
              <Ionicons name="information-circle-outline" size={20} color={C.primary} />
              <Text style={s.rulesTitle}>Règles du jeu</Text>
            </View>
            {[
              { icon: 'time-outline',       lib: 'Ionicons',                 txt: 'Timer serré (12 à 20s selon niveau)' },
              { icon: 'flash-outline',      lib: 'Ionicons',                 txt: 'Bonus de rapidité : +2 pts / seconde' },
              { icon: 'flame-outline',      lib: 'Ionicons',                 txt: 'Séries de bonnes réponses récompensées' },
              { icon: 'star-outline',       lib: 'Ionicons',                 txt: 'Gagnez des points fidélité à la fin' },
            ].map((r, i) => (
              <View key={i} style={s.ruleRow}>
                <View style={s.ruleIconWrap}>
                  <IconComponent lib={r.lib} name={r.icon} size={14} color={C.primary} />
                </View>
                <Text style={s.ruleItem}>{r.txt}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // SCREEN: LEVELS
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'levels') return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity style={s.backBtn} onPress={() => setScreen('categories')}>
            <Ionicons name="arrow-back" size={24} color={C.primary} />
            <Text style={s.backTxt}>{category?.label}</Text>
          </TouchableOpacity>

          <Text style={s.eyebrow}>DIFFICULTÉ</Text>
          <Text style={s.bigTitle}>Quel défi aujourd'hui ?</Text>
          <Text style={s.subtitle}>Le niveau influence vos gains potentiels</Text>

          {LEVELS.map(lev => {
            const qs = quizData[category?.key]?.[lev.key] || [];
            return (
              <TouchableOpacity
                key={lev.key}
                style={[s.levCard, { borderColor: C.border }]}
                activeOpacity={0.8}
                onPress={() => startGame(category, lev)}
              >
                <View style={[s.levIconWrap, { backgroundColor: C.bg, borderColor: C.border }]}>
                  <MaterialCommunityIcons name={lev.iconName} size={28} color={lev.color} />
                </View>

                <View style={s.levBody}>
                  <Text style={[s.levLabel, { color: lev.color }]}>{lev.label}</Text>
                  <Text style={s.levDesc}>{lev.desc}</Text>
                  <View style={s.levMeta}>
                    <View style={s.chip}>
                      <Ionicons name="time-outline" size={12} color={C.muted} />
                      <Text style={s.chipTxt}>{lev.timer}s</Text>
                    </View>
                    <View style={s.chip}>
                      <Ionicons name="star-outline" size={12} color={C.muted} />
                      <Text style={s.chipTxt}>{lev.pts} pts</Text>
                    </View>
                  </View>
                </View>

                <View style={[s.playBtn, { backgroundColor: C.primary }]}>
                  <Ionicons name="play" size={18} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // SCREEN: RESULT
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'result') {
    const maxScore = questions.reduce((acc, q) => acc + q.points + timerDuration * 2, 0);
    const pct = Math.round((score / maxScore) * 100);
    const medal = pct >= 80
      ? { Icon: Trophy, label: 'Légendaire !', color: C.primary }
      : pct >= 50
        ? { Icon: Star, label: 'Bien joué !', color: C.accent }
        : { Icon: Target, label: 'Bel effort !', color: C.muted };
    const MedalIcon = medal.Icon;
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <ScrollView contentContainerStyle={[s.scroll, { alignItems: 'center' }]} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', width: '100%' }}>
            <View style={s.medalWrap}>
              <MedalIcon
                size={72}
                color={medal.color}
                strokeWidth={1.6}
                {...(MedalIcon === Star ? { fill: medal.color } : {})}
              />
            </View>
            <Text style={[s.medalLabel, { color: medal.color }]}>{medal.label}</Text>

            <View style={s.scoreBig}>
              <Animated.Text style={[s.scoreBigNum, { transform: [{ scale: scoreAnim }] }]}>{score}</Animated.Text>
              <Text style={s.scoreBigSub}>POINTS SCORE</Text>
            </View>

            <View style={s.statsGrid}>
              {[
                { v: correctCount,         l: 'Correctes' },
                { v: wrongCount,           l: 'Fausses' },
                { v: String(bestStreak),   l: 'Série max' },
                { v: `${pct}%`,            l: 'Réussite' },
              ].map((st, i) => (
                <View key={i} style={s.statCell}>
                  <Text style={s.statVal}>{st.v}</Text>
                  <Text style={s.statLbl}>{st.l}</Text>
                </View>
              ))}
            </View>

            <View style={s.resultActions}>
              <TouchableOpacity style={s.btnPrimary} onPress={() => startGame(category, level)}>
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                <Text style={s.btnPrimaryTxt}>Rejouer</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={s.btnSecondary} onPress={() => setScreen('categories')}>
                <Ionicons name="apps-outline" size={20} color={C.primary} />
                <Text style={s.btnSecondaryTxt}>Autre catégorie</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.btnGhost} onPress={() => router.back()}>
                <Text style={s.btnGhostTxt}>← Retour aux jeux</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>

        <PointsToast
          points={toastPts}
          reason="Quiz terminé"
          icon="school-outline"
          visible={showToast}
          onHide={() => setShowToast(false)}
        />
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SCREEN: GAME
  // ════════════════════════════════════════════════════════════════════════════
  const question = questions[currentQ];
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => setScreen('levels')} style={s.closeBtnGame}>
          <Ionicons name="close" size={24} color={C.primary} />
        </TouchableOpacity>
        <Animated.Text style={[s.liveScore, { transform: [{ scale: scoreAnim }] }]}>{score} pts</Animated.Text>
        <View style={s.streakBadge}>
          {streak > 0 ? (
            <View style={s.streakInner}>
              <Flame size={16} color={C.primary} strokeWidth={2} />
              <Text style={s.streakTxt}>×{streak}</Text>
            </View>
          ) : (
            <IconComponent lib={level?.iconLib} name={level?.iconName} size={16} color={C.primary} />
          )}
        </View>
      </View>

      {/* Progress bar */}
      <View style={s.progressBg}>
        <View style={[s.progressFill, { width: `${progress}%`, backgroundColor: C.primary }]} />
      </View>

      <ScrollView contentContainerStyle={s.gameScroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View style={[s.qHeader, { opacity: fadeAnim }]}>
          <View style={s.catBadgeInline}>
            <IconComponent lib={category?.iconLib} name={category?.iconName} size={14} color={C.primary} />
            <Text style={s.catBadgeInlineTxt}>
              {category?.label.toUpperCase()} · {level?.label}
            </Text>
          </View>
          <Text style={s.qCounter}>{currentQ + 1} / {questions.length}</Text>
        </Animated.View>

        {/* Timer */}
        <View style={s.timerRow}>
          <View style={[s.timerCircle, { borderColor: timerColor }]}>
            <Text style={[s.timerNum, { color: timerColor }]}>{timeLeft}</Text>
            <Text style={s.timerLbl}>sec</Text>
          </View>
        </View>

        {/* Question */}
        <Animated.View style={[s.questionCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <Text style={s.questionTxt}>{question?.question}</Text>
        </Animated.View>

        {/* Options */}
        <View style={s.optionsContainer}>
          {question?.options.map((opt, idx) => {
            const isCorrectAns  = isAnswered && idx === question.answer;
            const isWrong       = isAnswered && selectedAnswer === idx && idx !== question.answer;
            const isTimeout     = isAnswered && selectedAnswer === -1 && idx === question.answer;
            const isDimmed      = isAnswered && !isCorrectAns && !isWrong && !isTimeout;

            let bg = C.card;
            let border = C.border;
            let color = C.primary;

            if (isCorrectAns || isTimeout) { bg = '#E8F5E9'; border = C.success; color = C.success; }
            else if (isWrong) { bg = '#FDEDEC'; border = C.danger; color = C.danger; }
            else if (isDimmed) { bg = '#F9FAFB'; border = '#F3F4F6'; color = C.muted; }

            return (
              <TouchableOpacity
                key={idx}
                style={[s.optionCard, { backgroundColor: bg, borderColor: border }]}
                onPress={() => handleAnswer(idx)}
                activeOpacity={isAnswered ? 1 : 0.8}
              >
                <View style={[s.optLetter, { backgroundColor: isDimmed ? '#F3F4F6' : C.bg }]}>
                  <Text style={[s.optLetterTxt, { color: isDimmed ? C.muted : C.primary }]}>
                    {['A', 'B', 'C', 'D'][idx]}
                  </Text>
                </View>
                <Text style={[s.optTxt, { color }]}>{opt}</Text>
                {(isCorrectAns || isTimeout) && <Ionicons name="checkmark-circle" size={20} color={C.success} />}
                {isWrong && <Ionicons name="close-circle" size={20} color={C.danger} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Next button */}
        {isAnswered && (
          <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
            {currentQ < questions.length - 1 ? (
              <Text style={s.nextBtnTxt}>Question suivante →</Text>
            ) : (
              <View style={s.nextBtnRow}>
                <Trophy size={20} color="#FFFFFF" strokeWidth={2} style={{ marginRight: 8 }} />
                <Text style={s.nextBtnTxt}>Voir les résultats</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

      </ScrollView>

      <PointsToast
        points={toastPts}
        reason="Quiz terminé"
        icon="school-outline"
        visible={showToast}
        onHide={() => setShowToast(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20, paddingBottom: 48 },

  // Shared
  backBtn:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  backTxt:   { color: C.primary, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  eyebrow:   { fontSize: 10, letterSpacing: 2, color: C.muted, marginBottom: 4, fontFamily: 'Poppins_600SemiBold' },
  bigTitle:  { fontSize: 32, fontFamily: 'PlayfairDisplay_700Bold', color: C.primary, marginBottom: 6 },
  subtitle:  { fontSize: 14, color: C.mocha, marginBottom: 32, fontFamily: 'Poppins_400Regular' },
  sectionLbl:{ fontSize: 11, letterSpacing: 1.5, color: C.muted, marginBottom: 16, fontFamily: 'Poppins_600SemiBold' },

  // Categories
  catCard:     { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 24, borderWidth: 1, padding: 16, marginBottom: 14, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  catIconWrap: { width: 62, height: 62, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  catBody:     { flex: 1 },
  catLabel:    { fontSize: 17, fontFamily: 'Poppins_600SemiBold', color: C.primary, marginBottom: 2 },
  catSub:      { fontSize: 12, color: C.muted, marginBottom: 6, fontFamily: 'Poppins_400Regular' },
  catMeta:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catDot:      { width: 8, height: 8, borderRadius: 4 },
  catMetaTxt:  { fontSize: 11, color: C.mocha, fontFamily: 'Poppins_400Regular' },
  catArrow:    { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  rulesCard:     { backgroundColor: C.card, borderRadius: 24, padding: 20, marginTop: 12, borderWidth: 1, borderColor: C.border },
  rulesTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  rulesTitle:    { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: C.primary },
  ruleRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  ruleIconWrap:  { width: 32, height: 32, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  ruleItem:      { fontSize: 13, color: C.mocha, flex: 1, fontFamily: 'Poppins_400Regular', lineHeight: 18 },

  // Levels
  levCard:    { backgroundColor: C.card, borderRadius: 24, padding: 20, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1 },
  levIconWrap:{ width: 60, height: 60, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  levBody:    { flex: 1 },
  levLabel:   { fontSize: 20, fontFamily: 'Poppins_600SemiBold', marginBottom: 2 },
  levDesc:    { fontSize: 13, color: C.muted, marginBottom: 10, fontFamily: 'Poppins_400Regular' },
  levMeta:    { flexDirection: 'row', gap: 8 },
  chip:       { backgroundColor: C.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.border },
  chipTxt:    { fontSize: 12, color: C.primary, fontFamily: 'Poppins_600SemiBold' },
  playBtn:    { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },

  // Result
  medalWrap:   { marginTop: 40, marginBottom: 10, alignItems: 'center', justifyContent: 'center' },
  medalLabel:  { fontSize: 28, fontFamily: 'PlayfairDisplay_700Bold', marginBottom: 24 },
  scoreBig:    { backgroundColor: C.card, borderRadius: 24, paddingVertical: 24, paddingHorizontal: 40, alignItems: 'center', marginBottom: 32, borderWidth: 1, borderColor: C.border },
  scoreBigNum: { fontSize: 64, fontFamily: 'PlayfairDisplay_700Bold', color: C.primary },
  scoreBigSub: { fontSize: 12, letterSpacing: 2, color: C.muted, marginTop: 4, fontFamily: 'Poppins_600SemiBold' },
  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 32 },
  statCell:    { backgroundColor: C.card, borderRadius: 20, padding: 20, alignItems: 'center', minWidth: (width - 64) / 2, borderWidth: 1, borderColor: C.border },
  statVal:     { fontSize: 24, fontFamily: 'Poppins_600SemiBold', color: C.primary },
  statLbl:     { fontSize: 12, color: C.muted, marginTop: 4, fontFamily: 'Poppins_400Regular' },
  resultActions: { width: '100%', gap: 14 },
  btnPrimary:    { backgroundColor: C.primary, borderRadius: 16, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6 },
  btnPrimaryTxt: { color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
  btnSecondary:  { backgroundColor: '#FFFFFF', borderRadius: 16, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 2, borderColor: C.primary },
  btnSecondaryTxt:{ color: C.primary, fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
  btnGhost:    { alignItems: 'center', padding: 12, marginTop: 8 },
  btnGhostTxt: { color: C.muted, fontSize: 14, fontFamily: 'Poppins_400Regular' },

  // Game
  topBar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  liveScore:  { fontSize: 20, fontFamily: 'Poppins_600SemiBold', color: C.primary },
  streakBadge:{ backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: C.border, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  streakInner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakTxt:  { fontSize: 14, color: C.primary, fontFamily: 'Poppins_600SemiBold' },
  progressBg: { height: 6, backgroundColor: C.border, marginHorizontal: 20, borderRadius: 3, overflow: 'hidden' },
  progressFill:{ height:'100%', borderRadius: 3 },
  gameScroll:  { padding: 20, paddingBottom: 40 },
  qHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  catBadgeInline:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: C.border },
  catBadgeInlineTxt:{ fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: C.primary, letterSpacing: 0.5 },
  qCounter:   { fontSize: 14, color: C.muted, fontFamily: 'Poppins_600SemiBold' },
  timerRow:   { alignItems: 'center', marginBottom: 24 },
  timerCircle:{ width: 72, height: 72, borderRadius: 36, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  timerNum:   { fontSize: 28, fontFamily: 'Poppins_700Bold' },
  timerLbl:   { fontSize: 10, color: C.muted, fontFamily: 'Poppins_600SemiBold' },
  questionCard:{ backgroundColor: C.card, borderRadius: 28, padding: 28, marginBottom: 24, borderWidth: 1, borderColor: C.border, shadowColor: C.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 4 },
  questionTxt: { fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', color: C.primary, lineHeight: 30, textAlign: 'center' },
  optionsContainer:{ gap: 12, marginBottom: 24 },
  optionCard:  { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, borderWidth: 2, padding: 16 },
  optLetter:   { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  optLetterTxt:{ fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  optTxt:      { flex: 1, fontSize: 16, fontFamily: 'Poppins_600SemiBold', lineHeight: 22 },
  nextBtn:     { backgroundColor: C.primary, borderRadius: 18, height: 60, alignItems: 'center', justifyContent: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 },
  nextBtnRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  nextBtnTxt:  { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  closeBtnGame: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
});
