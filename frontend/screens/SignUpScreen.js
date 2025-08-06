import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import ApiService from '../services/api'; // Adjust path as needed

export default function SignUpScreen() {
  const navigation = useNavigation();
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await ApiService.signup(formData);

      // Handle network errors
      if (response.networkError) {
        Alert.alert(
          'Connection Error',
          'Unable to connect to server. Please check:\n\n' +
            '1. Your internet connection\n' +
            '2. Server is running on the correct port\n' +
            '3. API URL is correct for your device type\n\n' +
            'Current API URL: Check your ApiService configuration'
        );
        return;
      }

      if (response.success && response.data?.success) {
        // Fix: Handle different possible response structures
        let userData;
        let token;

        // Check different possible response structures from your backend
        if (response.data.data?.user) {
          // Structure: { success: true, data: { user: {...}, token: "..." } }
          userData = response.data.data.user;
          token = response.data.data.token || response.data.token;
        } else if (response.data.user) {
          // Structure: { success: true, user: {...}, token: "..." }
          userData = response.data.user;
          token = response.data.token;
        } else {
          // Fallback - log the response structure to debug
          console.log('Unexpected signup response structure:', response.data);
          userData = response.data;
          token = response.data.token;
        }

        // Save token and user data
        if (token) {
          await ApiService.saveToken(token);
        }

        if (userData) {
          await ApiService.saveUserData(userData);
        }

        // Debug: Check what was saved
        console.log('Signup - Token saved:', token);
        console.log('Signup - User data saved:', userData);
        console.log('Full response structure:', JSON.stringify(response.data, null, 2));

        Alert.alert('Success!', 'Account created successfully!', [
          {
            text: 'OK',
            onPress: () => {
              try {
                navigation.navigate('Welcome');
              } catch (error) {
                console.log('Navigation error, using reset instead');
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            },
          },
        ]);
      } else {
        // Handle validation errors from backend
        const errorData = response.data;
        if (errorData?.errors && Array.isArray(errorData.errors)) {
          const backendErrors = {};
          errorData.errors.forEach((error) => {
            backendErrors[error.path || error.param] = error.msg;
          });
          setErrors(backendErrors);
        } else {
          Alert.alert('Error', errorData?.message || response.error || 'Something went wrong');
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Unexpected Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignUp = (provider) => {
    Alert.alert('Coming Soon', `${provider} sign up will be available soon!`);
  };

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-white px-6 pt-10"
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      keyboardOpeningTime={0}
      extraScrollHeight={20}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}>
      <View className="mb-10 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mt-8 h-10 w-10 items-center justify-center rounded-full bg-white shadow">
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
          style={{ width: 280, height: 280 }}
        />
      </View>

      <View className="space-y-5">
        <View>
          <TextInput
            className={`my-2 rounded-xl border px-4 py-3 text-base text-gray-800 shadow ${
              errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
            }`}
            placeholder="Full Name"
            placeholderTextColor="#9ca3af"
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
            editable={!loading}
            returnKeyType="next"
            onSubmitEditing={() => {
              // Focus on email field when user presses "next" on name field
              emailInputRef?.current?.focus();
            }}
          />
          {errors.name && <Text className="mt-1 text-sm text-red-600">{errors.name}</Text>}
        </View>

        <View>
          <TextInput
            ref={emailInputRef}
            className={`my-2 rounded-xl border px-4 py-3 text-base text-gray-800 shadow ${
              errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
            }`}
            placeholder="Email Address"
            placeholderTextColor="#9ca3af"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
            returnKeyType="next"
            onSubmitEditing={() => {
              // Focus on password field when user presses "next" on email field
              passwordInputRef?.current?.focus();
            }}
          />
          {errors.email && <Text className="mt-1 text-sm text-red-600">{errors.email}</Text>}
        </View>

        <View>
          <TextInput
            ref={passwordInputRef}
            className={`my-2 rounded-xl border px-4 py-3 text-base text-gray-800 shadow ${
              errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
            }`}
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            secureTextEntry
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={handleSignUp}
          />
          {errors.password && <Text className="mt-1 text-sm text-red-600">{errors.password}</Text>}
          <Text className="mt-1 text-xs text-gray-500">
            Password must contain uppercase, lowercase, and number
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleSignUp}
          disabled={loading}
          className={`mt-2 rounded-full py-4 shadow-lg ${
            loading ? 'bg-indigo-300' : 'bg-indigo-500'
          }`}>
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="text-center text-base font-semibold text-white">GET STARTED</Text>
          )}
        </TouchableOpacity>
      </View>

      <View className="mt-10 flex-row items-center justify-center space-x-4">
        <TouchableOpacity
          onPress={() => handleSocialSignUp('Facebook')}
          disabled={loading}
          className="h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white shadow">
          <Text className="text-xl font-bold text-blue-700">f</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleSocialSignUp('Google')}
          disabled={loading}
          className="h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white shadow">
          <Text className="text-xl font-bold text-red-600">G</Text>
        </TouchableOpacity>
      </View>

      <View className="mt-6 flex-row justify-center">
        <Text className="text-gray-500">ALREADY HAVE AN ACCOUNT?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
          <Text className="ml-1 font-semibold text-indigo-600">LOG IN</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}
