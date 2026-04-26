import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ET } from '../../constants/entertainmentTheme';

const TIPS = [
  { id: 1, type: 'Santé', text: "L'hydratation est clé. Un verre d'eau après votre café aide à l'équilibre.", icon: 'heart-outline', color: '#f09595' },
  { id: 2, type: 'Focus', text: "Le pic de caféine arrive 45min après la dégustation. Planifiez vos tâches.", icon: 'brain', color: '#afa9ec' },
  { id: 3, type: 'Nature', text: "Les marcs de café sont d'excellents engrais naturels pour vos plantes.", icon: 'leaf-outline', color: '#9fe1cb' },
];

export const HealthTipCard = () => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {TIPS.map((tip) => (
        <View key={tip.id} style={styles.card}>
          <View style={styles.header}>
            <View style={styles.badge}>
              <Text style={styles.badgeNum}>{tip.id}</Text>
            </View>
            {tip.icon.includes('outline') ? (
               <Ionicons name={tip.icon} size={20} color={tip.color} />
            ) : (
               <MaterialCommunityIcons name={tip.icon} size={20} color={tip.color} />
            )}
          </View>
          <Text style={styles.tipText}>{tip.text}</Text>
          <Text style={[styles.tipType, { color: tip.color }]}>{tip.type}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  card: { width: 160, backgroundColor: ET.bgCard, borderRadius: ET.radiusMd, padding: 16, borderWidth: 1, borderColor: ET.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { width: 20, height: 20, borderRadius: 6, backgroundColor: ET.accent, justifyContent: 'center', alignItems: 'center' },
  badgeNum: { fontFamily: ET.fontMono, fontSize: 10, color: ET.bg, fontWeight: 'bold' },
  tipText: { fontFamily: ET.fontBody, fontSize: 11, color: ET.textPrimary, lineHeight: 16, marginBottom: 8 },
  tipType: { fontFamily: ET.fontMono, fontSize: 8, letterSpacing: 1, textTransform: 'uppercase' }
});
