import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Utensils, ShoppingCart, Package, Gamepad2, Star } from 'lucide-react-native';
import { useCartStore } from '../../src/store/useCartStore';
import { useLoyalty } from '../../src/context/LoyaltyContext';

// Palette Match (Warm Cream Protocol)
const C = {
  bg: '#FFFFFF',
  border: '#EAD9C9',
  active: '#5C3221',    // Dark Espresso
  inactive: '#B89A87',  // Muted Taupe
  cream: '#FAF3EB'
};

const FONT = {
  poppins: 'Poppins_600SemiBold'
};

// Custom Icon with bottom dot for Active state
const CustomTabIcon = ({ focused, IconComp }) => (
  <View style={styles.iconWrapper}>
    <IconComp size={22} color={focused ? C.active : C.inactive} strokeWidth={focused ? 2.5 : 2} />
    {focused && <View style={styles.activeDot} />}
  </View>
);

export default function TabLayout() {
  const itemCount = useCartStore((state) => state.getItemCount());
  const { isLoggedIn } = useLoyalty();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: C.active,
        tabBarInactiveTintColor: C.inactive,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <CustomTabIcon focused={focused} IconComp={Home} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ focused }) => <CustomTabIcon focused={focused} IconComp={Utensils} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ focused }) => (
            <View>
              <CustomTabIcon focused={focused} IconComp={ShoppingCart} />
              {itemCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{itemCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ focused }) => <CustomTabIcon focused={focused} IconComp={Package} />,
        }}
      />
      <Tabs.Screen
        name="fun"
        options={{
          title: 'Play',
          tabBarIcon: ({ focused }) => <CustomTabIcon focused={focused} IconComp={Gamepad2} />,
        }}
      />
      <Tabs.Screen
        name="loyalty"
        options={{
          title: 'Rewards',
          tabBarActiveTintColor: '#D4A853',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconWrapper}>
              <Star
                size={22}
                color={focused ? '#D4A853' : C.inactive}
                strokeWidth={focused ? 2.5 : 2}
                fill={focused ? '#D4A853' : 'transparent'}
              />
              {focused && <View style={[styles.activeDot, { backgroundColor: '#D4A853' }]} />}
              {isLoggedIn && !focused && (
                <View style={styles.loyaltyDot} />
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
    height: 60,
    paddingBottom: Platform.OS === 'ios' ? 18 : 8,
    paddingTop: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  label: {
    fontFamily: FONT.poppins,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 4,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  activeDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: C.active,
    position: 'absolute',
    bottom: -6,
  },
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: C.active,
    borderRadius: 7,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.bg,
  },
  badgeText: {
    color: C.cream,
    fontSize: 8,
    fontFamily: FONT.poppins,
    fontWeight: 'bold',
  },
  loyaltyDot: {
    position: 'absolute',
    top: 0, right: -2,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: '#D4A853',
    borderWidth: 1.5, borderColor: '#FFFFFF',
  },
});
