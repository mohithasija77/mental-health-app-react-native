import { useNavigation, useRoute } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import ApiService from '../services/api';

export default function VerifyOtpScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [timer, setTimer] = useState(300); // 5 minutes countdown
  const [canResend, setCanResend] = useState(false);

  const otpRefs = useRef([]);

  useEffect(() => {
    // Start countdown timer
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Clear errors when user starts typing
    if (errors.otp) {
      setErrors({});
    }

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index, key) => {
    // Handle backspace
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const validateOtp = () => {
    const otpString = otp.join('');
    const newErrors = {};

    if (otpString.length !== 6) {
      newErrors.otp = 'Please enter the complete 6-digit OTP';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerifyOtp = async () => {
    if (!validateOtp()) {
      return;
    }

    setLoading(true);

    try {
      const otpString = otp.join('').trim(); // Ensure it's trimmed
      console.log('Sending OTP for verification:', { email, otp: otpString });

      const response = await ApiService.verifyOtp({ email, otp: otpString });
      console.log('Verify OTP response:', response);

      // Handle network errors
      if (response.networkError) {
        Alert.alert(
          'Connection Error',
          'Unable to connect to server. Please check your internet connection and try again.'
        );
        return;
      }

      if (response.success) {
        navigation.navigate('ResetPassword', { email, otp: otpString });
      } else {
        const errorData = response.data;
        const errorMessage = errorData?.message || response.error || 'Invalid OTP';
        setErrors({ otp: errorMessage });
        console.log('OTP verification failed:', errorMessage);
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      Alert.alert('Unexpected Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);

    try {
      const response = await ApiService.forgotPassword({ email });

      if (response.networkError) {
        Alert.alert(
          'Connection Error',
          'Unable to connect to server. Please check your internet connection and try again.'
        );
        return;
      }

      if (response.success) {
        Alert.alert('OTP Sent', 'A new verification code has been sent to your email.');
        // Reset timer and form
        setTimer(300);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        setErrors({});
        otpRefs.current[0]?.focus();
      } else {
        const errorData = response.data;
        const errorMessage = errorData?.message || response.error || 'Failed to resend OTP';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Unexpected Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setResendLoading(false);
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
          //   source={require('../assets/lottie/otp-verification.json')}
          autoPlay
          loop
          style={{ width: 480, height: 360 }}
        />
      </View>

      <View className="mb-8">
        <Text className="text-center text-2xl font-bold text-gray-800">Verify OTP</Text>
        <Text className="mt-2 text-center text-gray-600">
          We've sent a 6-digit verification code to
        </Text>
        <Text className="text-center font-semibold text-indigo-600">{email}</Text>
      </View>

      <View className="space-y-5">
        {/* OTP Input Fields */}
        <View className="flex-row justify-center space-x-3">
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (otpRefs.current[index] = ref)}
              className={`mx-1 h-14 w-12 rounded-xl border text-center text-xl font-bold text-gray-800 shadow ${
                errors.otp ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
              }`}
              value={digit}
              onChangeText={(value) => handleOtpChange(index, value)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={1}
              editable={!loading}
              textAlign="center"
            />
          ))}
        </View>

        {errors.otp && <Text className="mt-2 text-center text-sm text-red-600">{errors.otp}</Text>}

        {/* Timer */}
        <View className="items-center">
          {!canResend ? (
            <Text className="mt-3 text-gray-500">Resend OTP in {formatTime(timer)}</Text>
          ) : (
            <TouchableOpacity onPress={handleResendOtp} disabled={resendLoading}>
              {resendLoading ? (
                <ActivityIndicator color="#4f46e5" size="small" />
              ) : (
                <Text className="font-semibold text-indigo-600">Resend OTP</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={handleVerifyOtp}
          disabled={loading}
          className={`mt-6 rounded-full py-4 shadow-lg ${
            loading ? 'bg-indigo-300' : 'bg-indigo-500'
          }`}>
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="text-center text-base font-semibold text-white">VERIFY OTP</Text>
          )}
        </TouchableOpacity>
      </View>

      <View className="mt-8 flex-row justify-center">
        <Text className="text-gray-500">Wrong email?</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
          <Text className="ml-1 font-semibold text-indigo-600">Change Email</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}
