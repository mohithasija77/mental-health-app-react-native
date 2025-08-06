import { useNavigation } from '@react-navigation/native';
import { Activity, ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const StressDetectorScreen = ({ onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const navigation = useNavigation();

  const questions = [
    {
      id: 1,
      question: 'How are you feeling right now? 🌟',
      type: 'emoji',
      options: [
        { emoji: '😊', label: 'Amazing', value: 1 },
        { emoji: '🙂', label: 'Good', value: 2 },
        { emoji: '😐', label: 'Okay', value: 3 },
        { emoji: '😔', label: 'Not great', value: 4 },
        { emoji: '😰', label: 'Terrible', value: 5 },
      ],
    },
    {
      id: 2,
      question: 'How well did you sleep last night? 😴',
      type: 'scale',
      options: [
        { label: 'Like a baby', value: 1 },
        { label: 'Pretty well', value: 2 },
        { label: 'Okay', value: 3 },
        { label: 'Restless', value: 4 },
        { label: 'Barely slept', value: 5 },
      ],
    },
    {
      id: 3,
      question: "What's your energy level today? ⚡",
      type: 'slider',
      min: 1,
      max: 10,
      step: 1,
    },
    {
      id: 4,
      question: 'How overwhelmed do you feel? 🌊',
      type: 'emoji',
      options: [
        { emoji: '😌', label: 'Zen', value: 1 },
        { emoji: '🙂', label: 'Calm', value: 2 },
        { emoji: '😐', label: 'Balanced', value: 3 },
        { emoji: '😰', label: 'Stressed', value: 4 },
        { emoji: '🤯', label: 'Overwhelmed', value: 5 },
      ],
    },
    {
      id: 5,
      question: "How's your focus today? 🎯",
      type: 'scale',
      options: [
        { label: 'Laser focused', value: 1 },
        { label: 'Pretty good', value: 2 },
        { label: 'Average', value: 3 },
        { label: 'Distracted', value: 4 },
        { label: "Can't focus", value: 5 },
      ],
    },
    {
      id: 6,
      question: 'How are your relationships today? 💝',
      type: 'emoji',
      options: [
        { emoji: '🥰', label: 'Loving', value: 1 },
        { emoji: '😊', label: 'Good', value: 2 },
        { emoji: '😐', label: 'Neutral', value: 3 },
        { emoji: '😕', label: 'Tense', value: 4 },
        { emoji: '💔', label: 'Difficult', value: 5 },
      ],
    },
    {
      id: 7,
      question: 'Rate your physical comfort 💪',
      type: 'slider',
      min: 1,
      max: 10,
      step: 1,
    },
    {
      id: 8,
      question: "How's your appetite today? 🍎",
      type: 'scale',
      options: [
        { label: 'Great appetite', value: 1 },
        { label: 'Normal', value: 2 },
        { label: 'Okay', value: 3 },
        { label: 'Poor appetite', value: 4 },
        { label: 'No appetite', value: 5 },
      ],
    },
  ];

  const handleAnswer = (value) => {
    const newAnswers = { ...answers, [questions[currentQuestion].id]: value };
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        submitAnswers(newAnswers);
      }
    }, 300);
  };

  const submitAnswers = async (finalAnswers) => {
    const testId = 'test-user-123';
    setLoading(true);
    try {
      const response = await fetch('http://192.168.29.12:5003/api/mental-health/stress/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: testId, answers: finalAnswers }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze stress');
      }

      const data = await response.json();
      console.log(data);
      setAnalysis({
        stressLevel: data.analysis.stressLevel,
        summary: data.analysis.summary,
        recommendations: data.analysis.recommendations || [], // Ensure it's always an array
      });

      setShowResults(true);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    } catch (error) {
      console.error('Stress analysis error:', error);
      // Set a fallback analysis in case of error
      setAnalysis({
        stressLevel: 0,
        summary: 'Unable to analyze stress at this time. Please try again later.',
        recommendations: [],
      });
      setShowResults(true);
    } finally {
      setLoading(false);
    }
  };

  const renderQuestion = () => {
    const question = questions[currentQuestion];

    return (
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{question.question}</Text>

        {question.type === 'emoji' && (
          <View style={styles.optionsRow}>
            {question.options.map((option, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleAnswer(option.value)}
                style={styles.optionButton}>
                <Text style={styles.emoji}>{option.emoji}</Text>
                <Text style={styles.optionLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {question.type === 'scale' && (
          <View>
            {question.options.map((option, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleAnswer(option.value)}
                style={styles.scaleButton}>
                <Text style={styles.scaleLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {question.type === 'slider' && (
          <View style={styles.sliderRow}>
            <Text style={styles.sliderHint}>Tap a number (1-10)</Text>
            <View style={styles.sliderNumbers}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                <TouchableOpacity
                  key={num}
                  onPress={() => handleAnswer(num)}
                  style={styles.sliderNumber}>
                  <Text style={styles.sliderNumberText}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderResults = () => {
    if (!analysis) return null;

    return (
      <ScrollView contentContainerStyle={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Your Stress Analysis 📊</Text>
        <Text style={styles.resultsLevel}>Stress Level: {analysis.stressLevel}/10</Text>

        <View style={styles.analysisBox}>
          <Text style={styles.analysisTitle}>Analysis</Text>
          <Text style={styles.analysisText}>{analysis.summary}</Text>
        </View>

        <View style={styles.analysisBox}>
          <Text style={styles.analysisTitle}>Recommendations 💡</Text>
          {/* Fixed: Added safe check for recommendations array */}
          {analysis.recommendations && analysis.recommendations.length > 0 ? (
            analysis.recommendations.map((rec, idx) => (
              <Text key={idx} style={styles.recommendationText}>
                • {rec}
              </Text>
            ))
          ) : (
            <Text style={styles.recommendationText}>
              No recommendations available at this time.
            </Text>
          )}
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.doneButton}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <Activity size={48} color="white" />
        <Text style={styles.loadingText}>Analyzing your responses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stress Detector</Text>
      </View>

      {/* Progress */}
      {!showResults && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${((currentQuestion + 1) / questions.length) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {currentQuestion + 1} of {questions.length}
          </Text>
        </View>
      )}

      {/* Content */}
      {showResults ? renderResults() : renderQuestion()}

      {/* Celebration */}
      {showCelebration && (
        <View style={styles.celebrationOverlay}>
          <Text style={styles.celebrationEmoji}>🎉</Text>
          <Text style={styles.celebrationTitle}>Great Job!</Text>
          <Text style={styles.celebrationText}>Analysis complete</Text>
        </View>
      )}
    </View>
  );
};

export default StressDetectorScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#5A67D8' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 40, paddingHorizontal: 16 },
  backButton: { marginRight: 8, padding: 8 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  progressContainer: { paddingHorizontal: 16, marginVertical: 8 },
  progressBarBackground: { height: 6, backgroundColor: '#ccc', borderRadius: 3 },
  progressBarFill: { height: 6, backgroundColor: 'white', borderRadius: 3 },
  progressText: { color: 'white', textAlign: 'center', marginTop: 4 },
  questionContainer: { flex: 1, justifyContent: 'center', padding: 16 },
  questionText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  optionButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    margin: 6,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  emoji: { fontSize: 28 },
  optionLabel: { color: 'white', marginTop: 4 },
  scaleButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 4,
    padding: 12,
    borderRadius: 12,
  },
  scaleLabel: { color: 'white', textAlign: 'center' },
  sliderRow: { alignItems: 'center' },
  sliderHint: { color: 'white', marginBottom: 8 },
  sliderNumbers: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  sliderNumber: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    margin: 4,
    padding: 12,
    borderRadius: 20,
  },
  sliderNumberText: { color: 'white' },
  resultsContainer: { padding: 16, alignItems: 'center' },
  resultsTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  resultsLevel: { color: 'white', fontSize: 18, marginBottom: 16 },
  analysisBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
  },
  analysisTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  analysisText: { color: 'white' },
  recommendationText: { color: 'white' },
  doneButton: { backgroundColor: 'white', padding: 12, borderRadius: 12, marginTop: 16 },
  doneButtonText: { color: '#5A67D8', fontWeight: 'bold' },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#5A67D8',
  },
  loadingText: { color: 'white', marginTop: 12 },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationEmoji: { fontSize: 48 },
  celebrationTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  celebrationText: { color: 'white', marginTop: 4 },
});
