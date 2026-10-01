import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
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
    // Silence error logging in production
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FFFDF7] p-6 text-center">
          <div className="bg-white p-8 rounded-3xl border border-rose-200 shadow-lg max-w-md">
            <span className="text-5xl">🌱⚠️</span>
            <h2 className="font-heading font-bold text-xl text-slate-800 mt-4">
              Something went wrong.
            </h2>
            <p className="text-xs text-slate-500 mt-2">
              An unexpected error occurred in NutriKids.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 bg-amber-500 text-white px-6 py-2.5 rounded-full font-bold text-xs shadow hover:bg-amber-600 transition-colors"
            >
              Reload Application
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
