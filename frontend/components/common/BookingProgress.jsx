import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STEPS = [
  { number: 1, label: 'Details' },
  { number: 2, label: 'Medical' },
  { number: 3, label: 'Booking' },
  { number: 4, label: 'Consent' },
  { number: 5, label: 'Verify' },
  { number: 6, label: 'Payment' },
];

export default function BookingProgress({ currentStep }) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
      <View style={{
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 14,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          {STEPS.map((step, index) => (
            <View key={step.number} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={{ alignItems: 'center' }}>
                <View style={{
                  width: 30, height: 30, borderRadius: 15,
                  backgroundColor:
                    step.number < currentStep ? '#16a34a' :
                    step.number === currentStep ? '#1e40af' : '#e5e7eb',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{
                    color: step.number <= currentStep ? '#fff' : '#9ca3af',
                    fontSize: 12, fontWeight: 'bold'
                  }}>
                    {step.number < currentStep ? '✓' : step.number}
                  </Text>
                </View>
                <Text style={{
                  fontSize: 9, marginTop: 4,
                  color: step.number === currentStep ? '#1e40af' : '#9ca3af',
                  fontWeight: step.number === currentStep ? '700' : '400',
                  textAlign: 'center',
                }}>
                  {step.label}
                </Text>
              </View>
              {index < STEPS.length - 1 && (
                <View style={{
                  flex: 1, height: 2,
                  marginBottom: 18,
                  marginHorizontal: 3,
                  backgroundColor: step.number < currentStep ? '#16a34a' : '#e5e7eb',
                }} />
              )}
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
