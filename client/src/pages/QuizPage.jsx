import React, { useState, useEffect } from "react";
import { quizService } from "../services/api";
import TriviaQuizCard from "../components/TriviaQuizCard";
import { BookOpen, Sparkles, Award, Lightbulb, Trophy } from "lucide-react";

export default function QuizPage({ onPointsEarned }) {
  const [dailyQuiz, setDailyQuiz] = useState(null);
  const [totalEarned, setTotalEarned] = useState(0);

  useEffect(() => {
    fetchQuiz();
  }, []);

  const fetchQuiz = async () => {
    try {
      const data = await quizService.getDailyQuiz();
      if (data && data.question_text) {
        setDailyQuiz(data);
      }
    } catch {
      // Fallback handled in TriviaQuizCard
    }
  };

  const handleQuizCompletion = (score) => {
    setTotalEarned((prev) => prev + score);
    if (onPointsEarned) {
      onPointsEarned(score);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-500 via-sky-400 to-emerald-400 text-white p-6 sm:p-8 rounded-3xl shadow-md flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-4xl shadow-inner">
            🧠
          </div>
          <div>
            <h1 className="font-heading font-bold text-2xl sm:text-3xl">
              Nutrition Trivia Arena
            </h1>
            <p className="text-sky-100 text-xs sm:text-sm mt-1">
              Answer food & nutrition quizzes to power up your superhero avatar!
            </p>
          </div>
        </div>

        <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-2xl text-center">
          <span className="text-[11px] text-sky-100 block font-medium">
            Session Score
          </span>
          <span className="font-heading font-bold text-xl text-white">
            +{totalEarned} Pts ⭐
          </span>
        </div>
      </div>

      {/* Interactive Quiz Card */}
      <TriviaQuizCard quiz={dailyQuiz} onCompleteQuiz={handleQuizCompletion} />

      {/* Daily Nutrition Power Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="bg-emerald-50/70 p-5 rounded-3xl border border-emerald-200">
          <div className="text-3xl mb-2">🥕</div>
          <h4 className="font-heading font-bold text-sm text-slate-800">
            Vision Power!
          </h4>
          <p className="text-xs text-slate-600 mt-1">
            Orange and yellow vegetables like carrots and squash protect your
            eyesight!
          </p>
        </div>

        <div className="bg-amber-50/70 p-5 rounded-3xl border border-amber-200">
          <div className="text-3xl mb-2">🥛</div>
          <h4 className="font-heading font-bold text-sm text-slate-800">
            Bone Strength
          </h4>
          <p className="text-xs text-slate-600 mt-1">
            Calcium from dairy and dark leafy greens keeps your teeth and bones
            ultra strong.
          </p>
        </div>

        <div className="bg-purple-50/70 p-5 rounded-3xl border border-purple-200">
          <div className="text-3xl mb-2">🫐</div>
          <h4 className="font-heading font-bold text-sm text-slate-800">
            Brain Fuel
          </h4>
          <p className="text-xs text-slate-600 mt-1">
            Blueberries and strawberries are packed with antioxidants that boost
            your memory!
          </p>
        </div>
      </div>
    </div>
  );
}
