import {
  Brain,
  ChevronRight,
  Heart,
  Loader2,
  Moon,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AIAnalysisHomescreen() {
  const [userInput, setUserInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [floatingAnimation, setFloatingAnimation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFloatingAnimation((prev) => prev + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const categories = [
    {
      id: 'general',
      icon: Brain,
      label: 'General Analysis',
      subtitle: 'Deep understanding',
      color: 'from-violet-300 to-purple-400',
      bgGradient: 'from-violet-50 to-purple-100',
      shadowColor: 'shadow-violet-200/50',
      size: 'large',
    },
    {
      id: 'sentiment',
      icon: Heart,
      label: 'Sentiment',
      subtitle: 'Emotional insights',
      color: 'from-rose-300 to-pink-400',
      bgGradient: 'from-rose-50 to-pink-100',
      shadowColor: 'shadow-rose-200/50',
      size: 'medium',
    },
    {
      id: 'trends',
      icon: TrendingUp,
      label: 'Trends',
      subtitle: 'Pattern discovery',
      color: 'from-emerald-300 to-teal-400',
      bgGradient: 'from-emerald-50 to-teal-100',
      shadowColor: 'shadow-emerald-200/50',
      size: 'medium',
    },
    {
      id: 'insights',
      icon: Sparkles,
      label: 'Insights',
      subtitle: 'Hidden connections',
      color: 'from-amber-300 to-orange-400',
      bgGradient: 'from-amber-50 to-orange-100',
      shadowColor: 'shadow-amber-200/50',
      size: 'large',
    },
  ];

  const handleAnalysis = async () => {
    if (!userInput.trim()) return;

    setIsAnalyzing(true);

    setTimeout(() => {
      const mockAnalysis = {
        summary:
          'Your input reveals thoughtful consideration of user experience and innovation. The tone is optimistic and forward-thinking, suggesting strong leadership qualities and creative problem-solving approaches.',
        confidence: 94,
        keyPoints: [
          'Strong focus on user-centered design principles',
          'Emphasis on technological innovation and progress',
          'Positive outlook with growth-oriented mindset',
          'Creative approach to problem-solving',
        ],
        category: categories.find((c) => c.id === selectedCategory)?.label,
      };

      setAnalysis(mockAnalysis);
      setIsAnalyzing(false);
    }, 3000);
  };

  const FloatingElement = ({ delay, size, color, shape = 'circle' }) => (
    <div
      className={`absolute ${shape === 'circle' ? 'rounded-full' : 'rounded-lg'} ${color} opacity-30`}
      style={{
        width: size,
        height: size,
        left: `${15 + Math.random() * 70}%`,
        top: `${10 + Math.random() * 80}%`,
        animation: `gentleFloat ${8 + Math.random() * 4}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        filter: 'blur(1px)',
      }}
    />
  );

  const ArtisticIllustration = ({ category, isSelected }) => {
    const animations = {
      general: (
        <div className="relative mx-auto mb-4 h-24 w-24">
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-br from-violet-200 to-purple-300 ${isSelected ? 'animate-pulse' : ''}`}>
            <div className="absolute left-3 top-3 h-4 w-4 rounded-full bg-white opacity-80"></div>
            <div className="absolute bottom-4 right-4 h-3 w-3 rounded-full bg-white opacity-60"></div>
          </div>
          <Brain className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 transform text-violet-600" />
          <div className="absolute -right-2 -top-2 text-xl">✨</div>
        </div>
      ),
      sentiment: (
        <div className="relative mx-auto mb-4 h-24 w-24">
          <div
            className={`absolute inset-0 rotate-12 transform rounded-2xl bg-gradient-to-br from-rose-200 to-pink-300 ${isSelected ? 'animate-bounce' : ''}`}></div>
          <div className="absolute inset-2 flex items-center justify-center rounded-xl bg-gradient-to-br from-rose-100 to-pink-200">
            <Heart className="h-8 w-8 fill-current text-rose-500" />
          </div>
          <div className="absolute -left-1 -top-1 text-lg">💫</div>
          <div className="absolute -bottom-1 -right-1 text-lg">🌸</div>
        </div>
      ),
      trends: (
        <div className="relative mx-auto mb-4 h-24 w-24">
          <div className="absolute inset-0 -rotate-6 transform rounded-lg bg-gradient-to-br from-emerald-200 to-teal-300">
            <div className="absolute inset-2 flex items-center justify-center rounded-md bg-gradient-to-br from-emerald-100 to-teal-200">
              <TrendingUp
                className={`h-8 w-8 text-emerald-600 ${isSelected ? 'animate-pulse' : ''}`}
              />
            </div>
          </div>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 transform text-xl">📊</div>
        </div>
      ),
      insights: (
        <div className="relative mx-auto mb-4 h-24 w-24">
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 ${isSelected ? 'animate-spin' : ''}`}
            style={{ animationDuration: '8s' }}>
            <div className="absolute left-1/2 top-2 h-2 w-2 -translate-x-1/2 transform rounded-full bg-white"></div>
            <div className="absolute bottom-2 left-1/2 h-2 w-2 -translate-x-1/2 transform rounded-full bg-white"></div>
            <div className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 transform rounded-full bg-white"></div>
            <div className="absolute right-2 top-1/2 h-2 w-2 -translate-y-1/2 transform rounded-full bg-white"></div>
          </div>
          <Sparkles className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 transform text-amber-600" />
          <div className="absolute -right-2 -top-2 text-xl">💡</div>
        </div>
      ),
    };

    return animations[category.id] || animations.general;
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-rose-50 to-blue-50">
      <style>{`
        @keyframes gentleFloat {
          0%,
          100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-15px) translateX(8px) rotate(1deg);
          }
          50% {
            transform: translateY(-8px) translateX(-8px) rotate(-1deg);
          }
          75% {
            transform: translateY(-12px) translateX(5px) rotate(0.5deg);
          }
        }

        @keyframes softPulse {
          0%,
          100% {
            opacity: 0.1;
          }
          50% {
            opacity: 0.2;
          }
        }

        @keyframes gentleBreathe {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
      `}</style>

      {/* Artistic Background Elements */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <FloatingElement
            key={i}
            delay={i * 1.2}
            size={`${20 + Math.random() * 60}px`}
            color={
              [
                'bg-violet-200',
                'bg-rose-200',
                'bg-emerald-200',
                'bg-amber-200',
                'bg-blue-200',
                'bg-pink-200',
                'bg-teal-200',
              ][i % 7]
            }
            shape={Math.random() > 0.5 ? 'circle' : 'square'}
          />
        ))}
      </div>

      {/* Soft Gradient Overlays */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-violet-100/20 via-transparent to-rose-100/20"
        style={{ animation: 'softPulse 12s ease-in-out infinite' }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/30 to-transparent"
        style={{ animation: 'softPulse 15s ease-in-out infinite reverse' }}
      />

      <div className="container relative z-10 mx-auto px-6 py-12">
        {/* Artistic Header */}
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-4">
            <div className="relative">
              <div
                className="rounded-3xl border border-violet-200/50 bg-gradient-to-br from-violet-100 to-purple-200 p-5 shadow-lg"
                style={{ animation: 'gentleBreathe 4s ease-in-out infinite' }}>
                <Brain className="h-10 w-10 text-violet-600" />
              </div>
              <div className="absolute -right-2 -top-2 text-2xl">🌟</div>
            </div>
          </div>
          <h1 className="mb-3 bg-gradient-to-r from-slate-600 via-violet-600 to-rose-600 bg-clip-text text-5xl font-light text-transparent">
            What Brings You
          </h1>
          <h2 className="mb-6 text-3xl font-light text-slate-500">to Silent Moon?</h2>
          <p className="text-lg font-light text-slate-400">choose a topic to focus on:</p>
        </div>

        {/* Artistic Category Grid - Asymmetric Layout */}
        <div className="mx-auto mb-16 max-w-5xl">
          <div className="grid h-96 grid-cols-2 gap-6">
            {/* Large tile - Top Left */}
            <div className="row-span-2">
              {categories.filter((c) => c.size === 'large')[0] && (
                <CategoryTile
                  category={categories.filter((c) => c.size === 'large')[0]}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  floatingAnimation={floatingAnimation}
                  index={0}
                  className="h-full"
                />
              )}
            </div>

            {/* Two medium tiles - Right side */}
            <div className="space-y-6">
              {categories
                .filter((c) => c.size === 'medium')
                .map((category, idx) => (
                  <CategoryTile
                    key={category.id}
                    category={category}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    floatingAnimation={floatingAnimation}
                    index={idx + 1}
                    className="h-40"
                  />
                ))}
            </div>

            {/* Large tile - Bottom Left */}
            <div className="col-span-2">
              {categories.filter((c) => c.size === 'large')[1] && (
                <CategoryTile
                  category={categories.filter((c) => c.size === 'large')[1]}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  floatingAnimation={floatingAnimation}
                  index={3}
                  className="h-40"
                />
              )}
            </div>
          </div>
        </div>

        {/* Elegant Input Section */}
        <div
          className="mx-auto mb-8 max-w-4xl rounded-3xl border border-white/40 bg-white/60 p-8 shadow-2xl backdrop-blur-xl"
          style={{ animation: 'gentleBreathe 6s ease-in-out infinite' }}>
          <div className="relative">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Share what's on your mind... Let our AI understand your thoughts and feelings"
              className="h-32 w-full resize-none rounded-3xl border border-slate-200/50 bg-white/40 p-6 font-light text-slate-600 placeholder-slate-400 transition-all duration-500 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-200/30"
            />
            <div className="absolute bottom-6 right-6 flex items-center gap-3">
              <span className="text-sm font-light text-slate-400">{userInput.length}/1000</span>
              <button
                onClick={handleAnalysis}
                disabled={!userInput.trim() || isAnalyzing}
                className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-400 to-purple-500 px-6 py-3 font-light text-white shadow-lg transition-all duration-300 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50">
                {isAnalyzing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Zap className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
                    <span>Analyze</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        {(isAnalyzing || analysis) && (
          <div className="mx-auto max-w-4xl rounded-3xl border border-white/40 bg-white/60 p-8 shadow-2xl backdrop-blur-xl">
            {isAnalyzing ? (
              <div className="py-16 text-center">
                <div className="mb-8 inline-flex items-center gap-4">
                  <div className="relative">
                    <div className="h-20 w-20 animate-spin rounded-full border-4 border-violet-200 border-t-violet-400"></div>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform text-2xl">
                      🧠
                    </div>
                  </div>
                </div>
                <h3 className="mb-3 text-2xl font-light text-slate-600">
                  Understanding your thoughts...
                </h3>
                <p className="font-light text-slate-400">Our AI is gently processing your words</p>
                <div className="mt-8 flex justify-center">
                  <div className="flex gap-3">
                    {['🌸', '✨', '🌙'].map((emoji, i) => (
                      <div
                        key={i}
                        className="animate-bounce text-2xl"
                        style={{ animationDelay: `${i * 0.3}s` }}>
                        {emoji}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              analysis && (
                <div className="space-y-8">
                  <div className="mb-8 flex items-center gap-4">
                    <div className="rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 p-3">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-light text-slate-600">Your Analysis is Ready</h3>
                    <div className="ml-auto flex items-center gap-3">
                      <span className="text-lg font-semibold text-emerald-500">
                        {analysis.confidence}%
                      </span>
                      <span className="text-sm font-light text-slate-400">confidence</span>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-100/50 bg-gradient-to-r from-slate-50/50 to-violet-50/50 p-8">
                    <h4 className="mb-4 flex items-center gap-2 font-medium text-slate-500">
                      <Moon className="h-5 w-5" />
                      Summary
                    </h4>
                    <p className="text-lg font-light leading-relaxed text-slate-600">
                      {analysis.summary}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-rose-100/50 bg-gradient-to-r from-rose-50/50 to-pink-50/50 p-8">
                    <h4 className="mb-6 flex items-center gap-2 font-medium text-slate-500">
                      <Star className="h-5 w-5" />
                      Key Insights
                    </h4>
                    <div className="space-y-4">
                      {analysis.keyPoints.map((point, index) => (
                        <div key={index} className="group flex items-start gap-4">
                          <div className="mt-2 h-3 w-3 flex-shrink-0 rounded-full bg-gradient-to-r from-rose-300 to-pink-400 transition-transform duration-300 group-hover:scale-125" />
                          <span className="font-light leading-relaxed text-slate-600">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button className="group flex w-full items-center justify-center gap-3 rounded-3xl bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 px-8 py-5 text-lg font-light text-white shadow-xl transition-all duration-500 hover:scale-[1.01]">
                    <span>Explore Deeper Insights</span>
                    <ChevronRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryTile({
  category,
  selectedCategory,
  setSelectedCategory,
  floatingAnimation,
  index,
  className,
}) {
  const isSelected = selectedCategory === category.id;
  const Icon = category.icon;

  return (
    <button
      onClick={() => setSelectedCategory(category.id)}
      className={`group relative transform rounded-3xl p-8 transition-all duration-700 hover:-translate-y-1 hover:scale-[1.02] ${className} ${
        isSelected
          ? `bg-gradient-to-br ${category.bgGradient} border-2 border-white/60 shadow-2xl ${category.shadowColor} shadow-2xl`
          : `border border-white/30 bg-white/40 shadow-xl backdrop-blur-sm hover:bg-white/60 hover:shadow-2xl`
      }`}
      style={{
        transform: `translateY(${Math.sin(floatingAnimation * 0.015 + index * 0.5) * 2}px)`,
      }}>
      {/* Artistic Background Pattern */}
      <div
        className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${category.bgGradient} opacity-20`}
      />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-center text-center">
        <ArtisticIllustration category={category} isSelected={isSelected} />

        <h3 className="mb-2 text-xl font-medium text-slate-600">{category.label}</h3>
        <p className="text-sm font-light text-slate-400">{category.subtitle}</p>
      </div>

      {/* Selection Glow */}
      {isSelected && (
        <div
          className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${category.color} animate-pulse opacity-10`}
        />
      )}

      {/* Hover Glow */}
      <div
        className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${category.color} opacity-0 transition-opacity duration-500 group-hover:opacity-5`}
      />
    </button>
  );
}

function ArtisticIllustration({ category, isSelected }) {
  const animations = {
    general: (
      <div className="relative mx-auto mb-4 h-24 w-24">
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-br from-violet-200 to-purple-300 ${isSelected ? 'animate-pulse' : ''}`}>
          <div className="absolute left-3 top-3 h-4 w-4 rounded-full bg-white opacity-80"></div>
          <div className="absolute bottom-4 right-4 h-3 w-3 rounded-full bg-white opacity-60"></div>
        </div>
        <Brain className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 transform text-violet-600" />
        <div className="absolute -right-2 -top-2 text-xl">✨</div>
      </div>
    ),
    sentiment: (
      <div className="relative mx-auto mb-4 h-24 w-24">
        <div
          className={`absolute inset-0 rotate-12 transform rounded-2xl bg-gradient-to-br from-rose-200 to-pink-300 ${isSelected ? 'animate-bounce' : ''}`}></div>
        <div className="absolute inset-2 flex items-center justify-center rounded-xl bg-gradient-to-br from-rose-100 to-pink-200">
          <Heart className="h-8 w-8 fill-current text-rose-500" />
        </div>
        <div className="absolute -left-1 -top-1 text-lg">💫</div>
        <div className="absolute -bottom-1 -right-1 text-lg">🌸</div>
      </div>
    ),
    trends: (
      <div className="relative mx-auto mb-4 h-24 w-24">
        <div className="absolute inset-0 -rotate-6 transform rounded-lg bg-gradient-to-br from-emerald-200 to-teal-300">
          <div className="absolute inset-2 flex items-center justify-center rounded-md bg-gradient-to-br from-emerald-100 to-teal-200">
            <TrendingUp
              className={`h-8 w-8 text-emerald-600 ${isSelected ? 'animate-pulse' : ''}`}
            />
          </div>
        </div>
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 transform text-xl">📊</div>
      </div>
    ),
    insights: (
      <div className="relative mx-auto mb-4 h-24 w-24">
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 ${isSelected ? 'animate-spin' : ''}`}
          style={{ animationDuration: '8s' }}>
          <div className="absolute left-1/2 top-2 h-2 w-2 -translate-x-1/2 transform rounded-full bg-white"></div>
          <div className="absolute bottom-2 left-1/2 h-2 w-2 -translate-x-1/2 transform rounded-full bg-white"></div>
          <div className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 transform rounded-full bg-white"></div>
          <div className="absolute right-2 top-1/2 h-2 w-2 -translate-y-1/2 transform rounded-full bg-white"></div>
        </div>
        <Sparkles className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 transform text-amber-600" />
        <div className="absolute -right-2 -top-2 text-xl">💡</div>
      </div>
    ),
  };

  return animations[category.id] || animations.general;
}
