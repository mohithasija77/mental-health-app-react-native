import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogin = () => {
    console.log('Login with:', formData);
  };

  return (
    <ScrollView className="mt-10 flex-1 bg-white px-6 pt-10">
      <View className="mb-10 items-center">
        <LottieView
          source={require('../assets/lottie/login.json')}
          autoPlay
          loop
          style={{ width: 620, height: 420 }}
        />
      </View>

      <View className="space-y-5">
        <TextInput
          className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-800 shadow"
          placeholder="Email Address"
          placeholderTextColor="#9ca3af"
          value={formData.email}
          onChangeText={(value) => handleInputChange('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          className="my-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-800 shadow"
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          value={formData.password}
          onChangeText={(value) => handleInputChange('password', value)}
          secureTextEntry
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          className="mt-2 rounded-full bg-indigo-500 py-4 shadow-lg">
          <Text className="text-center text-base font-semibold text-white">LOGIN</Text>
        </TouchableOpacity>
      </View>

      <View className="mt-6 flex-row justify-center">
        <Text className="text-gray-500">Don't have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text className="ml-1 font-semibold text-indigo-600">Sign Up</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
