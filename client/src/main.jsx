import React from "react";
import ReactDOM from "react-dom/client";
import PropTypes from "prop-types";
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
    // Intentionally minimal logger for boundary
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full border border-red-200">
            <h2 className="text-xl font-bold text-red-600 mb-2">
              Application Error
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Something went wrong rendering the assortment advisor dashboard.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#E5B800] text-slate-950 font-semibold px-4 py-2 rounded text-sm hover:bg-amber-400"
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

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
