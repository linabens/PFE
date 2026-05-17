import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Bell, Coffee, Sparkles, X } from 'lucide-react-native';
import { useOrderStore } from '../src/store/useOrderStore';
import { orderApi } from '../src/api/orderApi';
import { assistanceApi } from '../src/api/assistanceApi';
import OrderReadyOverlay from '../src/components/OrderReadyOverlay';

const C = {
  bg: '#FAF3EB',
  imgBg: '#F0E4D6',
  border: '#EAD9C9',
  primary: '#5C3221',
  secondaryText: '#7A5C4D',
  mainText: '#3D1C0C',
  rosewood: '#C09891',
  success: '#4CAF50',
};

const FONT = {
  playfair: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  poppins: Platform.OS === 'ios' ? 'System' : 'sans-serif'
};

const STEPS = [
  { id: 'received',  label: 'Commande reçue' },
  { id: 'confirmed', label: 'Confirmée par le staff' },
  { id: 'preparing', label: 'En préparation' },
  { id: 'ready',     label: 'Prête à servir' },
  { id: 'served',    label: 'Servie' },
];

const STATUS_MAP = {
  'pending': 0,
  'confirmed': 1,
  'preparing': 2,
  'ready': 3,
  'completed': 4,
};

export default function OrderTrackingModal() {
  const router = useRouter();
  const { currentOrderId, orderStatus, updateOrderStatus, clearCurrentOrder, hasShownReady, setHasShownReady } = useOrderStore();
  
  const [isCalling, setIsCalling] = useState(false);
  const [showWaiterConfirm, setShowWaiterConfirm] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pollRef = useRef(null);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    if (currentOrderId) {
      const fetchStatus = async () => {
        try {
          const res = await orderApi.getOrderStatus(currentOrderId);
          if (res.success) {
            const newStatus = res.data.status;
            if (newStatus === 'ready' && orderStatus !== 'ready' && !hasShownReady) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            updateOrderStatus(newStatus);
          }
        } catch (e) { 
          if (e.message.includes('403') || e.message.includes('401') || e.message.includes('session') || e.message.includes('refusé')) {
            if (pollRef.current) clearInterval(pollRef.current);
            clearCurrentOrder();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            alert("Votre session a été fermée ou a expiré. Veuillez rescanner le QR code.");
            router.replace('/scan');
          }
        }
      };

      fetchStatus();
      pollRef.current = setInterval(fetchStatus, 10000); 
    }

    return () => clearInterval(pollRef.current);
  }, [currentOrderId]);

  const currentIndex = STATUS_MAP[orderStatus] || 0;

  const handleCallWaiter = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsCalling(true);
    try {
      await assistanceApi.callWaiter({ table_id: 'auto' });
      setShowWaiterConfirm(true);
      setTimeout(() => setShowWaiterConfirm(false), 3000);
    } catch (e) {
      setShowWaiterConfirm(true);
      setTimeout(() => setShowWaiterConfirm(false), 3000);
    } finally {
      setIsCalling(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  if (!currentOrderId) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top', 'bottom']}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
          <X size={24} color={C.mainText} />
        </TouchableOpacity>
        <View style={styles.emptyIcon}>
          <Coffee size={40} color={C.primary} strokeWidth={1.75} />
        </View>
        <Text style={styles.emptyTitle}>Aucune commande active</Text>
        <TouchableOpacity style={styles.goHomeBtn} onPress={handleClose}>
          <Text style={styles.goHomeTxt}>Fermer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Suivi de commande</Text>
          <Text style={styles.subtitle}>Commande #{currentOrderId.toString().slice(-6).toUpperCase()}</Text>
        </View>
        <TouchableOpacity style={styles.closeBtnHeader} onPress={handleClose}>
          <X size={24} color={C.mainText} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.mainBadge}>
          {currentIndex === 4 && (
            <Sparkles size={16} color={C.rosewood} strokeWidth={2} style={{ marginRight: 8 }} />
          )}
          <Text style={styles.mainBadgeTxt}>
            {currentIndex === 4 ? 'Bonne dégustation !' : STEPS[currentIndex].label}
          </Text>
        </View>

        <View style={styles.timelineWrapper}>
          {STEPS.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isFuture = index > currentIndex;

            return (
              <View key={step.id} style={styles.stepRow}>
                <View style={styles.visualSide}>
                  <View style={[styles.line, index === STEPS.length - 1 && { opacity: 0 }]} />
                  <View style={styles.nodeWrapper}>
                    {isCurrent ? (
                      <Animated.View style={[styles.nodeCurrent, { transform: [{ scale: pulseAnim }] }]} />
                    ) : (
                      <View style={[styles.node, isCompleted ? styles.nodeCompleted : styles.nodeFuture]} />
                    )}
                  </View>
                </View>

                <View style={[styles.stepContent, isCurrent && styles.activeContent]}>
                  <View style={styles.labelRow}>
                    <Text style={[
                      styles.stepLabel, 
                      isCompleted && styles.labelCompleted,
                      isFuture && styles.labelFuture,
                      isCurrent && styles.labelCurrent
                    ]}>
                      {step.label}
                    </Text>
                    {isCurrent && <View style={styles.nowBadge}><Text style={styles.nowTxt}>maintenant</Text></View>}
                  </View>
                  {isCompleted && <Text style={styles.timeTag}>12:45</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {currentIndex === 4 && (
          <TouchableOpacity style={styles.finishBtn} onPress={() => {
            clearCurrentOrder();
            handleClose();
          }}>
            <Text style={styles.finishTxt}>Commander à nouveau</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.callWaiterBtn} onPress={handleCallWaiter} disabled={isCalling}>
          {isCalling ? <ActivityIndicator size="small" color={C.rosewood} /> : <Bell size={18} color={C.rosewood} />}
          <Text style={styles.callWaiterTxt}>Appeler un serveur</Text>
        </TouchableOpacity>
      </View>

      {showWaiterConfirm && (
        <View style={styles.overlay}>
          <Animated.View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <Bell size={32} color={C.bg} />
            </View>
            <Text style={styles.confirmTitle}>Demande envoyée</Text>
            <Text style={styles.confirmSub}>Un serveur arrive bientôt à votre table.</Text>
          </Animated.View>
        </View>
      )}

      {orderStatus === 'ready' && !hasShownReady && (
        <OrderReadyOverlay 
          orderId={currentOrderId} 
          onDismiss={() => setHasShownReady(true)} 
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 24, paddingTop: 30, paddingBottom: 20 },
  title: { fontFamily: FONT.playfair, fontSize: 26, color: C.mainText },
  subtitle: { fontFamily: FONT.poppins, fontSize: 12, color: C.rosewood, marginTop: 4 },
  closeBtnHeader: { width: 40, height: 40, alignItems: 'flex-end', justifyContent: 'flex-start' },
  closeBtn: { position: 'absolute', top: 30, right: 24, padding: 10 },

  scrollContent: { paddingHorizontal: 24, paddingBottom: 120 },
  
  mainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: C.mainText,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.rosewood,
    marginBottom: 40,
  },
  mainBadgeTxt: { fontFamily: FONT.poppins, fontSize: 13, color: C.rosewood, fontWeight: 'bold' },

  timelineWrapper: { paddingLeft: 10 },
  stepRow: { flexDirection: 'row', minHeight: 80 },
  
  visualSide: { width: 30, alignItems: 'center' },
  line: { width: 2, backgroundColor: C.mainText, position: 'absolute', top: 5, bottom: -5 },
  nodeWrapper: { width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  node: { width: 10, height: 10, borderRadius: 5, zIndex: 2 },
  nodeCompleted: { backgroundColor: C.secondaryText },
  nodeFuture: { backgroundColor: C.mainText },
  nodeCurrent: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.rosewood, zIndex: 3 },

  stepContent: { flex: 1, paddingLeft: 10, paddingTop: -2 },
  activeContent: { marginBottom : 10},
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepLabel: { fontFamily: FONT.poppins, fontSize: 14 },
  labelCompleted: { color: C.rosewood },
  labelFuture: { color: C.rosewood, opacity: 0.5 },
  labelCurrent: { color: C.mainText, fontWeight: 'bold', fontSize: 16 },
  
  nowBadge: { backgroundColor: C.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  nowTxt: { color: C.bg, fontSize: 9, fontFamily: FONT.poppins, fontWeight: 'bold' },
  timeTag: { fontFamily: FONT.poppins, fontSize: 9, color: C.secondaryText, marginTop: 4 },

  footer: { position: 'absolute', bottom: 40, width: '100%', alignItems: 'center' },
  callWaiterBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: C.secondaryText, height: 50, paddingHorizontal: 24, borderRadius: 25, backgroundColor: C.bg },
  callWaiterTxt: { fontFamily: FONT.poppins, fontSize: 12, color: C.rosewood, fontWeight: 'bold' },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(61, 28, 12, 0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  confirmCard: { width: '80%', backgroundColor: C.bg, borderRadius: 24, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  confirmIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  confirmTitle: { fontFamily: FONT.playfair, fontSize: 20, color: C.mainText, marginBottom: 8 },
  confirmSub: { fontFamily: FONT.poppins, fontSize: 13, color: C.secondaryText, textAlign: 'center' },

  emptyIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: C.imgBg, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontFamily: FONT.playfair, fontSize: 22, color: C.mainText, marginBottom: 12 },
  goHomeBtn: { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 20, marginTop: 20 },
  goHomeTxt: { color: C.bg, fontFamily: FONT.poppins, fontWeight: 'bold' },

  finishBtn: { marginTop: 20, alignSelf: 'center', padding: 10 },
  finishTxt: { color: C.secondaryText, textDecorationLine: 'underline', fontSize: 13 }
});
