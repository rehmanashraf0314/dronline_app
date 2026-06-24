import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { authAPI } from '../../services/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) return Alert.alert('Error', 'Please enter your email');
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} className="mb-8">
          <Text className="text-primary text-base">← Back</Text>
        </TouchableOpacity>

        <View className="items-center mb-10">
          <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
            <Text className="text-4xl">🔐</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-800">Forgot Password?</Text>
          <Text className="text-gray-500 mt-2 text-center text-sm px-4">
            Enter your email and we'll send you a reset link
          </Text>
        </View>

        {sent ? (
          <View className="bg-green-50 border border-green-200 rounded-xl p-5 items-center">
            <Text className="text-green-700 font-semibold text-base mb-1">Email Sent ✅</Text>
            <Text className="text-green-600 text-sm text-center">
              Check your inbox for the password reset link.
            </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')} className="mt-4">
              <Text className="text-primary font-semibold">Back to Login →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-1">Email Address</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 text-base bg-gray-50"
                placeholder="you@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                blurOnSubmit={false}
              />
            </View>

            <TouchableOpacity
              className="bg-primary rounded-xl py-4 items-center"
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text className="text-white font-bold text-base">Send Reset Link</Text>
              }
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
