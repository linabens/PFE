import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  StatusBar, Animated, Easing, ScrollView, Modal, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';
import { useGame } from '../../src/context/GameContext';

const { width } = Dimensions.get('window');

const C = {
  bg: '#FAF3EB', card: '#FFFFFF', primary: '#5C3221', accent: '#C09891',
  muted: '#B89A87', mocha: '#7A5C4D', border: '#EAD9C9', cream: '#F5E6D3',
  success: '#059669', gold: '#D97706',
};

const SEGMENTS = [
  { label: '5% OFF',      color: '#F4D8D8', textColor: '#5C3221', prob: 0.30 },
  { label: '10% OFF',     color: '#BEA8A7', textColor: '#FFFFFF', prob: 0.25 },
  { label: 'LUCKY NEXT',  color: '#775144', textColor: '#F4D8D8', prob: 0.075 },
  { label: '15% OFF',     color: '#C09891', textColor: '#FFFFFF', prob: 0.15 },
  { label: 'FREE PASTRY', color: '#F4D8D8', textColor: '#5C3221', prob: 0.05 },
  { label: 'LUCKY NEXT',  color: '#775144', textColor: '#F4D8D8', prob: 0.075 },
  { label: '20% OFF',     color: '#BEA8A7', textColor: '#FFFFFF', prob: 0.10 },
  { label: '5% OFF',      color: '#C09891', textColor: '#FFFFFF', prob: 0.05 },
];

const RADIUS = 130;
const SEG_ANGLE = (2 * Math.PI) / SEGMENTS.length;
const CENTER = RADIUS + 10;

function pickPrize() {
  let r = Math.random();
  for (const seg of SEGMENTS) {
    if (r <= seg.prob) return seg;
    r -= seg.prob;
  }
  return SEGMENTS[0];
}

function segPath(i, r) {
  const start = i * SEG_ANGLE - Math.PI / 2;
  const end   = start + SEG_ANGLE;
  const x1 = r * Math.cos(start);
  const y1 = r * Math.sin(start);
  const x2 = r * Math.cos(end);
  const y2 = r * Math.sin(end);
  return `M 0 0 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
}

function WheelSvg({ rotation }) {
  const size = RADIUS * 2 + 20;
  return (
    <Svg width={size} height={size} viewBox={`${-CENTER} ${-CENTER} ${size} ${size}`}>
      <G>
        {SEGMENTS.map((seg, i) => {
          const midAngle = i * SEG_ANGLE + SEG_ANGLE / 2 - Math.PI / 2;
          const textR = RADIUS * 0.65;
          const tx = textR * Math.cos(midAngle);
          const ty = textR * Math.sin(midAngle);
          const deg = (midAngle * 180) / Math.PI + 90;
          return (
            <G key={i}>
              <Path d={segPath(i, RADIUS)} fill={seg.color} stroke="#FFF" strokeWidth={1.5} />
              <SvgText
                x={tx} y={ty}
                fill={seg.textColor}
                fontSize={seg.label.length > 8 ? 8 : 10}
                fontWeight="bold"
                textAnchor="middle"
                alignmentBaseline="middle"
                transform={`rotate(${deg}, ${tx}, ${ty})`}
              >
                {seg.label}
              </SvgText>
            </G>
          );
        })}
      </G>
    </Svg>
  );
}

export default function LuckyWheelScreen() {
  const router = useRouter();
  const { scores, spinsRemaining, recordWheelSpin, markCouponUsed } = useGame();

  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;
  const totalRotation = useRef(0);

  const spinsLeft = spinsRemaining();
  const coupons = scores.spinWheel.coupons;

  const spin = () => {
    if (spinning || spinsLeft === 0) return;
    const won = pickPrize();
    const segIndex = SEGMENTS.indexOf(won);
    const targetAngle = 360 - (segIndex * (360 / SEGMENTS.length) + (360 / SEGMENTS.length) / 2);
    const fullSpins = 5 * 360;
    const finalAngle = totalRotation.current + fullSpins + targetAngle - (totalRotation.current % 360);
    totalRotation.current = finalAngle;

    setSpinning(true);
    Animated.timing(rotation, {
      toValue: finalAngle,
      duration: 3500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setSpinning(false);
      setPrize(won);
      recordWheelSpin(won.label === 'LUCKY NEXT' ? 'BETTER LUCK' : won.label);
      setShowModal(true);
    });
  };

  const rotateStyle = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });

  const fmtExpiry = (iso) => {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
  };

  const activeCoupons = coupons.filter(c => !c.used && new Date(c.expiryDate) > new Date());

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={C.primary} />
        </TouchableOpacity>
        <Text style={s.title}>Lucky Wheel</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <Text style={s.spinsLeft}>
          <Text style={{ color: C.primary, fontFamily: 'Poppins_600SemiBold' }}>{spinsLeft}</Text>
          {'/3 spins left today'}
        </Text>

        {/* Wheel */}
        <View style={s.wheelWrap}>
          {/* Pointer */}
          <View style={s.pointer}>
            <MaterialCommunityIcons name="triangle" size={28} color={C.primary} style={{ transform: [{ rotate: '180deg' }] }} />
          </View>
          <Animated.View style={{ transform: [{ rotate: rotateStyle }] }}>
            <WheelSvg />
          </Animated.View>
          {/* Center button */}
          <TouchableOpacity
            style={[s.spinBtn, (spinning || spinsLeft === 0) && s.spinBtnDisabled]}
            onPress={spin}
            disabled={spinning || spinsLeft === 0}
          >
            <MaterialCommunityIcons name="coffee" size={28} color="#fff" />
            <Text style={s.spinBtnTxt}>{spinning ? '…' : 'SPIN'}</Text>
          </TouchableOpacity>
        </View>

        {spinsLeft === 0 && (
          <Text style={s.noSpins}>Come back tomorrow for more spins!</Text>
        )}

        {/* Coupons */}
        {activeCoupons.length > 0 && (
          <View style={s.couponsSection}>
            <Text style={s.couponsTitle}>Your Active Coupons</Text>
            {activeCoupons.map(c => (
              <View key={c.id} style={s.couponCard}>
                <View style={s.couponLeft}>
                  <MaterialCommunityIcons name="ticket-percent-outline" size={28} color={C.primary} />
                </View>
                <View style={s.couponBody}>
                  <Text style={s.couponPrize}>{c.prize}</Text>
                  <Text style={s.couponCode}>{c.id}</Text>
                  <Text style={s.couponExpiry}>Valid until {fmtExpiry(c.expiryDate)}</Text>
                </View>
                <TouchableOpacity style={s.useBtn} onPress={() => markCouponUsed(c.id)}>
                  <Text style={s.useBtnTxt}>Use</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Prize Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            {prize?.label === 'LUCKY NEXT' ? (
              <>
                <MaterialCommunityIcons name="emoticon-sad-outline" size={56} color={C.muted} />
                <Text style={s.modalTitle}>Better luck next time!</Text>
                <Text style={s.modalSub}>Keep spinning for great prizes.</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="party-popper" size={56} color={C.gold} />
                <Text style={s.modalTitle}>Congratulations!</Text>
                <Text style={[s.modalPrize, { color: prize?.textColor === '#FFFFFF' ? C.primary : prize?.textColor }]}>
                  {prize?.label}
                </Text>
                <Text style={s.modalSub}>Coupon saved to your wallet!</Text>
              </>
            )}
            <TouchableOpacity style={s.modalBtn} onPress={() => setShowModal(false)}>
              <Text style={s.modalBtnTxt}>
                {prize?.label === 'LUCKY NEXT' ? 'Try Again' : 'Awesome!'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: C.primary },
  body: { alignItems: 'center', padding: 20, gap: 20, paddingBottom: 48 },
  spinsLeft: { fontFamily: 'Poppins_400Regular', fontSize: 15, color: C.mocha },
  wheelWrap: { alignItems: 'center', justifyContent: 'center', width: RADIUS * 2 + 20, height: RADIUS * 2 + 40 },
  pointer: { position: 'absolute', top: -8, zIndex: 10 },
  spinBtn: {
    position: 'absolute', width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#fff', gap: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  spinBtnDisabled: { backgroundColor: C.muted },
  spinBtnTxt: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 10 },
  noSpins: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: C.muted, textAlign: 'center' },
  couponsSection: { width: '100%', gap: 10 },
  couponsTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: C.primary },
  couponCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed' },
  couponLeft: { width: 48, height: 48, backgroundColor: C.cream, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  couponBody: { flex: 1 },
  couponPrize: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: C.primary },
  couponCode: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 12, color: C.muted },
  couponExpiry: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: C.muted, marginTop: 2 },
  useBtn: { backgroundColor: C.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  useBtnTxt: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { backgroundColor: C.card, borderRadius: 28, padding: 32, alignItems: 'center', gap: 12, marginHorizontal: 32, width: width - 64 },
  modalTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: C.primary, textAlign: 'center' },
  modalPrize: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 28, textAlign: 'center' },
  modalSub: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: C.mocha, textAlign: 'center' },
  modalBtn: { backgroundColor: C.primary, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 14, marginTop: 8 },
  modalBtnTxt: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
});
