import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Coffee } from 'lucide-react-native';

/**
 * Placeholder when a menu item has no image — vector icon, not emoji.
 */
export default function ProductImageFallback({ size = 40, color = '#B89A87', style }) {
  return (
    <View style={[styles.wrap, style]} accessibilityRole="image" accessibilityLabel="Image produit indisponible">
      <Coffee size={size} color={color} strokeWidth={1.75} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
