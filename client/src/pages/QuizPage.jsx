import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { quizzesApi, progressApi } from "../services/api";
import QuizCard from "../components/quiz/QuizCard";
import QuizScorecard from "../components/quiz/QuizScorecard";
import { ChevronLeft, HelpCircle, Clock, Award } from "lucide-react";

const FALLBACK_QUIZ = {
  id: "q-gradient-descent",
  module_id: "m2",
  title: "Quiz: Gradient Descent & Optimization",
  passing_score: 70,
  questions: [
    {
      id: "q1",
      question_text:
        "What is the primary role of the learning rate (η) in gradient descent optimization?",
      options: [
        {
          id: "A",
          text: "It defines the exact number of layers in a deep neural network.",
        },
        {
          id: "B",
          text: "It scales the magnitude of parameter updates along the negative gradient direction.",
        },
        {
          id: "C",
          text: "It normalizes the input dataset features to zero mean and unit variance.",
        },
        {
          id: "D",
          text: "It computes the second derivative Hessian matrix automatically.",
        },
      ],
      correct_answer: "B",
      explanation:
        "The learning rate scales the gradient vector to determine how large a step to take in parameter space toward the minimum.",
    },
    {
      id: "q2",
      question_text:
        "In standard Batch Gradient Descent, what occurs when the learning rate (η) is chosen to be excessively large?",
      options: [
        {
          id: "A",
          text: "The algorithm converges monotonically to the global minimum.",
        },
        {
          id: "B",
          text: "The optimization oscillates wildly across the loss valley and may diverge.",
        },
        {
          id: "C",
          text: "The weight updates become infinitesimally small and stall.",
        },
        {
          id: "D",
          text: "The loss function switches to second-order Newton-Raphson optimization.",
        },
      ],
      correct_answer: "B",
      explanation:
        "Excessively large learning rates cause overshooting across convex valleys, leading to numerical divergence.",
    },
    {
      id: "q3",
      question_text:
        "How does Stochastic Gradient Descent (SGD) differ from standard Batch Gradient Descent?",
      options: [
        {
          id: "A",
          text: "SGD updates parameters using one randomly chosen sample per step rather than the entire dataset.",
        },
        {
          id: "B",
          text: "SGD requires calculating the full dataset Hessian matrix.",
        },
        {
          id: "C",
          text: "SGD is deterministic and exhibits zero gradient variance.",
        },
        { id: "D", text: "SGD does not require computing gradients." },
      ],
      correct_answer: "A",
      explanation:
        "SGD computes the gradient on a single randomly selected sample, enabling faster updates and escape from saddle points.",
    },
    {
      id: "q4",
      question_text:
        "Which optimizer adaptively computes individual learning rates for different parameters using exponentially decaying moving averages of squared gradients?",
      options: [
        { id: "A", text: "Standard Vanilla SGD without momentum" },
        { id: "B", text: "Adam (Adaptive Moment Estimation)" },
        { id: "C", text: "K-Means Clustering Algorithm" },
        { id: "D", text: "Simple Linear Regression OLS" },
      ],
      correct_answer: "B",
      explanation:
        "Adam combines the principles of Momentum (first moments) and RMSprop (second raw moments) for robust adaptive learning.",
    },
    {
      id: "q5",
      question_text:
        "What constitutes the stopping criterion for iterative gradient descent algorithms?",
      options: [
        {
          id: "A",
          text: "When the gradient norm falls below a threshold ε or maximum epochs are reached.",
        },
        { id: "B", text: "When all training weights reach exactly 0.0." },
        { id: "C", text: "When the learning rate expands infinitely." },
        { id: "D", text: "When the training loss increases to 100%." },
      ],
      correct_answer: "A",
      explanation:
        "Convergence is reached when parameter changes or gradient norms are negligible (||∇L|| < ε), or when predefined epoch limits are hit.",
    },
  ],
};

export const QuizPage = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(FALLBACK_QUIZ);
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      try {
        if (moduleId) {
          const data = await quizzesApi.getQuizByModuleId(moduleId);
          if (data && data.questions && data.questions.length > 0) {
            setQuiz(data);
          } else {
            setQuiz(FALLBACK_QUIZ);
          }
        }
      } catch {
        setQuiz(FALLBACK_QUIZ);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [moduleId]);

  const handleQuizComplete = async (resultData) => {
    setQuizResult(resultData);
    if (quiz?.id) {
      try {
        await quizzesApi.submitQuiz(quiz.id, resultData);
      } catch {
        // non-blocking
      }
    }
  };

  const handleRetry = () => {
    setQuizResult(null);
  };

  const handleContinue = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-[#0F172A] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-700/60 bg-[#0B0F19] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/tracks" className="text-slate-400 hover:text-white p-1">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-white">{quiz.title}</h1>
            <p className="text-[11px] text-slate-400">
              Knowledge Check &bull; Module Assessment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-mono text-cyan-400 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
            <Clock size={13} />
            <span>Self-Paced</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-10 w-full flex-1 flex flex-col justify-center">
        {quizResult ? (
          <QuizScorecard
            result={quizResult}
            onRetry={handleRetry}
            onContinue={handleContinue}
          />
        ) : (
          <QuizCard quiz={quiz} onComplete={handleQuizComplete} />
        )}
      </main>
    </div>
  );
};

export default QuizPage;
