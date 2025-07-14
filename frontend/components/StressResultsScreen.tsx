import { BarChart3, Brain, Clock, Heart, Zap } from 'lucide-react-native';
import { Animated, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';

const { width } = Dimensions.get('window');

const StressDetectorScreen = ({ route, navigation }) => {
  // ... all state and logic stay unchanged

  const renderTabButton = (tabId, label, icon) => {
    const Icon = icon;
    const isActive = activeTab === tabId;
    return (
      <TouchableOpacity
        key={tabId}
        className={tw`${isActive ? 'bg-blue-500' : 'bg-gray-100'} mx-1 flex-1 rounded-md px-2 py-3`}
        onPress={() => setActiveTab(tabId)}>
        <View className={tw`items-center gap-1`}>
          <Icon size={18} color={isActive ? '#fff' : '#6B7280'} />
          <Text className={tw`${isActive ? 'text-white' : 'text-gray-500'} text-xs font-medium`}>
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Example Tailwind View Update
  const renderOverviewTab = () => (
    <View className={tw`gap-6`}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
        className={tw`items-center gap-6 rounded-3xl bg-white p-8 shadow-md`}>
        <View
          className={tw`h-28 w-28 items-center justify-center rounded-full border-4`}
          style={{
            backgroundColor: stressInfo.color + '20',
            borderColor: stressInfo.color + '50',
          }}>
          <StressIcon size={56} color={stressInfo.color} />
        </View>

        <View className={tw`items-center gap-3`}>
          <Text className={tw`text-2xl font-bold text-gray-800`}>{stressInfo.label}</Text>
          <Text className={tw`max-w-[280px] text-center text-base leading-6 text-gray-500`}>
            {stressInfo.message}
          </Text>
          <View className={tw`mt-4 flex-row items-center gap-2`}>
            <Clock size={16} color="#6B7280" />
            <Text className={tw`text-sm text-gray-500`}>
              Assessed on {new Date().toLocaleDateString()}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* ... same strategy to apply for the rest of the tabs */}
    </View>
  );

  return (
    <View className={tw`flex-1 bg-gray-50`}>
      <ScrollView className={tw`flex-1`} showsVerticalScrollIndicator={false}>
        <View className={tw`gap-6 px-6 py-8`}>
          <View className={tw`items-center`}>
            <Text className={tw`text-2xl font-bold text-gray-900`}>Stress Assessment</Text>
            <Text className={tw`mt-2 text-gray-500`}>Your personalized stress analysis</Text>
          </View>

          <View className={tw`flex-row rounded-xl bg-white p-2 shadow-sm`}>
            {renderTabButton('overview', 'Overview', BarChart3)}
            {renderTabButton('recommendations', 'Tips', Heart)}
            {renderTabButton('insights', 'Insights', Brain)}
            {renderTabButton('actions', 'Actions', Zap)}
          </View>

          <Animated.View style={{ opacity: fadeAnim }}>{renderTabContent()}</Animated.View>
        </View>
      </ScrollView>
    </View>
  );
};

export default StressDetectorScreen;
