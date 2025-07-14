// File: src/components/StressDashboard.js

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const StressDashboard = ({ navigation }) => {
  const [stressHistory, setStressHistory] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      // Fetch stress history
      const historyResponse = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/stress/history?limit=7`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Fetch insights
      const insightsResponse = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/stress/insights`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (historyResponse.ok && insightsResponse.ok) {
        const historyData = await historyResponse.json();
        const insightsData = await insightsResponse.json();

        setStressHistory(historyData.data);
        setInsights(insightsData.insights);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getStressColor = (level) => {
    const colors = {
      'Very Low': '#4CAF50',
      Low: '#8BC34A',
      Moderate: '#FFC107',
      High: '#FF9800',
      'Very High': '#F44336',
    };
    return colors[level] || '#757575';
  };

  const getStressEmoji = (level) => {
    const emojis = {
      'Very Low': '😌',
      Low: '🙂',
      Moderate: '😐',
      High: '😰',
      'Very High': '🤯',
    };
    return emojis[level] || '😐';
  };

  const formatChartData = () => {
    if (!stressHistory.length) return null;

    const data = stressHistory.slice(-7).reverse();
    return {
      labels: data.map((item) =>
        new Date(item.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      ),
      datasets: [
        {
          data: data.map((item) => item.stressScore),
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };
  };

  const chartData = formatChartData();

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Stress Dashboard</Text>
          <TouchableOpacity
            style={styles.newAssessmentButton}
            onPress={() => navigation.navigate('StressDetector')}>
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.buttonText}>New Assessment</Text>
          </TouchableOpacity>
        </View>

        {insights && (
          <View style={styles.insightsCard}>
            <Text style={styles.cardTitle}>Your Stress Insights</Text>
            <View style={styles.insightRow}>
              <View style={styles.insightItem}>
                <Text style={styles.insightValue}>{insights.averageStress.toFixed(1)}/10</Text>
                <Text style={styles.insightLabel}>Average Stress</Text>
              </View>
              <View style={styles.insightItem}>
                <Text style={styles.insightValue}>{insights.totalAssessments}</Text>
                <Text style={styles.insightLabel}>Assessments</Text>
              </View>
              <View style={styles.insightItem}>
                <Text
                  style={[
                    styles.insightValue,
                    {
                      color:
                        insights.trend === 'Decreasing'
                          ? '#4CAF50'
                          : insights.trend === 'Increasing'
                            ? '#F44336'
                            : '#FFC107',
                    },
                  ]}>
                  {insights.trend}
                </Text>
                <Text style={styles.insightLabel}>Trend</Text>
              </View>
            </View>
          </View>
        )}

        {chartData && (
          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>7-Day Stress Trend</Text>
            <LineChart
              data={chartData}
              width={width - 60}
              height={200}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: 'transparent',
                backgroundGradientTo: 'transparent',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#fff',
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        <View style={styles.historyCard}>
          <Text style={styles.cardTitle}>Recent Assessments</Text>
          {stressHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No stress assessments yet</Text>
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => navigation.navigate('StressDetector')}>
                <Text style={styles.startButtonText}>Take Your First Assessment</Text>
              </TouchableOpacity>
            </View>
          ) : (
            stressHistory.map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyEmoji}>{getStressEmoji(item.stressLevel)}</Text>
                  <View>
                    <Text style={styles.historyLevel}>{item.stressLevel}</Text>
                    <Text style={styles.historyDate}>
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyScore}>{item.stressScore}/10</Text>
                  <View
                    style={[
                      styles.stressIndicator,
                      { backgroundColor: getStressColor(item.stressLevel) },
                    ]}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        {insights && insights.recommendations.length > 0 && (
          <View style={styles.recommendationsCard}>
            <Text style={styles.cardTitle}>Recommendations for You</Text>
            {insights.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Ionicons name="bulb" size={16} color="#FFC107" />
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('StressHistory')}>
            <Ionicons name="time" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>View History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('StressInsights')}>
            <Ionicons name="analytics" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Detailed Insights</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  newAssessmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: '600',
  },
  insightsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  insightItem: {
    alignItems: 'center',
  },
  insightValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  insightLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  chartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  historyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginBottom: 15,
  },
  startButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  startButtonText: {
    color: '#667eea',
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  historyLevel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historyDate: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyScore: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  stressIndicator: {
    width: 20,
    height: 4,
    borderRadius: 2,
  },
  recommendationsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
    width: '48%',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default StressDashboard;
