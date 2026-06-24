import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesAPI, countriesAPI } from '../../services/api';

export default function AdminServices() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', price: '', currency: 'EUR',
    category: 'General', countries: [],
  });

  const update = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), []);

  const { data: services, isLoading } = useQuery({
    queryKey: ['services-all'],
    queryFn: () => servicesAPI.getAll().then(r => r.data.data),
  });

  const { data: countries } = useQuery({
    queryKey: ['countries-all'],
    queryFn: () => countriesAPI.getAll().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => servicesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['services-all']);
      setShowForm(false);
      setForm({ title: '', description: '', price: '', currency: 'EUR', category: 'General', countries: [] });
      Alert.alert('Success', 'Service created.');
    },
    onError: (err) => Alert.alert('Error', err.response?.data?.message || err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => servicesAPI.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['services-all']),
    onError: (err) => Alert.alert('Error', err.response?.data?.message || err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => servicesAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['services-all']),
    onError: (err) => Alert.alert('Error', err.response?.data?.message || err.message),
  });

  const toggleCountry = (name) => {
    setForm(f => ({
      ...f,
      countries: f.countries.includes(name)
        ? f.countries.filter(c => c !== name)
        : [...f.countries, name],
    }));
  };

  const handleCreate = () => {
    if (!form.title) return Alert.alert('Required', 'Service title is required.');
    if (!form.price || isNaN(Number(form.price))) return Alert.alert('Required', 'Enter a valid price.');
    if (form.countries.length === 0) return Alert.alert('Required', 'Select at least one country.');
    createMutation.mutate({ ...form, price: Number(form.price), isEnabled: true });
  };

  const confirmDelete = (id, title) => {
    Alert.alert('Delete Service', `Remove "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>Services</Text>
          <TouchableOpacity
            onPress={() => setShowForm(!showForm)}
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99 }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>{showForm ? '✕ Cancel' : '+ Add'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Create form */}
        {showForm && (
          <View style={S.card}>
            <Text style={S.cardTitle}>Add New Service</Text>

            <Text style={S.label}>Service Title <Text style={S.req}>*</Text></Text>
            <TextInput style={S.input} placeholder="e.g. Online Doctor Consultation"
              value={form.title} onChangeText={v => update('title', v)}
              autoCorrect={false} blurOnSubmit={false} />

            <Text style={S.label}>Description</Text>
            <TextInput style={[S.input, { minHeight: 80, textAlignVertical: 'top' }]}
              placeholder="Brief description of this service..."
              value={form.description} onChangeText={v => update('description', v)}
              multiline autoCorrect={false} blurOnSubmit={false} />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={S.label}>Price <Text style={S.req}>*</Text></Text>
                <TextInput style={S.input} placeholder="40"
                  value={form.price} onChangeText={v => update('price', v)}
                  keyboardType="decimal-pad" blurOnSubmit={false} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.label}>Currency</Text>
                <View style={[S.input, { justifyContent: 'center' }]}>
                  <Text style={{ color: '#1f2937' }}>EUR €</Text>
                </View>
              </View>
            </View>

            <Text style={S.label}>Category</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {['General', 'Specialist', 'Mental Health', 'Pediatrics'].map(c => (
                <TouchableOpacity key={c} onPress={() => update('category', c)}
                  style={[S.chip, form.category === c && S.chipActive]}>
                  <Text style={form.category === c ? S.chipTextActive : S.chipText}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={S.label}>Available Countries <Text style={S.req}>*</Text></Text>
            <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>
              Select which countries this service is available in
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {countries?.map(c => (
                <TouchableOpacity key={c._id} onPress={() => toggleCountry(c.name)}
                  style={[S.chip, form.countries.includes(c.name) && S.chipActive]}>
                  <Text style={form.countries.includes(c.name) ? S.chipTextActive : S.chipText}>{c.name}</Text>
                </TouchableOpacity>
              ))}
              {!countries?.length && (
                <Text style={{ color: '#9ca3af', fontSize: 13 }}>No countries yet — add countries first</Text>
              )}
            </View>

            <TouchableOpacity
              style={{ backgroundColor: '#1e40af', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
              onPress={handleCreate} disabled={createMutation.isPending}
            >
              {createMutation.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Create Service</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* Services list */}
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 12 }}>
          All Services ({services?.length || 0})
        </Text>

        {isLoading ? <ActivityIndicator color="#1e40af" /> : services?.map(s => (
          <View key={s._id} style={S.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', fontSize: 15, color: '#1f2937' }}>{s.title}</Text>
                <Text style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>€{s.price} · {s.category}</Text>
                {s.description ? <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>{s.description}</Text> : null}
              </View>
              <Text style={{ fontWeight: 'bold', color: '#1e40af', fontSize: 18 }}>€{s.price}</Text>
            </View>

            {/* Countries */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
              {s.countries?.map(c => (
                <View key={c} style={{ backgroundColor: '#eff6ff', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 }}>
                  <Text style={{ color: '#1e40af', fontSize: 11 }}>{c}</Text>
                </View>
              ))}
            </View>

            {/* Toggles */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ color: '#374151', fontSize: 13 }}>Enabled</Text>
              <Switch
                value={s.isEnabled}
                onValueChange={v => updateMutation.mutate({ id: s._id, data: { isEnabled: v } })}
                trackColor={{ true: '#1e40af' }}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ color: '#374151', fontSize: 13 }}>Coming Soon</Text>
              <Switch
                value={s.isComingSoon}
                onValueChange={v => updateMutation.mutate({ id: s._id, data: { isComingSoon: v } })}
                trackColor={{ true: '#d97706' }}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: '#374151', fontSize: 13 }}>Temporarily Closed</Text>
              <Switch
                value={s.isTemporarilyClosed}
                onValueChange={v => updateMutation.mutate({ id: s._id, data: { isTemporarilyClosed: v } })}
                trackColor={{ true: '#dc2626' }}
              />
            </View>

            <TouchableOpacity
              onPress={() => confirmDelete(s._id, s.title)}
              style={{ backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
            >
              <Text style={{ color: '#dc2626', fontWeight: '600', fontSize: 13 }}>Delete Service</Text>
            </TouchableOpacity>
          </View>
        ))}

        {!isLoading && !services?.length && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🏥</Text>
            <Text style={{ color: '#9ca3af', fontSize: 15 }}>No services yet</Text>
            <Text style={{ color: '#d1d5db', fontSize: 13, marginTop: 4 }}>Tap "+ Add" to create your first service</Text>
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
