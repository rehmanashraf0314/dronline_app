import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';

export default function BookingSuccess() {
  const router = useRouter();
  const { user, isGuest } = useAuthStore();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
        {/* Success icon */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View style={{ width: 100, height: 100, backgroundColor: '#dcfce7', borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 50 }}>✅</Text>
          </View>
          <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#1f2937', marginBottom: 8, textAlign: 'center' }}>
            Appointment Booked!
          </Text>
          <Text style={{ color: '#6b7280', textAlign: 'center', fontSize: 15, lineHeight: 22 }}>
            Your appointment has been confirmed and payment received.
          </Text>
        </View>

        {/* Email sent notice */}
        <View style={{ backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 16, padding: 16, marginBottom: 24 }}>
          <Text style={{ color: '#1e40af', fontWeight: '700', fontSize: 14, marginBottom: 6 }}>📧 Check Your Email</Text>
          <Text style={{ color: '#3b82f6', fontSize: 13, lineHeight: 20 }}>
            We've sent a confirmation email with your appointment details and the video consultation link to join at your scheduled time.
          </Text>
        </View>

        {/* Actions based on auth state */}
        {user && !isGuest ? (
          // Logged in patient
          <TouchableOpacity
            style={{ backgroundColor: '#1e40af', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 }}
            onPress={() => router.replace('/(patient)/home')}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>View My Appointments</Text>
          </TouchableOpacity>
        ) : (
          // Guest user
          <>
            <View style={{ backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa', borderRadius: 14, padding: 16, marginBottom: 20 }}>
              <Text style={{ color: '#c2410c', fontWeight: '700', fontSize: 14, marginBottom: 6 }}>💡 Want to track your appointment?</Text>
              <Text style={{ color: '#9a3412', fontSize: 13, lineHeight: 20 }}>
                Sign in or create an account to view your appointment history, download medical documents, and join your video consultation directly from the app.
              </Text>
            </View>

            <TouchableOpacity
              style={{ backgroundColor: '#1e40af', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 }}
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Sign In to View Appointment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 12 }}
              onPress={() => router.replace('/(auth)/register')}
            >
              <Text style={{ color: '#1e40af', fontWeight: '600', fontSize: 15 }}>Create Account</Text>
              <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>Track appointments anytime</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ paddingVertical: 12, alignItems: 'center' }}
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text style={{ color: '#9ca3af', fontSize: 14 }}>Continue without account</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
