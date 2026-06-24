import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { appointmentsAPI } from '../../services/api';

export default function DoctorDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['doctor-appointments'],
    queryFn: () => appointmentsAPI.getDoctorMine().then((r) => r.data.data),
  });

  const today = new Date().toISOString().split('T')[0];
  
  // Sort and filter appointments
  const sortedData = data ? [...data].sort((a, b) => {
    // Priority: Today > Upcoming Urgent > Upcoming > Completed
    const dateA = a.appointment?.date || '';
    const timeA = a.appointment?.time || '00:00';
    const dateB = b.appointment?.date || '';
    const timeB = b.appointment?.time || '00:00';
    
    // Today appointments first
    if (dateA === today && dateB !== today) return -1;
    if (dateA !== today && dateB === today) return 1;
    
    // Active status before completed
    if (a.status === 'Active' && b.status !== 'Active') return -1;
    if (a.status !== 'Active' && b.status === 'Active') return 1;
    
    // Urgent before routine
    if (a.medical?.urgency === 'Urgent' && b.medical?.urgency !== 'Urgent') return -1;
    if (a.medical?.urgency !== 'Urgent' && b.medical?.urgency === 'Urgent') return 1;
    
    // Sort by date and time
    const dateTimeA = `${dateA}${timeA}`;
    const dateTimeB = `${dateB}${timeB}`;
    return dateTimeA.localeCompare(dateTimeB);
  }) : [];

  const todayAppts = sortedData.filter((a) => a.appointment?.date === today) || [];
  const upcoming = sortedData.filter((a) => a.appointment?.date > today && a.status === 'Active') || [];
  const completed = sortedData.filter((a) => a.status === 'Completed') || [];

  const AppointmentCard = ({ a }) => {
    const isUrgent = a.medical?.urgency === 'Urgent';
    const isPending = a.status === 'Pending';
    
    return (
      <TouchableOpacity
        onPress={() => router.push(`/(doctor)/consultation/${a._id}`)}
        className={`rounded-xl border p-4 mb-3 ${
          isPending 
            ? 'bg-yellow-50 border-yellow-200' 
            : isUrgent 
            ? 'bg-red-50 border-red-200' 
            : 'bg-white border-border'
        }`}
      >
        <View className="flex-row justify-between items-start mb-1">
          <Text className="font-semibold text-gray-800 flex-1">{a.patientName}</Text>
          <Text className="text-primary font-bold">{a.appointment?.time}</Text>
        </View>
        
        <Text className="text-gray-500 text-sm">{a.serviceType || 'Consultation'}</Text>
        
        <View className="flex-row items-center gap-2 mt-1">
          <Text className={`text-xs font-semibold px-2 py-1 rounded ${
            isUrgent ? 'bg-red-200 text-red-700' : 'bg-gray-200 text-gray-700'
          }`}>
            {a.medical?.urgency || 'Routine'}
          </Text>
          <Text className={`text-xs px-2 py-1 rounded ${
            a.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {a.status}
          </Text>
        </View>

        {a.medical?.symptoms && (
          <Text className="text-gray-400 text-xs mt-2" numberOfLines={2}>
            Symptoms: {a.medical.symptoms}
          </Text>
        )}

        {a.meetingLink && a.status === 'Active' && (
          <TouchableOpacity
            onPress={() => router.push(`/(doctor)/video/${a._id}`)}
            className="mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2"
          >
            <Text className="text-green-700 text-sm font-medium">📹 Join Video Call</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-surface">
      <View className="bg-primary px-4 pt-12 pb-6">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white/70 text-sm">Doctor Dashboard</Text>
            <Text className="text-white text-xl font-bold">Dr. {user?.fullName}</Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={() => refetch()} className="bg-white/20 px-3 py-1.5 rounded-full">
              <Text className="text-white text-sm">🔄 Refresh</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(doctor)/schedule')} className="bg-white/20 px-3 py-1.5 rounded-full">
              <Text className="text-white text-sm">Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} className="bg-white/20 px-3 py-1.5 rounded-full">
              <Text className="text-white text-sm">Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row gap-3 mt-4">
          <View className="flex-1 bg-white/20 rounded-xl p-3 items-center">
            <Text className="text-white text-2xl font-bold">{todayAppts.length}</Text>
            <Text className="text-white/70 text-xs">Today</Text>
          </View>
          <View className="flex-1 bg-white/20 rounded-xl p-3 items-center">
            <Text className="text-white text-2xl font-bold">{upcoming.length}</Text>
            <Text className="text-white/70 text-xs">Upcoming</Text>
          </View>
          <View className="flex-1 bg-white/20 rounded-xl p-3 items-center">
            <Text className="text-white text-2xl font-bold">{data?.length || 0}</Text>
            <Text className="text-white/70 text-xs">Total</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#1e40af" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Today's Appointments */}
            <Text className="text-base font-bold text-gray-800 mb-3">
              📅 Today's Appointments ({todayAppts.length})
            </Text>
            {todayAppts.length === 0 ? (
              <View className="bg-white rounded-xl border border-border p-5 items-center mb-4">
                <Text className="text-gray-400">No appointments today</Text>
              </View>
            ) : (
              todayAppts.map((a) => <AppointmentCard key={a._id} a={a} />)
            )}

            {/* Upcoming Appointments */}
            {upcoming.length > 0 && (
              <>
                <Text className="text-base font-bold text-gray-800 mb-3 mt-6">
                  🗓️ Upcoming ({upcoming.length})
                </Text>
                {upcoming.map((a) => <AppointmentCard key={a._id} a={a} />)}
              </>
            )}

            {/* Completed Appointments */}
            {completed.length > 0 && (
              <>
                <Text className="text-base font-bold text-gray-600 mb-3 mt-6">
                  ✅ Completed ({completed.length})
                </Text>
                {completed.map((a) => <AppointmentCard key={a._id} a={a} />)}
              </>
            )}

            {sortedData.length === 0 && !isLoading && (
              <View className="bg-white rounded-xl border border-border p-8 items-center mt-4">
                <Text className="text-2xl mb-2">📭</Text>
                <Text className="text-gray-600 font-semibold">No Appointments</Text>
                <Text className="text-gray-400 text-sm mt-1">You don't have any appointments yet.</Text>
              </View>
            )}
          </>
        )}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
