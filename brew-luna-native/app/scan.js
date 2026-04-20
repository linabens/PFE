import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing, TouchableOpacity, Modal, TextInput, Platform } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Coffee, X } from 'lucide-react-native';
import { useSessionStore } from '../src/store/useSessionStore';

const { width } = Dimensions.get('window');
const SCANNER_SIZE = 280;

export default function QRScanScreen() {
  const router = useRouter();
  const { setSession } = useSessionStore();
  
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [manualTableNumber, setManualTableNumber] = useState('');

  // Scanning animated line
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    // 2s Infinite Linear Loop for Scan Line
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: SCANNER_SIZE - 2, // stop at bottom
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  const authenticateTable = (tableValue) => {
    // Generate an artificial secure session valid for 2 hours
    const expires = new Date(Date.now() + 120 * 60 * 1000).toISOString();
    setSession({
      token: `QR_SESSIONS_TOKEN_${Math.random()}`,
      table_id: `table-${tableValue}`,
      table_number: parseInt(tableValue) || 1,
      expires_at: expires
    });
    
    // Slide up / push transition to Home
    router.replace('/(tabs)/home');
  };

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;
    setScanned(true);

    // Assuming the QR holds a URL or just an ID like 'table=14'
    // Extract ID (Fallback to data direct if URL parse fails)
    let extractedId = data;
    try {
      if (data.includes('http')) {
        const urlParams = new URL(data).searchParams;
        if (urlParams.has('table')) {
          extractedId = urlParams.get('table');
        }
      }
    } catch {
      // Not a valid URL, just use raw string
    }

    authenticateTable(extractedId);
  };

  const handleManualSubmit = () => {
    if (manualTableNumber.trim() !== '') {
      setModalVisible(false);
      authenticateTable(manualTableNumber);
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text style={styles.textWait}>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.container}><Text style={styles.textWait}>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      {/* Background Camera */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Dimmed Overlay */}
      <View style={styles.overlay}>
        
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Coffee size={24} color="#F4D8D8" />
            <Text style={styles.logoBrew}>Brew</Text>
            <Text style={styles.logoLuna}>Luna</Text>
          </View>
          <Text style={styles.headerSub}>Scannez le QR code de votre table</Text>
        </View>

        {/* Viewfinder Target */}
        <View style={styles.viewfinderWrapper}>
          <View style={styles.viewfinderBox}>
            {/* L-Brackets Corners Glow */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Sweep Anim Line */}
            <Animated.View style={[
              styles.scanLine,
              { transform: [{ translateY: scanLineAnim }] }
            ]} />
          </View>
        </View>

        {/* Footer actions */}
        <View style={styles.footer}>
          <Text style={styles.footerSub}>Pointez votre caméra vers le QR code de votre table</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.manualBtn}>
            <Text style={styles.manualTxt}>Entrer le numéro de table manuellement</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Manual Entry Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <X size={24} color="#3E2723" />
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
              autoFocus={true}
            />
            
            <TouchableOpacity style={styles.modalSubmit} onPress={handleManualSubmit}>
              <Text style={styles.modalSubmitTxt}>Valider</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0a06', // Dark Espresso override in case camera breaks
    justifyContent: 'center'
  },
  textWait: {
    color: '#BEA8A7',
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 10, 6, 0.75)', // Dark Espresso translucent mask
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 80,
  },
  // Typography
  header: { alignItems: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  logoBrew: { color: '#F4D8D8', fontSize: 22, fontWeight: '700', marginLeft: 6, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  logoLuna: { color: '#C09891', fontSize: 22, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  headerSub: { color: '#BEA8A7', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  
  // ViewFinder Core
  viewfinderWrapper: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderBox: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0)', // Cut out effectively
    borderWidth: 0,
    overflow: 'hidden',
  },
  // Sweeping Laser
  scanLine: {
    width: '100%',
    height: 3,
    backgroundColor: '#C09891', // Rosewood
    shadowColor: '#C09891',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  // 4 Glow L-Brackets (Rosewood)
  corner: {
    position: 'absolute',
    borderColor: '#C09891',
    width: 40,  // length requested 30, adding 10 padding
    height: 40,
    borderWidth: 0,
    shadowColor: '#C09891',
    shadowRadius: 8,
    shadowOpacity: 0.6,
    elevation: 5,
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 20 },
  topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 20 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 20 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 20 },
  
  // Footer
  footer: { alignItems: 'center', paddingHorizontal: 20 },
  footerSub: { color: '#BEA8A7', fontSize: 11, textAlign: 'center', marginBottom: 20 },
  manualBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  manualTxt: { color: '#775144', fontSize: 11, fontWeight: 'bold', textDecorationLine: 'underline' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#FDFBF7', padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 60 },
  closeBtn: { alignSelf: 'flex-end', padding: 8 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#3E2723', marginBottom: 8 },
  modalSub: { fontSize: 14, color: '#8D6E63', marginBottom: 24 },
  modalInput: { backgroundColor: 'white', borderWidth: 1, borderColor: '#F0EBE1', borderRadius: 16, padding: 16, fontSize: 22, color: '#3E2723', textAlign: 'center', marginBottom: 24, fontWeight: 'bold' },
  modalSubmit: { backgroundColor: '#3E2723', paddingVertical: 16, borderRadius: 100, alignItems: 'center' },
  modalSubmitTxt: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
