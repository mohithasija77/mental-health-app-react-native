import { mentalHealthFacts } from 'assets/mockData/facts';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const MentalHealthFacts = ({ navigation }) => {
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [likedFacts, setLikedFacts] = useState(new Set());

  const currentFact = mentalHealthFacts[currentFactIndex];
  const translateX = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const sparkleScale = useSharedValue(0);

  const changeFact = (direction) => {
    let newIndex = currentFactIndex + direction;
    if (newIndex < 0) newIndex = mentalHealthFacts.length - 1;
    if (newIndex >= mentalHealthFacts.length) newIndex = 0;
    setCurrentFactIndex(newIndex);
    translateX.value = 0;
    animateCard();
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > width * 0.25) {
        runOnJS(changeFact)(e.translationX < 0 ? 1 : -1);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: cardOpacity.value,
  }));

  const sparkleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sparkleScale.value }],
  }));

  const animateCard = () => {
    cardOpacity.value = 0;
    cardOpacity.value = withSequence(
      withTiming(0, { duration: 200 }),
      withTiming(1, { duration: 500 })
    );
  };

  const animateSparkle = () => {
    sparkleScale.value = withSequence(
      withTiming(1.5, { duration: 300 }),
      withTiming(0, { duration: 500 })
    );
  };

  const handleLike = () => {
    const newLikedFacts = new Set(likedFacts);
    if (likedFacts.has(currentFact.id)) {
      newLikedFacts.delete(currentFact.id);
    } else {
      newLikedFacts.add(currentFact.id);
      animateSparkle();
    }
    setLikedFacts(newLikedFacts);
  };

  const getRandomFact = () => {
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * mentalHealthFacts.length);
    } while (randomIndex === currentFactIndex);
    setCurrentFactIndex(randomIndex);
    animateCard();
  };

  useEffect(() => {
    animateCard();
  }, [currentFactIndex]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.backgroundGradient}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mind Gems 💎</Text>
            <View style={styles.headerRight}>
              <Text style={styles.factCounter}>
                {currentFactIndex + 1}/{mentalHealthFacts.length}
              </Text>
            </View>
          </View>

          {/* Main Fact Card */}
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.factCard, animatedStyle]}>
              <LinearGradient colors={currentFact.color} style={styles.factCardGradient}>
                <Text style={styles.factEmoji}>{currentFact.emoji}</Text>
                <Text style={styles.factText}>{currentFact.fact}</Text>
                <View style={styles.factMeta}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{currentFact.category}</Text>
                  </View>
                  <View style={styles.funLevelBadge}>
                    <Text style={styles.funLevelText}>{currentFact.funLevel}</Text>
                  </View>
                </View>
                {/* Sparkle Animation */}
                <Animated.View style={[styles.sparkle, sparkleAnimatedStyle]}>
                  <Text style={styles.sparkleText}>✨</Text>
                </Animated.View>
              </LinearGradient>
            </Animated.View>
          </GestureDetector>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={getRandomFact}>
              <Icon name="shuffle" size={28} color="#fff" />
              <Text style={styles.actionButtonText}>Surprise Me</Text>
            </TouchableOpacity>
            {/* <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Icon
                name={likedFacts.has(currentFact.id) ? 'favorite' : 'favorite-border'}
                size={28}
                color={likedFacts.has(currentFact.id) ? '#ff4757' : '#fff'}
              />
              <Text style={styles.actionButtonText}>
                {likedFacts.has(currentFact.id) ? 'Loved!' : 'Love it'}
              </Text>
            </TouchableOpacity> */}
          </View>

          {/* Navigation */}
          <View style={styles.navigation}>
            <TouchableOpacity style={styles.navButton} onPress={() => changeFact(-1)}>
              <Icon name="chevron-left" size={32} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={() => changeFact(1)}>
              <Icon name="chevron-right" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundGradient: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerRight: { padding: 8 },
  factCounter: { color: '#fff', fontSize: 16, fontWeight: '600' },
  factCard: {
    marginVertical: 30,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  factCardGradient: { padding: 30, minHeight: 300, position: 'relative' },
  factEmoji: { fontSize: 60, marginBottom: 20, textAlign: 'center' },
  factText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
    marginBottom: 20,
  },
  factMeta: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10 },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  categoryText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  funLevelBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  funLevelText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  sparkle: { position: 'absolute', top: 20, right: 20 },
  sparkleText: { fontSize: 24 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 30 },
  actionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 20,
    minWidth: 120,
  },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 5 },
  navigation: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 },
  navButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MentalHealthFacts;
