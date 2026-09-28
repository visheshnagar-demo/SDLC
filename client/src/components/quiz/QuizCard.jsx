import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  Sparkles,
} from "lucide-react";

export const QuizCard = ({ quiz, onComplete }) => {
  const questions = quiz?.questions || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);

  if (!questions || questions.length === 0) {
    return (
      <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-8 text-center text-slate-300">
        <HelpCircle size={40} className="mx-auto text-indigo-400 mb-3" />
        <h3 className="text-lg font-bold text-white mb-1">
          No Questions Available
        </h3>
        <p className="text-sm text-slate-400">
          There are currently no active questions in this assessment.
        </p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;
  const currentSelected = selectedAnswers[currentQ.id || currentIndex];

  // Options normalization (support either array of strings, array of {id, text}, or key-value map)
  const options = Array.isArray(currentQ.options)
    ? currentQ.options.map((opt, i) => {
        if (typeof opt === "string") {
          const letter = String.fromCharCode(65 + i);
          return { id: letter, text: opt, label: `${letter}. ${opt}` };
        }
        return {
          id: opt.id || opt.key || String.fromCharCode(65 + i),
          text: opt.text || opt.value || opt.option,
          label:
            opt.label ||
            `${opt.id || String.fromCharCode(65 + i)}. ${opt.text || opt.value}`,
        };
      })
    : [];

  const handleSelectOption = (optionId) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQ.id || currentIndex]: optionId,
    });
    setShowExplanation(true);
  };

  const isCorrectAnswer = (optionId) => {
    if (!currentQ.correct_answer) return false;
    return (
      String(currentQ.correct_answer).toUpperCase() ===
      String(optionId).toUpperCase()
    );
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Calculate results
      let correctCount = 0;
      questions.forEach((q, idx) => {
        const sel = selectedAnswers[q.id || idx];
        if (
          sel &&
          String(q.correct_answer).toUpperCase() === String(sel).toUpperCase()
        ) {
          correctCount++;
        }
      });
      const scorePct = Math.round((correctCount / totalQuestions) * 100);
      if (onComplete) {
        onComplete({
          quizId: quiz.id,
          totalQuestions,
          correctCount,
          scorePercentage: scorePct,
          passed: scorePct >= (quiz.passing_score || 70),
          selectedAnswers,
        });
      }
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setShowExplanation(false);
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Stepper Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold rounded-full uppercase tracking-wider">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            &bull; Pass mark: {quiz.passing_score || 70}%
          </span>
        </div>

        {/* Question Dot Indicator */}
        <div className="flex items-center gap-1.5">
          {questions.map((q, idx) => {
            const isAnswered = Boolean(selectedAnswers[q.id || idx]);
            const isCurrent = currentIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  setShowExplanation(Boolean(selectedAnswers[q.id || idx]));
                }}
                className={`w-7 h-7 rounded-full text-xs font-bold transition-all flex items-center justify-center ${
                  isCurrent
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/40"
                    : isAnswered
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Text */}
      <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
        {currentQ.question_text}
      </h2>

      {/* Options List */}
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = currentSelected === option.id;
          const isCorrect = isCorrectAnswer(option.id);
          const showAnswerStyle = currentSelected && showExplanation;

          let optionStyle =
            "bg-slate-800/40 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:border-slate-600";
          if (showAnswerStyle) {
            if (isCorrect) {
              optionStyle =
                "bg-emerald-500/10 border-emerald-500 text-emerald-200 font-medium";
            } else if (isSelected && !isCorrect) {
              optionStyle =
                "bg-red-500/10 border-red-500 text-red-200 font-medium";
            }
          } else if (isSelected) {
            optionStyle =
              "bg-indigo-600/20 border-indigo-500 text-white font-medium";
          }

          return (
            <div
              key={option.id}
              onClick={() => handleSelectOption(option.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-sm sm:text-base ${optionStyle}`}
            >
              <span>{option.label}</span>
              {showAnswerStyle && isCorrect && (
                <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold shrink-0 ml-2">
                  <CheckCircle2 size={16} /> Correct
                </span>
              )}
              {showAnswerStyle && isSelected && !isCorrect && (
                <span className="flex items-center gap-1 text-red-400 text-xs font-bold shrink-0 ml-2">
                  <XCircle size={16} /> Incorrect
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Explanation Banner */}
      {currentSelected && currentQ.explanation && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs sm:text-sm text-emerald-300 flex items-start gap-3">
          <Sparkles size={18} className="text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-emerald-200">Explanation: </span>
            <span>{currentQ.explanation}</span>
          </div>
        </div>
      )}

      {/* Footer Navigation Buttons */}
      <div className="pt-4 border-t border-slate-700/50 flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-xs font-semibold text-slate-300 rounded-xl transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Previous</span>
        </button>

        <button
          onClick={handleNext}
          disabled={!currentSelected}
          className="flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-bold text-white rounded-xl transition-all shadow-md shadow-indigo-600/20"
        >
          <span>
            {currentIndex === totalQuestions - 1
              ? "Submit Assessment"
              : "Next Question"}
          </span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default QuizCard;
