import { useNavigation } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import LottieView from 'lottie-react-native';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();

  const [fontsLoaded] = useFonts({
    Quicksand: require('../assets/fonts/static/Quicksand-Regular.ttf'), // Add your font here
    QuicksandBold: require('../assets/fonts/static/Quicksand-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <View className="flex-1 bg-slate-50">
      {/* Background SVG */}
      <Svg height="300" width={width} style={{ position: 'absolute', top: -40 }}>
        <Path d={`M0 100 Q${width / 2} 200, ${width} 100 L${width} 0 L0 0 Z`} fill="#e0f2fe" />
      </Svg>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          minHeight: height - 100, // Ensures content takes proper space
          paddingVertical: 20,
        }}
        className="relative"
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pb-8 pt-20">
          <Text className="text-2xl" style={{ fontFamily: 'QuicksandBold' }}>
            Welcome, Mohit 👋
          </Text>
          <Text className="mt-1 text-base text-slate-600" style={{ fontFamily: 'Quicksand' }}>
            Let's support your mind today.
          </Text>
        </View>

        {/* Grid */}
        <View className="flex-row flex-wrap items-center justify-between px-5">
          {/* 1. Mental Check-In */}
          <TouchableOpacity
            onPress={() => navigation.navigate('MentalCheckIn')}
            className="mb-6 h-52 w-[48%] items-center justify-center rounded-3xl bg-yellow-100 shadow-md">
            <LottieView
              source={require('../assets/lottie/bird.json')}
              autoPlay
              loop
              style={{ width: 80, height: 80 }}
            />
            <Text
              className="mt-2 text-center text-base text-slate-800"
              style={{ fontFamily: 'QuicksandBold' }}>
              Mental Check-In
            </Text>
          </TouchableOpacity>

          {/* 2. Weekly Summary */}
          <TouchableOpacity
            onPress={() => navigation.navigate('WeeklySummary')}
            className="mb-6 h-52 w-[48%] items-center justify-center rounded-3xl bg-sky-100 shadow-md">
            <LottieView
              source={require('../assets/lottie/learning.json')}
              autoPlay
              loop
              style={{ width: 80, height: 80 }}
            />
            <Text
              className="mt-2 text-center text-base text-slate-800"
              style={{ fontFamily: 'QuicksandBold' }}>
              Weekly Summary
            </Text>
          </TouchableOpacity>

          {/* 3. Mental Health Facts */}
          <TouchableOpacity
            onPress={() => navigation.navigate('MentalHealthFacts')}
            className="mb-6 h-52 w-[48%] items-center justify-center rounded-3xl bg-pink-100 shadow-md">
            <LottieView
              source={require('../assets/lottie/sundae.json')}
              autoPlay
              loop
              style={{ width: 80, height: 80 }}
            />
            <Text
              className="mt-2 text-center text-base text-slate-800"
              style={{ fontFamily: 'QuicksandBold' }}>
              Mental Health Facts
            </Text>
          </TouchableOpacity>

          {/* 4. Stress Detector */}
          <TouchableOpacity
            onPress={() => navigation.navigate('StressDetector')}
            className="mb-6 h-52 w-[48%] items-center justify-center rounded-3xl bg-green-100 shadow-md">
            <LottieView
              source={require('../assets/lottie/dog.json')}
              autoPlay
              loop
              style={{ width: 80, height: 80 }}
            />
            <Text
              className="mt-2 text-center text-base text-slate-800"
              style={{ fontFamily: 'QuicksandBold' }}>
              Stress Detector
            </Text>
          </TouchableOpacity>
        </View>

        {/* Spacer to push footer to bottom */}
        <View className="h-8" />

        {/* Footer */}
        <View className="mt-6 flex-row justify-center pb-6">
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text
              className="ml-1 font-semibold text-indigo-600"
              style={{ fontFamily: 'QuicksandBold' }}>
              Log Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
