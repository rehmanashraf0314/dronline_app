import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useStripe } from '@stripe/stripe-react-native';
import { useBookingStore } from '../../store/bookingStore';
import { paymentsAPI } from '../../services/api';
import BookingProgress from '../../components/common/BookingProgress';

export default function Step6Payment() {
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { buildAppointmentPayload, bookingSelection, reset } = useBookingStore();
  const [loading, setLoading] = useState(false);

  const service = bookingSelection.service;
  const amount = service?.price || 0;

  const handlePayAndBook = async () => {
    setLoading(true);
    try {
      const appointmentData = buildAppointmentPayload();

      // Step 1: Create PaymentIntent on backend
      const intentRes = await paymentsAPI.createIntent({
        amount,
        currency: 'eur',
        appointmentData,
      });
      const { clientSecret, paymentIntentId } = intentRes.data;

      // Step 2: Create appointment in Pending state
      await paymentsAPI.createPendingAppointment({
        appointmentData,
        paymentIntentId,
      });

      // Step 3: Initialize Stripe payment sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'DrOnline',
        defaultBillingDetails: {
          email: appointmentData.patient.email,
          name: `${appointmentData.patient.firstName} ${appointmentData.patient.lastName}`,
        },
        appearance: {
          colors: {
            primary: '#1e40af',
          },
        },
      });

      if (initError) {
        Alert.alert('Payment Error', initError.message);
        setLoading(false);
        return;
      }

      // Step 4: Present payment sheet to user
      const { error: payError } = await presentPaymentSheet();

      if (payError) {
        if (payError.code === 'Canceled') {
          // User closed the sheet — don't show error
        } else {
          Alert.alert('Payment Failed', payError.message);
        }
        setLoading(false);
        return;
      }

      // Step 5: Payment succeeded — Stripe webhook will confirm appointment
      // Navigate to success screen
      router.replace('/(booking)/success');
      reset(); // Clear booking store

    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <BookingProgress currentStep={6} />

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-xl font-bold text-gray-800 mb-1">Payment Details</Text>
        <Text className="text-sm text-gray-500 mb-5">Review your booking and complete payment.</Text>

        {/* Order Summary */}
        <View className="border border-border rounded-xl p-4 mb-4 bg-surface">
          <Text className="font-semibold text-gray-800 mb-3">Booking Summary</Text>
          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text className="text-gray-500 text-sm">Service</Text>
              <Text className="text-gray-800 text-sm font-medium">{service?.title}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500 text-sm">Doctor</Text>
              <Text className="text-gray-800 text-sm font-medium">{bookingSelection.doctor?.fullName}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500 text-sm">Date</Text>
              <Text className="text-gray-800 text-sm font-medium">{bookingSelection.date}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500 text-sm">Time</Text>
              <Text className="text-gray-800 text-sm font-medium">{bookingSelection.time}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500 text-sm">Mode</Text>
              <Text className="text-gray-800 text-sm font-medium capitalize">{bookingSelection.preferredMode}</Text>
            </View>
            <View className="h-px bg-border my-1" />
            <View className="flex-row justify-between">
              <Text className="font-bold text-gray-800">Total to Pay</Text>
              <Text className="font-bold text-primary text-lg">€{amount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Security notice */}
        <View className="flex-row items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <Text className="text-xl">🔒</Text>
          <View className="flex-1">
            <Text className="font-semibold text-green-800 text-sm">Secure Payment</Text>
            <Text className="text-green-700 text-xs mt-0.5">
              Your payment information is encrypted and secure. We never store your card details.
            </Text>
          </View>
        </View>

        {/* Powered by Stripe */}
        <View className="items-center mb-4">
          <Text className="text-gray-400 text-xs">Powered by Stripe — PCI DSS Compliant</Text>
        </View>

        {/* Billing agreement */}
        <Text className="text-xs text-gray-400 text-center mb-6 px-4">
          By completing this payment, I authorize charging my selected payment method and agree to the{' '}
          <Text className="text-primary underline">billing terms</Text>.
        </Text>

        <View className="h-6" />
      </ScrollView>

      <View className="px-4 pb-6 pt-3 border-t border-border bg-white gap-3">
        <TouchableOpacity
          onPress={handlePayAndBook}
          disabled={loading}
          className="bg-primary rounded-xl py-4 items-center"
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : (
              <View className="items-center">
                <Text className="text-white font-bold text-base">Pay €{amount.toFixed(2)} & Book</Text>
                <Text className="text-white/70 text-xs mt-0.5">Tap to open secure payment</Text>
              </View>
            )
          }
        </TouchableOpacity>

        {!loading && (
          <TouchableOpacity className="border border-border rounded-xl py-3 items-center" onPress={() => router.back()}>
            <Text className="text-gray-600">← Back</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
