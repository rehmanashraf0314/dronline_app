import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { appointmentsAPI } from '../../services/api';

const STATUS = ['All', 'Active', 'Pending', 'Completed', 'Cancelled'];
const statusStyle = {
  Active:    { bg: '#dcfce7', text: '#16a34a' },
  Pending:   { bg: '#fef9c3', text: '#ca8a04' },
  Completed: { bg: '#f3f4f6', text: '#6b7280' },
  Cancelled: { bg: '#fee2e2', text: '#dc2626' },
};

export default function AdminAppointments() {
  const router = useRouter();
  const [filter, setFilter] = useState('All');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-appointments-list', filter],
    queryFn: () => appointmentsAPI.getAll(filter !== 'All' ? { status: filter } : {}).then(r => r.data.data),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ backgroundColor: '#1e40af', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 8 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>Appointments</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{data?.length || 0} records</Text>
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', maxHeight: 52 }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row' }}
      >
        {STATUS.map(s => (
          <TouchableOpacity key={s} onPress={() => setFilter(s)}
            style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 99, backgroundColor: filter === s ? '#1e40af' : '#f3f4f6' }}>
            <Text style={{ color: filter === s ? '#fff' : '#374151', fontWeight: '600', fontSize: 13 }}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={{ flex: 1, padding: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#1e40af" />}
      >
        {isLoading ? <ActivityIndicator color="#1e40af" style={{ marginTop: 40 }} /> :
          data?.map(a => {
            const st = statusStyle[a.status] || statusStyle.Pending;
            return (
              <TouchableOpacity
                key={a._id}
                onPress={() => router.push(`/(admin)/appointment/${a._id}`)}
                style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', padding: 16, marginBottom: 12 }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <Text style={{ fontWeight: '700', color: '#1f2937', fontSize: 15, flex: 1 }}>{a.patientName}</Text>
                  <View style={{ backgroundColor: st.bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 }}>
                    <Text style={{ color: st.text, fontSize: 11, fontWeight: '700' }}>{a.status}</Text>
                  </View>
                </View>
                <Text style={{ color: '#6b7280', fontSize: 13 }}>{a.serviceType}</Text>
                <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>{a.appointment?.date} at {a.appointment?.time}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text style={{ color: a.doctorName ? '#374151' : '#f59e0b', fontSize: 12 }}>
                    {a.doctorName ? `Dr. ${a.doctorName}` : '⚠️ Unassigned'}
                  </Text>
                  <Text style={{ color: '#9ca3af', fontSize: 12 }}>{a.paymentStatus}</Text>
                </View>
                <Text style={{ color: '#bfdbfe', fontSize: 11, marginTop: 4, textAlign: 'right' }}>Tap to view details →</Text>
              </TouchableOpacity>
            );
          })
        }
        {!isLoading && !data?.length && (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
            <Text style={{ color: '#9ca3af', fontSize: 15 }}>No appointments found</Text>
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
