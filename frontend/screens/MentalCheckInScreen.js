import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import LottieView from 'lottie-react-native';
import { useEffect, useState } from 'react';
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
import Icon from 'react-native-vector-icons/Feather';
const { API_BASE_URL } = Constants.expoConfig.extra;

const { width, height } = Dimensions.get('window');

export default function MentalCheckInScreen() {
  const navigation = useNavigation();

  const [feelingScale, setFeelingScale] = useState(5);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [stressLevel, setStressLevel] = useState(5);
  const [mood, setMood] = useState('happy');
  const [recentEvents, setRecentEvents] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  // Label mappings for each scale
  const feelingLabels = {
    1: 'Terrible',
    2: 'Very Bad',
    3: 'Bad',
    4: 'Poor',
    5: 'Okay',
    6: 'Fair',
    7: 'Good',
    8: 'Very Good',
    9: 'Great',
    10: 'Excellent',
  };

  const sleepLabels = {
    1: 'Terrible',
    2: 'Very Poor',
    3: 'Poor',
    4: 'Below Average',
    5: 'Average',
    6: 'Fair',
    7: 'Good',
    8: 'Very Good',
    9: 'Excellent',
    10: 'Perfect',
  };

  const stressLabels = {
    1: 'No Stress',
    2: 'Minimal',
    3: 'Low',
    4: 'Mild',
    5: 'Moderate',
    6: 'Noticeable',
    7: 'High',
    8: 'Very High',
    9: 'Severe',
    10: 'Overwhelming',
  };

  // Function to get label color based on value and scale type
  const getLabelColor = (value, scaleType) => {
    if (scaleType === 'stress') {
      // For stress, higher values are worse (red), lower values are better (green)
      if (value <= 3) return '#10B981'; // green-600
      if (value <= 6) return '#EAB308'; // yellow-500
      return '#DC2626'; // red-600
    } else {
      // For feeling and sleep, higher values are better
      if (value >= 8) return '#10B981'; // green-600
      if (value >= 6) return '#EAB308'; // yellow-500
      if (value >= 4) return '#EA580C'; // orange-600
      return '#DC2626'; // red-600
    }
  };

  const checkTodaysCheckin = async () => {
    try {
      setIsLoading(true);

      // Get user data from AsyncStorage
      const userData = await AsyncStorage.getItem('userData');
      const user = userData ? JSON.parse(userData) : null;

      // Check for _id since your user object uses MongoDB's _id field
      if (!user || !user._id) {
        console.error('No authenticated user found');
        console.log('User data:', user); // Debug log to see what's stored
        setHasCheckedInToday(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/mental-health/checkin/check-today/${user._id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      const data = await response.json();
      console.log('Check-in response:', data); // Debug log

      if (response.ok) {
        setHasCheckedInToday(data.hasCheckedInToday || false);
        console.log('Has checked in today:', data.hasCheckedInToday);
      } else {
        console.error('Check-in API error:', data);
        setHasCheckedInToday(false);
      }
    } catch (error) {
      console.error("Error checking today's checkin:", error);
      setHasCheckedInToday(false);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ CHECK ON COMPONENT MOUNT
  useEffect(() => {
    checkTodaysCheckin();
  }, []);

  const handleSelect = (selectedMood) => {
    setMood(selectedMood);
    setIsOpen(false);
  };

  const handleSubmit = async () => {
    if (hasCheckedInToday) {
      Alert.alert(
        'Already Checked In',
        "You've already submitted your check-in for today. Come back tomorrow!"
      );
      return;
    }

    const testId = 'test-user-123'; // Replace with actual user ID

    const userData = await AsyncStorage.getItem('userData');
    const user = userData ? JSON.parse(userData) : null;

    const payload = {
      userId: user._id,
      feelingScale: feelingScale ?? 0,
      sleepQuality: sleepQuality ?? 0,
      stressLevel: stressLevel ?? 0,
      mood: mood?.toLowerCase() ?? '',
      recentEvents: recentEvents ?? '',
      notes: additionalNotes ?? '',
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/mental-health/analyze`, {
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

        setHasCheckedInToday(true);

        // --- RESET FORM STATES ---
        setFeelingScale(5); // default value
        setSleepQuality(5); // default value
        setStressLevel(5); // default value
        setMood('happy'); // default mood
        setRecentEvents('');
        setAdditionalNotes('');
        setIsOpen(false); // close mood dropdown if open

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
  console.log(hasCheckedInToday);
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
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="font-semibold text-slate-700">How are you feeling today?</Text>
            <Text
              className="text-lg font-bold"
              style={{ color: getLabelColor(feelingScale, 'feeling') }}>
              {feelingLabels[feelingScale]}
            </Text>
          </View>

          <Slider
            minimumValue={1}
            maximumValue={10}
            value={feelingScale}
            step={1}
            onValueChange={setFeelingScale}
            minimumTrackTintColor={getLabelColor(feelingScale, 'feeling')}
            maximumTrackTintColor="#E2E8F0"
            thumbStyle={{ backgroundColor: getLabelColor(feelingScale, 'feeling') }}
          />
          <View className="mt-1 flex-row justify-between">
            <Text className="text-xs text-slate-500">Terrible</Text>
            <Text className="text-xs text-slate-500">Okay</Text>
            <Text className="text-xs text-slate-500">Excellent</Text>
          </View>
        </View>

        {/* Sleep Quality */}
        <View className="mb-4 mt-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="font-semibold text-slate-700">How was your sleep quality?</Text>
            <Text
              className="text-lg font-bold"
              style={{ color: getLabelColor(sleepQuality, 'sleep') }}>
              {sleepLabels[sleepQuality]}
            </Text>
          </View>
          <Slider
            minimumValue={1}
            maximumValue={10}
            value={sleepQuality}
            step={1}
            onValueChange={setSleepQuality}
            minimumTrackTintColor={getLabelColor(sleepQuality, 'sleep')}
            maximumTrackTintColor="#E2E8F0"
            thumbStyle={{ backgroundColor: getLabelColor(sleepQuality, 'sleep') }}
          />
          <View className="mt-1 flex-row justify-between">
            <Text className="text-xs text-slate-500">Terrible</Text>
            <Text className="text-xs text-slate-500">Average</Text>
            <Text className="text-xs text-slate-500">Perfect</Text>
          </View>
        </View>

        {/* Stress Level */}
        <View className="mb-4 mt-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="font-semibold text-slate-700">What's your stress level?</Text>
            <Text
              className="text-lg font-bold"
              style={{ color: getLabelColor(stressLevel, 'stress') }}>
              {stressLabels[stressLevel]}
            </Text>
          </View>
          <Slider
            minimumValue={1}
            maximumValue={10}
            value={stressLevel}
            step={1}
            onValueChange={setStressLevel}
            minimumTrackTintColor={getLabelColor(stressLevel, 'stress')}
            maximumTrackTintColor="#E2E8F0"
            thumbStyle={{ backgroundColor: getLabelColor(stressLevel, 'stress') }}
          />
          <View className="mt-1 flex-row justify-between">
            <Text className="text-xs text-slate-500">No Stress</Text>
            <Text className="text-xs text-slate-500">Moderate</Text>
            <Text className="text-xs text-slate-500">Overwhelming</Text>
          </View>
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
        <TouchableOpacity
          onPress={handleSubmit}
          className={`mb-4 rounded-full py-4 ${
            hasCheckedInToday ? 'bg-gray-400' : 'bg-indigo-600'
          }`}
          disabled={hasCheckedInToday || isLoading}>
          <Text className="text-center text-lg font-semibold text-white">
            {hasCheckedInToday ? 'Already Checked In Today' : 'Analyze My State'}
          </Text>
        </TouchableOpacity>

        {/* Go Back Button */}
        <View className="mb-6">
          <TouchableOpacity
            className="rounded-lg border border-gray-300 bg-white p-4"
            onPress={() => navigation.navigate('Welcome')}>
            <View className="flex-row items-center justify-center">
              <Icon name="arrow-left" size={20} color="#374151" />
              <Text className="ml-2 text-center font-semibold text-gray-700">Back to Home</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
