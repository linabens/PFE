import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '../styles/theme';

/**
 * BREW LUNA — Category Tabs (Native)
 */

export default function CategoryTabs({ categories, activeId, onSelect }) {
  const allCategories = [{ id: 'all', name: 'All Items' }, ...categories];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {allCategories.map((cat) => {
          const isActive = activeId === cat.id;

          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.8}
              onPress={() => onSelect(cat.id)}
              style={[
                styles.tab,
                isActive ? styles.tabActive : styles.tabInactive
              ]}
            >
              <Text style={[
                styles.tabText,
                isActive ? styles.tabTextActive : styles.tabTextInactive
              ]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  tabActive: {
    backgroundColor: Colors.mocha,
    borderColor: Colors.mocha,
  },
  tabInactive: {
    backgroundColor: Colors.bgCard,
    borderColor: 'rgba(196, 149, 106, 0.2)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: 'white',
  },
  tabTextInactive: {
    color: Colors.textSecondary,
  }
});
