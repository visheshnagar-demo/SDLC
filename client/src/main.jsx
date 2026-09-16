import React from "react";
import ReactDOM from "react-dom/client";
import BankingDashboard from "./pages/BankingDashboard";
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
    console.error("Uncaught Error in Banking Dashboard:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 p-6 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Something went wrong
            </h2>
            <p className="text-slate-600 text-sm mb-4">
              {this.state.error?.toString() ||
                "An unexpected error occurred in the application."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
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
      <BankingDashboard />
    </ErrorBoundary>
  </React.StrictMode>,
);
