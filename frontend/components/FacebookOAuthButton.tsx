import * as Facebook from 'expo-auth-session/providers/facebook';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Button, Image, StyleSheet, Text, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export default function FacebookOAuthButton() {
  const redirectUri = 'https://auth.expo.io/@mohithasija/mental-health-slug';

  console.log('Redirect URI:', redirectUri);

  const [user, setUser] = useState(null);
  const [request, response, promptAsync] = Facebook.useAuthRequest({
    clientId: Constants.expoConfig.extra.FACEBOOK_APP_ID, // change this for yours
    redirectUri,
    scopes: ['public_profile', 'email'],
  });

  useEffect(() => {
    console.log('=== AUTH RESPONSE DEBUG ===');
    console.log('Response exists:', !!response);
    console.log('response', response);
    console.log('Response type:', response?.type);
    console.log('Full response:', JSON.stringify(response, null, 2));

    if (response) {
      if (response.type === 'success') {
        console.log('Success! Authentication object:', response.authentication);
        if (response.authentication?.accessToken) {
          console.log(
            'Access token received:',
            response.authentication.accessToken.substring(0, 20) + '...'
          );

          // ADD THIS BACK - Fetch user data
          (async () => {
            try {
              const userInfoResponse = await fetch(
                `https://graph.facebook.com/me?access_token=${response.authentication.accessToken}&fields=id,name,picture.type(large)`
              );
              const userInfo = await userInfoResponse.json();
              console.log('User info received:', userInfo);
              setUser(userInfo);
            } catch (error) {
              console.log('Error fetching user info:', error);
            }
          })();
        } else {
          console.log('No access token in response');
        }
      } else if (response.type === 'error') {
        console.log('Error response:', response.error);
        console.log('Error description:', response.errorDescription);
      } else if (response.type === 'cancel') {
        console.log('User cancelled authentication');
      } else {
        console.log('Unknown response type');
      }
    } else {
      console.log('Response is null/undefined');
    }
  }, [response]);

  const handlePressAsync = async () => {
    try {
      console.log('Starting authentication...');
      const result = await promptAsync();
      console.log('promptAsync returned:', JSON.stringify(result, null, 2));

      // This should show us what we're getting back
      if (result) {
        console.log('Result type:', result.type);
        if (result.type === 'success') {
          console.log('Success from promptAsync!');
        } else if (result.type === 'error') {
          console.log('Error from promptAsync:', result.error);
        }
      }
    } catch (error) {
      console.log('Error in handlePressAsync:', error);
    }
  };

  return (
    <View style={styles.container}>
      {user ? (
        <Profile user={user} />
      ) : (
        <Button disabled={!request} title="Sign in with Facebook" onPress={handlePressAsync} />
      )}
    </View>
  );
}

function Profile({ user }) {
  return (
    <View style={styles.profile}>
      <Image source={{ uri: user.picture.data.url }} style={styles.image} />
      <Text style={styles.name}>{user.name}</Text>
      <Text>ID: {user.id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profile: {
    alignItems: 'center',
  },
  name: {
    fontSize: 20,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
});
