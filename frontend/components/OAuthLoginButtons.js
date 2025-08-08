import * as Facebook from 'expo-auth-session/providers/facebook';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import ApiService from '../services/api'; // Adjust if the path is different

WebBrowser.maybeCompleteAuthSession();

export default function OAuthLoginButtons({ onSuccess, loading }) {
  // Google Auth
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    iosClientId: Constants.expoConfig.extra.GOOGLE_IOS_CLIENT_ID,
    androidClientId: Constants.expoConfig.extra.GOOGLE_ANDROID_CLIENT_ID,
    webClientId: Constants.expoConfig.extra.GOOGLE_WEB_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
  });

  // Facebook Auth
  const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
    clientId: Constants.expoConfig.extra.FACEBOOK_APP_ID,
    scopes: ['public_profile', 'email'],
  });

  // Handle Google login response
  useEffect(() => {
    const handleGoogleLogin = async () => {
      if (googleResponse?.type === 'success') {
        try {
          const { authentication } = googleResponse;

          const userInfoRes = await fetch(
            `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${authentication.accessToken}`
          );
          const userInfo = await userInfoRes.json();

          const loginResult = await ApiService.oauthLogin(
            'google',
            authentication.accessToken,
            userInfo
          );

          if (loginResult.success && loginResult.data?.token) {
            await ApiService.saveToken(loginResult.data.token);
            await ApiService.saveUserData(loginResult.data.user);
            onSuccess?.(); // callback from LoginScreen
          } else {
            Alert.alert('Login Failed', loginResult?.error || 'Something went wrong');
          }
        } catch (err) {
          console.error('Google login error:', err);
          Alert.alert('Google Login Failed', err.message);
        }
      }
    };

    handleGoogleLogin();
  }, [googleResponse]);

  // Handle Facebook login response
  useEffect(() => {
    const handleFacebookLogin = async () => {
      if (fbResponse?.type === 'success') {
        try {
          const { authentication } = fbResponse;

          const userInfoRes = await fetch(
            `https://graph.facebook.com/me?access_token=${authentication.accessToken}&fields=id,name,email,picture`
          );
          const userInfo = await userInfoRes.json();

          const loginResult = await ApiService.oauthLogin(
            'facebook',
            authentication.accessToken,
            userInfo
          );

          if (loginResult.success && loginResult.data?.token) {
            await ApiService.saveToken(loginResult.data.token);
            await ApiService.saveUserData(loginResult.data.user);
            onSuccess?.();
          } else {
            Alert.alert('Login Failed', loginResult?.error || 'Something went wrong');
          }
        } catch (err) {
          console.error('Facebook login error:', err);
          Alert.alert('Facebook Login Failed', err.message);
        }
      }
    };

    handleFacebookLogin();
  }, [fbResponse]);

  return (
    <View className="mt-8 items-center">
      <Text className="mb-4 text-gray-500">Or continue with</Text>
      <View className="flex-row items-center justify-center space-x-4">
        {/* Facebook Button */}
        <TouchableOpacity
          onPress={() => fbPromptAsync()}
          disabled={!fbRequest || loading}
          className="h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white shadow">
          {!fbRequest || loading ? (
            <ActivityIndicator size="small" color="#1877f2" />
          ) : (
            <Text className="text-xl font-bold text-blue-700">f</Text>
          )}
        </TouchableOpacity>

        {/* Google Button */}
        <TouchableOpacity
          onPress={() => googlePromptAsync()}
          disabled={!googleRequest || loading}
          className="h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white shadow">
          {!googleRequest || loading ? (
            <ActivityIndicator size="small" color="#db4437" />
          ) : (
            <Text className="text-xl font-bold text-red-600">G</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
