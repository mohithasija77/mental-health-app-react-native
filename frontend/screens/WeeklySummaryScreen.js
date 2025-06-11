import { getApiUrl } from 'constants/api';
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

const WeeklySummaryScreen = ({ userId = 'test-user-123' }) => {
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(new Date());

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

  const generateWeeklySummary = async () => {
    setLoading(true);

    try {
      console.log('Making request with userId:', userId);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(getApiUrl('WEEKLY_SUMMARY'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
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
        Alert.alert('Success', 'Weekly summary generated!');
      } else {
        Alert.alert('Error', data.error || 'Failed to generate weekly summary');
      }
    } catch (error) {
      clearTimeout(timeoutId);
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

  // Remove the selectedWeek dependency since we're not using dates anymore
  useEffect(() => {
    generateWeeklySummary();
  }, []); // Empty dependency array - only runs once when component mounts

  // Or if you want to refresh when userId changes:
  // useEffect(() => {
  //   generateWeeklySummary();
  // }, [userId]);

  const navigateWeek = (direction) => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(newDate.getDate() + direction * 7);
    setSelectedWeek(newDate);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
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
      happy: '#fbbf24',
      excited: '#f59e0b',
      calm: '#10b981',
      grateful: '#8b5cf6',
      hopeful: '#06b6d4',
      sad: '#6b7280',
      anxious: '#f97316',
      overwhelmed: '#ef4444',
      frustrated: '#dc2626',
      angry: '#991b1b',
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

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="mt-4 text-gray-600">Generating your weekly summary...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigateWeek(-1)}>
            <Icon name="chevron-left" size={24} color="#6b7280" />
          </TouchableOpacity>

          <View className="items-center">
            <Text className="text-lg font-semibold text-gray-900">Weekly Summary</Text>
            {weeklySummary && (
              <Text className="text-sm text-gray-500">
                {formatDate(weeklySummary.period.startDate)} -{' '}
                {formatDate(weeklySummary.period.endDate)}
              </Text>
            )}
          </View>

          <TouchableOpacity onPress={() => navigateWeek(1)}>
            <Icon name="chevron-right" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      {weeklySummary ? (
        <View className="px-6 py-4">
          {/* Key Metrics */}
          <View className="mb-6 rounded-xl bg-white p-6 shadow-sm">
            <Text className="mb-4 text-lg font-semibold text-gray-900">This Week's Overview</Text>

            <View className="-mx-2 flex-row flex-wrap">
              <View className="mb-4 w-1/2 px-2">
                <View className="rounded-lg bg-blue-50 p-3">
                  <Text className="text-sm font-medium text-blue-600">Wellness Score</Text>
                  <Text className="text-2xl font-bold text-blue-700">
                    {weeklySummary.averages.wellnessScore}/10
                  </Text>
                </View>
              </View>

              <View className="mb-4 w-1/2 px-2">
                <View className="rounded-lg bg-green-50 p-3">
                  <Text className="text-sm font-medium text-green-600">Sleep Quality</Text>
                  <Text className="text-2xl font-bold text-green-700">
                    {weeklySummary.averages.sleepQuality}/10
                  </Text>
                </View>
              </View>

              <View className="mb-4 w-1/2 px-2">
                <View className="rounded-lg bg-purple-50 p-3">
                  <Text className="text-sm font-medium text-purple-600">Feeling Scale</Text>
                  <Text className="text-2xl font-bold text-purple-700">
                    {weeklySummary.averages.feelingScale}/10
                  </Text>
                </View>
              </View>

              <View className="mb-4 w-1/2 px-2">
                <View className="rounded-lg bg-orange-50 p-3">
                  <Text className="text-sm font-medium text-orange-600">Stress Level</Text>
                  <Text className="text-2xl font-bold text-orange-700">
                    {weeklySummary.averages.stressLevel}/10
                  </Text>
                </View>
              </View>
            </View>

            {/* Trend Indicator */}
            <View className="mt-4 flex-row items-center">
              <Icon
                name={getTrendIcon(weeklySummary.trends.wellnessScoreTrend).name}
                size={20}
                color={getTrendIcon(weeklySummary.trends.wellnessScoreTrend).color}
              />
              <Text className="ml-2 capitalize text-gray-600">
                Wellness trend: {weeklySummary.trends.wellnessScoreTrend}
              </Text>
            </View>
          </View>

          {/* AI Insights */}
          <View className="mb-6 rounded-xl bg-white p-6 shadow-sm">
            <View className="mb-4 flex-row items-center">
              <Icon name="brain" size={20} color="#6366f1" />
              <Text className="ml-2 text-lg font-semibold text-gray-900">AI Insights</Text>
            </View>
            <Text className="leading-6 text-gray-700">{weeklySummary.insights.aiSummary}</Text>
          </View>

          {/* Mood Distribution */}
          <View className="mb-6 rounded-xl bg-white p-6 shadow-sm">
            <Text className="mb-4 text-lg font-semibold text-gray-900">Mood Distribution</Text>
            {renderMoodChart()}
          </View>

          {/* Key Patterns */}
          {weeklySummary.insights.keyPatterns && weeklySummary.insights.keyPatterns.length > 0 && (
            <View className="mb-6 rounded-xl bg-white p-6 shadow-sm">
              <View className="mb-4 flex-row items-center">
                <Icon name="eye" size={20} color="#10b981" />
                <Text className="ml-2 text-lg font-semibold text-gray-900">Key Patterns</Text>
              </View>
              {weeklySummary.insights.keyPatterns.map((pattern, index) => (
                <View key={index} className="mb-2 flex-row items-start">
                  <View className="mr-3 mt-2 h-2 w-2 rounded-full bg-green-500" />
                  <Text className="flex-1 text-gray-700">{pattern}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Recommendations */}
          {weeklySummary.insights.recommendations &&
            weeklySummary.insights.recommendations.length > 0 && (
              <View className="mb-6 rounded-xl bg-white p-6 shadow-sm">
                <View className="mb-4 flex-row items-center">
                  <Icon name="lightbulb" size={20} color="#f59e0b" />
                  <Text className="ml-2 text-lg font-semibold text-gray-900">Recommendations</Text>
                </View>
                {weeklySummary.insights.recommendations.map((recommendation, index) => (
                  <View key={index} className="mb-3 flex-row items-start">
                    <View className="mr-3 mt-2 h-2 w-2 rounded-full bg-yellow-500" />
                    <Text className="flex-1 text-gray-700">{recommendation}</Text>
                  </View>
                ))}
              </View>
            )}

          {/* Best & Challenging Days */}
          <View className="mb-6 rounded-xl bg-white p-6 shadow-sm">
            <Text className="mb-4 text-lg font-semibold text-gray-900">Week Highlights</Text>

            <View className="mb-4">
              <View className="mb-2 flex-row items-center">
                <Icon name="sun" size={16} color="#10b981" />
                <Text className="ml-2 text-sm font-medium text-green-600">Best Day</Text>
              </View>
              <Text className="text-gray-700">
                {formatDate(weeklySummary.trends.bestDay.date)} - Wellness Score:{' '}
                {weeklySummary.trends.bestDay.wellnessScore}/10
              </Text>
              <Text className="mt-1 text-sm text-gray-500">
                Mood: {weeklySummary.trends.bestDay.mood}
              </Text>
            </View>

            <View>
              <View className="mb-2 flex-row items-center">
                <Icon name="cloud" size={16} color="#f97316" />
                <Text className="ml-2 text-sm font-medium text-orange-600">
                  Most Challenging Day
                </Text>
              </View>
              <Text className="text-gray-700">
                {formatDate(weeklySummary.trends.challengingDay.date)} - Wellness Score:{' '}
                {weeklySummary.trends.challengingDay.wellnessScore}/10
              </Text>
              <Text className="mt-1 text-sm text-gray-500">
                Mood: {weeklySummary.trends.challengingDay.mood}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View className="mb-6 rounded-xl bg-white p-6 shadow-sm">
            <Text className="mb-4 text-lg font-semibold text-gray-900">Take Action</Text>

            <TouchableOpacity className="mb-3 rounded-lg bg-blue-600 p-4">
              <View className="flex-row items-center justify-center">
                <Icon name="plus" size={20} color="white" />
                <Text className="ml-2 font-semibold text-white">Add Today's Check-in</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity className="mb-3 rounded-lg bg-green-600 p-4">
              <View className="flex-row items-center justify-center">
                <Icon name="share" size={20} color="white" />
                <Text className="ml-2 font-semibold text-white">Share Summary</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity className="rounded-lg bg-purple-600 p-4">
              <View className="flex-row items-center justify-center">
                <Icon name="download" size={20} color="white" />
                <Text className="ml-2 font-semibold text-white">Export Data</Text>
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
          <Text className="mt-2 text-center text-gray-500">
            Complete daily check-ins to generate your weekly summary
          </Text>
          <TouchableOpacity
            className="mt-6 rounded-lg bg-blue-600 px-6 py-3"
            onPress={() => {
              /* Navigate to daily check-in */
            }}>
            <Text className="font-semibold text-white">Start Daily Check-in</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

export default WeeklySummaryScreen;
