import { useNavigation, useRoute } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import ApiService from '../services/api';

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const confirmPasswordRef = useRef(null);

  // Get email and OTP from route params
  const { email, otp } = route.params;

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      return;
    }

    if (!email || !otp) {
      Alert.alert('Error', 'Session expired. Please start the password reset process again.');
      navigation.navigate('ForgotPassword');
      return;
    }

    setLoading(true);

    try {
      const response = await ApiService.resetPassword({
        email,
        otp,
        newPassword: formData.password,
      });

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
          'Password Reset Successful',
          'Your password has been reset successfully. Please login with your new password.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              },
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
          const errorMessage = errorData?.message || response.error || 'Failed to reset password';

          if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
            Alert.alert(
              'Session Expired',
              'Your verification session has expired. Please request a new OTP.',
              [
                {
                  text: 'Request New OTP',
                  onPress: () => navigation.navigate('ForgotPassword'),
                },
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
              ]
            );
          } else {
            Alert.alert('Error', errorMessage);
          }
        }
      }
    } catch (error) {
      console.error('Reset password error:', error);
      Alert.alert('Unexpected Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
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
          //   source={require('../assets/lottie/reset-password.json')}
          autoPlay
          loop
          style={{ width: 480, height: 360 }}
        />
      </View>

      <View className="mb-8">
        <Text className="text-center text-2xl font-bold text-gray-800">Create New Password</Text>
        <Text className="mt-2 text-center text-gray-600">Enter your new password for</Text>
        <Text className="text-center font-semibold text-indigo-600">{email}</Text>
      </View>

      <View style={{ gap: 10 }}>
        <View>
          <TextInput
            className={` rounded-xl border px-4 py-3 text-base text-gray-800 shadow ${
              errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
            }`}
            placeholder="New Password"
            placeholderTextColor="#9ca3af"
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            secureTextEntry={!showPassword}
            editable={!loading}
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordRef?.current?.focus()}
          />
          {errors.password && <Text className="mt-1 text-sm text-red-600">{errors.password}</Text>}
        </View>

        <View>
          <TextInput
            ref={confirmPasswordRef}
            className={`rounded-xl border px-4 py-3 text-base text-gray-800 shadow ${
              errors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
            }`}
            placeholder="Confirm New Password"
            placeholderTextColor="#9ca3af"
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
            secureTextEntry={!showPassword}
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={handleResetPassword}
          />
          {errors.confirmPassword && (
            <Text className="mt-1 text-sm text-red-600">{errors.confirmPassword}</Text>
          )}
        </View>

        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="mb-2">
          <Text className="text-right text-sm text-indigo-600">
            {showPassword ? 'Hide Passwords' : 'Show Passwords'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleResetPassword}
          disabled={loading}
          className={`mt-6 rounded-full py-4 shadow-lg ${
            loading ? 'bg-indigo-300' : 'bg-indigo-500'
          }`}>
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="text-center text-base font-semibold text-white">RESET PASSWORD</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* <View className="mt-8 flex-row justify-center">
        <Text className="text-gray-500">Need to verify OTP again?</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('VerifyOtp', { email })}
          disabled={loading}>
          <Text className="ml-1 font-semibold text-indigo-600">Back to OTP</Text>
        </TouchableOpacity>
      </View> */}
    </KeyboardAwareScrollView>
  );
}
