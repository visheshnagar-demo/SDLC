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

  componentDidCatch() {
    // Rely on error boundary fallback without polluting logs
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0c141f] text-[#ffb4ab] p-8 font-mono flex flex-col items-center justify-center">
          <div className="p-6 rounded-2xl bg-[#141c27] border border-[#fb7185]/50 max-w-lg text-center space-y-4">
            <h2 className="text-xl font-bold text-[#fb7185]">
              AquaSense System Notice
            </h2>
            <p className="text-sm text-[#bac9cc]">
              An unexpected render issue occurred in the client application.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-[#00e5ff] text-[#070c13] font-bold text-xs uppercase"
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
