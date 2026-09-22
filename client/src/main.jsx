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
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#121316] text-[#F8F9FA] flex flex-col items-center justify-center p-8 text-center space-y-4">
          <h2 className="font-serif text-2xl font-bold text-[#F2CA50]">
            Horological Interface Notice
          </h2>
          <p className="text-sm text-[#9EACB9] max-w-md">
            Something unexpected occurred while rendering the luxury interface.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A0B0E] font-bold px-6 py-2.5 rounded-lg text-xs uppercase tracking-wider"
          >
            Reload Interface
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  );
}
