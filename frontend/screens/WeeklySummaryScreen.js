import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/Feather';
const { API_BASE_URL } = Constants.expoConfig.extra;

const WeeklySummaryScreen = () => {
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [showCheckinButton, setShowCheckinButton] = useState(true);

  const navigation = useNavigation();

  const today = new Date();
  const firstDayOfWeek = new Date(today);
  firstDayOfWeek.setDate(today.getDate() - today.getDay()); // Sunday start
  firstDayOfWeek.setHours(0, 0, 0, 0);
  const [selectedWeekStart, setSelectedWeekStart] = useState(firstDayOfWeek);

  const screenWidth = Dimensions.get('window').width;
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(75, 85, 99, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#6366f1',
    },
  };

  const isCurrentWeek = () => {
    const today = new Date();
    const startOfSelectedWeek = new Date(selectedWeekStart);
    const endOfSelectedWeek = new Date(startOfSelectedWeek);
    endOfSelectedWeek.setDate(startOfSelectedWeek.getDate() + 6);

    // Normalize to midnight for accurate date-only comparison
    today.setHours(0, 0, 0, 0);
    startOfSelectedWeek.setHours(0, 0, 0, 0);
    endOfSelectedWeek.setHours(0, 0, 0, 0);

    return today >= startOfSelectedWeek && today <= endOfSelectedWeek;
  };

  const showStartWeeklyCheckinButton = isCurrentWeek() && !hasCheckedInToday;

  const endDate = selectedWeekStart
    ? new Date(selectedWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
    : null;

  // Helper function to check if week has data
  const hasData = weeklySummary && weeklySummary.period && weeklySummary.period.totalDays > 0;

  // Get user data from AsyncStorage
  const getUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const user = userData ? JSON.parse(userData) : null;

      if (user && user._id) {
        setUserId(user._id);
        return user._id;
      } else {
        console.error('No authenticated user found');
        Alert.alert('Error', 'Please log in to view your weekly summary');
        return null;
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      Alert.alert('Error', 'Failed to get user information');
      return null;
    }
  };

  const generateWeeklySummary = async (weekStart = selectedWeekStart, userIdParam = userId) => {
    if (!userIdParam) {
      console.error('No user ID available for weekly summary');
      return;
    }

    setLoading(true);

    try {
      console.log('Making request with userId:', userIdParam);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${API_BASE_URL}/api/mental-health/summary/weekly-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userIdParam,
          weekStartDate: weekStart.toISOString(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setWeeklySummary(data.weeklySummary);
      } else {
        Alert.alert('Error', data.error || 'Failed to generate weekly summary');
      }
    } catch (error) {
      console.error('Error generating weekly summary:', error);

      if (error.name === 'AbortError') {
        Alert.alert(
          'Timeout Error',
          'Request took too long. The server might be processing or unavailable.'
        );
      } else {
        Alert.alert('Error', `Failed to connect: ${error.message}`);
      }
    }
    setLoading(false);
  };

  const checkTodaysCheckin = async () => {
    try {
      setIsLoading(true);

      // Get user data from AsyncStorage
      const userData = await AsyncStorage.getItem('userData');
      const user = userData ? JSON.parse(userData) : null;

      // Check for _id since your user object uses MongoDB's _id field
      if (!user || !user._id) {
        console.error('No authenticated user found');
        console.log('User data:', user); // Debug log to see what's stored
        setHasCheckedInToday(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/mental-health/checkin/check-today/${user._id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      const data = await response.json();
      console.log('Check-in response:', data); // Debug log

      if (response.ok) {
        setHasCheckedInToday(data.hasCheckedInToday || false);
        console.log('Has checked in today:', data.hasCheckedInToday);
      } else {
        console.error('Check-in API error:', data);
        setHasCheckedInToday(false);
      }
    } catch (error) {
      console.error("Error checking today's checkin:", error);
      setHasCheckedInToday(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      if (!weeklySummary || !userId) {
        Alert.alert('Error', 'No data available to export');
        return;
      }

      const exportData = {
        exportInfo: {
          userId: userId,
          exportDate: new Date().toISOString(),
          exportType: 'weekly_summary',
          version: '1.0',
        },
        period: {
          weekStart: selectedWeekStart.toISOString(),
          weekEnd: endDate.toISOString(),
          weekNumber: getWeekNumber(selectedWeekStart),
          year: selectedWeekStart.getFullYear(),
        },
        summary: {
          totalCheckIns: weeklySummary.period?.totalDays || 0,
          dataRange: weeklySummary.period?.dataRange || 'No data available',
          averages: {
            wellnessScore: weeklySummary.averages?.wellnessScore || 0,
            sleepQuality: weeklySummary.averages?.sleepQuality || 0,
            feelingScale: weeklySummary.averages?.feelingScale || 0,
            stressLevel: weeklySummary.averages?.stressLevel || 0,
          },
        },
        trends: {
          moodFrequency: weeklySummary.trends?.moodFrequency || {},
          bestDay: weeklySummary.trends?.bestDay || null,
          challengingDay: weeklySummary.trends?.challengingDay || null,
        },
        insights: {
          aiSummary: weeklySummary.insights?.aiSummary || '',
          keyPatterns: weeklySummary.insights?.keyPatterns || [],
        },
        dailyEntries: weeklySummary.dailyEntries || [],
        rawData: weeklySummary,
      };

      // Create a JSON string of the export
      const jsonString = JSON.stringify(exportData, null, 2);

      // Define file path
      const fileName = `weekly-summary-${formatDate(selectedWeekStart)}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;

      // Write the file
      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share or open the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('File Saved', `File has been saved to: ${fileUri}`);
      }

      console.log('Exported to:', fileUri);
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        'Export Failed',
        'There was an error exporting your weekly summary. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Helper function to get week number
  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  useEffect(() => {
    const initializeData = async () => {
      const userIdFromStorage = await getUserData();
      if (userIdFromStorage) {
        await checkTodaysCheckin();
        if (selectedWeekStart) {
          await generateWeeklySummary(selectedWeekStart, userIdFromStorage);
        }
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    const shouldShowButton = isCurrentWeek() && !hasCheckedInToday;
    setShowCheckinButton(shouldShowButton);
  }, [selectedWeekStart, hasCheckedInToday]);

  useEffect(() => {
    if (userId && selectedWeekStart) {
      generateWeeklySummary(selectedWeekStart, userId);
    }
  }, [selectedWeekStart, userId]);

  const navigateWeek = (direction) => {
    const newDate = new Date(selectedWeekStart);
    newDate.setDate(newDate.getDate() + direction * 7);
    newDate.setHours(0, 0, 0, 0);

    setSelectedWeekStart(newDate);
  };
  console.log(isCurrentWeek(), !hasCheckedInToday);
  console.log('checkinbutton', showCheckinButton);
  const formatDate = (date) => {
    if (!date || isNaN(date)) return '';
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving':
        return { name: 'trending-up', color: '#10b981' };
      case 'declining':
        return { name: 'trending-down', color: '#ef4444' };
      default:
        return { name: 'minus', color: '#6b7280' };
    }
  };

  const getMoodColor = (mood) => {
    const moodColors = {
      happy: '#fbbf24', // yellow
      excited: '#f59e0b', // orange
      calm: '#10b981', // green
      grateful: '#8b5cf6', // violet
      hopeful: '#06b6d4', // cyan
      sad: '#6b7280', // gray
      anxious: '#f97316', // deep orange
      overwhelmed: '#ef4444', // red
      frustrated: '#dc2626', // darker red
      angry: '#991b1b', // darkest red
      stressed: '#e11d48', // rose
      energetic: '#22c55e', // bright green
      relaxed: '#3b82f6', // blue
      tired: '#a3a3a3', // medium gray (neutral, low energy)
      joyful: '#fde68a', // soft pastel yellow (warm, uplifting)
      optimistic: '#38bdf8', // sky blue (fresh, forward-looking)
    };

    return moodColors[mood] || '#6b7280';
  };

  const renderMoodChart = () => {
    if (!weeklySummary?.trends?.moodFrequency) return null;

    const moodData = Object.entries(weeklySummary.trends.moodFrequency).map(
      ([mood, count], index) => ({
        name: mood,
        population: count,
        color: getMoodColor(mood),
        legendFontColor: '#4b5563',
        legendFontSize: 12,
      })
    );

    return (
      <PieChart
        data={moodData}
        width={screenWidth - 40}
        height={200}
        chartConfig={chartConfig}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
    );
  };

  // Show loading state if no user ID is available yet
  if (!userId && !loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="mt-4 text-gray-600">Loading user data...</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="mt-4 text-gray-600">Generating your weekly summary...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className=" bg-white px-4 pb-4 pt-12 shadow-sm">
        <View className="mt-2 flex-row items-center">
          <TouchableOpacity
            onPress={() => navigateWeek(-1)}
            className="rounded-lg p-2"
            style={{ width: 44, height: 44 }}>
            <Icon name="chevron-left" size={24} color="#6b7280" />
          </TouchableOpacity>

          <View className="mx-2 mt-4 flex-1 items-center">
            <Text className="text-center text-lg font-semibold text-gray-900">Weekly Summary</Text>
            {selectedWeekStart && endDate && (
              <View className="mt-1 px-2">
                <Text
                  className="text-center text-sm text-gray-500"
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.7}>
                  {formatDate(selectedWeekStart)} - {formatDate(endDate)}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={() => navigateWeek(1)}
            className="rounded-lg p-2"
            style={{ width: 44, height: 44 }}>
            <Icon name="chevron-right" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1">
        {weeklySummary ? (
          <View className="px-4 py-4">
            {/* Conditional rendering based on whether there's data */}
            {hasData ? (
              <>
                {/* Key Metrics - Only show if there's data */}
                <View className="mb-6 rounded-xl bg-white p-4 shadow-sm">
                  <Text className="mb-4 text-lg font-semibold text-gray-900">
                    This Week's Overview
                  </Text>

                  <View className="-mx-1 flex-row flex-wrap">
                    {/* Wellness Score */}
                    <View className="mb-3 w-1/2 px-1">
                      <View className="rounded-lg bg-blue-50 p-3">
                        <Text className="mb-1 text-xs font-medium text-blue-600">
                          Wellness Score
                        </Text>
                        <Text className="text-xl font-bold text-blue-700">
                          {weeklySummary.averages?.wellnessScore || 0}/10
                        </Text>
                      </View>
                    </View>

                    {/* Sleep Quality */}
                    <View className="mb-3 w-1/2 px-1">
                      <View className="rounded-lg bg-green-50 p-3">
                        <Text className="mb-1 text-xs font-medium text-green-600">
                          Sleep Quality
                        </Text>
                        <Text className="text-xl font-bold text-green-700">
                          {weeklySummary.averages?.sleepQuality || 0}/10
                        </Text>
                      </View>
                    </View>

                    {/* Feeling Scale */}
                    <View className="mb-3 w-1/2 px-1">
                      <View className="rounded-lg bg-purple-50 p-3">
                        <Text className="mb-1 text-xs font-medium text-purple-600">
                          Feeling Scale
                        </Text>
                        <Text className="text-xl font-bold text-purple-700">
                          {weeklySummary.averages?.feelingScale || 0}/10
                        </Text>
                      </View>
                    </View>

                    {/* Stress Level */}
                    <View className="mb-3 w-1/2 px-1">
                      <View className="rounded-lg bg-orange-50 p-3">
                        <Text className="mb-1 text-xs font-medium text-orange-600">
                          Stress Level
                        </Text>
                        <Text className="text-xl font-bold text-orange-700">
                          {weeklySummary.averages?.stressLevel || 0}/10
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Trend - Only show if trend exists */}
                  {/* {weeklyTrend && (
                    <View className="mt-3 flex-row items-center">
                      <Icon
                        name={getTrendIcon(weeklySummary.trends.wellnessScoreTrend).name}
                        size={20}
                        color={getTrendIcon(weeklySummary.trends.wellnessScoreTrend).color}
                      />
                      <Text className="ml-2 flex-1 capitalize text-gray-600" numberOfLines={1}>
                        Wellness trend: {weeklyTrend}
                      </Text>
                    </View>
                  )} */}
                </View>

                {/* Mood Distribution - Only show if mood data exists */}
                {weeklySummary.trends?.moodFrequency &&
                  Object.keys(weeklySummary.trends.moodFrequency).length > 0 && (
                    <View className="mb-6 rounded-xl bg-white p-4 shadow-sm">
                      <Text className="mb-4 text-lg font-semibold text-gray-900">
                        Mood Distribution
                      </Text>
                      <View className="min-h-[200px]">{renderMoodChart()}</View>
                    </View>
                  )}

                {/* Week Highlights - Only show if best/challenging day data exists */}
                {(weeklySummary.trends?.bestDay || weeklySummary.trends?.challengingDay) && (
                  <View className="mb-6 rounded-xl bg-white p-4 shadow-sm">
                    <Text className="mb-4 text-lg font-semibold text-gray-900">
                      Week Highlights
                    </Text>

                    {/* Best Day */}
                    {weeklySummary.trends?.bestDay && (
                      <View className="mb-4">
                        <View className="mb-2 flex-row items-center">
                          <Icon name="sun" size={16} color="#10b981" />
                          <Text className="ml-2 text-sm font-medium text-green-600">Best Day</Text>
                        </View>
                        <Text className="leading-5 text-gray-700">
                          {formatDate(new Date(weeklySummary.trends.bestDay.date))} - Wellness
                          Score: {weeklySummary.trends.bestDay.wellnessScore}/10
                        </Text>
                        <Text className="mt-1 text-sm text-gray-500">
                          Mood: {weeklySummary.trends.bestDay.mood}
                        </Text>
                      </View>
                    )}

                    {/* Challenging Day */}
                    {weeklySummary.trends?.challengingDay && (
                      <View>
                        <View className="mb-2 flex-row items-center">
                          <Icon name="cloud" size={16} color="#f97316" />
                          <Text className="ml-2 flex-1 text-sm font-medium text-orange-600">
                            Most Challenging Day
                          </Text>
                        </View>
                        <Text className="leading-5 text-gray-700">
                          {formatDate(new Date(weeklySummary.trends.challengingDay.date))} -
                          Wellness Score: {weeklySummary.trends.challengingDay.wellnessScore}/10
                        </Text>
                        <Text className="mt-1 text-sm text-gray-500">
                          Mood: {weeklySummary.trends.challengingDay.mood}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </>
            ) : (
              /* No Data State */
              <View className="flex-1 items-center justify-center px-6 py-12">
                <Icon name="calendar" size={64} color="#d1d5db" />
                <Text className="mt-4 text-center text-xl font-semibold text-gray-400">
                  No Data Available
                </Text>
                <Text className="mt-2 text-center leading-6 text-gray-500">
                  {weeklySummary.period?.dataRange || 'No check-ins for this week'}
                </Text>

                <TouchableOpacity
                  className="mt-6 rounded-lg bg-blue-600 px-6 py-3"
                  onPress={() => navigation.navigate('MentalCheckIn')}>
                  <Text className="font-semibold text-white">Start Daily Check-in</Text>
                </TouchableOpacity>
              </View>
            )}
            {/* AI Insights - Always show if available */}
            {weeklySummary.insights?.aiSummary && (
              <View className="mb-6 rounded-xl bg-white p-4 shadow-sm">
                <View className="mb-4 flex-row items-center">
                  <Icon name="brain" size={20} color="#6366f1" />
                  <Text className="ml-2 flex-1 text-lg font-semibold text-gray-900">
                    AI Insights
                  </Text>
                </View>
                <Text className="leading-6 text-gray-700">{weeklySummary.insights.aiSummary}</Text>
              </View>
            )}
            {/* Key Patterns - Only show if patterns exist */}
            {weeklySummary.insights?.keyPatterns?.length > 0 && (
              <View className="mb-6 rounded-xl bg-white p-4 shadow-sm">
                <View className="mb-4 flex-row items-center">
                  <Icon name="eye" size={20} color="#10b981" />
                  <Text className="ml-2 flex-1 text-lg font-semibold text-gray-900">
                    Key Patterns
                  </Text>
                </View>
                {weeklySummary.insights.keyPatterns.map((pattern, idx) => (
                  <View key={idx} className="mb-2 flex-row items-start">
                    <View className="mr-3 mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />
                    <Text className="flex-1 leading-5 text-gray-700">{pattern}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Take Action - Always show */}
            <View className="mb-6 rounded-xl bg-white p-4 shadow-sm">
              <Text className="mb-4 text-lg font-semibold text-gray-900">Take Action</Text>
              {showCheckinButton ? (
                <TouchableOpacity
                  className="mb-3 rounded-lg bg-blue-600 p-4"
                  onPress={() => navigation.navigate('MentalCheckIn')}>
                  <View className="flex-row items-center justify-center">
                    <Icon name="plus" size={20} color="white" />
                    <Text className="ml-2 text-center font-semibold text-white">
                      Add Today's Check-in
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <></>
              )}

              {/* <TouchableOpacity className="mb-3 rounded-lg bg-green-600 p-4">
                <View className="flex-row items-center justify-center">
                  <Icon name="share" size={20} color="white" />
                  <Text className="ml-2 text-center font-semibold text-white">Share Summary</Text>
                </View>
              </TouchableOpacity> */}
              {hasData ? (
                <TouchableOpacity
                  className="rounded-lg bg-purple-600 p-4"
                  onPress={handleExportData}>
                  <View className="flex-row items-center justify-center">
                    <Icon name="download" size={20} color="white" />
                    <Text className="ml-2 text-center font-semibold text-white">Export Data</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity className="rounded-lg bg-teal-600 p-4">
                    <View className="flex-row items-center justify-center">
                      <Text className="ml-2 text-center font-semibold text-white">
                        No Actions to take
                      </Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}
            </View>
            {/* Go Back Button */}
            <View className="mb-6">
              <TouchableOpacity
                className="rounded-lg border border-gray-300 bg-white p-4"
                onPress={() => navigation.navigate('Welcome')}>
                <View className="flex-row items-center justify-center">
                  <Icon name="arrow-left" size={20} color="#374151" />
                  <Text className="ml-2 text-center font-semibold text-gray-700">Back to Home</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center px-6 py-12">
            <Icon name="calendar" size={64} color="#d1d5db" />
            <Text className="mt-4 text-center text-xl font-semibold text-gray-400">
              No Data Available
            </Text>
            <Text className="mt-2 text-center leading-6 text-gray-500">
              Complete daily check-ins to generate your weekly summary
            </Text>
            <TouchableOpacity
              className="mt-6 rounded-lg bg-blue-600 px-6 py-3"
              onPress={() => navigation.navigate('MentalCheckIn')}>
              <Text className="font-semibold text-white">Start Daily Check-in</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default WeeklySummaryScreen;
