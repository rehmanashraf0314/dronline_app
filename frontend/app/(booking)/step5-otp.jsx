import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useBookingStore } from '../../store/bookingStore';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../services/api';
import BookingProgress from '../../components/common/BookingProgress';

export default function Step5OTP() {
  const router = useRouter();
  const { patientDetails, setOtpVerified } = useBookingStore();
  const { setAuthFromOTP } = useAuthStore();

  const email = patientDetails.email;
  const name = patientDetails.firstName;

  const [userId, setUserId] = useState(null);
  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [accountStatus, setAccountStatus] = useState('new'); // 'new' | 'guest' | 'existing'

  const [showAccountChoice, setShowAccountChoice] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendOTP = async () => {
    setSending(true);
    try {
      const res = await authAPI.sendOTP({ email, name });
      setUserId(res.data.userId);
      setAccountStatus(res.data.accountStatus || 'new');
      setOtpSent(true);
      setCountdown(60);

      if (res.data.accountStatus === 'existing') {
        Alert.alert(
          '📧 Account Found',
          `An account already exists for ${email}.\n\nA verification code was sent. After verifying you can continue your booking.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('📧 Code Sent', `A 6-digit verification code was sent to ${email}`);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP. Check your email address.');
    } finally {
      setSending(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) return Alert.alert('Invalid', 'Enter the 6-digit code from your email.');
    setVerifying(true);
    try {
      const res = await authAPI.verifyOTP({ userId, otp });
      const { token, user, isGuest } = res.data;
      await setAuthFromOTP({ token, user, isGuest });
      setOtpVerified(userId);
      setVerified(true);
      setShowAccountChoice(true);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setVerifying(false);
    }
  };

  const createAccount = async () => {
    if (password.length < 8) return Alert.alert('Weak Password', 'Password must be at least 8 characters.');
    if (password !== confirmPassword) return Alert.alert('Mismatch', 'Passwords do not match.');
    setCreatingAccount(true);
    try {
      await authAPI.setPassword({ password });
      Alert.alert('Account Created! 🎉', 'You can now login anytime to view your appointments.');
      router.push('/(booking)/step6-payment');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create account');
    } finally {
      setCreatingAccount(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <BookingProgress currentStep={5} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ height: 16 }} />
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 }}>Verify Your Email</Text>
          <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
            We'll send a one-time code to <Text style={{ color: '#1e40af', fontWeight: '600' }}>{email}</Text>
          </Text>

          {/* Existing account warning */}
          {accountStatus === 'existing' && otpSent && (
            <View style={{ backgroundColor: '#fefce8', borderWidth: 1, borderColor: '#fde68a', borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <Text style={{ color: '#92400e', fontWeight: '700', fontSize: 13, marginBottom: 4 }}>⚠️ Account Already Exists</Text>
              <Text style={{ color: '#78350f', fontSize: 12, lineHeight: 18 }}>
                This email already has an account. After verifying you can continue your booking. You can also{' '}
                <Text style={{ color: '#1e40af', fontWeight: '600' }} onPress={() => router.replace('/(auth)/login')}>
                  login instead →
                </Text>
              </Text>
            </View>
          )}

          {!otpSent ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <View style={{ width: 80, height: 80, backgroundColor: '#eff6ff', borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 38 }}>📧</Text>
              </View>
              <Text style={{ color: '#6b7280', textAlign: 'center', marginBottom: 28, fontSize: 14, lineHeight: 22, paddingHorizontal: 16 }}>
                Tap below to receive a 6-digit verification code at your email address.
              </Text>
              <TouchableOpacity
                onPress={sendOTP} disabled={sending}
                style={{ backgroundColor: '#1e40af', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40, alignItems: 'center', width: '100%' }}
              >
                {sending
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Send Verification Code</Text>
                }
              </TouchableOpacity>
            </View>
          ) : !verified ? (
            <View>
              <View style={{ backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 12, padding: 14, marginBottom: 20 }}>
                <Text style={{ color: '#15803d', fontSize: 13 }}>
                  ✅ Code sent to <Text style={{ fontWeight: '700' }}>{email}</Text>. Check inbox and spam folder.
                </Text>
              </View>

              <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 8 }}>Enter 6-digit Code</Text>
              <TextInput
                style={{ borderWidth: 2, borderColor: '#1e40af', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 18, textAlign: 'center', fontSize: 32, fontWeight: 'bold', letterSpacing: 10, backgroundColor: '#f9fafb', marginBottom: 16, color: '#1f2937' }}
                placeholder="000000"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                blurOnSubmit={false}
              />

              <TouchableOpacity
                onPress={verifyOTP} disabled={verifying}
                style={{ backgroundColor: '#1e40af', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 16 }}
              >
                {verifying
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Verify Code</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity
                onPress={countdown === 0 ? sendOTP : undefined}
                disabled={countdown > 0 || sending}
                style={{ alignItems: 'center' }}
              >
                <Text style={{ fontSize: 14, color: countdown > 0 ? '#9ca3af' : '#1e40af' }}>
                  {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : showAccountChoice && accountStatus !== 'existing' ? (
            <View>
              <View style={{ backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 12, padding: 14, marginBottom: 20 }}>
                <Text style={{ color: '#15803d', fontWeight: '700', fontSize: 14 }}>✅ Email Verified!</Text>
              </View>

              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 6 }}>Save your account?</Text>
              <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, lineHeight: 20 }}>
                Creating an account lets you view appointments, download documents, and book faster next time.
              </Text>

              {/* Create account */}
              <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 16, padding: 16, marginBottom: 14, backgroundColor: '#f9fafb' }}>
                <Text style={{ fontWeight: '700', color: '#1f2937', marginBottom: 14, fontSize: 15 }}>Create Account (optional)</Text>

                <Text style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>Password</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, backgroundColor: '#fff', marginBottom: 12, color: '#1f2937' }}
                  placeholder="Min 8 characters"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  blurOnSubmit={false}
                />

                <Text style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>Confirm Password</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, backgroundColor: '#fff', marginBottom: 16, color: '#1f2937' }}
                  placeholder="Repeat password"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                  blurOnSubmit={false}
                />

                <TouchableOpacity
                  onPress={createAccount} disabled={creatingAccount}
                  style={{ backgroundColor: '#1e40af', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
                >
                  {creatingAccount
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Create Account & Continue →</Text>
                  }
                </TouchableOpacity>
              </View>

              {/* Continue as guest */}
              <TouchableOpacity
                onPress={() => router.push('/(booking)/step6-payment')}
                style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
              >
                <Text style={{ color: '#6b7280', fontWeight: '600', fontSize: 15 }}>Continue as Guest →</Text>
                <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>Email confirmation will be sent</Text>
              </TouchableOpacity>
            </View>
          ) : verified && accountStatus === 'existing' ? (
            // Existing account - just proceed
            <View>
              <View style={{ backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 12, padding: 14, marginBottom: 20 }}>
                <Text style={{ color: '#15803d', fontWeight: '700', fontSize: 14 }}>✅ Email Verified!</Text>
                <Text style={{ color: '#16a34a', fontSize: 13, marginTop: 4 }}>Your account has been identified. Proceed to payment.</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(booking)/step6-payment')}
                style={{ backgroundColor: '#1e40af', borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Continue to Payment →</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={{ height: 32 }} />
        </ScrollView>

        {!verified && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 28, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#fff' }}>
            <TouchableOpacity
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
              onPress={() => router.back()}
            >
              <Text style={{ color: '#4b5563', fontWeight: '600' }}>← Back</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
