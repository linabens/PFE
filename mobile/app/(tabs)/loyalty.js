/**
 * BREW LUNA — Tab Fidélité
 * Route d'entrée : affiche LoyaltyScreen ou LoyaltyDashboardScreen
 * selon si l'utilisateur est connecté
 */

import React from 'react';
import { useLoyalty } from '../../src/context/LoyaltyContext';
import LoyaltyScreen from '../../src/screens/LoyaltyScreen';
import LoyaltyDashboardScreen from '../../src/screens/LoyaltyDashboardScreen';
import { View, ActivityIndicator } from 'react-native';

export default function LoyaltyTab() {
  const { isLoggedIn, isLoaded } = useLoyalty();

  // Attente du chargement AsyncStorage
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#2C1810', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#D4A853" />
      </View>
    );
  }

  return isLoggedIn ? <LoyaltyDashboardScreen /> : <LoyaltyScreen />;
}
