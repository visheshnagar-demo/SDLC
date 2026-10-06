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
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5FAF7] flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-xl shadow-md border border-[#DBE5E0] max-w-lg text-center">
            <h2 className="text-2xl font-bold text-[#D92929] mb-4">
              Something went wrong
            </h2>
            <p className="text-[#6B7A73] mb-6">
              An unexpected error occurred in the Dairy Farm Management
              interface.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-[#0D7A52] text-white font-medium rounded-lg hover:bg-[#095C3E] transition"
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
