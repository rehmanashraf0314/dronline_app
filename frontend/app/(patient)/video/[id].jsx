import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { appointmentsAPI } from '../../../services/api';

export default function VideoCallScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [meetingUrl, setMeetingUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appointmentsAPI.getMeetingToken(id)
      .then((r) => {
        const { token, meetingLink } = r.data;
        setMeetingUrl(`${meetingLink}?t=${token}`);
      })
      .catch(() => {
        Alert.alert('Error', 'Could not load video call.');
        router.back();
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <View className="flex-1 bg-gray-900 items-center justify-center">
      <ActivityIndicator size="large" color="#fff" />
      <Text className="text-white mt-3">Connecting...</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-900">
      <View className="flex-row justify-between items-center px-4 pt-12 pb-3">
        <Text className="text-white font-semibold">Video Consultation</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-red-500 px-4 py-2 rounded-full">
          <Text className="text-white font-bold">End Call</Text>
        </TouchableOpacity>
      </View>
      {meetingUrl && (
        <WebView source={{ uri: meetingUrl }} style={{ flex: 1 }}
          allowsInlineMediaPlayback mediaPlaybackRequiresUserAction={false} />
      )}
    </View>
  );
}
