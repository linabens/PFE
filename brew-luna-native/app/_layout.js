import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { 
  PlayfairDisplay_700Bold 
} from '@expo-google-fonts/playfair-display';
import { 
  Poppins_400Regular, 
  Poppins_600SemiBold 
} from '@expo-google-fonts/poppins';
import { 
  JetBrainsMono_400Regular 
} from '@expo-google-fonts/jetbrains-mono';
import { Colors } from '../src/styles/theme';
import { LoyaltyProvider } from '../src/context/LoyaltyContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

/**
 * BREW LUNA — Root Layout
 * Provides safe area, status bar, and stack navigation
 */

export default function RootLayout() {
  const [loaded, error] = useFonts({
    PlayfairDisplay_700Bold,
    Poppins_400Regular,
    Poppins_600SemiBold,
    JetBrainsMono_400Regular,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <LoyaltyProvider>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.espresso} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.bgPage },
            animation: 'fade_from_bottom',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
          <Stack.Screen name="product/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="loyalty" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </LoyaltyProvider>
  );
}
