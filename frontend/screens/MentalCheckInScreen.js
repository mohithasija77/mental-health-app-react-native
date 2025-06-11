import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { getApiUrl } from 'constants/api';
import LottieView from 'lottie-react-native';
import { useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

export default function MentalCheckInScreen() {
  const navigation = useNavigation();

  const [feelingScale, setFeelingScale] = useState(5);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [stressLevel, setStressLevel] = useState(5);
  const [mood, setMood] = useState('anxious');
  const [recentEvents, setRecentEvents] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const handleSubmit = async () => {
    // Get userId from your auth system
    const testId = 'test-user-123'; // Replace with actual user ID

    const payload = {
      userId: testId,
      feelingScale,
      sleepQuality,
      stressLevel,
      mood,
      recentEvents,
      notes: additionalNotes,
    };

    try {
      const response = await fetch(getApiUrl('ANALYZE'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📊 Response status:', response.status);
      console.log('📋 Response headers:', response.headers);

      // Check if response is ok
      if (!response.ok) {
        console.error('❌ HTTP Error:', response.status, response.statusText);

        // Try to get error details
        const errorText = await response.text();
        console.error('❌ Error response body:', errorText);

        Alert.alert(
          'Network Error',
          `HTTP ${response.status}: ${response.statusText}\n\nDetails: ${errorText}`
        );
        return;
      }

      // Try to parse JSON
      const data = await response.json();
      console.log('✅ Success response:', data);

      if (data.success && data.analysis) {
        Alert.alert('AI Analysis', data.analysis.aiResponse);
      } else {
        Alert.alert('Unexpected Response', JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error('💥 Fetch error:', error);
      console.error('💥 Error type:', error.name);
      console.error('💥 Error message:', error.message);

      if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
        Alert.alert(
          'Connection Error',
          'Cannot connect to server. Please check:\n' +
            '1. Server is running\n' +
            '2. IP address is correct\n' +
            '3. Port 5003 is open\n' +
            '4. Both devices on same network'
        );
      } else {
        Alert.alert('Error', `${error.name}: ${error.message}`);
      }
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Background Wave */}
      <Svg height="300" width={width} style={{ position: 'absolute', top: -50 }}>
        <Path d={`M0 100 Q${width / 2} 200, ${width} 100 L${width} 0 L0 0 Z`} fill="#e0f2fe" />
      </Svg>

      <View className="px-6 pt-24">
        <Text className="mb-2 text-2xl font-bold text-slate-800">Mental Check-In 🧠</Text>
        <Text className="mb-6 text-base text-slate-500">Tell us how you're doing today.</Text>

        {/* Lottie Animation */}
        <View className="mb-6 items-center">
          <LottieView
            source={require('../assets/lottie/bird.json')}
            autoPlay
            loop
            style={{ width: 120, height: 120 }}
          />
        </View>

        {/* Feeling Scale */}
        <Text className="font-semibold text-slate-700">Feeling Scale (1 - 10)</Text>
        <Slider
          minimumValue={1}
          maximumValue={10}
          value={feelingScale}
          step={1}
          onValueChange={setFeelingScale}
        />
        <Text className="mb-4 text-right text-slate-600">{feelingScale}</Text>

        {/* Sleep Quality */}
        <Text className="font-semibold text-slate-700">Sleep Quality (1 - 10)</Text>
        <Slider
          minimumValue={1}
          maximumValue={10}
          value={sleepQuality}
          step={1}
          onValueChange={setSleepQuality}
        />
        <Text className="mb-4 text-right text-slate-600">{sleepQuality}</Text>

        {/* Stress Level */}
        <Text className="font-semibold text-slate-700">Stress Level (1 - 10)</Text>
        <Slider
          minimumValue={1}
          maximumValue={10}
          value={stressLevel}
          step={1}
          onValueChange={setStressLevel}
        />
        <Text className="mb-4 text-right text-slate-600">{stressLevel}</Text>

        {/* Mood */}
        <Text className="mb-1 font-semibold text-slate-700">Mood (e.g., calm, anxious)</Text>
        <TextInput
          value={mood}
          onChangeText={setMood}
          placeholder="Your current mood"
          className="mb-4 rounded-lg border border-slate-300 p-3"
        />

        {/* Recent Events */}
        <Text className="mb-1 font-semibold text-slate-700">Recent Events</Text>
        <TextInput
          value={recentEvents}
          onChangeText={setRecentEvents}
          placeholder="Anything important recently?"
          className="mb-4 rounded-lg border border-slate-300 p-3"
        />

        {/* Additional Notes */}
        <Text className="mb-1 font-semibold text-slate-700">Additional Notes</Text>
        <TextInput
          value={additionalNotes}
          onChangeText={setAdditionalNotes}
          placeholder="Share more..."
          multiline
          numberOfLines={4}
          className="mb-6 rounded-lg border border-slate-300 p-3 text-base"
        />

        {/* Submit Button */}
        <TouchableOpacity onPress={handleSubmit} className="rounded-full bg-indigo-600 py-4">
          <Text className="text-center text-lg font-semibold text-white">Analyze My State</Text>
        </TouchableOpacity>

        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-6 items-center">
          <Text className="font-semibold text-indigo-500">Back to Home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
