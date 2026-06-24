import { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useBookingStore } from '../../store/bookingStore';
import BookingProgress from '../../components/common/BookingProgress';

const DURATIONS = ['<24h', '1-3 days', '4-7 days', '1-2 weeks', '2+ weeks'];
const URGENCIES = ['Routine', 'Soon', 'Urgent'];

// KEY FIX: TagInput is defined OUTSIDE the parent component
// so it never re-mounts when parent state changes → keyboard stays open
const TagInput = ({ label, field, items, inputVal, onChangeText, onAdd, onRemove, placeholder, optional }) => {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 4 }}>
        {label}
        {optional && <Text style={{ color: '#9ca3af' }}> (optional)</Text>}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          style={{
            flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12,
            paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
            backgroundColor: '#f9fafb', color: '#1f2937',
          }}
          placeholder={placeholder}
          value={inputVal}
          onChangeText={onChangeText}
          autoCorrect={false}
          blurOnSubmit={false}
          returnKeyType="done"
          onSubmitEditing={onAdd}
        />
        <TouchableOpacity
          onPress={onAdd}
          style={{ backgroundColor: '#1e40af', paddingHorizontal: 18, borderRadius: 12, justifyContent: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 22 }}>+</Text>
        </TouchableOpacity>
      </View>
      {items.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {items.map((item, i) => (
            <TouchableOpacity
              key={`${field}-${i}`}
              onPress={() => onRemove(i)}
              style={{ backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Text style={{ color: '#1e40af', fontSize: 13 }}>{item}</Text>
              <Text style={{ color: '#93c5fd', fontSize: 12, fontWeight: 'bold' }}>✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default function Step2MedicalInfo() {
  const router = useRouter();
  const { medicalInfo, setMedicalInfo } = useBookingStore();
  const [form, setForm] = useState(medicalInfo);

  // Separate state for tag inputs to avoid triggering re-render of whole form
  const [allergyInput, setAllergyInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');
  const [medicationInput, setMedicationInput] = useState('');

  const update = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const addAllergy = useCallback(() => {
    if (!allergyInput.trim()) return;
    setForm(prev => ({ ...prev, allergies: [...prev.allergies, allergyInput.trim()] }));
    setAllergyInput('');
  }, [allergyInput]);

  const addCondition = useCallback(() => {
    if (!conditionInput.trim()) return;
    setForm(prev => ({ ...prev, conditions: [...prev.conditions, conditionInput.trim()] }));
    setConditionInput('');
  }, [conditionInput]);

  const addMedication = useCallback(() => {
    if (!medicationInput.trim()) return;
    setForm(prev => ({ ...prev, medications: [...prev.medications, medicationInput.trim()] }));
    setMedicationInput('');
  }, [medicationInput]);

  const removeItem = useCallback((field, index) => {
    setForm(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  }, []);

  const handleNext = () => {
    if (!form.symptoms) return Alert.alert('Required', 'Please describe your primary symptoms.');
    setMedicalInfo(form);
    router.push('/(booking)/step3-booking-selection');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <BookingProgress currentStep={2} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1, paddingHorizontal: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ height: 16 }} />
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 }}>Medical Information</Text>
          <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Help your doctor prepare for your consultation.</Text>

          <TagInput
            label="Known Allergies"
            field="allergies"
            items={form.allergies}
            inputVal={allergyInput}
            onChangeText={setAllergyInput}
            onAdd={addAllergy}
            onRemove={(i) => removeItem('allergies', i)}
            placeholder="e.g. Penicillin, Peanuts"
          />

          <TagInput
            label="Chronic Conditions"
            field="conditions"
            items={form.conditions}
            inputVal={conditionInput}
            onChangeText={setConditionInput}
            onAdd={addCondition}
            onRemove={(i) => removeItem('conditions', i)}
            placeholder="Type condition, then tap +"
            optional
          />

          <TagInput
            label="Current Medications"
            field="medications"
            items={form.medications}
            inputVal={medicationInput}
            onChangeText={setMedicationInput}
            onAdd={addMedication}
            onRemove={(i) => removeItem('medications', i)}
            placeholder="Type medication, then tap +"
            optional
          />

          <Text style={S.label}>Preferred Pharmacy <Text style={{ color: '#9ca3af' }}>(optional)</Text></Text>
          <TextInput style={S.input} placeholder="Pharmacy name or address"
            value={form.pharmacy} onChangeText={v => update('pharmacy', v)}
            autoCorrect={false} blurOnSubmit={false} />

          <Text style={S.label}>Primary Symptoms <Text style={{ color: '#dc2626' }}>*</Text></Text>
          <TextInput
            style={[S.input, { minHeight: 100, textAlignVertical: 'top' }]}
            placeholder="Describe what you're experiencing..."
            value={form.symptoms}
            onChangeText={v => update('symptoms', v)}
            multiline numberOfLines={4}
            autoCorrect={false} blurOnSubmit={false}
          />

          <Text style={S.label}>Symptom Duration <Text style={{ color: '#9ca3af' }}>(optional)</Text></Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {DURATIONS.map(d => (
              <TouchableOpacity key={d} onPress={() => update('symptomDuration', d)}
                style={[S.chip, form.symptomDuration === d && S.chipActive]}>
                <Text style={form.symptomDuration === d ? S.chipTextActive : S.chipText}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={S.label}>Urgency</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            {URGENCIES.map(u => {
              const sel = form.urgency === u;
              const colors = {
                Routine: { bg: sel ? '#16a34a' : '#f0fdf4', text: sel ? '#fff' : '#16a34a' },
                Soon:    { bg: sel ? '#d97706' : '#fffbeb', text: sel ? '#fff' : '#d97706' },
                Urgent:  { bg: sel ? '#dc2626' : '#fef2f2', text: sel ? '#fff' : '#dc2626' },
              };
              return (
                <TouchableOpacity key={u} onPress={() => update('urgency', u)}
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors[u].bg }}>
                  <Text style={{ fontWeight: '700', fontSize: 14, color: colors[u].text }}>{u}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={{ paddingHorizontal: 16, paddingBottom: 28, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#fff' }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={{ flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
              onPress={() => router.back()}
            >
              <Text style={{ color: '#4b5563', fontWeight: '600', fontSize: 15 }}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 2, backgroundColor: '#1e40af', borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
              onPress={handleNext}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Next →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const S = {
  label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, backgroundColor: '#f9fafb', marginBottom: 16, color: '#1f2937' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  chipActive: { backgroundColor: '#1e40af', borderColor: '#1e40af' },
  chipText: { color: '#4b5563', fontSize: 13 },
  chipTextActive: { color: '#fff', fontSize: 13, fontWeight: '600' },
};
