import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SignUpScreen() {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignUp = () => {
    console.log('Sign up with:', formData);
  };

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-10">
      <View className="mb-10 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white shadow">
          <Text className="text-lg font-semibold">←</Text>
        </TouchableOpacity>
        <Text className="mt-8 text-lg font-semibold text-gray-900">Create your account</Text>
        <View className="w-10" />
      </View>

      {/* Lottie Illustration */}
      <View className="mb-10 items-center justify-center">
        <LottieView
          source={require('../assets/lottie/signup.json')}
          autoPlay
          loop
          style={{ width: 300, height: 300 }}
        />
      </View>

      <View className="space-y-5">
        <TextInput
          className="my-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-800 shadow"
          placeholder="Full Name"
          placeholderTextColor="#9ca3af"
          value={formData.name}
          onChangeText={(value) => handleInputChange('name', value)}
        />

        <TextInput
          className="my-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-800 shadow"
          placeholder="Email Address"
          placeholderTextColor="#9ca3af"
          value={formData.email}
          onChangeText={(value) => handleInputChange('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          className="my-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-800 shadow"
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          value={formData.password}
          onChangeText={(value) => handleInputChange('password', value)}
          secureTextEntry
        />

        <TouchableOpacity
          onPress={handleSignUp}
          className="mt-2 rounded-full bg-indigo-500 py-4 shadow-lg">
          <Text className="text-center text-base font-semibold text-white">GET STARTED</Text>
        </TouchableOpacity>
      </View>

      <View className="mt-10 flex-row items-center justify-center space-x-4">
        <TouchableOpacity className="h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white shadow">
          <Text className="text-xl font-bold text-blue-700">f</Text>
        </TouchableOpacity>
        <TouchableOpacity className="h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white shadow">
          <Text className="text-xl font-bold text-red-600">G</Text>
        </TouchableOpacity>
      </View>

      <View className="mt-6 flex-row justify-center">
        <Text className="text-gray-500">ALREADY HAVE AN ACCOUNT?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text className="ml-1 font-semibold text-indigo-600">LOG IN</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
