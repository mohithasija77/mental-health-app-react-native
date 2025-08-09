import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
const { API_BASE_URL } = Constants.expoConfig.extra;

// Configuration
const AUTH_BASE_URL = `${API_BASE_URL}/api`; // Change this to your server URL
// For Android emulator use: http://10.0.2.2:5000/api
// For iOS simulator use: http://localhost:5000/api

class ApiService {
  constructor() {
    this.baseURL = AUTH_BASE_URL;
  }

  // Get stored token
  async getToken() {
    try {
      return await AsyncStorage.getItem('userToken');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Make authenticated request
  async makeRequest(endpoint, options = {}) {
    const token = await this.getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      console.log(`Making request to: ${this.baseURL}${endpoint}`);
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          status: response.status,
          data: errorData,
        };
      }

      const data = await response.json();

      return {
        success: response.ok,
        status: response.status,
        data,
      };
    } catch (error) {
      console.error('API Request error:', error);
      return {
        success: false,
        error: error.message,
        data: null,
        networkError: true,
      };
    }
  }

  // Auth endpoints
  async signup(userData) {
    return this.makeRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser() {
    return this.makeRequest('/auth/me');
  }

  async logout() {
    try {
      const response = await this.makeRequest('/auth/logout', {
        method: 'POST',
      });

      // Clear local storage regardless of response
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');

      return response;
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local storage even if request fails
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      return { success: false, error: error.message };
    }
  }

  // Token management
  async saveToken(token) {
    try {
      await AsyncStorage.setItem('userToken', token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  // Update your saveUserData method in ApiService to handle undefined values
  async saveUserData(userData) {
    try {
      if (!userData) {
        console.warn('Attempted to save undefined/null user data');
        return;
      }
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      console.log('User data saved successfully:', userData);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  async getUserData() {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  async clearStorage() {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  // Add this method to your ApiService class
  async checkTodaysCheckin() {
    try {
      const user = await this.getUserData();

      if (!user || !user._id) {
        throw new Error('No authenticated user found');
      }

      // Use the _id field since that's what your backend uses
      return this.makeRequest(`/mental-health/checkin/check-today/${user._id}`);
    } catch (error) {
      console.error("Error checking today's checkin:", error);
      throw error;
    }
  }

  // utils/AuthService.js
  async isAuthenticated() {
    try {
      const token = await this.getToken();
      return !!token;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  // OTP-based Password Reset Methods
  async forgotPassword(data) {
    try {
      const response = await fetch(`${this.baseURL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      return {
        success: response.ok,
        data: responseData,
        status: response.status,
      };
    } catch (error) {
      console.error('Forgot password API error:', error);

      if (error.message === 'Network request failed' || error.name === 'TypeError') {
        return {
          success: false,
          networkError: true,
          error: 'Network connection failed',
        };
      }

      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  // NEW: Verify OTP method
  async verifyOtp(data) {
    try {
      const response = await fetch(`${this.baseURL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      return {
        success: response.ok,
        data: responseData,
        status: response.status,
      };
    } catch (error) {
      console.error('Verify OTP API error:', error);

      if (error.message === 'Network request failed' || error.name === 'TypeError') {
        return {
          success: false,
          networkError: true,
          error: 'Network connection failed',
        };
      }

      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  // UPDATED: Reset password now uses email and OTP instead of token
  async resetPassword(data) {
    try {
      const response = await fetch(`${this.baseURL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      return {
        success: response.ok,
        data: responseData,
        status: response.status,
      };
    } catch (error) {
      console.error('Reset password API error:', error);

      if (error.message === 'Network request failed' || error.name === 'TypeError') {
        return {
          success: false,
          networkError: true,
          error: 'Network connection failed',
        };
      }

      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }
}

// Export singleton instance
export default new ApiService();
