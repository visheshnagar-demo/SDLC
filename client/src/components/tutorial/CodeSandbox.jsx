import React, { useState } from "react";
import { Copy, Check, Play, Terminal, RefreshCw } from "lucide-react";

export const CodeSandbox = ({
  codeSnippets = [],
  defaultOutput = "Output: Converged at epoch 420 (Loss: 0.0024)",
}) => {
  const snippets =
    Array.isArray(codeSnippets) && codeSnippets.length > 0
      ? codeSnippets
      : [
          {
            language: "python",
            framework: "Python (NumPy)",
            code: `import numpy as np

def gradient_descent(X, y, lr=0.01, epochs=1000):
    m, n = X.shape
    weights = np.zeros(n)
    bias = 0
    for epoch in range(epochs):
        y_pred = np.dot(X, weights) + bias
        dw = (1/m) * np.dot(X.T, (y_pred - y))
        db = (1/m) * np.sum(y_pred - y)
        weights -= lr * dw
        bias -= lr * db
    return weights, bias

# Synthetic linear dataset
np.random.seed(42)
X = np.random.randn(100, 2)
y = 2.5 * X[:, 0] - 1.5 * X[:, 1] + 0.5

weights, bias = gradient_descent(X, y, lr=0.05, epochs=500)
print(f"Optimized Weights: {weights.round(3)}, Bias: {round(bias, 3)}")`,
            output:
              "Optimized Weights: [ 2.498 -1.499], Bias: 0.501\nConverged at epoch 485 (Loss: 0.00012)",
          },
        ];

  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState(
    snippets[0]?.output || defaultOutput,
  );

  const activeSnippet = snippets[activeTab] || snippets[0];

  const handleCopy = () => {
    if (activeSnippet?.code) {
      navigator.clipboard.writeText(activeSnippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      setConsoleOutput(activeSnippet.output || defaultOutput);
      setIsRunning(false);
    }, 600);
  };

  const lines = activeSnippet.code ? activeSnippet.code.split("\n") : [];

  return (
    <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl flex flex-col h-full overflow-hidden shadow-2xl">
      {/* IDE Top Bar */}
      <div className="bg-[#080B12] border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {snippets.map((snip, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveTab(idx);
                setConsoleOutput(snippets[idx]?.output || defaultOutput);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                activeTab === idx
                  ? "bg-indigo-600/20 text-cyan-300 border border-indigo-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              {snip.framework || snip.language || `Snippet ${idx + 1}`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            {copied ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy Code</span>
              </>
            )}
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
          >
            {isRunning ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <Play size={13} className="fill-current" />
            )}
            <span>{isRunning ? "Running..." : "Run"}</span>
          </button>
        </div>
      </div>

      {/* Code Editor Body */}
      <div className="flex-1 overflow-x-auto p-4 font-mono text-xs text-slate-300 bg-[#070A11] flex leading-6 select-text">
        {/* Line Numbers */}
        <div className="select-none pr-4 text-right text-slate-600 border-r border-slate-800">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code Content */}
        <pre className="pl-4 flex-1 text-slate-200 focus:outline-none">
          <code>
            {lines.map((line, i) => {
              // Basic syntax highlighting heuristics
              let coloredLine = line;
              const isComment = line.trim().startsWith("#");
              const isImport =
                line.trim().startsWith("import ") ||
                line.trim().startsWith("from ");
              const isDef =
                line.includes("def ") ||
                line.includes("class ") ||
                line.includes("return ");

              let style = "text-slate-200";
              if (isComment) style = "text-slate-500 italic";
              else if (isImport) style = "text-cyan-400 font-semibold";
              else if (isDef) style = "text-indigo-400 font-medium";

              return (
                <div key={i} className={style}>
                  {line || " "}
                </div>
              );
            })}
          </code>
        </pre>
      </div>

      {/* Console Output */}
      <div className="bg-[#05070D] border-t border-slate-800/80 p-4">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-mono font-semibold mb-2">
          <Terminal size={14} className="text-emerald-400" />
          <span>Execution Console</span>
        </div>
        <div className="bg-[#0B0F19] border border-slate-800/80 rounded-xl p-3 font-mono text-xs text-emerald-400 whitespace-pre-wrap">
          {consoleOutput}
        </div>
      </div>
    </div>
  );
};

export default CodeSandbox;
