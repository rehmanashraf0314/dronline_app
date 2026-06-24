import '../global.css';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useAuthStore } from '../store/authStore';

const queryClient = new QueryClient();

function AuthGuard() {
  const { user, isLoading, init } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => { init(); }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    const inBooking = segments[0] === '(booking)';
    if (!user && !inAuth && !inBooking) {
      router.replace('/(auth)/login');
    } else if (user && inAuth) {
      if (user.role === 'admin') router.replace('/(admin)/dashboard');
      else if (user.role === 'doctor') router.replace('/(doctor)/dashboard');
      else router.replace('/(patient)/home');
    }
  }, [user, isLoading, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'}>
        <AuthGuard />
        <Stack screenOptions={{ headerShown: false }} />
      </StripeProvider>
    </QueryClientProvider>
  );
}
