import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import ApiService from '../services/api';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateEmail = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async () => {
    if (!validateEmail()) {
      return;
    }

    setLoading(true);

    try {
      const response = await ApiService.forgotPassword({ email });
      console.log('forget password response', response);

      // Handle network errors
      if (response.networkError) {
        Alert.alert(
          'Connection Error',
          'Unable to connect to server. Please check your internet connection and try again.'
        );
        return;
      }

      if (response.success) {
        Alert.alert(
          'OTP Sent',
          'A 6-digit verification code has been sent to your email address.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('VerifyOtp', { email }),
            },
          ]
        );
      } else {
        // Handle errors
        const errorData = response.data;
        if (errorData?.errors && Array.isArray(errorData.errors)) {
          const backendErrors = {};
          errorData.errors.forEach((error) => {
            backendErrors[error.path || error.param] = error.msg;
          });
          setErrors(backendErrors);
        } else {
          const errorMessage = errorData?.message || response.error || 'Failed to send OTP';
          Alert.alert('Error', errorMessage);
        }
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      Alert.alert('Unexpected Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value) => {
    setEmail(value);
    // Clear error when user starts typing
    if (errors.email) {
      setErrors({});
    }
  };

  return (
    <KeyboardAwareScrollView
      className="mt-10 flex-1 bg-white px-6 pt-10"
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      keyboardOpeningTime={0}
      extraScrollHeight={20}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}>
      <View className="mb-10 items-center">
        <LottieView
          //   source={require('../assets/lottie/forgot-password.json')}
          autoPlay
          loop
          style={{ width: 480, height: 360 }}
        />
      </View>

      <View className="mb-8">
        <Text className="text-center text-2xl font-bold text-gray-800">Forgot Password?</Text>
        <Text className="mt-2 text-center text-gray-600">
          Don't worry! Enter your email address and we'll send you a verification code.
        </Text>
      </View>

      <View className="space-y-5">
        <View>
          <TextInput
            className={`rounded-xl border px-4 py-3 text-base text-gray-800 shadow ${
              errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
            }`}
            placeholder="Enter your email address"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={handleInputChange}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={handleForgotPassword}
          />
          {errors.email && <Text className="mt-1 text-sm text-red-600">{errors.email}</Text>}
        </View>

        <TouchableOpacity
          onPress={handleForgotPassword}
          disabled={loading}
          className={`mt-6 rounded-full py-4 shadow-lg ${
            loading ? 'bg-indigo-300' : 'bg-indigo-500'
          }`}>
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="text-center text-base font-semibold text-white">
              SEND VERIFICATION CODE
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View className="mt-8 flex-row justify-center">
        <Text className="text-gray-500">Remember your password?</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
          <Text className="ml-1 font-semibold text-indigo-600">Back to Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}
