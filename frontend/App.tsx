import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ApiService from './services/api';

import MentalCheckInScreen from 'screens/MentalCheckInScreen';
import MentalHealthFacts from 'screens/MentalHealthFactsScreen';
import StressDetectorScreen from 'screens/StressDetectorScreen';
import VerifyOtpScreen from 'screens/VerifyOtpScreen';
import WeeklySummaryScreen from 'screens/WeeklySummaryScreen';
import { cancelDailyReminder, handleNotificationResponse } from 'services/DailyNotifications';
import { navigationRef } from 'services/NavigationRef';
import './global.css';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import LoginScreen from './screens/LoginScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import SignUpScreen from './screens/SignUpScreen';
import WelcomeScreen from './screens/WelcomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Function to check authentication
  const checkAuth = async () => {
    const authenticated = await ApiService.isAuthenticated();
    setIsAuthenticated(authenticated);
    // await scheduleDailyReminder();
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );
    return () => subscription.remove();
  }, []);

  // Function to handle logout - this will be passed to screens that need it
  const handleLogout = async () => {
    setLoading(true);
    await ApiService.logout();
    setIsAuthenticated(false);
    await cancelDailyReminder();
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <>
              <Stack.Screen name="Login">
                {(props) => <LoginScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
              </Stack.Screen>
              <Stack.Screen name="SignUp">
                {(props) => <SignUpScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
              </Stack.Screen>
              {/*ForgotPassword and ResetPassword are here because they're for non-authenticated users */}
              <Stack.Screen
                name="ForgotPassword"
                component={ForgotPasswordScreen}
                options={{
                  headerShown: true,
                  title: 'Forgot Password',
                  headerStyle: {
                    backgroundColor: '#6366f1',
                  },
                  headerTintColor: '#fff',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  },
                }}
              />
              <Stack.Screen
                name="ResetPassword"
                component={ResetPasswordScreen}
                options={{
                  headerShown: true,
                  title: 'Reset Password',
                  headerStyle: {
                    backgroundColor: '#6366f1',
                  },
                  headerTintColor: '#fff',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  },
                }}
              />
              <Stack.Screen
                name="VerifyOtp"
                component={VerifyOtpScreen}
                options={{
                  headerShown: true,
                  title: 'Verify OTP',
                  headerStyle: {
                    backgroundColor: '#6366f1',
                  },
                  headerTintColor: '#fff',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  },
                }}
              />
            </>
          ) : (
            <>
              <Stack.Screen name="Welcome">
                {(props) => (
                  <WelcomeScreen
                    {...props}
                    setIsAuthenticated={setIsAuthenticated}
                    handleLogout={handleLogout}
                  />
                )}
              </Stack.Screen>
              {/* <Stack.Screen name="Home">
                {(props) => <HomeScreen {...props} handleLogout={handleLogout} />}
              </Stack.Screen> */}
              <Stack.Screen name="MentalCheckIn" component={MentalCheckInScreen} />
              <Stack.Screen name="MentalHealthFacts" component={MentalHealthFacts} />
              <Stack.Screen name="StressDetector" component={StressDetectorScreen} />
              <Stack.Screen name="WeeklySummary" component={WeeklySummaryScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
