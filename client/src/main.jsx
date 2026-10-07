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
    // structured fallback
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
          <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-red-200">
            <h2 className="text-xl font-bold text-red-700 mb-2">
              Something went wrong
            </h2>
            <p className="text-slate-600 mb-4 text-sm">
              An error occurred during application rendering.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
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
