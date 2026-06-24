import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { authAPI } from '../../services/api';

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const update = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), []);

  const handleRegister = async () => {
    if (!form.email || !form.password || !form.confirmPassword) {
      return Alert.alert('Error', 'Please fill all fields');
    }
    if (form.password !== form.confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match');
    }
    if (form.password.length < 8) {
      return Alert.alert('Error', 'Password must be at least 8 characters');
    }

    setLoading(true);
    try {
      await authAPI.register({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: 'patient',
      });
      Alert.alert(
        'Account Created ✅',
        'Your account was created successfully. Please sign in.',
        [{ text: 'Sign In', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: 'center', marginBottom: 36 }}>
            <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#1e40af' }}>DrOnline</Text>
            <Text style={{ color: '#6b7280', marginTop: 6, fontSize: 15 }}>Create your account</Text>
          </View>

          <Text style={S.label}>Email <Text style={{ color: '#dc2626' }}>*</Text></Text>
          <TextInput style={S.input} placeholder="you@email.com"
            keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
            value={form.email} onChangeText={v => update('email', v)} blurOnSubmit={false} />

          <Text style={S.label}>Password <Text style={{ color: '#dc2626' }}>*</Text></Text>
          <TextInput style={S.input} placeholder="Min 8 characters"
            secureTextEntry autoCapitalize="none" autoCorrect={false}
            value={form.password} onChangeText={v => update('password', v)} blurOnSubmit={false} />

          <Text style={S.label}>Confirm Password <Text style={{ color: '#dc2626' }}>*</Text></Text>
          <TextInput style={S.input} placeholder="Repeat password"
            secureTextEntry autoCapitalize="none" autoCorrect={false}
            value={form.confirmPassword} onChangeText={v => update('confirmPassword', v)} blurOnSubmit={false} />

          <View style={{ height: 8 }} />

          <TouchableOpacity
            style={{ backgroundColor: '#1e40af', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 16 }}
            onPress={handleRegister} disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Create Account</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
              Already have an account?{' '}
              <Text style={{ color: '#1e40af', fontWeight: '600' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const S = {
  label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13, fontSize: 15,
    backgroundColor: '#f9fafb', marginBottom: 16, color: '#1f2937',
  },
};
