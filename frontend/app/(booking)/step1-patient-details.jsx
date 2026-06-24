import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, KeyboardAvoidingView, Platform, Modal
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useBookingStore } from '../../store/bookingStore';
import BookingProgress from '../../components/common/BookingProgress';

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA' },
  { code: '+44', country: 'UK' },
  { code: '+91', country: 'India' },
  { code: '+353', country: 'Ireland' },
  { code: '+351', country: 'Portugal' },
  { code: '+33', country: 'France' },
  { code: '+49', country: 'Germany' },
  { code: '+39', country: 'Italy' },
  { code: '+34', country: 'Spain' },
  { code: '+31', country: 'Netherlands' },
  { code: '+32', country: 'Belgium' },
  { code: '+43', country: 'Austria' },
  { code: '+41', country: 'Switzerland' },
  { code: '+45', country: 'Denmark' },
  { code: '+46', country: 'Sweden' },
  { code: '+47', country: 'Norway' },
];

export default function Step1PatientDetails() {
  const router = useRouter();
  const { patientDetails, setPatientDetails } = useBookingStore();
  const [form, setForm] = useState(patientDetails);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCountryCodeModal, setShowCountryCodeModal] = useState(false);

  // useCallback prevents re-renders that dismiss keyboard
  const update = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateAddress = useCallback((key, value) => {
    setForm(prev => ({ ...prev, address: { ...prev.address, [key]: value } }));
  }, []);

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      update('dob', dateStr);
    }
  };

  const selectCountryCode = (code) => {
    update('phoneCountryCode', code);
    setShowCountryCodeModal(false);
  };

  const dobDate = form.dob ? new Date(form.dob + 'T00:00:00Z') : new Date();

  const handleNext = () => {
    const required = ['firstName', 'lastName', 'dob', 'gender', 'phone', 'email', 'nationalId'];
    const missing = required.filter(k => !form[k]);
    if (missing.length) return Alert.alert('Required Fields', 'Please fill all required fields.');
    if (!form.address.line1 || !form.address.city || !form.address.postalCode) {
      return Alert.alert('Required Fields', 'Please fill address line 1, city and postal code.');
    }
    setPatientDetails(form);
    router.push('/(booking)/step2-medical-info');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: '#fff' }}>
      <BookingProgress currentStep={1} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1, paddingHorizontal: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ height: 16 }} />
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 }}>
            Patient Details
          </Text>
          <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
            Required for medical records and prescriptions.
          </Text>

          {/* First Name */}
          <Text style={styles.label}>First Name <Text style={styles.req}>*</Text></Text>
          <TextInput style={styles.input} placeholder="John"
            value={form.firstName} onChangeText={v => update('firstName', v)}
            autoCorrect={false} blurOnSubmit={false} />

          {/* Last Name */}
          <Text style={styles.label}>Last Name <Text style={styles.req}>*</Text></Text>
          <TextInput style={styles.input} placeholder="Doe"
            value={form.lastName} onChangeText={v => update('lastName', v)}
            autoCorrect={false} blurOnSubmit={false} />

          {/* DOB with Date Picker */}
          <Text style={styles.label}>Date of Birth <Text style={styles.req}>*</Text></Text>
          <TouchableOpacity 
            style={[styles.input, { justifyContent: 'center', paddingVertical: 12 }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: form.dob ? '#1f2937' : '#9ca3af', fontSize: 15 }}>
              📅 {form.dob || 'Tap to select your date of birth'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dobDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}

          {/* Gender */}
          <Text style={styles.label}>Gender <Text style={styles.req}>*</Text></Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {GENDERS.map(g => (
              <TouchableOpacity key={g} onPress={() => update('gender', g)}
                style={[styles.chip, form.gender === g && styles.chipActive]}>
                <Text style={form.gender === g ? styles.chipTextActive : styles.chipText}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Phone with Country Code */}
          <Text style={styles.label}>Phone <Text style={styles.req}>*</Text></Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <TouchableOpacity
              style={[styles.input, { width: 90, paddingHorizontal: 8, marginBottom: 0, justifyContent: 'center' }]}
              onPress={() => setShowCountryCodeModal(true)}
            >
              <Text style={{ color: '#1f2937', fontSize: 15, fontWeight: '600' }}>
                {form.phoneCountryCode || '+353'}
              </Text>
            </TouchableOpacity>
            <TextInput 
              style={[styles.input, { flex: 1, marginBottom: 0 }]} 
              placeholder="912345678"
              value={form.phone} 
              onChangeText={v => update('phone', v)}
              keyboardType="phone-pad" 
              blurOnSubmit={false} 
            />
          </View>

          {/* Country Code Modal */}
          <Modal
            visible={showCountryCodeModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowCountryCodeModal(false)}
          >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
              <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 20 }}>
                <View style={{ borderBottomWidth: 1, borderColor: '#e5e7eb', paddingVertical: 12, alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937' }}>Select Country Code</Text>
                </View>
                <ScrollView style={{ maxHeight: 400, paddingHorizontal: 16, marginTop: 8 }}>
                  {COUNTRY_CODES.map((item) => (
                    <TouchableOpacity
                      key={item.code}
                      onPress={() => selectCountryCode(item.code)}
                      style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f0f0f0' }}
                    >
                      <Text style={{ fontSize: 15, color: '#1f2937' }}>
                        {item.code} {item.country}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Email */}
          <Text style={styles.label}>Email <Text style={styles.req}>*</Text></Text>
          <TextInput style={styles.input} placeholder="you@email.com"
            value={form.email} onChangeText={v => update('email', v)}
            keyboardType="email-address" autoCapitalize="none"
            autoCorrect={false} blurOnSubmit={false} />

          {/* National ID */}
          <Text style={styles.label}>ID / Passport Number <Text style={styles.req}>*</Text></Text>
          <TextInput style={styles.input} placeholder="12345678"
            value={form.nationalId} onChangeText={v => update('nationalId', v)}
            autoCorrect={false} blurOnSubmit={false} />
          <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: -10, marginBottom: 16 }}>
            Required for European medical records and prescriptions.
          </Text>

          {/* Address */}
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 12 }}>
            Address
          </Text>

          <Text style={styles.label}>Address Line 1 <Text style={styles.req}>*</Text></Text>
          <TextInput style={styles.input} placeholder="Street, House No."
            value={form.address.line1} onChangeText={v => updateAddress('line1', v)}
            autoCorrect={false} blurOnSubmit={false} />

          <Text style={styles.label}>Address Line 2 <Text style={{ color: '#9ca3af' }}>(optional)</Text></Text>
          <TextInput style={styles.input} placeholder="Apartment, Suite"
            value={form.address.line2} onChangeText={v => updateAddress('line2', v)}
            autoCorrect={false} blurOnSubmit={false} />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>City <Text style={styles.req}>*</Text></Text>
              <TextInput style={styles.input} placeholder="Lisbon"
                value={form.address.city} onChangeText={v => updateAddress('city', v)}
                autoCorrect={false} blurOnSubmit={false} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>State <Text style={{ color: '#9ca3af' }}>(opt)</Text></Text>
              <TextInput style={styles.input} placeholder="Optional"
                value={form.address.state} onChangeText={v => updateAddress('state', v)}
                autoCorrect={false} blurOnSubmit={false} />
            </View>
          </View>

          <Text style={styles.label}>Postal Code <Text style={styles.req}>*</Text></Text>
          <TextInput style={styles.input} placeholder="1000-001"
            value={form.address.postalCode} onChangeText={v => updateAddress('postalCode', v)}
            autoCorrect={false} blurOnSubmit={false} />

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>Next →</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = {
  label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 4 },
  req: { color: '#dc2626' },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 15,
    backgroundColor: '#f9fafb', marginBottom: 16, color: '#1f2937',
  },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99,
    borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb',
  },
  chipActive: { backgroundColor: '#1e40af', borderColor: '#1e40af' },
  chipText: { color: '#4b5563', fontSize: 14 },
  chipTextActive: { color: '#fff', fontSize: 14, fontWeight: '500' },
  footer: {
    paddingHorizontal: 16, paddingBottom: 28, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#fff',
  },
  nextBtn: {
    backgroundColor: '#1e40af', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  nextBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
};
