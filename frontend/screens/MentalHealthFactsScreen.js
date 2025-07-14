import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

const MentalHealthFacts = ({ navigation }) => {
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [likedFacts, setLikedFacts] = useState(new Set());
  const [showFact, setShowFact] = useState(false);
  const [cardAnimation] = useState(new Animated.Value(0));
  const [heartAnimation] = useState(new Animated.Value(1));
  const [sparkleAnimation] = useState(new Animated.Value(0));

  const mentalHealthFacts = [
    {
      id: 1,
      fact: 'Laughing releases endorphins, which are natural mood boosters! A good giggle can literally make you feel better.',
      emoji: '😄',
      color: ['#FFD700', '#FFA500'],
      category: 'Happiness',
      funLevel: 'High',
    },
    {
      id: 2,
      fact: "Your brain uses 20% of your body's total energy. Taking care of your mental health is like charging your most important battery!",
      emoji: '🧠',
      color: ['#9C27B0', '#673AB7'],
      category: 'Brain Power',
      funLevel: 'Mind-blowing',
    },
    {
      id: 3,
      fact: 'Forest bathing (spending time in nature) can reduce stress hormones by up to 50%. Trees are natural therapists!',
      emoji: '🌳',
      color: ['#4CAF50', '#2E7D32'],
      category: 'Nature Therapy',
      funLevel: 'Zen',
    },
    {
      id: 4,
      fact: 'Dancing for just 10 minutes can boost your mood as much as a workout! Your happy chemicals love to groove.',
      emoji: '💃',
      color: ['#E91E63', '#F06292'],
      category: 'Movement',
      funLevel: 'Groovy',
    },
    {
      id: 5,
      fact: "Hugging releases oxytocin, the 'cuddle hormone,' which reduces stress and blood pressure. Free medicine!",
      emoji: '🤗',
      color: ['#FF9800', '#FF5722'],
      category: 'Connection',
      funLevel: 'Warm & Fuzzy',
    },
    {
      id: 6,
      fact: "Your gut produces 95% of your body's serotonin. A happy belly equals a happy mind!",
      emoji: '🌟',
      color: ['#00BCD4', '#0097A7'],
      category: 'Gut Health',
      funLevel: 'Surprising',
    },
    {
      id: 7,
      fact: "Singing in the shower releases dopamine and reduces anxiety. You're basically doing therapy karaoke!",
      emoji: '🎤',
      color: ['#3F51B5', '#5C6BC0'],
      category: 'Music Therapy',
      funLevel: 'Melodic',
    },
    {
      id: 8,
      fact: 'Petting a dog or cat for just 10 minutes can significantly lower your cortisol levels. Pets are furry stress relievers!',
      emoji: '🐕',
      color: ['#795548', '#8D6E63'],
      category: 'Pet Therapy',
      funLevel: 'Pawsome',
    },
    {
      id: 9,
      fact: "Smiling, even when you don't feel like it, can trick your brain into feeling happier. Fake it 'til you make it works!",
      emoji: '😊',
      color: ['#FFEB3B', '#FFC107'],
      category: 'Positive Psychology',
      funLevel: 'Clever',
    },
    {
      id: 10,
      fact: 'Chocolate contains compounds that can boost mood and cognitive function. Science says chocolate is brain food!',
      emoji: '🍫',
      color: ['#6D4C41', '#8D6E63'],
      category: 'Sweet Science',
      funLevel: 'Delicious',
    },
  ];

  const currentFact = mentalHealthFacts[currentFactIndex];

  useEffect(() => {
    animateCard();
  }, [currentFactIndex]);

  const animateCard = () => {
    setShowFact(false);
    Animated.sequence([
      Animated.timing(cardAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(cardAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => setShowFact(true));
  };

  const animateHeart = () => {
    Animated.sequence([
      Animated.timing(heartAnimation, {
        toValue: 1.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(heartAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateSparkle = () => {
    Animated.timing(sparkleAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      sparkleAnimation.setValue(0);
    });
  };

  const handleLike = () => {
    const newLikedFacts = new Set(likedFacts);
    if (likedFacts.has(currentFact.id)) {
      newLikedFacts.delete(currentFact.id);
    } else {
      newLikedFacts.add(currentFact.id);
      animateHeart();
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
  };

  const getNextFact = () => {
    setCurrentFactIndex((prev) => (prev + 1) % mentalHealthFacts.length);
  };

  const getPrevFact = () => {
    setCurrentFactIndex((prev) => (prev - 1 + mentalHealthFacts.length) % mentalHealthFacts.length);
  };

  const cardTransform = cardAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  const cardOpacity = cardAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const sparkleRotation = sparkleAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sparkleScale = sparkleAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.5, 0],
  });

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
          <Animated.View
            style={[
              styles.factCard,
              {
                transform: [{ translateY: cardTransform }],
                opacity: cardOpacity,
              },
            ]}>
            <LinearGradient colors={currentFact.color} style={styles.factCardGradient}>
              <View style={styles.factContent}>
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
              </View>

              {/* Sparkle Animation */}
              <Animated.View
                style={[
                  styles.sparkle,
                  {
                    transform: [{ rotate: sparkleRotation }, { scale: sparkleScale }],
                  },
                ]}>
                <Text style={styles.sparkleText}>✨</Text>
              </Animated.View>
            </LinearGradient>
          </Animated.View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Animated.View
                style={[styles.heartContainer, { transform: [{ scale: heartAnimation }] }]}>
                <Icon
                  name={likedFacts.has(currentFact.id) ? 'favorite' : 'favorite-border'}
                  size={28}
                  color={likedFacts.has(currentFact.id) ? '#ff4757' : '#fff'}
                />
              </Animated.View>
              <Text style={styles.actionButtonText}>
                {likedFacts.has(currentFact.id) ? 'Loved!' : 'Love it'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={getRandomFact}>
              <Icon name="shuffle" size={28} color="#fff" />
              <Text style={styles.actionButtonText}>Surprise Me</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation */}
          <View style={styles.navigation}>
            <TouchableOpacity style={styles.navButton} onPress={getPrevFact}>
              <Icon name="chevron-left" size={32} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.navButton} onPress={getNextFact}>
              <Icon name="chevron-right" size={32} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Fun Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{likedFacts.size}</Text>
              <Text style={styles.statLabel}>Facts Loved</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{mentalHealthFacts.length}</Text>
              <Text style={styles.statLabel}>Total Gems</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {Math.round((likedFacts.size / mentalHealthFacts.length) * 100)}%
              </Text>
              <Text style={styles.statLabel}>Explored</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    padding: 8,
  },
  factCounter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
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
  factCardGradient: {
    padding: 30,
    minHeight: 300,
    position: 'relative',
  },
  factContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  factEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  factText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
    marginBottom: 20,
  },
  factMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  funLevelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  funLevelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sparkle: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  sparkleText: {
    fontSize: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 30,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 20,
    minWidth: 120,
  },
  heartContainer: {
    marginBottom: 5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  navButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    marginTop: 5,
  },
});

export default MentalHealthFacts;
