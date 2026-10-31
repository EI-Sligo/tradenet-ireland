// app/_layout.tsx
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { COLORS } from '../src/constants/theme';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

function RootNavigationGuard() {
  const { session, profile, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inOnboardingGroup = segments[0] === 'onboarding';

    if (!session) {
      // Not logged in -> send to login screen
      if (!inAuthGroup) router.replace('/auth');
    } else if (session && !profile) {
      // Logged in but no profile yet -> send to onboarding
      if (!inOnboardingGroup) router.replace('/onboarding');
    } else if (session && profile) {
      // Fully logged in -> send to main tabs
      if (inAuthGroup || inOnboardingGroup) router.replace('/(tabs)');
    }
  }, [session, profile, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.safetyAmber} />
      </View>
    );
  }

  // <Slot /> acts as the placeholder where the actual current screen goes
  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootNavigationGuard />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});