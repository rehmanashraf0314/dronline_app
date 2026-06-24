import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsAPI } from '../../../services/api';

const DOCS = [
  { key: 'prescription', label: 'Prescription', icon: '💊' },
  { key: 'medicalCertificate', label: 'Medical Certificate', icon: '📋' },
  { key: 'medicalLeave', label: 'Medical Leave', icon: '🏥' },
  { key: 'referralLetter', label: 'Referral Letter', icon: '📨' },
];

export default function ConsultationDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [sendingDoc, setSendingDoc] = useState(null);

  const { data: appt, isLoading } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentsAPI.getById(id).then((r) => r.data.data),
  });

  const sendDocMutation = useMutation({
    mutationFn: ({ docType }) =>
      appointmentsAPI.sendDocument(id, { docType, fileUrl: null }),
    onSuccess: (_, { docType }) => {
      queryClient.invalidateQueries(['appointment', id]);
      Alert.alert('Sent ✅', `${docType} sent to patient's email.`);
      setSendingDoc(null);
    },
    onError: (err) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send document');
      setSendingDoc(null);
    },
  });

  const handleSendDoc = (docType, label) => {
    Alert.alert(
      `Send ${label}?`,
      `This will email the ${label} to the patient immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            setSendingDoc(docType);
            sendDocMutation.mutate({ docType });
          },
        },
      ]
    );
  };

  if (isLoading) return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#1e40af" />
    </View>
  );

  if (!appt) return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-gray-400">Appointment not found</Text>
    </View>
  );

  const docs = appt.consultationDocuments || {};

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View className="bg-primary px-4 pt-12 pb-5">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-white/70">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">{appt.patientName}</Text>
        <Text className="text-white/70 text-sm">{appt.serviceType}</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>

        {/* Appointment Info */}
        <View className="bg-white rounded-xl border border-border p-4 mb-4">
          <Text className="font-semibold text-gray-800 mb-3">Appointment Details</Text>
          {[
            ['Date', appt.appointment?.date],
            ['Time', appt.appointment?.time],
            ['Mode', appt.appointment?.preferredMode],
            ['Status', appt.status],
            ['Payment', appt.paymentStatus],
          ].map(([k, v]) => (
            <View key={k} className="flex-row justify-between py-1.5 border-b border-border/50">
              <Text className="text-gray-500 text-sm">{k}</Text>
              <Text className="text-gray-800 text-sm font-medium">{v}</Text>
            </View>
          ))}
        </View>

        {/* Patient Info */}
        <View className="bg-white rounded-xl border border-border p-4 mb-4">
          <Text className="font-semibold text-gray-800 mb-3">Patient Information</Text>
          {[
            ['Name', appt.patientName],
            ['Email', appt.patientEmail],
            ['Phone', appt.patientPhone],
            ['DOB', appt.patient?.dob],
            ['Gender', appt.patient?.gender],
            ['National ID', appt.patient?.nationalId],
            ['Country', appt.patient?.address?.country],
          ].map(([k, v]) => v ? (
            <View key={k} className="flex-row justify-between py-1.5 border-b border-border/50">
              <Text className="text-gray-500 text-sm">{k}</Text>
              <Text className="text-gray-800 text-sm font-medium">{v}</Text>
            </View>
          ) : null)}
        </View>

        {/* Medical Info */}
        <View className="bg-white rounded-xl border border-border p-4 mb-4">
          <Text className="font-semibold text-gray-800 mb-3">Medical Information</Text>

          <Text className="text-xs text-gray-500 mb-1">Symptoms</Text>
          <Text className="text-gray-800 text-sm mb-3">{appt.medical?.symptoms || 'N/A'}</Text>

          <Text className="text-xs text-gray-500 mb-1">Duration</Text>
          <Text className="text-gray-800 text-sm mb-3">{appt.medical?.symptomDuration || 'N/A'}</Text>

          <Text className="text-xs text-gray-500 mb-1">Urgency</Text>
          <Text className={`text-sm font-semibold mb-3 ${
            appt.medical?.urgency === 'Urgent' ? 'text-red-500' :
            appt.medical?.urgency === 'Soon' ? 'text-yellow-600' : 'text-green-600'
          }`}>{appt.medical?.urgency}</Text>

          {appt.medical?.allergies?.length > 0 && (
            <>
              <Text className="text-xs text-gray-500 mb-1">Allergies</Text>
              <View className="flex-row flex-wrap gap-2 mb-3">
                {appt.medical.allergies.map((a, i) => (
                  <View key={i} className="bg-red-50 border border-red-200 rounded-full px-3 py-1">
                    <Text className="text-red-700 text-xs">{a}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {appt.medical?.conditions?.length > 0 && (
            <>
              <Text className="text-xs text-gray-500 mb-1">Conditions</Text>
              <View className="flex-row flex-wrap gap-2 mb-3">
                {appt.medical.conditions.map((c, i) => (
                  <View key={i} className="bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1">
                    <Text className="text-yellow-700 text-xs">{c}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {appt.medical?.meds?.length > 0 && (
            <>
              <Text className="text-xs text-gray-500 mb-1">Current Medications</Text>
              <View className="flex-row flex-wrap gap-2">
                {appt.medical.meds.map((m, i) => (
                  <View key={i} className="bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
                    <Text className="text-blue-700 text-xs">{m}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Video Call */}
        {appt.meetingLink && (
          <TouchableOpacity
            onPress={() => router.push(`/(doctor)/video/${appt._id}`)}
            className="bg-green-500 rounded-xl p-4 mb-4 flex-row items-center justify-center gap-3"
          >
            <Text className="text-2xl">📹</Text>
            <View>
              <Text className="text-white font-bold text-base">Join Video Consultation</Text>
              <Text className="text-white/70 text-xs">Tap to open video call</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Consultation Documents */}
        <View className="bg-white rounded-xl border border-border p-4 mb-6">
          <Text className="font-semibold text-gray-800 mb-1">Consultation Documents</Text>
          <Text className="text-xs text-gray-400 mb-3">Sent directly to patient's email</Text>

          {DOCS.map((doc) => {
            const sent = docs[doc.key]?.sent;
            const sentAt = docs[doc.key]?.sentAt;
            const isSending = sendingDoc === doc.key;

            return (
              <View key={doc.key} className="flex-row items-center justify-between py-3 border-b border-border/50">
                <View className="flex-row items-center gap-3">
                  <Text className="text-xl">{doc.icon}</Text>
                  <View>
                    <Text className="text-gray-800 text-sm font-medium">{doc.label}</Text>
                    {sent && sentAt && (
                      <Text className="text-green-600 text-xs">
                        Sent {new Date(sentAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>

                {sent ? (
                  <View className="bg-green-100 px-3 py-1.5 rounded-full">
                    <Text className="text-green-700 text-xs font-medium">✓ Sent</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleSendDoc(doc.key, doc.label)}
                    disabled={isSending}
                    className="bg-primary px-3 py-1.5 rounded-full"
                  >
                    {isSending
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text className="text-white text-xs font-medium">Send</Text>
                    }
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
