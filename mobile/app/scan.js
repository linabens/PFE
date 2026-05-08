import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing,
  TouchableOpacity, Modal, TextInput, Platform, ActivityIndicator,
  Vibration, KeyboardAvoidingView,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Coffee, X, Hash } from 'lucide-react-native';
import { useSessionStore } from '../src/store/useSessionStore';
import { sessionApi } from '../src/api/sessionApi';

const SCANNER_SIZE = 270;

export default function QRScanScreen() {
  const router = useRouter();
  const { setSession } = useSessionStore();

  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);        // { msg, type: 'error'|'success' }
  const [modalVisible, setModalVisible] = useState(false);
  const [manualTableNumber, setManualTableNumber] = useState('');

  // Animated values
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLoopRef = useRef(null);

  // ─── Permission ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // ─── Scan Line Loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    scanLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: SCANNER_SIZE - 4,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    scanLoopRef.current.start();
    return () => scanLoopRef.current?.stop();
  }, []);

  // ─── Corner Pulse (idle) ────────────────────────────────────────────────────
  useEffect(() => {
    if (!scanned && !loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [scanned, loading]);

  // ─── Toast Helper ───────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = 'error') => {
    setToast({ msg, type });
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(2800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, []);

  // ─── Authenticate ──────────────────────────────────────────────────────────
  const authenticateTable = useCallback(async (tableValue) => {
    setLoading(true);
    try {
      const res = await sessionApi.createSession(parseInt(tableValue) || 1);
      if (res.success) {
        setSession({
          token: res.data.token,
          table_id: res.data.table_id,
          table_number: res.data.table_number ?? tableValue,
          expires_at: res.data.expires_at,
        });
        Vibration.vibrate(80);
        router.replace('/(tabs)/home');
      } else {
        showToast(res.error || 'Erreur lors de la création de la session');
        setScanned(false);
      }
    } catch {
      showToast('Impossible de joindre le serveur');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  }, [setSession, router, showToast]);

  // ─── QR Handler ─────────────────────────────────────────────────────────────
  const handleBarCodeScanned = useCallback(async ({ data }) => {
    if (scanned || loading) return;
    setScanned(true);
    Vibration.vibrate(60);

    // ── Step 1: Extract the real QR code from whatever format was scanned ──
    // Handles: full URLs, TABLE_N codes, bare numbers, exp:// links, etc.
    let qrCode = data.trim();

    // If it's a URL containing /api/sessions/scan/, extract the code after /scan/
    if (qrCode.includes('/api/sessions/scan/')) {
      qrCode = qrCode.split('/api/sessions/scan/')[1].split('?')[0];
    }
    // If it's a URL with a table= param
    else if (qrCode.includes('table=')) {
      qrCode = qrCode.split('table=')[1].split('&')[0];
    }
    // If it's an exp:// Expo URL — ignore, not a real QR code
    else if (qrCode.startsWith('exp://') || qrCode.startsWith('exps://')) {
      showToast('QR code invalide. Utilisez le numéro de table.');
      setScanned(false);
      return;
    }

    // ── Step 2: Try the scan endpoint with the extracted QR code ──
    try {
      const res = await sessionApi.scanQrCode(qrCode);
      if (res.success) {
        setSession({
          token: res.data.token,
          table_id: res.data.table_id,
          table_number: res.data.table_number,
          expires_at: res.data.expires_at,
        });
        router.replace('/(tabs)/home');
        return;
      }
      // Backend returned an error (e.g. table not found) — show it
      showToast(res.error || 'QR code non reconnu');
      setScanned(false);
      return;
    } catch {
      // Network error or unexpected failure — try fallback
    }

    // ── Step 3: Fallback — if qrCode is TABLE_N or a number, use table number ──
    let tableNumber = null;
    const tableMatch = qrCode.match(/TABLE[_-]?(\d+)/i);
    if (tableMatch) {
      tableNumber = tableMatch[1]; // e.g. "2" from "TABLE_2"
    } else if (/^\d+$/.test(qrCode)) {
      tableNumber = qrCode; // bare number
    }

    if (tableNumber) {
      await authenticateTable(tableNumber);
    } else {
      showToast('QR code non reconnu. Entrez le numéro manuellement.');
      setScanned(false);
    }
  }, [scanned, loading, setSession, router, authenticateTable, showToast]);

  // ─── Manual Submit ──────────────────────────────────────────────────────────
  const handleManualSubmit = useCallback(() => {
    const num = manualTableNumber.trim();
    if (!num) {
      showToast('Veuillez entrer un numéro de table');
      return;
    }
    setModalVisible(false);
    setManualTableNumber('');
    authenticateTable(num);
  }, [manualTableNumber, showToast, authenticateTable]);

  // ─── Permission States ──────────────────────────────────────────────────────
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#C09891" />
        <Text style={[styles.textWait, { marginTop: 16 }]}>Accès à la caméra…</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.textWait}>❌ Caméra non autorisée</Text>
        <Text style={[styles.textWait, { fontSize: 12, marginTop: 8, opacity: 0.6 }]}>
          Activez la caméra dans les paramètres de l'app
        </Text>
        <TouchableOpacity style={styles.manualBtnFull} onPress={() => setModalVisible(true)}>
          <Hash size={16} color="#F4D8D8" />
          <Text style={styles.manualBtnFullTxt}>Entrer le numéro manuellement</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Main Render ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* Background Camera */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned || loading ? undefined : handleBarCodeScanned}
      />

      {/* Dimmed Overlay */}
      <View style={styles.overlay}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Coffee size={22} color="#F4D8D8" />
            <Text style={styles.logoBrew}> Coffee</Text>
            <Text style={styles.logoLuna}>Time</Text>
          </View>
          <Text style={styles.headerSub}>
            {loading ? 'Connexion en cours…' : 'Scannez le QR code de votre table'}
          </Text>
        </View>

        {/* Viewfinder */}
        <Animated.View style={[styles.viewfinderWrapper, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.viewfinderCutout}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Sweep line */}
            {!loading && (
              <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineAnim }] }]} />
            )}

            {/* Loading spinner overlay */}
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#C09891" />
              </View>
            )}
          </View>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerSub}>
            Positionnez le QR code de la table dans le cadre
          </Text>

          {scanned && !loading && (
            <TouchableOpacity style={styles.retryBtn} onPress={() => setScanned(false)}>
              <Text style={styles.retryTxt}>↺ Rescanner</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.manualBtn}>
            <Hash size={14} color="#C09891" style={{ marginRight: 6 }} />
            <Text style={styles.manualTxt}>Entrer le numéro de table</Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* Toast Notification */}
      {toast && (
        <Animated.View style={[
          styles.toast,
          toast.type === 'success' ? styles.toastSuccess : styles.toastError,
          { opacity: toastOpacity },
        ]}>
          <Text style={styles.toastTxt}>{toast.msg}</Text>
        </Animated.View>
      )}

      {/* Manual Entry Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalBox}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => { setModalVisible(false); setManualTableNumber(''); }}>
              <X size={22} color="#3E2723" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Numéro de Table</Text>
            <Text style={styles.modalSub}>Saisissez le numéro affiché sur votre table</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Ex: 5"
              placeholderTextColor="#A1887F"
              keyboardType="number-pad"
              value={manualTableNumber}
              onChangeText={setManualTableNumber}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleManualSubmit}
              maxLength={3}
            />

            <TouchableOpacity
              style={[styles.modalSubmit, !manualTableNumber.trim() && styles.modalSubmitDisabled]}
              onPress={handleManualSubmit}
              disabled={!manualTableNumber.trim()}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.modalSubmitTxt}>Valider</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0a06',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWait: {
    color: '#BEA8A7',
    textAlign: 'center',
    fontSize: 15,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 8, 4, 0.72)',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 70,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: { alignItems: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  logoBrew: {
    color: '#F4D8D8', fontSize: 24, fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  logoLuna: {
    color: '#C09891', fontSize: 24, fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  headerSub: { color: '#BEA8A7', fontSize: 13, fontWeight: '500', letterSpacing: 0.4 },

  // ── Viewfinder ──────────────────────────────────────────────────────────────
  viewfinderWrapper: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderCutout: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },

  // Sweep laser line
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#C09891',
    shadowColor: '#C09891',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },

  // Loading overlay inside viewfinder
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 10, 6, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // L-bracket corners (rendered OUTSIDE overflow:hidden wrapper via absolute, inside parent)
  corner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderColor: '#C09891',
  },
  topLeft:    { top: 0,    left: 0,    borderTopWidth: 3, borderLeftWidth: 3,  borderTopLeftRadius: 12 },
  topRight:   { top: 0,    right: 0,   borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
  bottomLeft: { bottom: 0, left: 0,    borderBottomWidth: 3, borderLeftWidth: 3,  borderBottomLeftRadius: 12 },
  bottomRight:{ bottom: 0, right: 0,   borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },

  // ── Footer ──────────────────────────────────────────────────────────────────
  footer: { alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  footerSub: { color: '#BEA8A7', fontSize: 12, textAlign: 'center', lineHeight: 18 },

  retryBtn: {
    backgroundColor: 'rgba(192,152,145,0.15)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#C09891',
  },
  retryTxt: { color: '#C09891', fontWeight: '600', fontSize: 13 },

  manualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  manualTxt: { color: '#C09891', fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },

  manualBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    backgroundColor: '#3E2723',
    borderRadius: 100,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  manualBtnFullTxt: { color: '#F4D8D8', fontWeight: '700', fontSize: 14 },

  // ── Toast ────────────────────────────────────────────────────────────────────
  toast: {
    position: 'absolute',
    bottom: 60,
    left: 24,
    right: 24,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  toastError:   { backgroundColor: '#7B2D2D' },
  toastSuccess: { backgroundColor: '#2D5A3D' },
  toastTxt: { color: 'white', fontSize: 14, fontWeight: '600', textAlign: 'center' },

  // ── Modal ────────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FDFBF7',
    padding: 28,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: Platform.OS === 'ios' ? 52 : 36,
  },
  closeBtn: { alignSelf: 'flex-end', padding: 6, marginBottom: 4 },
  modalTitle: { fontSize: 26, fontWeight: '800', color: '#3E2723', marginBottom: 6 },
  modalSub:   { fontSize: 14, color: '#8D6E63', marginBottom: 24 },
  modalInput: {
    backgroundColor: '#FFF8F5',
    borderWidth: 1.5,
    borderColor: '#F0EBE1',
    borderRadius: 16,
    padding: 18,
    fontSize: 28,
    color: '#3E2723',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '700',
    letterSpacing: 6,
  },
  modalSubmit: {
    backgroundColor: '#3E2723',
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
  },
  modalSubmitDisabled: { backgroundColor: '#A1887F' },
  modalSubmitTxt: { color: 'white', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
});
