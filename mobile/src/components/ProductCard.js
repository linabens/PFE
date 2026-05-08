import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Plus, Clock } from 'lucide-react-native';
import { Colors, Spacing, Radius, Shadows } from '../styles/theme';
import { useCartStore } from '../store/useCartStore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.xl * 3) / 2;

/**
 * BREW LUNA — Product Card (Native)
 */

export default function ProductCard({ product, onPress }) {
  const addItem = useCartStore((state) => state.addItem);

  const isUnavailable = !product.is_active || product.stock <= 0;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.container, isUnavailable && styles.disabled]}
      onPress={onPress}
    >
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.image_url || 'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=300&h=300&auto=format&fit=crop' }}
          style={styles.image}
        />
        
        {isUnavailable && (
          <View style={styles.overlay}>
             <Text style={styles.overlayText}>Sold Out</Text>
          </View>
        )}

        {/* Floating Price */}
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>{Number(product.price).toFixed(3)} DT</Text>
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.desc} numberOfLines={2}>
          {product.description || 'Deliciously crafted for your enjoyment.'}
        </Text>
        
        <View style={styles.footer}>
          <View style={styles.timeInfo}>
            <Clock size={12} color={Colors.mocha} />
            <Text style={styles.timeText}>5-10m</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.addButton, isUnavailable && styles.addButtonDisabled]}
            onPress={() => !isUnavailable && addItem(product, 1)}
            disabled={isUnavailable}
          >
            <Plus size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(196, 149, 106, 0.1)',
    ...Shadows.sm,
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.6,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  priceContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(44, 24, 16, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  priceText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    padding: 10,
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  desc: {
    fontSize: 10,
    color: Colors.textMuted,
    lineHeight: 14,
    marginBottom: 10,
  },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 10,
    color: Colors.mocha,
    fontWeight: '500',
  },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    backgroundColor: Colors.mocha,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.mocha,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonDisabled: {
    backgroundColor: Colors.textMuted,
  }
});
