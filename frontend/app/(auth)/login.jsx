import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
    setLoading(true);
    try {
      const user = await login({ email, password });
      if (user.role === 'admin') router.replace('/(admin)/dashboard');
      else if (user.role === 'doctor') router.replace('/(doctor)/dashboard');
      else router.replace('/(patient)/home');
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Invalid credentials');
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
        {/* Logo */}
        <View className="items-center mb-10">
          <Text className="text-4xl font-bold text-primary">DrOnline</Text>
          <Text className="text-gray-500 mt-2 text-base">Your Digital Health Partner</Text>
        </View>

        {/* Email */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
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

        {/* Password */}
        <View className="mb-2">
          <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 text-base bg-gray-50"
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={password}
            onChangeText={setPassword}
            blurOnSubmit={false}
          />
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/forgot-password')}
          className="mb-6"
        >
          <Text className="text-primary text-sm text-right">Forgot password?</Text>
        </TouchableOpacity>

        {/* Login button */}
        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center mb-4"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text className="text-white font-bold text-base">Sign In</Text>
          }
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center my-3">
          <View className="flex-1 h-px bg-gray-200" />
          <Text className="mx-3 text-gray-400 text-sm">or</Text>
          <View className="flex-1 h-px bg-gray-200" />
        </View>

        {/* Book without account */}
        <TouchableOpacity
          className="border border-primary rounded-xl py-4 items-center mb-4"
          onPress={() => router.push('/(booking)/step1-patient-details')}
        >
          <Text className="text-primary font-bold text-base">Book an Appointment</Text>
          <Text className="text-gray-400 text-xs mt-0.5">No account needed</Text>
        </TouchableOpacity>

        {/* Sign up */}
        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text className="text-center text-gray-500 text-sm">
            Don't have an account?{' '}
            <Text className="text-primary font-semibold">Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
