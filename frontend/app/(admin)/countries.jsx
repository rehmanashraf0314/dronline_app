import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { countriesAPI } from '../../services/api';

const TIMEZONES = [
  'Europe/Lisbon', 'Europe/Dublin', 'Europe/London',
  'Europe/Madrid', 'Europe/Paris', 'Europe/Berlin',
  'Europe/Rome', 'Europe/Amsterdam',
];

export default function AdminCountries() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', timezone: 'Europe/Lisbon' });

  const { data, isLoading } = useQuery({
    queryKey: ['countries-all'],
    queryFn: () => countriesAPI.getAll().then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => countriesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['countries-all']);
      setShowForm(false);
      setForm({ name: '', timezone: 'Europe/Lisbon' });
      Alert.alert('Success', 'Country added.');
    },
    onError: (err) => Alert.alert('Error', err.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => countriesAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['countries-all']),
    onError: (err) => Alert.alert('Error', err.response?.data?.message || 'Failed'),
  });

  const confirmDelete = (id, name) => {
    Alert.alert('Delete Country', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  return (
    <View className="flex-1 bg-surface">
      <View className="bg-primary px-4 pt-12 pb-5">
        <TouchableOpacity onPress={() => router.back()} className="mb-2">
          <Text className="text-white/70">← Back</Text>
        </TouchableOpacity>
        <View className="flex-row justify-between items-center">
          <Text className="text-white text-xl font-bold">Countries</Text>
          <TouchableOpacity
            onPress={() => setShowForm(!showForm)}
            className="bg-white/20 px-4 py-2 rounded-full"
          >
            <Text className="text-white font-medium">{showForm ? '✕ Cancel' : '+ Add'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {/* Add form */}
        {showForm && (
          <View className="bg-white border border-border rounded-xl p-4 mb-4">
            <Text className="font-semibold text-gray-800 mb-3">Add Country</Text>
            <Text className="text-sm text-gray-600 mb-1">Country Name</Text>
            <TextInput
              className="border border-border rounded-xl px-4 py-3 mb-3 bg-surface"
              placeholder="e.g. Portugal"
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
            />
            <Text className="text-sm text-gray-600 mb-2">Timezone</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              <View className="flex-row gap-2">
                {TIMEZONES.map((tz) => (
                  <TouchableOpacity
                    key={tz}
                    onPress={() => setForm((f) => ({ ...f, timezone: tz }))}
                    className={`px-3 py-2 rounded-lg border ${form.timezone === tz ? 'bg-primary border-primary' : 'border-border bg-surface'}`}
                  >
                    <Text className={`text-xs ${form.timezone === tz ? 'text-white' : 'text-gray-600'}`}>{tz}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity
              onPress={() => createMutation.mutate(form)}
              disabled={!form.name || createMutation.isPending}
              className="bg-primary rounded-xl py-3 items-center"
            >
              {createMutation.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text className="text-white font-bold">Add Country</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* List */}
        {isLoading ? <ActivityIndicator /> : data?.map((c) => (
          <View key={c._id} className="bg-white rounded-xl border border-border p-4 mb-3 flex-row justify-between items-center">
            <View>
              <Text className="font-semibold text-gray-800">{c.name}</Text>
              <Text className="text-gray-400 text-xs">{c.timezone}</Text>
            </View>
            <TouchableOpacity
              onPress={() => confirmDelete(c._id, c.name)}
              className="bg-red-50 border border-red-200 px-3 py-1.5 rounded-full"
            >
              <Text className="text-red-600 text-xs font-medium">Delete</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
