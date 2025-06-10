import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';

const CATEGORIES = ['general', 'sleep', 'mood', 'stress'] as const;
type Category = (typeof CATEGORIES)[number];

const AISection: React.FC = () => {
  const [userInput, setUserInput] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>('general');

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysis(null);

    setTimeout(() => {
      setAnalysis(`🧠 AI analysis of your "${selectedCategory}" notes: insightful summary here.`);
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <View className="mt-6 rounded-xl bg-indigo-100 p-4">
      <Text className="mb-3 text-xl font-semibold text-indigo-900">AI-Powered Analysis</Text>

      <TextInput
        className="h-28 rounded-lg bg-white p-3 text-black"
        multiline
        placeholder="Write your thoughts here..."
        value={userInput}
        onChangeText={setUserInput}
        placeholderTextColor="#94a3b8"
      />

      <View className="mt-3 flex-row flex-wrap">
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            className={`mb-2 mr-2 rounded-full px-3 py-1 ${
              selectedCategory === cat ? 'bg-indigo-600' : 'bg-indigo-200'
            }`}>
            <Text
              className={`font-medium ${
                selectedCategory === cat ? 'text-white' : 'text-indigo-900'
              }`}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={handleAnalyze}
        className="mt-4 items-center rounded-lg bg-indigo-700 py-2">
        <Text className="font-semibold text-white">
          {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
        </Text>
      </TouchableOpacity>

      {isAnalyzing && <ActivityIndicator className="mt-3" />}
      {analysis && <Text className="mt-4 italic text-slate-700">{analysis}</Text>}
    </View>
  );
};

export default AISection;
