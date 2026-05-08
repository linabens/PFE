import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  StatusBar, Animated, ScrollView, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useGame } from '../../src/context/GameContext';
import { useLoyalty } from '../../src/context/LoyaltyContext';
import PointsToast from '../../src/components/PointsToast';

const { width } = Dimensions.get('window');

const C = {
  bg: '#FAF3EB', card: '#FFFFFF', primary: '#5C3221', accent: '#C09891',
  muted: '#B89A87', mocha: '#7A5C4D', border: '#EAD9C9', cream: '#F5E6D3',
  success: '#166534', successBg: '#DCFCE7', error: '#9B1C1C', errorBg: '#FEE2E2',
};

const ALL_QUESTIONS = [
  { q: 'Which country produces the most coffee in the world?', options: ['Brazil', 'Colombia', 'Vietnam', 'Ethiopia'], answer: 0 },
  { q: 'What is a macchiato?', options: ['Espresso with a dollop of foam', 'Coffee with chocolate', 'Iced coffee with milk', 'Turkish coffee'], answer: 0 },
  { q: 'What does "espresso" mean in Italian?', options: ['Strong coffee', 'Pressed out', 'Fast coffee', 'Dark roast'], answer: 1 },
  { q: 'Which drink has the most milk?', options: ['Cappuccino', 'Latte', 'Macchiato', 'Flat white'], answer: 1 },
  { q: 'Ideal water temperature for brewing coffee?', options: ['70–80°C', '85–95°C', '95–100°C', '100°C+'], answer: 1 },
  { q: 'What are coffee cherries?', options: ['Dried coffee beans', 'The fruit containing coffee beans', 'Ground coffee', 'Coffee flowers'], answer: 1 },
  { q: 'What is a cortado?', options: ['Equal espresso and steamed milk', 'Espresso with whipped cream', 'Cold brew coffee', 'Turkish coffee'], answer: 0 },
  { q: 'Where did coffee originate?', options: ['Colombia', 'Brazil', 'Ethiopia', 'Yemen'], answer: 2 },
  { q: 'What is crema?', options: ['Golden foam on espresso', 'Coffee with cream', 'Milk foam', 'Coffee sediment'], answer: 0 },
  { q: 'What is the difference between Arabica and Robusta?', options: ['Arabica is smoother, Robusta is stronger', 'No difference', 'Arabica has more caffeine', 'Robusta is more expensive'], answer: 0 },
  { q: 'What is a flat white?', options: ['Espresso with microfoam milk', 'White chocolate mocha', 'Iced latte', 'Cappuccino without foam'], answer: 0 },
  { q: 'What is cold brew coffee?', options: ['Coffee brewed with cold water over 12–24 hours', 'Iced regular coffee', 'Frozen coffee', 'Coffee with ice cream'], answer: 0 },
  { q: 'What is latte art?', options: ['Patterns created in milk foam', 'Coffee paintings', 'Cup decorations', 'Coffee bean arrangements'], answer: 0 },
  { q: 'What does "single origin" mean?', options: ['Coffee from one region', 'One type of bean', 'One brewing method', 'One roast level'], answer: 0 },
  { q: 'How much caffeine is in a typical espresso shot?', options: ['40–50mg', '63–75mg', '95–100mg', '120mg+'], answer: 1 },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickTen() {
  return shuffle(ALL_QUESTIONS).slice(0, 10);
}

const TIMER_MAX = 30;

export default function CoffeeQuizScreen() {
  const router = useRouter();
  const { updateQuizScore } = useGame();
  const { isLoggedIn, earnPoints } = useLoyalty();

  const [phase, setPhase] = useState('intro'); // intro | playing | result
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_MAX);
  const [showToast, setShowToast] = useState(false);

  const timerRef = useRef(null);
  const timerAnim = useRef(new Animated.Value(1)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const btnAnims = useRef(ALL_QUESTIONS.slice(0, 4).map(() => new Animated.Value(0))).current;

  const startGame = () => {
    setQuestions(pickTen());
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setPhase('playing');
  };

  const animateIn = useCallback(() => {
    cardAnim.setValue(40);
    Animated.spring(cardAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
    btnAnims.forEach((a, i) => {
      a.setValue(0);
      Animated.timing(a, { toValue: 1, duration: 250, delay: i * 60, useNativeDriver: true }).start();
    });
  }, []);

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    setTimeLeft(TIMER_MAX);
    timerAnim.setValue(1);
    Animated.timing(timerAnim, { toValue: 0, duration: TIMER_MAX * 1000, useNativeDriver: false }).start();
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { handleTimeout(); return 0; }
        return t - 1;
      });
    }, 1000);
  }, [current]);

  const handleTimeout = () => {
    clearInterval(timerRef.current);
    if (selected !== null) return;
    setSelected(-1);
    setTimeout(goNext, 1500);
  };

  useEffect(() => {
    if (phase === 'playing') {
      animateIn();
      startTimer();
    }
    return () => clearInterval(timerRef.current);
  }, [current, phase]);

  const handleAnswer = (idx) => {
    if (selected !== null) return;
    clearInterval(timerRef.current);
    setSelected(idx);
    const correct = idx === questions[current].answer;
    if (correct) setScore(s => s + 1);
    setTimeout(goNext, 1800);
  };

  const goNext = () => {
    if (current + 1 >= questions.length) {
      endGame();
    } else {
      setSelected(null);
      setCurrent(c => c + 1);
    }
  };

  const endGame = () => {
    clearInterval(timerRef.current);
    setPhase('result');
    const finalScore = score + (selected === questions[current]?.answer ? 1 : 0);
    updateQuizScore(finalScore);
    if (isLoggedIn && finalScore >= 5) {
      const pts = Math.round(finalScore * 12);
      earnPoints(pts, 'game', 'Coffee Quiz');
      setShowToast(true);
    }
  };

  const getBtnStyle = (idx) => {
    if (selected === null) return {};
    if (idx === questions[current]?.answer) return { backgroundColor: C.successBg, borderColor: C.success };
    if (idx === selected) return { backgroundColor: C.errorBg, borderColor: C.error };
    return { opacity: 0.4 };
  };

  const getBtnTextStyle = (idx) => {
    if (selected === null) return {};
    if (idx === questions[current]?.answer) return { color: C.success };
    if (idx === selected) return { color: C.error };
    return {};
  };

  const timerColor = timerAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: ['#C0392B', '#D97706', '#059669'] });

  // ── INTRO ─────────────────────────────────────────────────────────────────
  if (phase === 'intro') return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={s.center}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={C.primary} />
        </TouchableOpacity>
        <MaterialCommunityIcons name="help-circle-outline" size={72} color={C.accent} style={{ marginBottom: 16 }} />
        <Text style={s.eyebrow}>COFFEE KNOWLEDGE</Text>
        <Text style={s.bigTitle}>Coffee Quiz</Text>
        <Text style={s.subtitle}>10 questions · 30 seconds each{'\n'}Test your barista knowledge!</Text>
        <View style={s.infoRow}>
          {[['10', 'Questions'], ['30s', 'Per question'], ['10', 'Best score']].map(([val, lbl]) => (
            <View key={lbl} style={s.infoBox}>
              <Text style={s.infoVal}>{val}</Text>
              <Text style={s.infoLbl}>{lbl}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={s.startBtn} onPress={startGame}>
          <Text style={s.startBtnTxt}>Start Quiz</Text>
          <Ionicons name="play" size={18} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  // ── RESULT ─────────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const finalScore = score;
    const emoji = finalScore >= 8 ? 'trophy-outline' : finalScore >= 5 ? 'star-outline' : 'emoticon-sad-outline';
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.center}>
          <MaterialCommunityIcons name={emoji} size={72} color={C.primary} style={{ marginBottom: 12 }} />
          <Text style={s.bigTitle}>{finalScore >= 8 ? 'Excellent!' : finalScore >= 5 ? 'Well done!' : 'Keep learning!'}</Text>
          <View style={s.scoreCircle}>
            <Text style={s.scoreBig}>{finalScore}</Text>
            <Text style={s.scoreOf}>/10</Text>
          </View>
          <TouchableOpacity style={s.startBtn} onPress={startGame}>
            <Text style={s.startBtnTxt}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={() => router.back()}>
            <Text style={s.secondaryTxt}>Back to Games</Text>
          </TouchableOpacity>
        </ScrollView>
        <PointsToast points={Math.round(finalScore * 12)} reason="Quiz complete" icon="medal-outline" visible={showToast} onHide={() => setShowToast(false)} />
      </SafeAreaView>
    );
  }

  // ── PLAYING ─────────────────────────────────────────────────────────────────
  const q = questions[current];
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => { clearInterval(timerRef.current); router.back(); }}>
          <Ionicons name="close" size={24} color={C.primary} />
        </TouchableOpacity>
        <Text style={s.progress}>{current + 1} / {questions.length}</Text>
        <View style={s.scorePill}>
          <MaterialCommunityIcons name="star" size={14} color={C.accent} />
          <Text style={s.scorePillTxt}>{score}</Text>
        </View>
      </View>

      <View style={s.progressBarBg}>
        <View style={[s.progressBarFill, { width: `${((current + 1) / questions.length) * 100}%` }]} />
      </View>

      <View style={s.timerRow}>
        <Animated.View style={[s.timerBarFill, { width: timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), backgroundColor: timerColor }]} />
        <Text style={s.timerTxt}>{timeLeft}s</Text>
      </View>

      <ScrollView contentContainerStyle={s.playBody}>
        <Animated.View style={[s.questionCard, { transform: [{ translateY: cardAnim }] }]}>
          <MaterialCommunityIcons name="coffee" size={24} color={C.accent} style={{ marginBottom: 8 }} />
          <Text style={s.questionTxt}>{q?.q}</Text>
        </Animated.View>

        {q?.options.map((opt, idx) => (
          <Animated.View key={idx} style={{ opacity: btnAnims[idx] }}>
            <TouchableOpacity
              style={[s.optionBtn, getBtnStyle(idx)]}
              onPress={() => handleAnswer(idx)}
              disabled={selected !== null}
              activeOpacity={0.75}
            >
              <View style={s.optionLeft}>
                <Text style={s.optionLetter}>{['A', 'B', 'C', 'D'][idx]}</Text>
              </View>
              <Text style={[s.optionTxt, getBtnTextStyle(idx)]}>{opt}</Text>
              {selected !== null && idx === q.answer && (
                <Ionicons name="checkmark-circle" size={20} color={C.success} />
              )}
              {selected === idx && idx !== q.answer && (
                <Ionicons name="close-circle" size={20} color={C.error} />
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  center: { padding: 24, alignItems: 'center', paddingBottom: 48 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 32, padding: 4 },
  eyebrow: { fontSize: 10, letterSpacing: 2, color: C.muted, fontFamily: 'Poppins_600SemiBold', marginBottom: 4 },
  bigTitle: { fontSize: 32, fontFamily: 'PlayfairDisplay_700Bold', color: C.primary, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: C.mocha, textAlign: 'center', fontFamily: 'Poppins_400Regular', marginBottom: 32, lineHeight: 22 },
  infoRow: { flexDirection: 'row', gap: 16, marginBottom: 40 },
  infoBox: { backgroundColor: C.card, borderRadius: 16, padding: 16, alignItems: 'center', minWidth: 80, borderWidth: 1, borderColor: C.border },
  infoVal: { fontSize: 22, fontFamily: 'JetBrainsMono_400Regular', color: C.primary },
  infoLbl: { fontSize: 11, color: C.muted, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  startBtn: { backgroundColor: C.primary, paddingVertical: 16, paddingHorizontal: 40, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  startBtnTxt: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
  secondaryBtn: { paddingVertical: 14, paddingHorizontal: 32 },
  secondaryTxt: { color: C.mocha, fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  scoreCircle: { backgroundColor: C.card, borderRadius: 80, width: 140, height: 140, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.primary, marginVertical: 32, flexDirection: 'row', alignItems: 'baseline' },
  scoreBig: { fontSize: 56, fontFamily: 'PlayfairDisplay_700Bold', color: C.primary },
  scoreOf: { fontSize: 20, color: C.muted, fontFamily: 'Poppins_400Regular' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  progress: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 14, color: C.mocha },
  scorePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: C.border },
  scorePillTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: C.primary },
  progressBarBg: { height: 3, backgroundColor: C.border, marginHorizontal: 20, borderRadius: 2 },
  progressBarFill: { height: 3, backgroundColor: C.accent, borderRadius: 2 },
  timerRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 12, gap: 10 },
  timerBarFill: { height: 6, borderRadius: 3, flex: 1 },
  timerTxt: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 12, color: C.muted, width: 28 },
  playBody: { padding: 20, gap: 10, paddingBottom: 40 },
  questionCard: { backgroundColor: C.card, borderRadius: 20, padding: 24, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  questionTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 17, color: C.primary, lineHeight: 26 },
  optionBtn: { backgroundColor: C.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: C.border },
  optionLeft: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center' },
  optionLetter: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: C.primary },
  optionTxt: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 15, color: C.primary },
});
