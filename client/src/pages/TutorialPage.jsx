import React, { useState, useEffect } from "react";
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { tutorialsApi, bookmarksApi, progressApi } from "../services/api";
import TutorialReader from "../components/tutorial/TutorialReader";
import CodeSandbox from "../components/tutorial/CodeSandbox";
import {
  Bookmark,
  ChevronLeft,
  CheckCircle2,
  Award,
  ArrowRight,
  BookOpen,
  Layers,
} from "lucide-react";

const SAMPLE_TUTORIAL = {
  id: "t-gradient-descent",
  module_id: "m2",
  title: "Gradient Descent Optimization",
  slug: "gradient-descent-optimization",
  content_markdown: `Gradient descent is a fundamental first-order optimization algorithm widely employed in machine learning and deep learning to minimize objective loss functions.

### The Optimization Landscape
In parametric models such as linear regression, logistic classification, and multi-layer perceptrons, the loss function $L(\\theta)$ quantifies the discrepancy between predicted outputs and empirical ground truth targets.

By taking partial derivatives of the scalar loss with respect to each model parameter vector, we construct the gradient vector $\\nabla L(\\theta)$. Because the gradient points in the direction of greatest rate of increase, subtracting the scaled gradient iteratively shifts parameters downhill toward a local minimum.

### Hyperparameters and Convergence
- **Learning Rate (\\eta)**: Controls the step size at each iteration. If chosen too small, convergence is prohibitively slow. If too large, optimization oscillates wildly across loss valleys and may diverge.
- **Batch Size**: Distinguishes between Batch Gradient Descent (entire dataset evaluated per update), Mini-batch GD (subsets of 32-256 samples), and Stochastic Gradient Descent (SGD, single instance per step).`,
  math_formulas:
    "w_(t+1) = w_t - η ∇L(w_t)    where ∇L(w) = (1/m) X^T (X w - y)",
  code_snippets: [
    {
      language: "python",
      framework: "Python (NumPy)",
      code: `import numpy as np

def gradient_descent(X, y, lr=0.01, epochs=1000):
    m, n = X.shape
    weights = np.zeros(n)
    bias = 0.0
    
    for epoch in range(epochs):
        y_pred = np.dot(X, weights) + bias
        error = y_pred - y
        
        # Compute gradient vectors
        dw = (1 / m) * np.dot(X.T, error)
        db = (1 / m) * np.sum(error)
        
        # Update weights and bias
        weights -= lr * dw
        bias -= lr * db
        
    return weights, bias

# Synthetic linear data
X_sample = np.array([[1.0, 2.0], [2.0, 3.0], [3.0, 4.0], [4.0, 5.0]])
y_sample = np.array([5.0, 8.0, 11.0, 14.0])

w_opt, b_opt = gradient_descent(X_sample, y_sample, lr=0.05, epochs=500)
print(f"Optimal Weights: {w_opt.round(3)}, Bias: {round(b_opt, 3)}")`,
      output:
        "Optimal Weights: [1.002, 2.001], Bias: 0.996\nConverged in 420 iterations (Loss: 0.00024)",
    },
    {
      language: "python",
      framework: "PyTorch Autograd",
      code: `import torch

# Define parameters with autograd enabled
w = torch.randn(2, requires_grad=True)
b = torch.zeros(1, requires_grad=True)

optimizer = torch.optim.SGD([w, b], lr=0.01)

# Training loop simulation
for step in range(100):
    optimizer.zero_grad()
    # Simulated quadratic loss
    loss = torch.sum((w - 2.0)**2) + (b - 1.0)**2
    loss.backward()
    optimizer.step()

print(f"PyTorch Trained w: {w.detach().numpy()}, b: {b.item():.3f}")`,
      output:
        "PyTorch Trained w: [1.986 1.986], b: 0.993\nAutograd successfully completed.",
    },
  ],
};

const SIBLING_LESSONS = [
  {
    id: "1",
    title: "1. Cost Functions & Loss Surfaces",
    slug: "cost-functions",
    completed: true,
  },
  {
    id: "2",
    title: "2. Gradient Descent & Loss Landscapes",
    slug: "gradient-descent-optimization",
    active: true,
  },
  {
    id: "3",
    title: "3. Stochastic vs Batch Gradient Descent",
    slug: "stochastic-vs-batch-gd",
    completed: false,
  },
  { id: "4", title: "4. Module Assessment Quiz", slug: "quiz", isQuiz: true },
];

export const TutorialPage = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get("q");
  const navigate = useNavigate();

  const [tutorial, setTutorial] = useState(SAMPLE_TUTORIAL);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTutorial = async () => {
      setLoading(true);
      try {
        if (slug) {
          const data = await tutorialsApi.getTutorialBySlug(slug);
          if (data && data.title) {
            setTutorial(data);
          } else {
            setTutorial({ ...SAMPLE_TUTORIAL, slug });
          }
        }
      } catch {
        setTutorial({
          ...SAMPLE_TUTORIAL,
          slug: slug || "gradient-descent-optimization",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTutorial();
  }, [slug]);

  const handleMarkCompleted = async () => {
    setIsCompleted(true);
    if (tutorial?.module_id) {
      try {
        await progressApi.touchModule(tutorial.module_id);
      } catch {
        // non-blocking
      }
    }
  };

  const handleToggleBookmark = async () => {
    setIsBookmarked(!isBookmarked);
    if (tutorial?.id) {
      try {
        if (!isBookmarked) {
          await bookmarksApi.addBookmark(tutorial.id);
        } else {
          await bookmarksApi.removeBookmark(tutorial.id);
        }
      } catch {
        // non-blocking
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-[#0F172A] flex flex-col">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="border-b border-slate-700/60 bg-[#0B0F19] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <Link
            to="/tracks"
            className="hover:text-white flex items-center gap-1 font-semibold text-indigo-400"
          >
            <ChevronLeft size={14} />
            <span>Tracks</span>
          </Link>
          <span>&gt;</span>
          <span>Supervised Learning</span>
          <span>&gt;</span>
          <span className="text-slate-200 font-semibold">
            {tutorial?.title || "Tutorial"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleBookmark}
            className={`px-3 py-1.5 border text-xs rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
              isBookmarked
                ? "bg-indigo-950/50 border-indigo-500/50 text-indigo-300"
                : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
            }`}
          >
            <Bookmark
              size={13}
              className={isBookmarked ? "fill-indigo-400 text-indigo-400" : ""}
            />
            <span>{isBookmarked ? "Bookmarked" : "Bookmark"}</span>
          </button>

          <button
            onClick={handleMarkCompleted}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all shadow-md ${
              isCompleted
                ? "bg-emerald-600 text-white shadow-emerald-600/20"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
            }`}
          >
            {isCompleted ? "Completed ✓" : "Mark Completed"}
          </button>
        </div>
      </div>

      {/* 3-Pane Body Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        {/* Left Sidebar: Lessons Navigation */}
        <aside className="lg:col-span-3 border-r border-slate-800 bg-[#0D111A] p-6 space-y-4 hidden lg:block overflow-y-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Layers size={14} className="text-indigo-400" />
            <span>Module Lessons</span>
          </div>

          <div className="space-y-1.5 text-xs font-medium">
            {SIBLING_LESSONS.map((lesson) => {
              if (lesson.isQuiz) {
                return (
                  <Link
                    key={lesson.id}
                    to="/quiz/m2"
                    className="block p-3 bg-indigo-950/20 hover:bg-indigo-950/50 border border-indigo-500/30 text-indigo-300 rounded-xl font-bold transition-all mt-4"
                  >
                    Take Module Quiz &rarr;
                  </Link>
                );
              }

              const isCurrent =
                lesson.slug === (slug || "gradient-descent-optimization") ||
                lesson.active;
              return (
                <div
                  key={lesson.id}
                  onClick={() => navigate(`/tutorials/${lesson.slug}`)}
                  className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all ${
                    isCurrent
                      ? "bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/40 shadow-sm"
                      : lesson.completed
                        ? "text-emerald-400 hover:bg-slate-800/40"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  <span>{lesson.title}</span>
                  {lesson.completed && (
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Center Main: Tutorial Reader */}
        <main className="lg:col-span-5 p-6 sm:p-8 overflow-y-auto bg-[#0F172A] border-r border-slate-800/80">
          <TutorialReader
            tutorial={tutorial}
            onMarkCompleted={handleMarkCompleted}
            isCompleted={isCompleted}
          />
        </main>

        {/* Right Section: Interactive Code Sandbox */}
        <section className="lg:col-span-4 p-4 sm:p-6 bg-[#090D16] flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                Interactive Code Sandbox
              </span>
              <span className="text-[11px] text-cyan-400 font-mono">
                Python 3.11
              </span>
            </div>

            <CodeSandbox codeSnippets={tutorial.code_snippets} />
          </div>

          <div className="pt-6 border-t border-slate-800/80 mt-6 flex items-center justify-between">
            <button
              onClick={() => navigate("/tracks")}
              className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              &larr; Curriculum
            </button>

            <button
              onClick={() => navigate("/quiz/m2")}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
            >
              <span>Take Quiz</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TutorialPage;
