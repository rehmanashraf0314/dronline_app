import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI, countriesAPI, servicesAPI } from '../../services/api';
import api from '../../services/api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SPECIALIZATIONS = [
  'General Practice', 'Cardiology', 'Dermatology', 'Pediatrics',
  'Neurology', 'Orthopedics', 'Psychiatry', 'Clinical Neurophysiology',
];

const emptyForm = {
  fullName: '', email: '', specialization: 'General Practice',
  imcNumber: '', licenseAuthority: '', country: '',
  serviceId: '', serviceFee: '',
  yearsOfExperience: '', bio: '',
  availability: DAYS.map(d => ({ dayOfWeek: d, timeRanges: [], enabled: false })),
  slotDuration: '30',
};

export default function AdminDoctors() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [timeInputs, setTimeInputs] = useState({});

  const update = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), []);

  const { data: doctors, isLoading } = useQuery({
    queryKey: ['admin-doctors'],
    queryFn: () => adminAPI.getDoctors().then(r => r.data.data),
  });

  const { data: countries } = useQuery({
    queryKey: ['countries-all'],
    queryFn: () => countriesAPI.getAll().then(r => r.data.data),
  });

  const { data: services } = useQuery({
    queryKey: ['services-all'],
    queryFn: () => servicesAPI.getAll().then(r => r.data.data),
  });

  const toggleDay = (index) => {
    setForm(f => {
      const av = [...f.availability];
      av[index] = { ...av[index], enabled: !av[index].enabled };
      return { ...f, availability: av };
    });
  };

  const addTimeRange = (index) => {
    const val = timeInputs[index] || '';
    if (!val.includes('-')) return Alert.alert('Format', 'Use format: 09:00-17:00');
    setForm(f => {
      const av = [...f.availability];
      av[index] = { ...av[index], timeRanges: [...av[index].timeRanges, val.trim()] };
      return { ...f, availability: av };
    });
    setTimeInputs(t => ({ ...t, [index]: '' }));
  };

  const removeTimeRange = (dayIndex, rangeIndex) => {
    setForm(f => {
      const av = [...f.availability];
      av[dayIndex] = { ...av[dayIndex], timeRanges: av[dayIndex].timeRanges.filter((_, i) => i !== rangeIndex) };
      return { ...f, availability: av };
    });
  };

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/admin/doctors/create', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-doctors']);
      setShowForm(false);
      setForm(emptyForm);
      Alert.alert('Doctor Created ✅', 'Login credentials have been sent to the doctor\'s email.');
    },
    onError: (err) => Alert.alert('Error', err.response?.data?.message || err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => adminAPI.toggleDoctor(id),
    onSuccess: () => queryClient.invalidateQueries(['admin-doctors']),
    onError: (err) => Alert.alert('Error', err.response?.data?.message || err.message),
  });

  const handleCreate = () => {
    if (!form.fullName) return Alert.alert('Required', 'Full name is required.');
    if (!form.email) return Alert.alert('Required', 'Email is required.');
    if (!form.country) return Alert.alert('Required', 'Select a country.');
    if (!form.serviceId) return Alert.alert('Required', 'Select a service.');

    const availability = form.availability
      .filter(d => d.enabled && d.timeRanges.length > 0)
      .map(d => ({ dayOfWeek: d.dayOfWeek, timeRanges: d.timeRanges }));

    createMutation.mutate({
      fullName: form.fullName,
      email: form.email.trim().toLowerCase(),
      specialization: form.specialization,
      imcNumber: form.imcNumber,
      licenseAuthority: form.licenseAuthority,
      country: form.country,
      serviceId: form.serviceId,
      serviceFee: form.serviceFee ? Number(form.serviceFee) : undefined,
      yearsOfExperience: Number(form.yearsOfExperience) || 0,
      bio: form.bio,
      availability,
      slotDuration: Number(form.slotDuration) || 30,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>Doctors</Text>
          <TouchableOpacity
            onPress={() => setShowForm(!showForm)}
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99 }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>{showForm ? '✕ Cancel' : '+ Add Doctor'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {showForm && (
          <View style={S.card}>
            <Text style={S.cardTitle}>Add New Doctor</Text>
            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 16, backgroundColor: '#eff6ff', padding: 10, borderRadius: 8 }}>
              📧 Login credentials will be automatically emailed to the doctor after creation.
            </Text>

            <Text style={S.label}>Full Name <Text style={S.req}>*</Text></Text>
            <TextInput style={S.input} placeholder="Dr. Jane Smith"
              value={form.fullName} onChangeText={v => update('fullName', v)}
              autoCorrect={false} blurOnSubmit={false} />

            <Text style={S.label}>Email <Text style={S.req}>*</Text></Text>
            <TextInput style={S.input} placeholder="doctor@email.com"
              value={form.email} onChangeText={v => update('email', v)}
              keyboardType="email-address" autoCapitalize="none"
              autoCorrect={false} blurOnSubmit={false} />

            <Text style={S.label}>Country <Text style={S.req}>*</Text></Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {countries?.map(c => (
                  <TouchableOpacity key={c._id} onPress={() => update('country', c.name)}
                    style={[S.chip, form.country === c.name && S.chipActive]}>
                    <Text style={form.country === c.name ? S.chipTextActive : S.chipText}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
                {!countries?.length && <Text style={{ color: '#9ca3af', fontSize: 13 }}>Add countries first</Text>}
              </View>
            </ScrollView>

            <Text style={S.label}>Service <Text style={S.req}>*</Text></Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {services?.map(s => (
                  <TouchableOpacity key={s._id} onPress={() => update('serviceId', s._id)}
                    style={[S.chip, form.serviceId === s._id && S.chipActive]}>
                    <Text style={form.serviceId === s._id ? S.chipTextActive : S.chipText}>{s.title}</Text>
                  </TouchableOpacity>
                ))}
                {!services?.length && <Text style={{ color: '#9ca3af', fontSize: 13 }}>Add services first</Text>}
              </View>
            </ScrollView>

            <Text style={S.label}>Service Fee (optional)</Text>
            <TextInput style={S.input} placeholder="e.g. 75"
              value={form.serviceFee} onChangeText={v => update('serviceFee', v)}
              keyboardType="number-pad" blurOnSubmit={false} />

            <Text style={S.label}>Specialization</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {SPECIALIZATIONS.map(s => (
                  <TouchableOpacity key={s} onPress={() => update('specialization', s)}
                    style={[S.chip, form.specialization === s && S.chipActive]}>
                    <Text style={form.specialization === s ? S.chipTextActive : S.chipText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={S.label}>IMC / License No.</Text>
                <TextInput style={S.input} placeholder="407942"
                  value={form.imcNumber} onChangeText={v => update('imcNumber', v)}
                  autoCorrect={false} blurOnSubmit={false} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.label}>License Authority</Text>
                <TextInput style={S.input} placeholder="Ireland"
                  value={form.licenseAuthority} onChangeText={v => update('licenseAuthority', v)}
                  autoCorrect={false} blurOnSubmit={false} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={S.label}>Years Experience</Text>
                <TextInput style={S.input} placeholder="5"
                  value={form.yearsOfExperience} onChangeText={v => update('yearsOfExperience', v)}
                  keyboardType="number-pad" blurOnSubmit={false} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.label}>Slot Duration (min)</Text>
                <TextInput style={S.input} placeholder="30"
                  value={form.slotDuration} onChangeText={v => update('slotDuration', v)}
                  keyboardType="number-pad" blurOnSubmit={false} />
              </View>
            </View>

            <Text style={S.label}>Bio</Text>
            <TextInput style={[S.input, { minHeight: 80, textAlignVertical: 'top' }]}
              placeholder="Brief doctor bio..."
              value={form.bio} onChangeText={v => update('bio', v)}
              multiline autoCorrect={false} blurOnSubmit={false} />

            {/* Availability */}
            <Text style={[S.label, { marginBottom: 10 }]}>Availability</Text>
            <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>
              Enable days and add time ranges in format: 09:00-17:00
            </Text>
            {form.availability.map((day, index) => (
              <View key={day.dayOfWeek} style={{ marginBottom: 12, backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e5e7eb' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: day.enabled ? 10 : 0 }}>
                  <Text style={{ fontWeight: '600', color: '#374151', fontSize: 14 }}>{day.dayOfWeek}</Text>
                  <Switch value={day.enabled} onValueChange={() => toggleDay(index)}
                    trackColor={{ true: '#1e40af' }} />
                </View>
                {day.enabled && (
                  <>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      <TextInput
                        style={[S.input, { flex: 1, marginBottom: 0, fontSize: 13 }]}
                        placeholder="09:00-17:00"
                        value={timeInputs[index] || ''}
                        onChangeText={v => setTimeInputs(t => ({ ...t, [index]: v }))}
                        autoCorrect={false} blurOnSubmit={false}
                      />
                      <TouchableOpacity onPress={() => addTimeRange(index)}
                        style={{ backgroundColor: '#1e40af', paddingHorizontal: 14, borderRadius: 10, justifyContent: 'center' }}>
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {day.timeRanges.map((r, ri) => (
                        <TouchableOpacity key={ri} onPress={() => removeTimeRange(index, ri)}
                          style={{ backgroundColor: '#dbeafe', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', gap: 4 }}>
                          <Text style={{ color: '#1e40af', fontSize: 12 }}>{r}</Text>
                          <Text style={{ color: '#1e40af', fontSize: 11 }}>✕</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </View>
            ))}

            <TouchableOpacity
              style={{ backgroundColor: '#1e40af', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 8 }}
              onPress={handleCreate} disabled={createMutation.isPending}
            >
              {createMutation.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Create Doctor & Send Email</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* Doctors list */}
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 12 }}>
          All Doctors ({doctors?.length || 0})
        </Text>

        {isLoading ? <ActivityIndicator color="#1e40af" /> : doctors?.map(d => (
          <View key={d._id} style={S.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', fontSize: 15, color: '#1f2937' }}>{d.fullName}</Text>
                <Text style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>{d.specialization}</Text>
                <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 1 }}>{d.contact?.email || d.email}</Text>
                <Text style={{ color: '#9ca3af', fontSize: 12 }}>{d.contact?.address?.country}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <View style={{ backgroundColor: d.isActive ? '#dcfce7' : '#fee2e2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}>
                  <Text style={{ color: d.isActive ? '#16a34a' : '#dc2626', fontSize: 12, fontWeight: '600' }}>
                    {d.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => toggleMutation.mutate(d._id)}
                  style={{ backgroundColor: d.isActive ? '#fef2f2' : '#eff6ff', borderWidth: 1, borderColor: d.isActive ? '#fecaca' : '#bfdbfe', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
                >
                  <Text style={{ color: d.isActive ? '#dc2626' : '#1e40af', fontSize: 12, fontWeight: '600' }}>
                    {d.isActive ? 'Deactivate' : 'Activate'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {!isLoading && !doctors?.length && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🩺</Text>
            <Text style={{ color: '#9ca3af', fontSize: 15 }}>No doctors yet</Text>
            <Text style={{ color: '#d1d5db', fontSize: 13, marginTop: 4 }}>Tap "+ Add Doctor" to create one</Text>
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = {
  header: { backgroundColor: '#1e40af', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 4 },
  req: { color: '#dc2626' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, backgroundColor: '#f9fafb', marginBottom: 14, color: '#1f2937' },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  chipActive: { backgroundColor: '#1e40af', borderColor: '#1e40af' },
  chipText: { color: '#4b5563', fontSize: 13 },
  chipTextActive: { color: '#fff', fontSize: 13, fontWeight: '600' },
};
