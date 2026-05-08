/**
 * BREW LUNA — Layout du groupe de routes Loyalty
 * Enregistre les sous-routes : register, login, dashboard, redeem, history
 */

import { Stack } from 'expo-router';

export default function LoyaltyLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="register" />
      <Stack.Screen name="login" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="redeem" />
      <Stack.Screen name="history" />
    </Stack>
  );
}
