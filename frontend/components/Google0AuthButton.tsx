import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ApiService from '../services/api';
import { scheduleDailyReminder } from '../services/DailyNotifications';

WebBrowser.maybeCompleteAuthSession();

export default function GoogleOAuthButton({ setIsAuthenticated, mode = 'login' }) {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const navigation = useNavigation();

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: Constants.expoConfig.extra.GOOGLE_IOS_CLIENT_ID,
    androidClientId: Constants.expoConfig.extra.GOOGLE_ANDROID_CLIENT_ID,
    webClientId: Constants.expoConfig.extra.GOOGLE_WEB_CLIENT_ID,
  });

  const debugLog = (message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage, data || '');
    setDebugInfo(
      (prev) => prev + '\n' + logMessage + (data ? ` ${JSON.stringify(data, null, 2)}` : '')
    );
  };

  useEffect(() => {
    loadStoredAuth();
  }, []);

  useEffect(() => {
    if (response) handleAuthResponse();
  }, [response]);

  const loadStoredAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const user = await AsyncStorage.getItem('userData');
      if (token && user) setIsAuthenticated(true);
      debugLog('Checked existing auth', { hasToken: !!token, hasUser: !!user });
    } catch (error) {
      debugLog('Error loading stored auth', error.message);
    }
  };

  const handleAuthResponse = async () => {
    if (!response) return;
    setLoading(true);
    try {
      if (response.type === 'success') {
        const accessToken = response.authentication?.accessToken;
        if (!accessToken) throw new Error('No access token returned');

        const googleUser = await fetchGoogleUserInfo(accessToken);
        if (!googleUser) throw new Error('Failed to fetch Google user info');

        mode === 'signup'
          ? await handleGoogleSignup(googleUser)
          : await handleGoogleLogin(googleUser);
      } else if (response.type === 'error') {
        Alert.alert('Error', 'Authentication failed: ' + response.error);
      } else if (response.type === 'cancel') {
        debugLog('User cancelled Google OAuth');
      }
    } catch (err) {
      debugLog('handleAuthResponse error', err.message);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoogleUserInfo = async (token) => {
    try {
      const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      return null;
    }
  };

  const handleGoogleSignup = async (googleUser) => {
    try {
      const signupData = {
        email: googleUser.email,
        name: googleUser.name,
        firstName: googleUser.given_name,
        lastName: googleUser.family_name,
        profilePicture: googleUser.picture,
        googleId: googleUser.id,
        authProvider: 'google',
      };
      const response = await ApiService.googleSignup(signupData);
      if (response.success && response.data?.success)
        await processSuccessfulAuth(response, 'Signup');
      else handleAuthError(response, 'signup');
    } catch (err) {
      Alert.alert('Error', 'Failed to create account with Google');
    }
  };

  const handleGoogleLogin = async (googleUser) => {
    try {
      const loginData = {
        email: googleUser.email,
        googleId: googleUser.id,
        authProvider: 'google',
      };
      const response = await ApiService.googleLogin(loginData);
      if (response.success && response.data?.success)
        await processSuccessfulAuth(response, 'Login');
      else handleAuthError(response, 'login');
    } catch (err) {
      Alert.alert('Error', 'Failed to login with Google');
    }
  };

  const processSuccessfulAuth = async (response, authType) => {
    try {
      let userData = response.data.data?.user || response.data.user || response.data;
      const token = response.data.data?.token || response.data.token;

      // ✅ Ensure _id exists for compatibility with rest of the app
      if (userData && !userData._id && userData.id) {
        userData._id = userData.id;
      }

      if (token) await AsyncStorage.setItem('userToken', token);
      if (userData) {
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        setUserInfo(userData);
      }

      setIsAuthenticated(true);
      await scheduleDailyReminder();

      Alert.alert('Success', `Google ${authType.toLowerCase()} successful!`, [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Welcome'),
        },
      ]);
    } catch (err) {
      Alert.alert('Error', 'Failed to process authentication');
    }
  };

  const handleAuthError = (response, authType) => {
    const msg = response.data?.message || `Google ${authType} failed`;
    if (authType === 'signup' && msg.includes('already')) {
      Alert.alert('Account Exists', 'Please login instead.', [
        { text: 'Go to Login', onPress: () => navigation.navigate('Login') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else if (authType === 'login' && msg.includes('not found')) {
      Alert.alert('Account Not Found', 'Please sign up first.', [
        { text: 'Go to Signup', onPress: () => navigation.navigate('SignUp') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else Alert.alert('Error', msg);
  };

  const handlePress = () => {
    if (promptAsync) promptAsync();
    else Alert.alert('Error', 'Google OAuth not ready. Please try again.');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.googleButton}
        onPress={handlePress}
        disabled={!request || loading}
        activeOpacity={0.8}>
        <Text style={styles.googleButtonText}>
          {mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
        </Text>
      </TouchableOpacity>

      {loading && <Text style={styles.loadingText}>Processing Google authentication...</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 4, // for Android shadow
  },
  googleIcon: { width: 24, height: 24, marginRight: 10 },
  googleButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loadingText: { marginTop: 15, fontSize: 16, color: '#666' },
});
