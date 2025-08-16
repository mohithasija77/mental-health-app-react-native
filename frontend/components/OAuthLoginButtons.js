import * as AuthSession from 'expo-auth-session';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import ApiService from '../services/api';

WebBrowser.maybeCompleteAuthSession();

export default function OAuthLoginButtons({ onSuccess, loading }) {
  const [isLoading, setIsLoading] = useState(false);
  const codeVerifierRef = useRef(null);

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'mentalheath:/oauthredirect',
    path: 'oauthredirect',
  });

  // Google Auth with PKCE
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    iosClientId: Constants.expoConfig.extra.GOOGLE_IOS_CLIENT_ID,
    androidClientId: Constants.expoConfig.extra.GOOGLE_ANDROID_CLIENT_ID,
    webClientId: Constants.expoConfig.extra.GOOGLE_WEB_CLIENT_ID, // used only if running on web
    scopes: ['openid', 'profile', 'email'],
    responseType: 'code',
    usePKCE: true,
  });

  // Facebook Auth
  const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
    clientId: Constants.expoConfig.extra.FACEBOOK_APP_ID,
    scopes: ['public_profile', 'email'],
    responseType: 'code',
  });

  useEffect(() => {
    const handleGoogleLogin = async () => {
      if (googleResponse?.type === 'success' && googleRequest) {
        setIsLoading(true);
        try {
          const codeVerifier = googleRequest.codeVerifier || codeVerifierRef.current;

          // Always use the same redirectUri that googleRequest used
          const tokenResponse = await AuthSession.exchangeCodeAsync(
            {
              clientId:
                Constants.expoConfig.extra.GOOGLE_IOS_CLIENT_ID ||
                Constants.expoConfig.extra.GOOGLE_ANDROID_CLIENT_ID,
              code: googleResponse.params.code,
              redirectUri,
              extraParams: {
                code_verifier: codeVerifier,
                access_type: 'offline',
                prompt: 'consent',
              },
            },
            {
              tokenEndpoint: 'https://oauth2.googleapis.com/token',
            }
          );

          const authToken = tokenResponse.accessToken;
          if (!authToken) throw new Error('No access token received');

          const userInfoRes = await fetch(
            `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${authToken}`
          );
          if (!userInfoRes.ok) throw new Error(`Failed to fetch user info: ${userInfoRes.status}`);

          const userInfo = await userInfoRes.json();
          const enhancedUserInfo = {
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            given_name: userInfo.given_name,
            family_name: userInfo.family_name,
            picture: userInfo.picture,
            verified_email: userInfo.verified_email,
            provider: 'google',
          };

          const loginResult = await ApiService.oauthLogin('google', authToken, enhancedUserInfo);
          if (loginResult.success && loginResult.data?.token) {
            await ApiService.saveToken(loginResult.data.token);
            await ApiService.saveUserData(loginResult.data.user);
            onSuccess?.();
          } else {
            Alert.alert('Login Failed', loginResult?.error || 'Authentication failed.');
          }
        } catch (err) {
          console.error('Google login error:', err);
          Alert.alert('Google Login Failed', err.message);
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleGoogleLogin();
  }, [googleResponse]);

  useEffect(() => {
    const handleFacebookLogin = async () => {
      if (fbResponse?.type === 'success' && fbRequest) {
        setIsLoading(true);
        try {
          const tokenResponse = await AuthSession.exchangeCodeAsync(
            {
              clientId: Constants.expoConfig.extra.FACEBOOK_APP_ID,
              code: fbResponse.params.code,
              redirectUri,
            },
            {
              tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
            }
          );

          const authToken = tokenResponse.accessToken;
          if (!authToken) throw new Error('No access token received');

          const userInfoRes = await fetch(
            `https://graph.facebook.com/me?access_token=${authToken}&fields=id,name,email,picture.type(large),first_name,last_name,verified`
          );
          if (!userInfoRes.ok) throw new Error('Failed to fetch Facebook user info');

          const userInfo = await userInfoRes.json();
          const enhancedUserInfo = {
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            first_name: userInfo.first_name,
            last_name: userInfo.last_name,
            picture: userInfo.picture?.data?.url,
            verified: userInfo.verified,
            provider: 'facebook',
          };

          const loginResult = await ApiService.oauthLogin('facebook', authToken, enhancedUserInfo);
          if (loginResult.success && loginResult.data?.token) {
            await ApiService.saveToken(loginResult.data.token);
            await ApiService.saveUserData(loginResult.data.user);
            onSuccess?.();
          } else {
            Alert.alert('Login Failed', loginResult?.error || 'Authentication failed.');
          }
        } catch (err) {
          console.error('Facebook login error:', err);
          Alert.alert('Facebook Login Failed', err.message);
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleFacebookLogin();
  }, [fbResponse]);

  const handleGooglePress = async () => {
    if (!googleRequest || loading || isLoading) return;
    try {
      setIsLoading(true);
      codeVerifierRef.current = googleRequest.codeVerifier;
      await googlePromptAsync();
    } catch (error) {
      console.error('Error initiating Google auth:', error);
      Alert.alert('Error', 'Failed to start Google authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookPress = async () => {
    if (!fbRequest || loading || isLoading) return;
    try {
      setIsLoading(true);
      await fbPromptAsync();
    } catch (error) {
      console.error('Error initiating Facebook auth:', error);
      Alert.alert('Error', 'Failed to start Facebook authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = loading || isLoading;

  return (
    <View className="mt-8 items-center">
      <Text className="mb-4 text-gray-500">Or continue with</Text>
      <View className="flex-row items-center justify-center space-x-4">
        <TouchableOpacity
          onPress={handleFacebookPress}
          disabled={!fbRequest || isButtonDisabled}
          className={`h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white shadow ${
            isButtonDisabled ? 'opacity-50' : ''
          }`}>
          {!fbRequest || isButtonDisabled ? (
            <ActivityIndicator size="small" color="#1877f2" />
          ) : (
            <Text className="text-xl font-bold text-blue-700">f</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleGooglePress}
          disabled={!googleRequest || isButtonDisabled}
          className={`h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white shadow ${
            isButtonDisabled ? 'opacity-50' : ''
          }`}>
          {!googleRequest || isButtonDisabled ? (
            <ActivityIndicator size="small" color="#db4437" />
          ) : (
            <Text className="text-xl font-bold text-red-600">G</Text>
          )}
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View className="mt-4 flex-row items-center">
          <ActivityIndicator size="small" color="#666" />
          <Text className="ml-2 text-sm text-gray-600">Authenticating...</Text>
        </View>
      )}
    </View>
  );
}
