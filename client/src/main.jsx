import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Structured error handling in boundary
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0f17] text-[#dfe2ee] p-8 flex flex-col items-center justify-center font-sans">
          <div className="max-w-md w-full bg-[#111622] border border-rose-500/30 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <h2 className="text-xl font-bold text-rose-400">
              Something went wrong
            </h2>
            <p className="text-xs text-slate-400">
              An unexpected render error occurred in the application.
            </p>
            <pre className="text-xs text-slate-500 bg-[#0b0f17] p-3 rounded-lg overflow-x-auto text-left font-mono">
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <button
              onClick={() => (window.location.href = "/")}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
