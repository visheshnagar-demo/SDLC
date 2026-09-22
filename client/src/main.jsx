import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // In production error boundaries report to monitoring
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex items-center justify-center p-6">
          <div className="bg-[#0f172a] border border-[#f43f5e] p-8 rounded-xl max-w-lg w-full text-center shadow-2xl">
            <h2 className="text-2xl font-bold text-[#f43f5e] mb-4">
              Something went wrong
            </h2>
            <p className="text-[#bcc9cd] mb-6 text-sm">
              An unexpected error occurred in the Cloud Management System.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-[#06b6d4] hover:bg-[#38bdf8] text-[#0b1326] font-semibold rounded-lg transition-colors"
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
