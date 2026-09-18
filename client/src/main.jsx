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
    console.error("Uncaught error in application:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-amber-50 min-h-screen text-orange-950 font-serif flex items-center justify-center">
          <div className="max-w-md bg-white p-6 rounded-xl shadow-lg border border-orange-200 text-center space-y-4">
            <h2 className="text-xl font-bold text-orange-900">
              Something went wrong
            </h2>
            <p className="text-xs text-orange-700">
              An unexpected error occurred in the Temple Management application.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-orange-800 text-white font-bold rounded-lg text-xs"
            >
              Reload Page
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
