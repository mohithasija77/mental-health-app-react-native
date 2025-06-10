import { useNavigation } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import LottieView from 'lottie-react-native';
import { Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import AISection from '../components/AISection';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();

  const [fontsLoaded] = useFonts({
    Quicksand: require('../assets/fonts/static/Quicksand-Regular.ttf'), // Add your font here
    QuicksandBold: require('../assets/fonts/static/Quicksand-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="relative bg-slate-50">
      {/* Background SVG */}
      <Svg height="300" width={width} style={{ position: 'absolute', top: -50 }}>
        <Path d={`M0 100 Q${width / 2} 200, ${width} 100 L${width} 0 L0 0 Z`} fill="#e0f2fe" />
      </Svg>

      {/* Header */}
      <View className="px-5 pb-5 pt-20">
        <Text className="text-2xl" style={{ fontFamily: 'QuicksandBold' }}>
          Welcome, Mohit 👋
        </Text>
        <Text className="mt-1 text-base text-slate-600" style={{ fontFamily: 'Quicksand' }}>
          Let’s support your mind today.
        </Text>
      </View>

      {/* Grid */}
      <View className="flex-row flex-wrap justify-between px-5">
        {/* 1. Mental Check-In */}
        <TouchableOpacity className="mb-6 h-52 w-[48%] items-center justify-center rounded-3xl bg-yellow-100 shadow">
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

        {/* 2. Emotion Analyzer */}
        <TouchableOpacity className="mb-6 h-52 w-[48%] items-center justify-center rounded-3xl bg-sky-100 shadow">
          <Image
            // source={require('../assets/icons/emotion.png')}
            style={{ width: 70, height: 70 }}
            resizeMode="contain"
          />
          <Text
            className="mt-2 text-center text-base text-slate-800"
            style={{ fontFamily: 'QuicksandBold' }}>
            Emotion Analyzer
          </Text>
        </TouchableOpacity>

        {/* 3. AI Journal Insight */}
        <TouchableOpacity className="mb-6 h-52 w-[48%] items-center justify-center rounded-3xl bg-pink-100 shadow">
          <Image
            // source={require('../assets/icons/journal.png')}
            style={{ width: 70, height: 70 }}
            resizeMode="contain"
          />
          <Text
            className="mt-2 text-center text-base text-slate-800"
            style={{ fontFamily: 'QuicksandBold' }}>
            AI Journal Insight
          </Text>
        </TouchableOpacity>

        {/* 4. Stress Detector */}
        <TouchableOpacity className="mb-6 h-52 w-[48%] items-center justify-center rounded-3xl bg-green-100 shadow">
          <Image
            // source={require('../assets/icons/stress.png')}
            style={{ width: 70, height: 70 }}
            resizeMode="contain"
          />
          <Text
            className="mt-2 text-center text-base text-slate-800"
            style={{ fontFamily: 'QuicksandBold' }}>
            Stress Detector
          </Text>
        </TouchableOpacity>
      </View>

      {/* AI Section */}
      <AISection />

      {/* Footer */}
      <View className="mt-6 flex-row justify-center pb-6">
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text
            className="ml-1 font-semibold text-indigo-600"
            style={{ fontFamily: 'QuicksandBold' }}>
            Back
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
