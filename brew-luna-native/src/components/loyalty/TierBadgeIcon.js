import React from 'react';
import { Medal, Award, Crown, Gem } from 'lucide-react-native';

/**
 * Visual tier marker (replaces emoji medals in UI).
 */
export default function TierBadgeIcon({ tierName, size = 16, color = '#FFFFFF' }) {
  switch (tierName) {
    case 'Silver':
      return <Award size={size} color={color} strokeWidth={2} />;
    case 'Gold':
      return <Crown size={size} color={color} strokeWidth={2} />;
    case 'Platinum':
      return <Gem size={size} color={color} strokeWidth={2} />;
    case 'Bronze':
    default:
      return <Medal size={size} color={color} strokeWidth={2} />;
  }
}
