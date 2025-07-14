import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export default function MentalCheckInScreen() {
  const navigation = useNavigation();

  const [feelingScale, setFeelingScale] = useState(5);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [stressLevel, setStressLevel] = useState(5);
  const [mood, setMood] = useState('anxious');
  const [recentEvents, setRecentEvents] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const moodOptions = [
    'happy',
    'sad',
    'anxious',
    'excited',
    'calm',
    'angry',
    'hopeful',
    'overwhelmed',
    'grateful',
    'frustrated',
    'stressed',
    'energetic',
    'relaxed',
    'tired',
    'joyful',
    'optimistic',
  ];

  const handleSelect = (selectedMood) => {
    setMood(selectedMood);
    setIsOpen(false);
  };

  const handleSubmit = async () => {
    const testId = 'test-user-123'; // Replace with actual user ID

    const payload = {
      userId: testId,
      feelingScale: feelingScale ?? 0,
      sleepQuality: sleepQuality ?? 0,
      stressLevel: stressLevel ?? 0,
      mood: mood?.toLowerCase() ?? '',
      recentEvents: recentEvents ?? '',
      notes: additionalNotes ?? '',
    };

    try {
      const response = await fetch('http://172.16.3.162:5003/api/mental-health/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json(); // ✅ parse once

      if (response.ok && data.success && data.analysis) {
        console.log('✅ Success response:', data);
        const { analysis } = data;

        const message = `
  Daily Score: ${analysis.dataInsights.wellnessScore}/10

  Data Observations:
   ${analysis.dataInsights.observations.join('\n• ')}
  
  Current Summary:
   Feeling: ${analysis.summary.feelingScale}/10
   Sleep: ${analysis.summary.sleepQuality}/10  
   Stress: ${analysis.summary.stressLevel}/10
   Mood: ${analysis.summary.mood}
  
  ${analysis.supportiveInsights}
        `.trim();

        Alert.alert(
          '🌟 Daily Wellness Insights',
          message,
          [{ text: 'Got it!', style: 'default' }],
          { cancelable: true }
        );
      } else {
        // ❌ Backend responded with error (status 400 etc)
        console.error('❌ API error response:', data);

        if (data.error === 'Duplicate check-in') {
          Alert.alert(
            'Check-in already submitted',
            'You’ve already done today’s check-in. Come back tomorrow!'
          );
        } else {
          Alert.alert('Something went wrong', data.message || 'Please try again later.');
        }
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
    <KeyboardAwareScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{
        paddingBottom: 150, // More padding for keyboard and footer
        flexGrow: 1,
      }}
      enableOnAndroid={true}
      extraScrollHeight={50} // adjust if you want more space above keyboard
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {/* Fixed Background Wave - reduced height */}
      <Svg height="100" width={width} style={{ position: 'absolute', top: 0 }}>
        <Path d={`M0 80 Q${width / 2} 160, ${width} 80 L${width} 0 L0 0 Z`} fill="#e0f2fe" />
      </Svg>

      <View className="px-6 pt-16">
        <Text className="mb-2 text-2xl font-bold text-slate-800">Mental Check-In 🧠</Text>
        <Text className="mb-4 text-base text-slate-500">Tell us how you're doing today.</Text>

        {/* Smaller Lottie Animation */}
        <View className="mb-4 items-center">
          <LottieView
            source={require('../assets/lottie/bird.json')}
            autoPlay
            loop
            style={{ width: 80, height: 80 }}
          />
        </View>

        {/* Feeling Scale */}
        <View className="mb-4">
          <Text className="mb-2 font-semibold text-slate-700">Feeling Scale (1 - 10)</Text>
          <Slider
            minimumValue={1}
            maximumValue={10}
            value={feelingScale}
            step={1}
            onValueChange={setFeelingScale}
          />
          <Text className="text-right text-slate-600">{feelingScale}</Text>
        </View>

        {/* Sleep Quality */}
        <View className="mb-4">
          <Text className="mb-2 font-semibold text-slate-700">Sleep Quality (1 - 10)</Text>
          <Slider
            minimumValue={1}
            maximumValue={10}
            value={sleepQuality}
            step={1}
            onValueChange={setSleepQuality}
          />
          <Text className="text-right text-slate-600">{sleepQuality}</Text>
        </View>

        {/* Stress Level */}
        <View className="mb-4">
          <Text className="mb-2 font-semibold text-slate-700">Stress Level (1 - 10)</Text>
          <Slider
            minimumValue={1}
            maximumValue={10}
            value={stressLevel}
            step={1}
            onValueChange={setStressLevel}
          />
          <Text className="text-right text-slate-600">{stressLevel}</Text>
        </View>

        {/* Mood Dropdown */}
        <View className="mb-4">
          <Text className="mb-2 font-semibold text-slate-700">Mood</Text>
          <TouchableOpacity
            onPress={() => setIsOpen(true)}
            className="flex-row items-center justify-between rounded-lg border border-slate-300 bg-white p-3">
            <Text className={`${mood ? 'text-slate-900' : 'text-slate-400'}`}>
              {mood ? mood.charAt(0).toUpperCase() + mood.slice(1) : 'Select your current mood'}
            </Text>
            <Text className="text-lg text-slate-400">{isOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
        </View>

        {/* Dropdown Modal */}
        <Modal
          visible={isOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsOpen(false)}>
          <TouchableOpacity
            className="flex-1 items-center justify-center bg-black/50"
            activeOpacity={1}
            onPress={() => setIsOpen(false)}>
            <View className="mx-4 max-h-96 w-80 rounded-lg bg-white">
              <View className="border-b border-slate-200 p-4">
                <Text className="text-center text-lg font-semibold text-slate-800">
                  Select Mood
                </Text>
              </View>
              <ScrollView className="max-h-80" nestedScrollEnabled={true}>
                {moodOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => handleSelect(option)}
                    className={`border-b border-slate-100 p-4 ${
                      mood === option ? 'bg-blue-50' : 'bg-white'
                    }`}>
                    <Text
                      className={`text-center ${
                        mood === option ? 'font-semibold text-blue-600' : 'text-slate-700'
                      }`}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                className="rounded-b-lg bg-slate-50 p-4">
                <Text className="text-center font-medium text-slate-600">Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Recent Events */}
        <View className="mb-4">
          <Text className="mb-2 font-semibold text-slate-700">Recent Events</Text>
          <TextInput
            value={recentEvents}
            onChangeText={setRecentEvents}
            placeholder="Anything important recently?"
            className="rounded-lg border border-slate-300 p-3"
            returnKeyType="done"
            blurOnSubmit={true}
          />
        </View>

        {/* Additional Notes */}
        <View className="mb-6">
          <Text className="mb-2 font-semibold text-slate-700">Additional Notes</Text>
          <TextInput
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
            placeholder="Share more..."
            multiline
            numberOfLines={4}
            className="rounded-lg border border-slate-300 p-3 text-base"
            textAlignVertical="top"
            returnKeyType="done"
            blurOnSubmit={true}
            scrollEnabled={false}
            style={{ height: 100, textAlignVertical: 'top' }}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity onPress={handleSubmit} className="mb-4 rounded-full bg-indigo-600 py-4">
          <Text className="text-center text-lg font-semibold text-white">Analyze My State</Text>
        </TouchableOpacity>

        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()} className="mb-8 items-center">
          <Text className="font-semibold text-indigo-500">Back to Home</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}
