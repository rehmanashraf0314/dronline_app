import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function DoctorSchedule() {
  const router = useRouter();
  const { user } = useAuthStore();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ backgroundColor: '#1e40af', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 8 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>My Schedule</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Dr. {user?.fullName}</Text>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🗓️</Text>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 8 }}>Your Availability</Text>
        <Text style={{ color: '#6b7280', textAlign: 'center', fontSize: 14, lineHeight: 22 }}>
          Your schedule is managed by the admin. Contact your administrator to update your availability or time slots.
        </Text>
      </View>
    </SafeAreaView>
  );
}
