import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { appointmentsAPI, adminAPI } from '../../../services/api';

export default function AdminAppointmentDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: appt, isLoading } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentsAPI.getById(id).then(r => r.data.data),
  });

  const { data: doctors } = useQuery({
    queryKey: ['admin-doctors'],
    queryFn: () => adminAPI.getDoctors().then(r => r.data.data),
  });

  const assignMutation = useMutation({
    mutationFn: ({ doctorId }) => appointmentsAPI.assignDoctor(id, doctorId),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointment', id]);
      Alert.alert('Done', 'Doctor assigned successfully');
    },
    onError: err => Alert.alert('Error', err.response?.data?.message || 'Failed'),
  });

  const showAssign = () => {
    if (!doctors?.length) return Alert.alert('No doctors', 'Add doctors first');
    Alert.alert('Assign Doctor', 'Select:', [
      ...doctors.filter(d => d.isActive).map(d => ({
        text: `${d.fullName} — ${d.specialization}`,
        onPress: () => assignMutation.mutate({ doctorId: d._id }),
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  if (isLoading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color="#1e40af" /></View>;
  if (!appt) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#9ca3af' }}>Not found</Text></View>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ backgroundColor: '#1e40af', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 10 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>{appt.patientName}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{appt.serviceType}</Text>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>

        {/* Assign Doctor */}
        <View style={S.card}>
          <Text style={S.cardTitle}>Doctor Assignment</Text>
          <Text style={{ color: '#374151', fontSize: 14, marginBottom: 12 }}>
            {appt.doctorName ? `Assigned: Dr. ${appt.doctorName}` : '⚠️ No doctor assigned yet'}
          </Text>
          <TouchableOpacity onPress={showAssign}
            style={{ backgroundColor: '#1e40af', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>
              {appt.doctorName ? 'Reassign Doctor' : 'Assign Doctor'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Appointment Info */}
        <View style={S.card}>
          <Text style={S.cardTitle}>Appointment</Text>
          {[
            ['Status', appt.status],
            ['Date', appt.appointment?.date],
            ['Time', appt.appointment?.time],
            ['Mode', appt.appointment?.preferredMode],
            ['Payment', appt.paymentStatus],
            ['Amount', `€${appt.payment?.amount}`],
          ].map(([k, v]) => (
            <View key={k} style={S.row}>
              <Text style={S.rowLabel}>{k}</Text>
              <Text style={S.rowValue}>{v || 'N/A'}</Text>
            </View>
          ))}
        </View>

        {/* Patient Info */}
        <View style={S.card}>
          <Text style={S.cardTitle}>Patient</Text>
          {[
            ['Name', appt.patientName],
            ['Email', appt.patientEmail],
            ['Phone', appt.patientPhone],
            ['DOB', appt.patient?.dob],
            ['Gender', appt.patient?.gender],
            ['National ID', appt.patient?.nationalId],
            ['Country', appt.patient?.address?.country],
            ['City', appt.patient?.address?.city],
          ].filter(([, v]) => v).map(([k, v]) => (
            <View key={k} style={S.row}>
              <Text style={S.rowLabel}>{k}</Text>
              <Text style={S.rowValue}>{v}</Text>
            </View>
          ))}
        </View>

        {/* Medical Info */}
        <View style={S.card}>
          <Text style={S.cardTitle}>Medical</Text>
          <Text style={{ color: '#6b7280', fontSize: 12, marginBottom: 4 }}>Symptoms</Text>
          <Text style={{ color: '#1f2937', fontSize: 14, marginBottom: 12 }}>{appt.medical?.symptoms || 'N/A'}</Text>
          {[
            ['Urgency', appt.medical?.urgency],
            ['Duration', appt.medical?.symptomDuration],
          ].map(([k, v]) => (
            <View key={k} style={S.row}>
              <Text style={S.rowLabel}>{k}</Text>
              <Text style={[S.rowValue, k === 'Urgency' && v === 'Urgent' && { color: '#dc2626', fontWeight: '700' }]}>{v || 'N/A'}</Text>
            </View>
          ))}
          {appt.medical?.allergies?.length > 0 && (
            <>
              <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 8, marginBottom: 4 }}>Allergies</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {appt.medical.allergies.map((a, i) => (
                  <View key={i} style={{ backgroundColor: '#fef2f2', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 }}>
                    <Text style={{ color: '#dc2626', fontSize: 12 }}>{a}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = {
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  rowLabel: { color: '#6b7280', fontSize: 13 },
  rowValue: { color: '#1f2937', fontSize: 13, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
};
