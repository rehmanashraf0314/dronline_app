import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { appointmentsAPI } from '../../services/api';

const statusStyle = {
  Active:    { bg: '#dcfce7', text: '#16a34a' },
  Pending:   { bg: '#fef9c3', text: '#ca8a04' },
  Completed: { bg: '#f3f4f6', text: '#6b7280' },
  Cancelled: { bg: '#fee2e2', text: '#dc2626' },
};

export default function PatientHome() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: () => appointmentsAPI.getMine().then(r => r.data.data),
    retry: 1,
  });

  const upcoming = data?.filter(a => ['Active', 'Pending'].includes(a.status)) || [];
  const past = data?.filter(a => ['Completed', 'Cancelled'].includes(a.status)) || [];

  const AppCard = ({ a, dim }) => {
    const st = statusStyle[a.status] || statusStyle.Pending;
    return (
      <TouchableOpacity
        onPress={() => router.push(`/(patient)/appointment/${a._id}`)}
        style={{
          backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb',
          padding: 16, marginBottom: 12, opacity: dim ? 0.7 : 1,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <Text style={{ fontWeight: '700', color: '#1f2937', fontSize: 15, flex: 1 }}>{a.serviceType}</Text>
          <View style={{ backgroundColor: st.bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 }}>
            <Text style={{ color: st.text, fontSize: 11, fontWeight: '700' }}>{a.status}</Text>
          </View>
        </View>
        <Text style={{ color: '#6b7280', fontSize: 13 }}>
          {a.doctorName ? `Dr. ${a.doctorName}` : 'Doctor being assigned'}
        </Text>
        <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>
          {a.appointment?.date} at {a.appointment?.time}
        </Text>
        {a.meetingLink && a.status === 'Active' && (
          <TouchableOpacity
            onPress={() => router.push(`/(patient)/video/${a._id}`)}
            style={{ marginTop: 10, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}
          >
            <Text style={{ fontSize: 16 }}>📹</Text>
            <Text style={{ color: '#1e40af', fontSize: 13, fontWeight: '600' }}>Join Video Consultation</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#1e40af', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Welcome back</Text>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 2 }}>
              {user?.fullName || user?.email?.split('@')[0]}
            </Text>
          </View>
          <TouchableOpacity onPress={logout}
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99 }}>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#1e40af" />}
      >
        {/* Book button */}
        <TouchableOpacity
          onPress={() => router.push('/(booking)/step1-patient-details')}
          style={{ backgroundColor: '#1e40af', borderRadius: 18, padding: 20, marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <View>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Book Appointment</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>Consult a doctor online today</Text>
          </View>
          <Text style={{ fontSize: 40 }}>🩺</Text>
        </TouchableOpacity>

        {/* Upcoming */}
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 12 }}>
          Upcoming ({upcoming.length})
        </Text>

        {isLoading ? (
          <ActivityIndicator color="#1e40af" style={{ marginTop: 20 }} />
        ) : upcoming.length === 0 ? (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', padding: 24, alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📅</Text>
            <Text style={{ color: '#9ca3af', fontSize: 14 }}>No upcoming appointments</Text>
            <Text style={{ color: '#d1d5db', fontSize: 12, marginTop: 4 }}>Book one above to get started</Text>
          </View>
        ) : (
          upcoming.map(a => <AppCard key={a._id} a={a} />)
        )}

        {/* Past */}
        {past.length > 0 && (
          <>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#6b7280', marginBottom: 12, marginTop: 8 }}>
              Past ({past.length})
            </Text>
            {past.map(a => <AppCard key={a._id} a={a} dim />)}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
