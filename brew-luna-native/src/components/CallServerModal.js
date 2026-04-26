import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Bell, X, Check } from 'lucide-react-native';

const { width } = Dimensions.get('window');

/**
 * BREW LUNA — Call Server Confirmation Modal
 * Art Déco & Warm Cream Aesthetic
 */
export default function CallServerModal({ visible, onClose, onConfirm, loading }) {
  // Use Animated for entry/exit (simple version for now)
  
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header Accent */}
          <View style={styles.headerDot} />
          
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} disabled={loading}>
            <X size={20} color="#7A5C4D" />
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <Bell size={32} color="#FFFFFF" strokeWidth={1.5} />
          </View>

          <Text style={styles.title}>Appeler un serveur ?</Text>
          <Text style={styles.subtitle}>
            Un membre de notre équipe viendra à votre table pour vous assister.
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.btn, styles.cancelBtn]} 
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btn, styles.confirmBtn]} 
              onPress={onConfirm}
              loading={loading}
            >
              {loading ? (
                <Text style={styles.confirmText}>Envoi...</Text>
              ) : (
                <View style={styles.confirmContent}>
                  <Check size={16} color="#FAF3EB" style={{ marginRight: 6 }} />
                  <Text style={styles.confirmText}>Confirmer</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Decorative Pattern (Art Déco lines) */}
          <View style={styles.decoLines}>
            <View style={styles.line} />
            <View style={[styles.line, { width: 40, marginTop: 4 }]} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 24, 16, 0.6)', // bgOverlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10
  },
  headerDot: {
    position: 'absolute',
    top: 0,
    width: 60,
    height: 4,
    backgroundColor: '#C09891', // rosewood
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#5C3221', // primary
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
    shadowColor: '#5C3221',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4
  },
  title: {
    fontSize: 22,
    fontFamily: 'serif', // fallback for Playfair
    fontWeight: 'bold',
    color: '#3D1C0C', // mainText
    marginBottom: 12,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'sans-serif', // fallback for Poppins
    color: '#7A5C4D', // secondaryText
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 10
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12
  },
  btn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cancelBtn: {
    backgroundColor: '#FAF3EB',
    borderWidth: 1,
    borderColor: '#EAD9C9'
  },
  cancelText: {
    color: '#7A5C4D',
    fontSize: 14,
    fontWeight: '600'
  },
  confirmBtn: {
    backgroundColor: '#5C3221'
  },
  confirmContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  confirmText: {
    color: '#FAF3EB',
    fontSize: 14,
    fontWeight: 'bold'
  },
  decoLines: {
    position: 'absolute',
    bottom: -15,
    right: -15,
    transform: [{ rotate: '-45deg' }],
    opacity: 0.1
  },
  line: {
    width: 80,
    height: 1,
    backgroundColor: '#5C3221'
  }
});
