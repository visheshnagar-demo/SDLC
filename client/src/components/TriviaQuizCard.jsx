import React, { useState } from "react";
import {
  Award,
  CheckCircle,
  XCircle,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function TriviaQuizCard({ quiz = null, onCompleteQuiz }) {
  const defaultQuestions = [
    {
      id: "q1",
      question_text:
        "Which crunchy orange snack is full of Vitamin C and gives your eyes super vision powers?",
      options: [
        "Crunchy Carrots 🥕",
        "Chocolate Donut 🍩",
        "French Fries 🍟",
        "Soda Pop 🥤",
      ],
      correct_answer: "Crunchy Carrots 🥕",
      points_reward: 50,
      fun_fact:
        "Carrots have lots of beta-carotene which helps you see in the dark!",
    },
    {
      id: "q2",
      question_text:
        "How many glasses of water should a healthy superhero drink every day?",
      options: ["1 glass", "2 glasses", "6 to 8 glasses 💧", "100 glasses"],
      correct_answer: "6 to 8 glasses 💧",
      points_reward: 50,
      fun_fact:
        "Drinking water keeps your muscles energetic and your brain super fast!",
    },
    {
      id: "q3",
      question_text:
        "Which food group gives you strong muscles and helps you run faster?",
      options: [
        "Proteins (Eggs, Chicken, Beans) 🍗",
        "Sugary Candy 🍬",
        "Marshmallows 🍥",
        "Potato Chips 🥔",
      ],
      correct_answer: "Proteins (Eggs, Chicken, Beans) 🍗",
      points_reward: 50,
      fun_fact:
        "Protein is like the building blocks that make your body grow strong!",
    },
  ];

  const questions = quiz ? [quiz] : defaultQuestions;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const currentQ = questions[currentIndex] || questions[0];

  const handleOptionSelect = (option) => {
    if (isSubmitted) return;
    setSelectedOption(option);
  };

  const handleCheckAnswer = () => {
    if (!selectedOption) return;
    setIsSubmitted(true);

    const isCorrect =
      selectedOption.includes(currentQ.correct_answer) ||
      currentQ.correct_answer.includes(selectedOption);

    if (isCorrect) {
      setScore((prev) => prev + (currentQ.points_reward || 50));
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      setCompleted(true);
      if (onCompleteQuiz) {
        onCompleteQuiz(score);
      }
    }
  };

  if (completed) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-amber-200 shadow-md text-center max-w-xl mx-auto">
        <span className="text-6xl">🏆</span>
        <h3 className="font-heading font-bold text-2xl text-slate-800 mt-4">
          Quiz Quest Complete!
        </h3>
        <p className="text-slate-600 mt-2">
          You earned{" "}
          <strong className="text-amber-600">+{score} Reward Points</strong> for
          answering nutrition trivia!
        </p>

        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl my-6 text-emerald-800 font-semibold text-sm">
          🌟 You are becoming a true Nutrition Champion! Keep eating balanced
          meals!
        </div>

        <button
          onClick={() => {
            setCurrentIndex(0);
            setSelectedOption(null);
            setIsSubmitted(false);
            setScore(0);
            setCompleted(false);
          }}
          className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-full font-bold shadow-md transition-colors"
        >
          Play Again
        </button>
      </div>
    );
  }

  const isCorrect =
    isSubmitted &&
    (selectedOption?.includes(currentQ.correct_answer) ||
      currentQ.correct_answer?.includes(selectedOption));

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-amber-100 shadow-sm max-w-2xl mx-auto">
      {/* Quiz Header */}
      <div className="flex justify-between items-center mb-6">
        <span className="bg-amber-100 text-amber-800 px-3.5 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
          <Award className="w-3.5 h-3.5 mr-1" />
          <span>Daily Quest #{currentIndex + 1}</span>
        </span>
        <span className="text-xs font-semibold text-slate-500">
          Question {currentIndex + 1} of {questions.length}
        </span>
      </div>

      {/* Question Text */}
      <h3 className="font-heading font-bold text-lg sm:text-xl text-slate-900 mb-6 leading-relaxed">
        {currentQ.question_text}
      </h3>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {currentQ.options.map((option, idx) => {
          let btnStyle =
            "bg-white text-slate-700 border-slate-200 hover:border-amber-400 hover:bg-amber-50/30";

          if (isSubmitted) {
            if (
              option.includes(currentQ.correct_answer) ||
              currentQ.correct_answer.includes(option)
            ) {
              btnStyle =
                "bg-emerald-500 text-white border-emerald-600 font-bold";
            } else if (selectedOption === option) {
              btnStyle = "bg-rose-500 text-white border-rose-600 font-bold";
            } else {
              btnStyle = "bg-slate-50 text-slate-400 border-slate-200";
            }
          } else if (selectedOption === option) {
            btnStyle =
              "bg-amber-100 text-amber-900 border-amber-500 font-bold ring-2 ring-amber-300";
          }

          return (
            <button
              key={idx}
              onClick={() => handleOptionSelect(option)}
              disabled={isSubmitted}
              className={`p-4 rounded-2xl text-left font-semibold text-sm border-2 transition-all shadow-sm ${btnStyle}`}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {isSubmitted &&
                  (option.includes(currentQ.correct_answer) ||
                    currentQ.correct_answer.includes(option)) && (
                    <CheckCircle className="w-5 h-5 text-white ml-2 flex-shrink-0" />
                  )}
                {isSubmitted &&
                  selectedOption === option &&
                  !(
                    option.includes(currentQ.correct_answer) ||
                    currentQ.correct_answer.includes(option)
                  ) && (
                    <XCircle className="w-5 h-5 text-white ml-2 flex-shrink-0" />
                  )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Feedback Banner */}
      {isSubmitted && (
        <div
          className={`p-4 rounded-2xl font-bold text-center mb-6 transition-all ${
            isCorrect
              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
              : "bg-rose-100 text-rose-800 border border-rose-300"
          }`}
        >
          {isCorrect ? (
            <p className="flex items-center justify-center space-x-1">
              <span>
                🎉 Awesome Choice! +{currentQ.points_reward || 50} Points
                Earned!
              </span>
            </p>
          ) : (
            <p>
              Oops! The correct answer was {currentQ.correct_answer}. Keep
              learning!
            </p>
          )}
          {currentQ.fun_fact && (
            <p className="text-xs font-normal mt-1 opacity-90">
              💡 <em>{currentQ.fun_fact}</em>
            </p>
          )}
        </div>
      )}

      {/* Action Button */}
      {!isSubmitted ? (
        <button
          onClick={handleCheckAnswer}
          disabled={!selectedOption}
          className={`w-full py-3 rounded-full font-bold text-sm shadow-md transition-all ${
            selectedOption
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          Check Answer
        </button>
      ) : (
        <button
          onClick={handleNext}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-full font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2"
        >
          <span>
            {currentIndex + 1 < questions.length
              ? "Next Question"
              : "Complete Quest"}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
