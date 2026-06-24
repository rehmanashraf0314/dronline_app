import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useBookingStore } from '../../store/bookingStore';
import BookingProgress from '../../components/common/BookingProgress';

const CONSENTS = [
  {
    key: 'gdpr',
    required: true,
    label: 'I accept the Privacy Policy (GDPR)',
    desc: 'Your data is processed according to GDPR regulations.',
    url: 'https://www.dronline247.eu/privacy-policy',
    linkLabel: 'Privacy Policy (GDPR)',
  },
  {
    key: 'treatment',
    required: true,
    label: 'I give informed consent for Assessment & Treatment',
    desc: 'You consent to online medical consultation and assessment.',
    url: 'https://www.dronline247.eu/terms-and-conditions',
    linkLabel: 'Assessment & Treatment',
  },
  {
    key: 'shareFHIR',
    required: true,
    label: 'Allow sharing with providers using FHIR',
    desc: 'Medical information is stored using FHIR standards for secure interoperability.',
    url: 'https://www.dronline247.eu/privacy-policy',
    linkLabel: 'FHIR',
  },
  {
    key: 'marketing',
    required: false,
    label: 'Receive service updates & promotions',
    desc: 'Optional. You can unsubscribe anytime.',
    url: null,
    linkLabel: null,
  },
];

export default function Step4Consent() {
  const router = useRouter();
  const { consent, setConsent } = useBookingStore();
  const [form, setForm] = useState(consent);

  const toggle = (key) => setForm((f) => ({ ...f, [key]: !f[key] }));

  const handleNext = () => {
    const missing = CONSENTS.filter((c) => c.required && !form[c.key]);
    if (missing.length) {
      return Alert.alert('Required Consent', 'Please accept all required consents to continue.');
    }
    setConsent(form);
    router.push('/(booking)/step5-otp');
  };

  return (
    <View className="flex-1 bg-white">
      <BookingProgress currentStep={4} />

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-xl font-bold text-gray-800 mb-1">Consent & Privacy</Text>
        <Text className="text-sm text-gray-500 mb-2">GDPR & FHIR Compliant</Text>

        <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
          <Text className="text-blue-800 text-sm">
            Your data is processed according to GDPR regulations. Medical information is stored using FHIR standards for secure interoperability.
          </Text>
        </View>

        {CONSENTS.map((c) => (
          <TouchableOpacity
            key={c.key}
            onPress={() => toggle(c.key)}
            className={`flex-row gap-3 p-4 rounded-xl border mb-3 ${
              form[c.key] ? 'bg-primary/5 border-primary' : 'border-border bg-surface'
            }`}
          >
            {/* Checkbox */}
            <View
              className={`w-6 h-6 rounded border-2 items-center justify-center mt-0.5 flex-shrink-0 ${
                form[c.key] ? 'bg-primary border-primary' : 'border-gray-300'
              }`}
            >
              {form[c.key] && <Text className="text-white text-xs font-bold">✓</Text>}
            </View>

            {/* Content */}
            <View className="flex-1">
              <Text className={`font-semibold text-sm ${form[c.key] ? 'text-primary' : 'text-gray-800'}`}>
                {c.label}
                {c.required && <Text className="text-danger"> *</Text>}
              </Text>
              <Text className="text-gray-500 text-xs mt-1">{c.desc}</Text>
              {c.url && (
                <TouchableOpacity onPress={() => Linking.openURL(c.url)}>
                  <Text className="text-primary text-xs mt-1 underline">Read: {c.linkLabel} →</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))}

        <View className="h-6" />
      </ScrollView>

      <View className="px-4 pb-6 pt-3 border-t border-border bg-white flex-row gap-3">
        <TouchableOpacity className="flex-1 border border-border rounded-xl py-4 items-center" onPress={() => router.back()}>
          <Text className="text-gray-600 font-bold">← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-2 bg-primary rounded-xl py-4 items-center px-8" onPress={handleNext}>
          <Text className="text-white font-bold text-base">Next →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
