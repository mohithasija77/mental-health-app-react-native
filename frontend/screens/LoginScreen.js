import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import ApiService from '../services/api'; // Adjust path as needed

export default function LoginScreen() {
  const navigation = useNavigation();
  const passwordInputRef = useRef(null);
  const [formData, setFormData] = useState({ email: '', password: '' });
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
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await ApiService.login(formData);

      // Handle network errors
      if (response.networkError) {
        Alert.alert(
          'Connection Error',
          'Unable to connect to server. Please check your internet connection and try again.'
        );
        return;
      }

      if (response.success && response.data?.success) {
        // Save token first
        await ApiService.saveToken(response.data.token);

        // Get user data from /auth/me endpoint since login doesn't return user data
        try {
          const userResponse = await ApiService.getCurrentUser();
          if (userResponse.success && userResponse.data?.data?.user) {
            // Extract the actual user object from the nested structure
            const userData = userResponse.data.data.user;
            await ApiService.saveUserData(userData);
            console.log('Login - Token saved:', response.data.token);
            console.log('Login - User data saved:', userData);
          } else {
            console.error('Failed to get user data after login:', userResponse);
          }
        } catch (userError) {
          console.error('Error getting user data after login:', userError);
        }

        Alert.alert('Welcome Back!', 'Login successful!', [
          {
            text: 'OK',
            onPress: () => {
              try {
                navigation.navigate('Welcome');
              } catch (error) {
                console.log('Navigation error, using reset instead');
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Home' }],
                });
              }
            },
          },
        ]);
      } else {
        // Handle login errors
        const errorData = response.data;
        if (errorData?.errors && Array.isArray(errorData.errors)) {
          const backendErrors = {};
          errorData.errors.forEach((error) => {
            backendErrors[error.path || error.param] = error.msg;
          });
          setErrors(backendErrors);
        } else {
          const errorMessage = errorData?.message || response.error || 'Login failed';
          if (errorMessage.includes('Invalid email or password')) {
            Alert.alert(
              'Login Failed',
              'Invalid email or password. Please check your credentials and try again.'
            );
          } else {
            Alert.alert('Error', errorMessage);
          }
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Unexpected Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset functionality will be available soon!');
  };

  const handleSocialLogin = (provider) => {
    Alert.alert('Coming Soon', `${provider} login will be available soon!`);
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
          source={require('../assets/lottie/login.json')}
          autoPlay
          loop
          style={{ width: 480, height: 360 }}
        />
      </View>

      <View className="space-y-5">
        <View>
          <TextInput
            className={`rounded-xl border px-4 py-3 text-base text-gray-800 shadow ${
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
            ref={(ref) => (passwordInputRef.current = ref)}
            className={`my-3 rounded-xl border px-4 py-3 text-base text-gray-800 shadow ${
              errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
            }`}
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            secureTextEntry
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          {errors.password && <Text className="mt-1 text-sm text-red-600">{errors.password}</Text>}
        </View>

        <TouchableOpacity onPress={handleForgotPassword} disabled={loading} className="mb-2">
          <Text className="text-right text-sm text-indigo-600">Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          className={`mt-2 rounded-full py-4 shadow-lg ${
            loading ? 'bg-indigo-300' : 'bg-indigo-500'
          }`}>
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="text-center text-base font-semibold text-white">LOGIN</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Social Login Options */}
      <View className="mt-8 items-center">
        <Text className="mb-4 text-gray-500">Or continue with</Text>
        <View className="flex-row items-center justify-center space-x-4">
          <TouchableOpacity
            onPress={() => handleSocialLogin('Facebook')}
            disabled={loading}
            className="h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white shadow">
            <Text className="text-xl font-bold text-blue-700">f</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSocialLogin('Google')}
            disabled={loading}
            className="h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white shadow">
            <Text className="text-xl font-bold text-red-600">G</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="mt-6 flex-row justify-center">
        <Text className="text-gray-500">Don't have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')} disabled={loading}>
          <Text className="ml-1 font-semibold text-indigo-600">Sign Up</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}
