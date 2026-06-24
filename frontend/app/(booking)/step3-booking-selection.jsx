import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useBookingStore } from '../../store/bookingStore';
import { countriesAPI, servicesAPI, doctorsAPI } from '../../services/api';
import BookingProgress from '../../components/common/BookingProgress';

const MODES = [
  { value: 'video', label: '📹 Video', desc: 'Video call link sent to email' },
  { value: 'phone', label: '📞 Phone', desc: 'Phone number sent to email' },
  { value: 'other', label: '💬 Other', desc: 'Doctor will contact you' },
];

export default function Step3BookingSelection() {
  const router = useRouter();
  const { bookingSelection, setBookingSelection } = useBookingStore();
  const [sel, setSel] = useState(bookingSelection);

  const [countries, setCountries] = useState([]);
  const [services, setServices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState({ countries: false, services: false, doctors: false, slots: false });

  // Load countries on mount
  useEffect(() => {
    setLoading((l) => ({ ...l, countries: true }));
    countriesAPI.getAll()
      .then((r) => setCountries(r.data.data))
      .finally(() => setLoading((l) => ({ ...l, countries: false })));
  }, []);

  // Load services when country changes
  useEffect(() => {
    if (!sel.country) return;
    setLoading((l) => ({ ...l, services: true }));
    setSel((s) => ({ ...s, service: null, doctor: null, time: '' }));
    servicesAPI.getEnabled(sel.country.name)
      .then((r) => setServices(r.data.data))
      .finally(() => setLoading((l) => ({ ...l, services: false })));
  }, [sel.country]);

  // Load doctors when service changes
  useEffect(() => {
    if (!sel.service || !sel.country) return;
    setLoading((l) => ({ ...l, doctors: true }));
    setSel((s) => ({ ...s, doctor: null, time: '' }));
    doctorsAPI.getAll({ country: sel.country.name, serviceId: sel.service._id })
      .then((r) => setDoctors(r.data.data))
      .finally(() => setLoading((l) => ({ ...l, doctors: false })));
  }, [sel.service]);

  // Load time slots when doctor + date changes
  useEffect(() => {
    if (!sel.doctor || !sel.date) return;
    setLoading((l) => ({ ...l, slots: true }));
    setSel((s) => ({ ...s, time: '' }));
    doctorsAPI.getSlots(sel.doctor._id, sel.date)
      .then((r) => setSlots(r.data.slots))
      .finally(() => setLoading((l) => ({ ...l, slots: false })));
  }, [sel.doctor, sel.date]);

  const update = (key, value) => setSel((s) => ({ ...s, [key]: value }));

  const handleNext = () => {
    if (!sel.country) return Alert.alert('Required', 'Please select a country.');
    if (!sel.service) return Alert.alert('Required', 'Please select a service.');
    if (!sel.doctor) return Alert.alert('Required', 'Please select a doctor.');
    if (!sel.date) return Alert.alert('Required', 'Please select a date.');
    if (!sel.time) return Alert.alert('Required', 'Please select a time slot.');
    setBookingSelection(sel);
    router.push('/(booking)/step4-consent');
  };

  const Section = ({ title, children }) => (
    <View className="mb-6">
      <Text className="text-base font-semibold text-gray-800 mb-3">{title}</Text>
      {children}
    </View>
  );

  const timezone = sel.country?.timezone || 'Europe/Lisbon';

  return (
    <View className="flex-1 bg-white">
      <BookingProgress currentStep={3} />

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-xl font-bold text-gray-800 mb-1">Book Your Appointment</Text>
        <Text className="text-sm text-gray-500 mb-5">Select your country, service, and preferred time.</Text>

        {/* 1. Country */}
        <Section title="1. Country">
          <Text className="text-xs text-gray-400 mb-2">Lists countries from our clinic network.</Text>
          {loading.countries
            ? <ActivityIndicator />
            : <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {countries.map((c) => (
                    <TouchableOpacity
                      key={c._id}
                      onPress={() => update('country', c)}
                      className={`px-4 py-2.5 rounded-xl border ${sel.country?._id === c._id ? 'bg-primary border-primary' : 'border-border bg-surface'}`}
                    >
                      <Text className={sel.country?._id === c._id ? 'text-white font-semibold' : 'text-gray-700'}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
          }
          {sel.country && (
            <Text className="text-xs text-primary mt-2">🕐 Local times: {timezone}</Text>
          )}
        </Section>

        {/* 2. Service */}
        {sel.country && (
          <Section title="2. Select Service">
            {loading.services
              ? <ActivityIndicator />
              : services.length === 0
              ? <Text className="text-gray-400 text-sm">No services available for {sel.country.name}</Text>
              : services.map((s) => (
                  <TouchableOpacity
                    key={s._id}
                    onPress={() => update('service', s)}
                    className={`p-4 rounded-xl border mb-2 ${sel.service?._id === s._id ? 'bg-primary/5 border-primary' : 'border-border bg-surface'}`}
                  >
                    <View className="flex-row justify-between items-center">
                      <Text className={`font-semibold ${sel.service?._id === s._id ? 'text-primary' : 'text-gray-800'}`}>{s.title}</Text>
                      <Text className="font-bold text-primary">€{s.price}</Text>
                    </View>
                    {s.description && <Text className="text-gray-500 text-sm mt-1">{s.description}</Text>}
                  </TouchableOpacity>
                ))
            }
          </Section>
        )}

        {/* 3. Doctor */}
        {sel.service && (
          <Section title="3. Select Doctor">
            {loading.doctors
              ? <ActivityIndicator />
              : doctors.length === 0
              ? <Text className="text-gray-400 text-sm">No doctors available for this service</Text>
              : doctors.map((d) => (
                  <TouchableOpacity
                    key={d._id}
                    onPress={() => update('doctor', d)}
                    className={`p-4 rounded-xl border mb-2 ${sel.doctor?._id === d._id ? 'bg-primary/5 border-primary' : 'border-border bg-surface'}`}
                  >
                    <Text className={`font-semibold ${sel.doctor?._id === d._id ? 'text-primary' : 'text-gray-800'}`}>{d.fullName}</Text>
                    <Text className="text-gray-500 text-sm">{d.specialization}</Text>
                    {d.yearsOfExperience && <Text className="text-gray-400 text-xs">{d.yearsOfExperience} years experience</Text>}
                  </TouchableOpacity>
                ))
            }
          </Section>
        )}

        {/* 4. Mode, Date, Time */}
        {sel.doctor && (
          <Section title="4. Preferred Mode & Date">
            {/* Mode */}
            <Text className="text-sm text-gray-600 mb-2">Preferred Mode</Text>
            <View className="flex-row gap-2 mb-4">
              {MODES.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  onPress={() => update('preferredMode', m.value)}
                  className={`flex-1 p-3 rounded-xl border items-center ${sel.preferredMode === m.value ? 'bg-primary border-primary' : 'border-border bg-surface'}`}
                >
                  <Text className={sel.preferredMode === m.value ? 'text-white font-bold' : 'text-gray-700'}>{m.label}</Text>
                  <Text className={`text-xs mt-0.5 text-center ${sel.preferredMode === m.value ? 'text-white/80' : 'text-gray-400'}`}>{m.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date */}
            <Text className="text-sm text-gray-600 mb-2">Preferred Date</Text>
            <Text className="text-xs text-gray-400 mb-2">Times shown in: {timezone}</Text>
            {/* Simple date input — in production use expo-datetimepicker */}
            <View className="border border-border rounded-xl px-4 py-3 mb-4 bg-surface">
              <Text className="text-xs text-gray-400 mb-1">Enter date (YYYY-MM-DD)</Text>
              <Text
                className="text-base text-gray-800"
                onPress={() => {}} // TODO: replace with DateTimePicker
              >
                {sel.date || 'Tap to select date'}
              </Text>
              {/* Inline date setter for now */}
              <View className="flex-row flex-wrap gap-2 mt-2">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(); d.setDate(d.getDate() + i + 1);
                  const str = d.toISOString().split('T')[0];
                  const label = i === 0 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
                  return (
                    <TouchableOpacity key={str} onPress={() => update('date', str)}
                      className={`px-3 py-1.5 rounded-lg border ${sel.date === str ? 'bg-primary border-primary' : 'border-border bg-white'}`}>
                      <Text className={sel.date === str ? 'text-white text-xs' : 'text-gray-600 text-xs'}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Time Slots */}
            {sel.date && (
              <>
                <Text className="text-sm text-gray-600 mb-2">Preferred Time (5-min slots)</Text>
                {loading.slots
                  ? <ActivityIndicator />
                  : slots.length === 0
                  ? <Text className="text-gray-400 text-sm">No slots available for this date</Text>
                  : <View className="flex-row flex-wrap gap-2">
                      {slots.map((slot) => (
                        <TouchableOpacity
                          key={slot}
                          onPress={() => update('time', slot)}
                          className={`px-3 py-2 rounded-lg border ${sel.time === slot ? 'bg-primary border-primary' : 'border-border bg-surface'}`}
                        >
                          <Text className={sel.time === slot ? 'text-white text-sm font-medium' : 'text-gray-600 text-sm'}>{slot}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                }
              </>
            )}

            {/* Amount */}
            {sel.service && (
              <View className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                <Text className="text-sm text-gray-600">Amount (EUR)</Text>
                <Text className="text-2xl font-bold text-primary">€{sel.service.price}</Text>
              </View>
            )}
          </Section>
        )}

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
