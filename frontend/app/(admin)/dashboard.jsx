import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { adminAPI, appointmentsAPI } from '../../services/api';

const StatCard = ({ label, value, icon, color }) => (
  <View className={`flex-1 rounded-xl p-4 items-center ${color}`}>
    <Text className="text-2xl mb-1">{icon}</Text>
    <Text className="text-2xl font-bold text-white">{value ?? '—'}</Text>
    <Text className="text-white/70 text-xs text-center">{label}</Text>
  </View>
);

const NavCard = ({ label, icon, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className="bg-white rounded-xl border border-border p-4 flex-row items-center gap-4 mb-3"
  >
    <View className="w-12 h-12 bg-primary/10 rounded-xl items-center justify-center">
      <Text className="text-2xl">{icon}</Text>
    </View>
    <View className="flex-1">
      <Text className="font-semibold text-gray-800">{label}</Text>
      <Text className="text-gray-400 text-xs">Manage →</Text>
    </View>
  </TouchableOpacity>
);

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminAPI.getStats().then((r) => r.data.data),
  });

  const { data: recentData } = useQuery({
    queryKey: ['admin-appointments'],
    queryFn: () => appointmentsAPI.getAll({ limit: 5 }).then((r) => r.data.data),
  });

  return (
    <View className="flex-1 bg-surface">
      <View className="bg-primary px-4 pt-12 pb-6">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-white/70 text-sm">Admin Panel</Text>
            <Text className="text-white text-xl font-bold">DrOnline</Text>
          </View>
          <TouchableOpacity onPress={logout} className="bg-white/20 px-3 py-1.5 rounded-full">
            <Text className="text-white text-sm">Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        {isLoading ? <ActivityIndicator color="#fff" /> : (
          <View className="flex-row gap-2">
            <StatCard label="Total Appts" value={stats?.totalAppointments} icon="📅" color="bg-blue-500" />
            <StatCard label="Active" value={stats?.activeAppointments} icon="✅" color="bg-green-500" />
            <StatCard label="Doctors" value={stats?.totalDoctors} icon="🩺" color="bg-purple-500" />
            <StatCard label="Patients" value={stats?.totalPatients} icon="👥" color="bg-orange-500" />
          </View>
        )}
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-base font-bold text-gray-800 mb-3">Manage</Text>

        <NavCard label="Appointments" icon="📅" onPress={() => router.push('/(admin)/appointments')} />
        <NavCard label="Doctors" icon="🩺" onPress={() => router.push('/(admin)/doctors')} />
        <NavCard label="Services" icon="🏥" onPress={() => router.push('/(admin)/services')} />
        <NavCard label="Countries" icon="🌍" onPress={() => router.push('/(admin)/countries')} />

        {/* Recent Appointments */}
        {recentData?.length > 0 && (
          <>
            <Text className="text-base font-bold text-gray-800 mb-3 mt-2">Recent Appointments</Text>
            {recentData.map((a) => (
              <TouchableOpacity
                key={a._id}
                onPress={() => router.push(`/(admin)/appointment/${a._id}`)}
                className="bg-white rounded-xl border border-border p-4 mb-2"
              >
                <View className="flex-row justify-between">
                  <Text className="font-semibold text-gray-800 text-sm">{a.patientName}</Text>
                  <Text className={`text-xs font-medium ${
                    a.status === 'Active' ? 'text-green-600' :
                    a.status === 'Pending' ? 'text-yellow-600' : 'text-gray-400'
                  }`}>{a.status}</Text>
                </View>
                <Text className="text-gray-500 text-xs">{a.serviceType} · {a.appointment?.date}</Text>
                <Text className="text-gray-400 text-xs">Dr. {a.doctorName || 'Unassigned'}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
