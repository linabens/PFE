import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { CheckCircle2, Download, Home, FileText } from 'lucide-react-native';

const C = {
  bg: '#FAF3EB',
  primary: '#5C3221',
  secondaryText: '#7A5C4D',
  mainText: '#3D1C0C',
  cardBg: '#FFFFFF',
  border: '#EAD9C9',
  rosewood: '#C09891',
};

const FONT = {
  playfair: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  poppins: Platform.OS === 'ios' ? 'System' : 'sans-serif'
};

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const { payload } = useLocalSearchParams();
  const [isGenerating, setIsGenerating] = useState(false);

  // Fallback in case navigation breaks
  if (!payload) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text>Aucune donnée de commande.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/home')}>
          <Text style={styles.btnText}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const orderData = JSON.parse(payload);

  const generatePDF = async () => {
    setIsGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const html = `
        <html>
          <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FAF3EB; padding: 40px; color: #3D1C0C;">
            <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
              <div style="text-align: center; border-bottom: 2px dashed #EAD9C9; padding-bottom: 30px; margin-bottom: 30px;">
                <h1 style="color: #5C3221; margin: 0; font-size: 32px; letter-spacing: 2px;">BrewLuna</h1>
                <p style="color: #7A5C4D; margin: 8px 0 0; font-size: 14px;">FACTURE OFFICIELLE</p>
              </div>
              
              <div style="display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; color: #7A5C4D;">
                <div>
                  <strong>Reçu N°:</strong> #${Math.floor(Math.random() * 10000)}<br>
                  <strong>Table:</strong> ${orderData.tableNumber}
                </div>
                <div style="text-align: right;">
                  <strong>Date:</strong> ${orderData.date}<br>
                  <strong>Heure:</strong> ${orderData.time}
                </div>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                  <tr style="border-bottom: 1px solid #EAD9C9; color: #7A5C4D; text-align: left;">
                    <th style="padding: 12px 0;">Description</th>
                    <th style="padding: 12px 0; text-align: center;">Qté</th>
                    <th style="padding: 12px 0; text-align: right;">Prix</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderData.items.map(item => `
                    <tr>
                      <td style="padding: 16px 0; border-bottom: 1px solid #F0E4D6;">
                        <strong style="display: block; font-size: 16px; color: #3D1C0C;">${item.name}</strong>
                        <span style="font-size: 12px; color: #7A5C4D;">${item.options?.join(' · ') || ''}</span>
                      </td>
                      <td style="padding: 16px 0; text-align: center; border-bottom: 1px solid #F0E4D6;">x${item.quantity}</td>
                      <td style="padding: 16px 0; text-align: right; border-bottom: 1px solid #F0E4D6;">${(item.price * item.quantity).toFixed(2)} DT</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div style="text-align: right; margin-bottom: 40px;">
                <p style="margin: 8px 0; color: #7A5C4D;">Sous-total: ${orderData.subtotal.toFixed(2)} DT</p>
                <p style="margin: 8px 0; color: #7A5C4D;">TVA (19%): ${orderData.tax.toFixed(2)} DT</p>
                <h2 style="margin: 16px 0 0; color: #5C3221; font-size: 24px;">TOTAL: ${orderData.finalTotal.toFixed(2)} DT</h2>
              </div>

              <div style="text-align: center; color: #C09891; font-size: 12px; margin-top: 50px;">
                Merci de votre visite chez BrewLuna !<br>
                Scannez le QR code sur votre table pour recommander.
              </div>
            </div>
          </body>
        </html>
      `;

      // Create PDF
      const { uri } = await Print.printToFileAsync({ html });
      
      // Share/Save functionality
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.warn("Erreur PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* Animated Success Identity */}
        <View style={styles.successBadge}>
          <CheckCircle2 size={80} color="#4CAF50" strokeWidth={1.5} />
        </View>

        <Text style={styles.title}>Commande Envoyée !</Text>
        <Text style={styles.subtitle}>
          Le barista vient de recevoir votre sélection. Asseyez-vous et détendez-vous.
        </Text>

        {/* Facture Preview Card */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <FileText size={20} color={C.secondaryText} />
            <Text style={styles.receiptTitle}>Résumé de la transaction</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Table :</Text>
            <Text style={styles.receiptValue}>{orderData.tableNumber}</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Heure :</Text>
            <Text style={styles.receiptValue}>{orderData.time}</Text>
          </View>
          <View style={[styles.receiptRow, { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 16, marginTop: 8 }]}>
            <Text style={[styles.receiptLabel, { fontWeight: 'bold', color: C.mainText }]}>A payer :</Text>
            <Text style={[styles.receiptValue, { fontSize: 20, color: C.primary }]}>{orderData.finalTotal.toFixed(2)} DT</Text>
          </View>
        </View>

      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.pdfBtn} onPress={generatePDF} disabled={isGenerating}>
          {isGenerating ? <ActivityIndicator color={C.primary} /> : <Download size={20} color={C.primary} />}
          <Text style={styles.pdfBtnText}>Télécharger la facture PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeBtn} onPress={() => router.push('/home')}>
          <Home size={20} color={C.bg} />
          <Text style={styles.homeBtnText}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.imgBg },
  center: { justifyContent: 'center', alignItems: 'center' },
  
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 60, alignItems: 'center' },
  
  successBadge: { marginBottom: 24, backgroundColor: C.cardBg, padding: 20, borderRadius: 100, shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  title: { fontFamily: FONT.playfair, fontSize: 32, color: C.mainText, marginBottom: 12, textAlign: 'center' },
  subtitle: { fontFamily: FONT.poppins, fontSize: 14, color: C.secondaryText, textAlign: 'center', lineHeight: 22, marginBottom: 40, paddingHorizontal: 20 },
  
  receiptCard: { width: '100%', backgroundColor: C.cardBg, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  receiptHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  receiptTitle: { fontFamily: FONT.poppins, fontSize: 14, color: C.secondaryText, fontWeight: 'bold' },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  receiptLabel: { fontFamily: FONT.poppins, fontSize: 13, color: C.secondaryText },
  receiptValue: { fontFamily: FONT.poppins, fontSize: 14, color: C.mainText, fontWeight: 'bold' },
  
  footer: { paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 20 },
  pdfBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: C.cardBg, paddingVertical: 18, borderRadius: 24, borderWidth: 1.5, borderColor: C.primary, marginBottom: 16 },
  pdfBtnText: { fontFamily: FONT.poppins, fontSize: 14, color: C.primary, fontWeight: 'bold' },
  
  homeBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: C.primary, paddingVertical: 18, borderRadius: 24 },
  homeBtnText: { fontFamily: FONT.poppins, fontSize: 14, color: C.bg, fontWeight: 'bold' }
});
