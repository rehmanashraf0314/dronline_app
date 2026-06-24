import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { appointmentsAPI } from '../../../services/api';

export default function PatientAppointmentDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { data: appt, isLoading } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentsAPI.getById(id).then(r => r.data.data),
  });

  if (isLoading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#1e40af" />
    </View>
  );

  if (!appt) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#9ca3af' }}>Appointment not found</Text>
    </View>
  );

  const statusColors = { Active: '#16a34a', Pending: '#ca8a04', Completed: '#6b7280', Cancelled: '#dc2626' };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ backgroundColor: '#1e40af', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 10 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>{appt.serviceType}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 }}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{appt.status}</Text>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{appt.paymentStatus}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>

        {/* Video call */}
        {appt.meetingLink && appt.status === 'Active' && (
          <TouchableOpacity
            onPress={() => router.push(`/(patient)/video/${appt._id}`)}
            style={{ backgroundColor: '#16a34a', borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}
          >
            <Text style={{ fontSize: 24 }}>📹</Text>
            <View>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Join Video Consultation</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>Tap to open video call</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Appointment info */}
        <View style={S.card}>
          <Text style={S.cardTitle}>Appointment Details</Text>
          {[
            ['Date', appt.appointment?.date],
            ['Time', appt.appointment?.time],
            ['Mode', appt.appointment?.preferredMode],
            ['Doctor', appt.doctorName ? `Dr. ${appt.doctorName}` : 'Being assigned'],
            ['Service', appt.serviceType],
            ['Amount', `€${appt.payment?.amount}`],
          ].map(([k, v]) => (
            <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
              <Text style={{ color: '#6b7280', fontSize: 13 }}>{k}</Text>
              <Text style={{ color: '#1f2937', fontSize: 13, fontWeight: '500' }}>{v}</Text>
            </View>
          ))}
        </View>

        {/* Documents received */}
        {appt.consultationDocuments && (
          <View style={S.card}>
            <Text style={S.cardTitle}>Documents</Text>
            {Object.entries({
              prescription: 'Prescription',
              medicalCertificate: 'Medical Certificate',
              medicalLeave: 'Medical Leave',
              referralLetter: 'Referral Letter',
            }).map(([key, label]) => {
              const doc = appt.consultationDocuments[key];
              return (
                <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                  <Text style={{ color: '#374151', fontSize: 13 }}>{label}</Text>
                  {doc?.sent
                    ? <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: '700' }}>✓ Sent to email</Text>
                    : <Text style={{ color: '#9ca3af', fontSize: 12 }}>Not sent yet</Text>
                  }
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = {
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 10 },
};
